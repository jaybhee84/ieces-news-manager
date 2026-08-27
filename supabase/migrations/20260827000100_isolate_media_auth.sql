-- Give Media Manager an app-specific profile and Auth identity while retaining
-- safe legacy News/Media users. Dashboard Manager continues to own access via
-- the authoritative "news" application key.

begin;

create table if not exists public.media_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  real_email text not null,
  auth_email text not null,
  username text not null,
  family_name text not null,
  first_name text not null,
  middle_initial text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists media_profiles_real_email_key
  on public.media_profiles (lower(real_email));
create unique index if not exists media_profiles_auth_email_key
  on public.media_profiles (lower(auth_email));
create unique index if not exists media_profiles_username_key
  on public.media_profiles (lower(username));

-- Legacy Media users keep their existing Auth identity/password. Rows owned by
-- any other app are deliberately excluded from this migration.
insert into public.media_profiles (
  id, real_email, auth_email, username, family_name, first_name,
  middle_initial, created_at, updated_at
)
select
  p.id,
  lower(trim(p.email)),
  lower(trim(p.email)),
  lower(trim(p.username)),
  p.family_name,
  p.first_name,
  p.middle_initial,
  coalesce(p.created_at, now()),
  now()
from public.profiles p
where p.app_source in ('news', 'owner')
on conflict (id) do nothing;

alter table public.media_profiles enable row level security;

drop policy if exists "Public resolve Media profiles" on public.media_profiles;
drop policy if exists "Users read own Media profile" on public.media_profiles;
create policy "Users read own Media profile"
  on public.media_profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users update own Media profile" on public.media_profiles;
create policy "Users update own Media profile"
  on public.media_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select on public.media_profiles to authenticated;
grant update on public.media_profiles to authenticated;

-- Resolve a username or real email to the private app-scoped Auth email
-- without exposing the Media membership table to anonymous enumeration.
create or replace function public.resolve_media_login(candidate_identifier text)
returns table(auth_email text, real_email text)
language sql
stable
security definer
set search_path = public
as $$
  select mp.auth_email, mp.real_email
  from public.media_profiles mp
  where lower(mp.username) = lower(trim(candidate_identifier))
     or lower(mp.real_email) = lower(trim(candidate_identifier))
  limit 1;
$$;

revoke all on function public.resolve_media_login(text) from public;
grant execute on function public.resolve_media_login(text) to anon, authenticated;

create or replace function public.set_media_profile_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists media_profiles_updated_at on public.media_profiles;
create trigger media_profiles_updated_at
before update on public.media_profiles
for each row execute function public.set_media_profile_updated_at();

-- Preserve the Dashboard owner's shared login, but give it a Media-specific
-- membership row so every accepted session has an app profile.
create or replace function public.ensure_media_owner_profile()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_email text;
begin
  if not public.is_dashboard_owner() then
    return false;
  end if;

  select lower(email) into owner_email
  from auth.users
  where id = auth.uid();

  if owner_email is null then
    return false;
  end if;

  insert into public.media_profiles (
    id, real_email, auth_email, username, family_name, first_name,
    middle_initial
  ) values (
    auth.uid(), owner_email, owner_email, 'owner.jaybhee84',
    'BAZAN', 'JONYBHEE', 'A'
  )
  on conflict (id) do update set
    real_email = excluded.real_email,
    auth_email = excluded.auth_email;

  return true;
end;
$$;

revoke all on function public.ensure_media_owner_profile() from public, anon;
grant execute on function public.ensure_media_owner_profile() to authenticated;

-- Used by write policies so another IECES application's valid Auth session is
-- not sufficient to modify Media data. Allowlist removal takes effect at the
-- database boundary as well as in the client session checks.
create or replace function public.has_media_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.media_profiles mp
    join public.news_allowed_users allowed
      on lower(allowed.email) = lower(mp.real_email)
    where mp.id = auth.uid()
  );
$$;

revoke all on function public.has_media_access() from public, anon;
grant execute on function public.has_media_access() to authenticated;

drop policy if exists "Authenticated insert" on public.news_articles;
drop policy if exists "Authenticated update" on public.news_articles;
drop policy if exists "Authenticated delete" on public.news_articles;
drop policy if exists "Media insert news" on public.news_articles;
drop policy if exists "Media update news" on public.news_articles;
drop policy if exists "Media delete news" on public.news_articles;
create policy "Media insert news" on public.news_articles
  for insert to authenticated with check (public.has_media_access());
create policy "Media update news" on public.news_articles
  for update to authenticated
  using (public.has_media_access()) with check (public.has_media_access());
create policy "Media delete news" on public.news_articles
  for delete to authenticated using (public.has_media_access());

drop policy if exists "Auth upload news photos" on storage.objects;
drop policy if exists "Auth delete news photos" on storage.objects;
drop policy if exists "Media upload news photos" on storage.objects;
drop policy if exists "Media delete news photos" on storage.objects;
create policy "Media upload news photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'news-photos' and public.has_media_access());
create policy "Media delete news photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'news-photos' and public.has_media_access());

commit;

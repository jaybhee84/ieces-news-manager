import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { email, password, username, family_name, first_name, middle_initial } =
    await request.json();

  if (!email || !password || !username || !family_name || !first_name) {
    return json(400, { error: "All required fields must be completed." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: allowed } = await supabaseAdmin
    .from("news_allowed_users")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (!allowed) {
    return json(403, {
      error: "This email is not approved for News Manager registration.",
    });
  }

  const { data: usernameOwner } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", username.trim())
    .maybeSingle();

  if (usernameOwner) {
    return json(409, { error: "Username is already taken." });
  }

  const { data: users, error: usersError } =
    await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

  if (usersError) {
    return json(500, { error: "Could not verify the shared user registry." });
  }

  let authUser = users.users.find(
    (user) => user.email?.toLowerCase() === normalizedEmail,
  );

  if (!authUser) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      return json(400, { error: error?.message || "Could not create user." });
    }
    authUser = data.user;
  }

  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("app_source")
    .eq("id", authUser.id)
    .maybeSingle();

  if (existingProfile) {
    return json(409, {
      error: "This account is already registered for an application.",
    });
  }

  // Registration claims an administrator-approved, unassigned Auth identity.
  // Set its password only after confirming it has no access to another app.
  const { error: passwordError } =
    await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      password,
      email_confirm: true,
    });

  if (passwordError) {
    return json(400, { error: "Could not set the account password." });
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: authUser.id,
    email: normalizedEmail,
    username: username.trim(),
    family_name: family_name.trim(),
    first_name: first_name.trim(),
    middle_initial: middle_initial?.trim() || null,
    app_source: "news",
  });

  if (profileError) {
    return json(500, { error: profileError.message });
  }

  return json(200, { success: true });
});

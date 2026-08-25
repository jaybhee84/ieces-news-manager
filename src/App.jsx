import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UpdateBanner from "./components/UpdateBanner";
import mediaManagerLogo from "./image/iecesmediamanager.png";

async function setPresence(session, status) {
  if (!session?.user?.id) return;
  await supabase.from("user_presence").upsert(
    {
      user_id: session.user.id,
      app_id: "media",
      email: session.user.email || null,
      status,
      last_seen: new Date().toISOString(),
    },
    { onConflict: "user_id,app_id" },
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const splashTimer = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      if (event === "SIGNED_IN" && session) {
        setShowSplash(true);
        clearTimeout(splashTimer.current);
        splashTimer.current = setTimeout(() => setShowSplash(false), 2200);
      }

      if (event === "SIGNED_OUT") {
        clearTimeout(splashTimer.current);
        setShowSplash(false);
      }
    });

    return () => {
      clearTimeout(splashTimer.current);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    setPresence(session, "online");
    const heartbeat = setInterval(() => setPresence(session, "online"), 60000);
    const updateVisibility = () =>
      setPresence(session, document.hidden ? "offline" : "online");
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", updateVisibility);
      setPresence(session, "offline");
    };
  }, [session]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (session && showSplash) {
    return (
      <div className="login-splash" role="status" aria-label="Opening dashboard">
        <div className="login-splash-glow" />
        <img
          src={mediaManagerLogo}
          alt="IECES Media Manager"
          className="login-splash-logo"
        />
        <p className="login-splash-text">IECES Media Manager</p>
      </div>
    );
  }

  return (
    <>
      <UpdateBanner />
      {session ? <DashboardPage session={session} /> : <LoginPage />}
    </>
  );
}

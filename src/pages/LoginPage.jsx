import { useState } from "react";
import { supabase } from "../lib/supabase";
import iecesLogo from "../image/ieceslogo.png";
import mediaManagerLogo from "../image/iecesmediamanager.png";
import loginBg1 from "../image/bg1.png";
import loginBg2 from "../image/bg2.png";
import loginBg3 from "../image/bg3.png.png";
import packageInfo from "../../package.json";

export default function LoginPage() {
  const [view, setView] = useState("login"); // 'login' | 'register'

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left panel — branding */}
      <div
        className="hidden md:flex w-1/2 flex-col items-center justify-center p-12 relative"
        style={{
          background:
            "linear-gradient(145deg, #7B1C1C 0%, #881337 55%, #4C0D15 100%)",
        }}
      >
        <div className="absolute top-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-10 border-2 border-white" />
        <div className="absolute bottom-[-40px] right-[-40px] w-80 h-80 rounded-full opacity-10 border-2 border-white" />

        <div className="relative z-10 text-center">
          <div className="logo-ripple-wrap logo-ripple-wrap-lg mx-auto mb-8">
            <span className="logo-ripple-ring" />
            <span className="logo-ripple-ring logo-ripple-ring-delay" />
            <div className="relative z-10 w-full h-full rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center overflow-hidden p-1">
              <img
                src={mediaManagerLogo}
                alt="IECES Media Manager"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
          </div>
          <p className="text-rose-200 text-sm leading-relaxed max-w-xs mx-auto">
            Isabela East Central Elementary School
            <br />
            <span className="text-rose-300 text-xs">Isabela City Division</span>
          </p>
          <div className="mt-8 pt-8 border-t border-white/20 text-rose-200/70 text-xs leading-relaxed">
            Upload news articles · Manage photos
            <br />
            Keep the school website up-to-date
          </div>
          <p className="mt-4 text-[11px] font-semibold tracking-widest text-rose-100/60 uppercase">
            Version {packageInfo.version}
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-form-panel flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 overflow-y-auto relative">
        <div className="login-form-slideshow" aria-hidden="true">
          {[loginBg1, loginBg2, loginBg3].map((image, index) => (
            <div
              key={image}
              className={`login-form-slide login-form-slide-${index + 1}`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
          <div className="login-form-overlay" />
        </div>

        <div className="relative z-10 w-full flex flex-col items-center">
        {/* Mobile logo */}
        <div className="md:hidden text-center mb-7">
          <div className="logo-ripple-wrap logo-ripple-wrap-sm mx-auto mb-4">
            <span className="logo-ripple-ring logo-ripple-ring-mobile" />
            <span className="logo-ripple-ring logo-ripple-ring-delay logo-ripple-ring-mobile" />
            <img
              src={iecesLogo}
              alt="IECES Logo"
              className="relative z-10 w-full h-full object-contain"
            />
          </div>
          <h1 className="text-slate-900 text-xl font-black">
            IECES Media Manager
          </h1>
          <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Version {packageInfo.version}
          </p>
        </div>

        {view === "login" ? (
          <LoginForm onGoRegister={() => setView("register")} />
        ) : (
          <RegisterForm onGoLogin={() => setView("login")} />
        )}
        </div>
      </div>
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ onGoRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const identifier = username.trim().toLowerCase();
    let loginEmail = identifier;
    if (!identifier.includes("@")) {
      let { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", identifier)
        .maybeSingle();
      if (!profile && identifier === "admin") {
        const { data: ownerEmail, error: ownerError } = await supabase.rpc(
          "dashboard_login_email",
          { candidate_username: identifier },
        );
        profile = ownerEmail ? { email: ownerEmail } : null;
        profileErr = ownerError;
      }
      if (profileErr || !profile) {
        setError("Username not found.");
        setLoading(false);
        return;
      }
      loginEmail = profile.email;
    }

    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    const { data: ownerAccess, error: ownerAccessError } = await supabase.rpc(
      "ensure_owner_app_access",
      { app_key: "news" },
    );
    if (ownerAccessError) {
      await supabase.auth.signOut();
      setError("Could not verify application access. Please try again.");
      setLoading(false);
      return;
    }

    if (!ownerAccess) {
      const { data: appProfile, error: accessError } = await supabase
        .from("profiles")
        .select("app_source")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (accessError || appProfile?.app_source !== "news") {
        await supabase.auth.signOut();
        setError(
          "This account is not registered for News Manager. Ask the administrator to allow it, then register.",
        );
        setLoading(false);
        return;
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-content-card w-full max-w-sm">
      <h2 className="text-2xl font-black text-slate-900 mb-1">Sign in</h2>
      <p className="text-slate-500 text-sm mb-8">
        Enter your username and password
      </p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Username or email
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/30 focus:border-rose-900 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/30 focus:border-rose-900 transition"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #7B1C1C, #881337)" }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-500 text-xs">
          Don't have an account?{" "}
          <button
            onClick={onGoRegister}
            className="font-bold text-rose-900 hover:underline"
          >
            Register here
          </button>
        </p>
      </div>

      <p className="text-slate-400 text-xs text-center mt-4">
        Contact your school ICT coordinator to get access.
      </p>
    </div>
  );
}

// ── Register Form ─────────────────────────────────────────────────────────────
function RegisterForm({ onGoLogin }) {
  const [form, setForm] = useState({
    familyName: "",
    firstName: "",
    middleInitial: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    // 1. Check the whitelist managed by IECES Dashboard Manager
    const { data: allowed, error: allowErr } = await supabase.rpc(
      "is_app_email_allowed",
      {
        app_key: "news",
        candidate_email: form.email.trim().toLowerCase(),
      },
    );

    if (allowErr || !allowed) {
      setError(
        "Your email is not authorized to register. Contact your school administrator.",
      );
      setLoading(false);
      return;
    }

    // 2. Check username not already taken
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", form.username.trim())
      .single();

    if (existingUser) {
      setError("Username is already taken. Please choose another.");
      setLoading(false);
      return;
    }

    const email = form.email.trim().toLowerCase();
    const profile = {
      email,
      username: form.username.trim(),
      family_name: form.familyName.trim(),
      first_name: form.firstName.trim(),
      middle_initial: form.middleInitial.trim() || null,
      app_source: "news",
    };

    // 3. The shared Auth user may already exist. A server-side function
    // reuses that identity and creates only the News Manager profile.
    const { data: functionData, error: functionError } =
      await supabase.functions.invoke("news-register", {
        body: { password: form.password, ...profile },
      });

    if (functionError || functionData?.error) {
      setError(
        functionData?.error || functionError?.message || "Registration failed.",
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="login-content-card w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mx-auto mb-4">
          ✅
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">
          Account Created!
        </h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          Your account has been registered. You can now sign in with your
          username and password.
        </p>
        <button
          onClick={onGoLogin}
          className="w-full py-3 rounded-xl font-bold text-sm text-white"
          style={{ background: "linear-gradient(135deg, #7B1C1C, #881337)" }}
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="login-content-card w-full max-w-sm">
      <h2 className="text-2xl font-black text-slate-900 mb-1">
        Create Account
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        Your email must be pre-approved by the administrator.
      </p>

      <form onSubmit={handleRegister} className="space-y-3">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Family Name *
            </label>
            <input
              type="text"
              value={form.familyName}
              onChange={set("familyName")}
              placeholder="Dela Cruz"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/30 focus:border-rose-900 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              First Name *
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={set("firstName")}
              placeholder="Juan"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/30 focus:border-rose-900 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Middle Initial{" "}
            <span className="text-slate-400 normal-case font-normal">
              (optional)
            </span>
          </label>
          <input
            type="text"
            value={form.middleInitial}
            onChange={set("middleInitial")}
            placeholder="B."
            maxLength={3}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/30 focus:border-rose-900 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Username *
          </label>
          <input
            type="text"
            value={form.username}
            onChange={set("username")}
            placeholder="juan_delacruz"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/30 focus:border-rose-900 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Email *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@deped.gov.ph"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/30 focus:border-rose-900 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Password *
          </label>
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder="Min. 6 characters"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/30 focus:border-rose-900 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Confirm Password *
          </label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            placeholder="Re-enter password"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-900/30 focus:border-rose-900 transition"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 mt-2"
          style={{ background: "linear-gradient(135deg, #7B1C1C, #881337)" }}
        >
          {loading ? "Registering…" : "Create Account"}
        </button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-slate-500 text-xs">
          Already have an account?{" "}
          <button
            onClick={onGoLogin}
            className="font-bold text-rose-900 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left panel — branding */}
      <div
        className="hidden md:flex w-1/2 flex-col items-center justify-center p-12 relative"
        style={{ background: 'linear-gradient(145deg, #7B1C1C 0%, #881337 55%, #4C0D15 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-10 border-2 border-white" />
        <div className="absolute bottom-[-40px] right-[-40px] w-80 h-80 rounded-full opacity-10 border-2 border-white" />

        <div className="relative z-10 text-center">
          {/* School seal placeholder */}
          <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center mx-auto mb-6 text-5xl">
            🏫
          </div>
          <h1 className="text-white text-3xl font-black leading-tight mb-2">
            IECES News Manager
          </h1>
          <p className="text-rose-200 text-sm leading-relaxed max-w-xs">
            Isabela East Central Elementary School<br />
            <span className="text-rose-300 text-xs">SDO Isabela City, Basilan</span>
          </p>

          <div className="mt-8 pt-8 border-t border-white/20 text-rose-200/70 text-xs leading-relaxed">
            Upload news articles · Manage photos<br />
            Keep the school website up-to-date
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <div className="text-4xl mb-2">🏫</div>
            <h1 className="text-slate-900 text-xl font-black">IECES News Manager</h1>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1">Sign in</h2>
          <p className="text-slate-500 text-sm mb-8">
            Use your Supabase account credentials
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@deped.gov.ph"
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
                onChange={e => setPassword(e.target.value)}
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
              style={{ background: 'linear-gradient(135deg, #7B1C1C, #881337)' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-slate-400 text-xs text-center mt-8">
            Contact your school ICT coordinator to get access.
          </p>
        </div>
      </div>
    </div>
  )
}

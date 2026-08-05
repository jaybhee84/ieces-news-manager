export default function Sidebar({ user, onSignOut, articleCount }) {
  const openWebsite = () => {
    window.electron?.openUrl('https://ieces.edu.ph/activities')
  }

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white"
    >
      {/* Logo */}
      <div
        className="px-5 py-5 border-b border-slate-100"
        style={{ background: 'linear-gradient(145deg, #7B1C1C, #881337)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl flex-shrink-0">
            🏫
          </div>
          <div>
            <p className="text-white text-xs font-black leading-tight">IECES</p>
            <p className="text-rose-200 text-[10px] leading-tight">News Manager</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-rose-50 text-rose-900">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM2 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          <span className="text-sm font-bold">All Articles</span>
          <span className="ml-auto text-xs bg-rose-900 text-white rounded-full px-2 py-0.5 font-bold">
            {articleCount}
          </span>
        </div>

        <button
          onClick={openWebsite}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="text-sm font-medium">View Website</span>
        </button>
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-900 text-xs font-black uppercase">
            {user.email?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-700 truncate">{user.email}</p>
            <p className="text-[10px] text-slate-400">Administrator</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full text-center text-xs text-slate-500 hover:text-rose-900 py-1.5 rounded-lg hover:bg-slate-50 transition font-medium"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

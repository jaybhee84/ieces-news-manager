import { useState, useEffect } from 'react'

export default function UpdateBanner() {
  const [status, setStatus] = useState(null) // 'available' | 'ready'

  useEffect(() => {
    window.electron?.onUpdateAvailable(() => setStatus('available'))
    window.electron?.onUpdateDownloaded(() => setStatus('ready'))
  }, [])

  if (!status) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 text-xs font-bold px-4 py-2 flex items-center justify-between shadow">
      <span>
        {status === 'available'
          ? '⬇️ A new update is downloading in the background…'
          : '✅ Update ready! Restart to apply.'}
      </span>
      {status === 'ready' && (
        <button
          onClick={() => window.electron?.installUpdate()}
          className="ml-4 px-3 py-1 rounded bg-amber-950 text-amber-100 text-xs font-bold hover:bg-amber-900 transition"
        >
          Restart Now
        </button>
      )}
    </div>
  )
}

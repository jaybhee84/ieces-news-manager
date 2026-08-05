export default function DeleteConfirmModal({ title, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl mx-auto mb-4">
          🗑️
        </div>
        <h3 className="text-lg font-black text-slate-900 text-center mb-2">Delete Article?</h3>
        <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
          <span className="font-semibold text-slate-700">"{title}"</span> and all its photos
          will be permanently deleted and removed from the website.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}

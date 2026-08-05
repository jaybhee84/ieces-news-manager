export default function ArticleCard({ article, onEdit, onDelete }) {
  const photoCount = article.photos?.length || 0
  const firstPhoto = photoCount > 0 ? article.photos[0] : null

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Photo area */}
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        {firstPhoto ? (
          <img
            src={firstPhoto}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
            <span className="text-4xl mb-1">{article.icon}</span>
            <span className="text-xs font-medium text-slate-400">No photo yet</span>
          </div>
        )}

        {/* Photo count badge */}
        {photoCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {photoCount} photo{photoCount !== 1 ? 's' : ''}
          </div>
        )}

        {/* Action buttons on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => onEdit(article)}
            className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-slate-50 transition"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => onDelete(article)}
            className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-red-700 transition"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${article.bg_color} ${article.border_color}`}>
            {article.category}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">{article.date_label}</span>
        </div>

        <h3 className="text-sm font-black text-slate-900 leading-snug mb-1 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
          {article.description}
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <button
          onClick={() => onEdit(article)}
          className="flex-1 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-rose-200 hover:text-rose-900 transition"
        >
          Edit Article
        </button>
        <button
          onClick={() => onDelete(article)}
          className="py-2 px-3 rounded-lg text-xs font-bold border border-red-100 text-red-500 hover:bg-red-50 transition"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

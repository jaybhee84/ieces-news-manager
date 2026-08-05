import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import ArticleCard from '../components/ArticleCard'
import ArticleModal from '../components/ArticleModal'
import Sidebar from '../components/Sidebar'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

export default function DashboardPage({ session }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setArticles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleNewArticle = () => {
    setEditingArticle(null)
    setShowModal(true)
  }

  const handleEdit = (article) => {
    setEditingArticle(article)
    setShowModal(true)
  }

  const handleDeleteConfirm = (article) => {
    setDeleteTarget(article)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    // Delete photos from storage
    if (deleteTarget.photos?.length) {
      const paths = deleteTarget.photos.map(url => {
        const parts = url.split('/news-photos/')
        return parts[1] || ''
      }).filter(Boolean)
      if (paths.length) {
        await supabase.storage.from('news-photos').remove(paths)
      }
    }
    const { error } = await supabase
      .from('news_articles')
      .delete()
      .eq('id', deleteTarget.id)
    if (!error) {
      showToast('Article deleted successfully.')
      fetchArticles()
    } else {
      showToast('Failed to delete article.', 'error')
    }
    setDeleteTarget(null)
  }

  const filtered = articles.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'All' || a.category === filterCat
    return matchSearch && matchCat
  })

  const categories = ['All', ...new Set(articles.map(a => a.category))]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar
        user={session.user}
        onSignOut={handleSignOut}
        articleCount={articles.length}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <div className="flex-1">
            <h1 className="text-lg font-black text-slate-900">News & Activities</h1>
            <p className="text-xs text-slate-400">
              Manage articles that appear on the IECES school website
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search articles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 w-56 transition"
            />
          </div>

          {/* New article button */}
          <button
            onClick={handleNewArticle}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition-all hover:opacity-90 hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, #7B1C1C, #881337)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            New Article
          </button>
        </header>

        {/* Category filter pills */}
        <div className="bg-white border-b border-slate-100 px-6 py-2.5 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterCat === cat
                  ? 'text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={filterCat === cat ? { backgroundColor: '#7B1C1C' } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Article grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-rose-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-semibold text-slate-500">No articles yet</p>
              <p className="text-sm mt-1">Click "New Article" to add the first one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onEdit={handleEdit}
                  onDelete={handleDeleteConfirm}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <ArticleModal
          article={editingArticle}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            fetchArticles()
            showToast(editingArticle ? 'Article updated!' : 'Article published!')
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all z-50 ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}
    </div>
  )
}

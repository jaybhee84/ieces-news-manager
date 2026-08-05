import { useState, useEffect } from 'react'
import { supabase, BUCKET } from '../lib/supabase'

const CATEGORY_PRESETS = [
  { label: 'Campus Journalism', tag: 'Journalism', icon: '✍️', bg: 'bg-amber-100 text-amber-900', border: 'border-amber-200' },
  { label: 'Health & Nutrition', tag: 'Nutrition', icon: '🥗', bg: 'bg-emerald-100 text-emerald-900', border: 'border-emerald-200' },
  { label: 'Sports & Culture', tag: 'Sports', icon: '🏆', bg: 'bg-blue-100 text-blue-900', border: 'border-blue-200' },
  { label: 'Community Engagement', tag: 'Community', icon: '🤝', bg: 'bg-purple-100 text-purple-900', border: 'border-purple-200' },
  { label: 'Academic & Literacy', tag: 'Literacy', icon: '📚', bg: 'bg-rose-100 text-rose-900', border: 'border-rose-200' },
  { label: 'Safety & Preparedness', tag: 'Safety', icon: '🚨', bg: 'bg-amber-100 text-amber-900', border: 'border-amber-200' },
  { label: 'Announcements', tag: 'News', icon: '📢', bg: 'bg-sky-100 text-sky-900', border: 'border-sky-200' },
  { label: 'Other', tag: 'Event', icon: '📰', bg: 'bg-slate-100 text-slate-900', border: 'border-slate-200' },
]

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const YEARS = Array.from({ length: 5 }, (_, i) => 2024 + i)

export default function ArticleModal({ article, onClose, onSaved }) {
  const isEdit = !!article

  const [form, setForm] = useState({
    title: '',
    category: CATEGORY_PRESETS[0].label,
    tag: CATEGORY_PRESETS[0].tag,
    icon: CATEGORY_PRESETS[0].icon,
    bg_color: CATEGORY_PRESETS[0].bg,
    border_color: CATEGORY_PRESETS[0].border,
    date_label: `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`,
    description: '',
  })
  const [existingPhotos, setExistingPhotos] = useState([]) // URLs from Supabase
  const [newPhotos, setNewPhotos] = useState([])           // {name, data, mime} from disk
  const [photosToDelete, setPhotosToDelete] = useState([]) // URLs to remove
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const [dateMonth, setDateMonth] = useState(MONTHS[new Date().getMonth()])
  const [dateYear, setDateYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (article) {
      setForm({
        title: article.title,
        category: article.category,
        tag: article.tag,
        icon: article.icon,
        bg_color: article.bg_color,
        border_color: article.border_color,
        date_label: article.date_label,
        description: article.description,
      })
      setExistingPhotos(article.photos || [])
      const parts = article.date_label?.split(' ')
      if (parts?.length === 2) {
        setDateMonth(parts[0])
        setDateYear(parseInt(parts[1]))
      }
    }
  }, [article])

  const applyPreset = (preset) => {
    setForm(f => ({
      ...f,
      category: preset.label,
      tag: preset.tag,
      icon: preset.icon,
      bg_color: preset.bg,
      border_color: preset.border,
    }))
  }

  const handlePickPhotos = async () => {
    const files = await window.electron?.pickImages()
    if (!files?.length) return
    setNewPhotos(prev => [...prev, ...files])
  }

  const removeNew = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const toggleDeleteExisting = (url) => {
    setPhotosToDelete(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    )
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.')
      return
    }
    setError('')
    setSaving(true)

    try {
      // 1. Delete removed existing photos from storage
      if (photosToDelete.length) {
        const paths = photosToDelete.map(url => {
          const idx = url.indexOf('/news-photos/')
          return idx !== -1 ? url.substring(idx + '/news-photos/'.length) : ''
        }).filter(Boolean)
        if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
      }

      // 2. Upload new photos
      const uploadedUrls = []
      for (let i = 0; i < newPhotos.length; i++) {
        const photo = newPhotos[i]
        const ext = photo.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const buffer = Uint8Array.from(atob(photo.data), c => c.charCodeAt(0))
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(fileName, buffer, { contentType: photo.mime, upsert: false })
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`)
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
        uploadedUrls.push(urlData.publicUrl)
        setUploadProgress(Math.round(((i + 1) / newPhotos.length) * 100))
      }

      // 3. Build final photos array
      const keptExisting = existingPhotos.filter(url => !photosToDelete.includes(url))
      const finalPhotos = [...keptExisting, ...uploadedUrls]

      const payload = {
        ...form,
        date_label: `${dateMonth} ${dateYear}`,
        photos: finalPhotos,
      }

      if (isEdit) {
        const { error: dbErr } = await supabase
          .from('news_articles')
          .update(payload)
          .eq('id', article.id)
        if (dbErr) throw new Error(dbErr.message)
      } else {
        const { error: dbErr } = await supabase
          .from('news_articles')
          .insert(payload)
        if (dbErr) throw new Error(dbErr.message)
      }

      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {isEdit ? 'Edit Article' : 'New Article'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEdit ? 'Update article details and photos' : 'Fill in the details and upload photos'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Category presets */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORY_PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`px-2 py-2 rounded-xl border text-xs font-bold text-left transition-all ${
                    form.category === p.label
                      ? 'border-rose-900 bg-rose-50 text-rose-900 ring-1 ring-rose-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="mr-1">{p.icon}</span> {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Division Schools Press Conference Victories"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <div className="flex gap-2">
              <select
                value={dateMonth}
                onChange={e => setDateMonth(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition"
              >
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
              <select
                value={dateYear}
                onChange={e => setDateYear(parseInt(e.target.value))}
                className="w-28 px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition"
              >
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="Describe the activity, event, or announcement…"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-900/20 focus:border-rose-900 transition resize-none"
            />
          </div>

          {/* Photos section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Photos
              </label>
              <button
                type="button"
                onClick={handlePickPhotos}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 text-rose-900 hover:bg-rose-50 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Photos
              </button>
            </div>

            {/* Existing photos */}
            {existingPhotos.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5">Uploaded</p>
                <div className="grid grid-cols-4 gap-2">
                  {existingPhotos.map(url => (
                    <div key={url} className="relative group">
                      <img
                        src={url}
                        className={`w-full h-20 object-cover rounded-lg border-2 transition-all ${
                          photosToDelete.includes(url)
                            ? 'opacity-40 border-red-400 grayscale'
                            : 'border-transparent'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleDeleteExisting(url)}
                        className={`absolute top-1 right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition ${
                          photosToDelete.includes(url)
                            ? 'bg-red-500 text-white'
                            : 'bg-black/60 text-white opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {photosToDelete.includes(url) ? '↩' : '✕'}
                      </button>
                    </div>
                  ))}
                </div>
                {photosToDelete.length > 0 && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {photosToDelete.length} photo(s) will be deleted on save.
                  </p>
                )}
              </div>
            )}

            {/* New photos preview */}
            {newPhotos.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1.5">To Upload</p>
                <div className="grid grid-cols-4 gap-2">
                  {newPhotos.map((photo, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={`data:${photo.mime};base64,${photo.data}`}
                        className="w-full h-20 object-cover rounded-lg border-2 border-emerald-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeNew(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {existingPhotos.length === 0 && newPhotos.length === 0 && (
              <div
                onClick={handlePickPhotos}
                className="border-2 border-dashed border-slate-200 rounded-xl h-24 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-rose-300 hover:text-rose-400 transition"
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium">Click to add photos</span>
              </div>
            )}
          </div>

          {/* Upload progress */}
          {saving && newPhotos.length > 0 && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Uploading photos…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%`, backgroundColor: '#7B1C1C' }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition"
            style={{ background: 'linear-gradient(135deg, #7B1C1C, #881337)' }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Article'}
          </button>
        </div>
      </div>
    </div>
  )
}

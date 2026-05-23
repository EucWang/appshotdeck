import { useRef, useState, useCallback, useEffect } from 'react'
import { Download, Layers, Save, FolderOpen, Globe, Sun, Moon, Undo2, Redo2, LayoutGrid } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../store/useEditorStore'
import { useThemeStore } from '../store/useThemeStore'
import { TemplateModal } from './TemplateModal'
import { exportAll, type ExportEntry } from '../utils/export'
import { saveProject, loadProject } from '../utils/project'

interface Props {
  canvasRefs: React.MutableRefObject<Map<string, HTMLDivElement>>
}

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'zh', label: '中文' },
]

export function Header({ canvasRefs }: Props) {
  const { t, i18n } = useTranslation()
  const slides = useEditorStore((s) => s.slides)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore((s) => s._undoCount > 0)
  const canRedo = useEditorStore((s) => s._redoCount > 0)
  const loadSlides = useEditorStore((s) => s.loadSlides)
  const { isDark, toggle: toggleTheme } = useThemeStore()
  const [showTemplates, setShowTemplates] = useState(false)
  const exporting = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  const handleExportAll = useCallback(async () => {
    if (exporting.current) return
    exporting.current = true
    try {
      const entries = slides
        .map((sl, idx) => {
          const el = canvasRefs.current.get(sl.id)
          if (!el) return null
          return { el, format: sl.format, name: `slide-${idx + 1}` } satisfies ExportEntry
        })
        .filter(Boolean) as ExportEntry[]
      await exportAll(entries)
    } finally {
      exporting.current = false
    }
  }, [slides, canvasRefs])

  const handleSave = useCallback(async () => {
    await saveProject(slides)
  }, [slides])

  const handleLoad = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { slides: loaded } = await loadProject(file)
      loadSlides(loaded)
    } catch (err) {
      alert(`Could not load project: ${err instanceof Error ? err.message : String(err)}`)
    }
    e.target.value = ''
  }, [loadSlides])

  return (
    <>
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-5 surface border-b border-subtle">
      <div className="flex items-center gap-2">
        <Layers className="w-5 h-5 text-indigo-400" />
        <span className="font-semibold tracking-tight">appshotdeck</span>
        <span className="text-muted text-xs ml-1">{t('header.tagline')}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex items-center gap-1 mr-1">
          <Globe className="w-3.5 h-3.5 text-muted" />
          {LANGS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                (i18n.resolvedLanguage ?? 'en') === lang.code
                  ? 'text-indigo-500 dark:text-indigo-400 font-semibold'
                  : 'text-muted hover:text-dim'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 btn-ghost"
          title={isDark ? t('header.light_mode') : t('header.dark_mode')}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="w-px h-6 bg-black/10 dark:bg-white/15" />

        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-2 btn-ghost ${!canUndo ? 'opacity-30 pointer-events-none' : ''}`}
          title={t('header.undo')}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-2 btn-ghost ${!canRedo ? 'opacity-30 pointer-events-none' : ''}`}
          title={t('header.redo')}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm btn-ghost"
          title={t('templates.title')}
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">{t('templates.button')}</span>
        </button>

        <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-2 text-sm btn-ghost">
          <Save className="w-4 h-4" />
          {t('header.save')}
        </button>

        <label className="flex items-center gap-1.5 px-3 py-2 text-sm btn-ghost cursor-pointer">
          <FolderOpen className="w-4 h-4" />
          {t('header.load')}
          <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleLoad} />
        </label>

        <div className="w-px h-6 bg-black/10 dark:bg-white/15" />

        <button
          onClick={handleExportAll}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          {t('header.export_all')}
        </button>
      </div>
    </header>
    <TemplateModal open={showTemplates} onClose={() => setShowTemplates(false)} />
    </>
  )
}

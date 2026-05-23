import { useState, useEffect, useCallback } from 'react'
import { LayoutGrid, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../store/useEditorStore'
import { TEMPLATES, TEMPLATE_CATEGORIES, type TemplateDef } from '../data/templates'

interface TemplateModalProps {
  open: boolean
  onClose: () => void
}

function bgStyle(bg: TemplateDef['patch']['background']): React.CSSProperties {
  if (bg.type === 'gradient')
    return { background: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})` }
  if (bg.type === 'solid')
    return { background: bg.color }
  return {}
}

function TemplatePreview({ template }: { template: TemplateDef }) {
  const { patch } = template
  const isDual = patch.screenshotCount === 2
  const textAtTop = patch.textPosition === 'top'

  const textBlock = (
    <div className={`flex flex-col gap-1 px-3 py-2 ${textAtTop ? '' : 'mt-auto order-3'}`}>
      <div
        className="h-1.5 rounded-full"
        style={{ width: '55%', background: patch.textColor, opacity: 0.85 }}
      />
      <div
        className="h-1 rounded-full"
        style={{ width: '38%', background: patch.subtitleColor, opacity: 0.5 }}
      />
    </div>
  )

  const deviceShape = (w: string) => (
    <div
      className={`${w} aspect-[9/17] rounded-sm`}
      style={{ background: 'rgba(128,128,128,0.25)', border: '1px solid rgba(128,128,128,0.2)' }}
    />
  )

  const deviceArea = isDual ? (
    <div className="flex-1 flex items-center justify-center gap-1 pb-2">
      {deviceShape('w-[22%]')}
      {deviceShape('w-[22%]')}
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center pb-2">
      {deviceShape('w-[36%]')}
    </div>
  )

  return (
    <div className="absolute inset-0 flex flex-col" style={bgStyle(patch.background)}>
      {textAtTop ? textBlock : null}
      {deviceArea}
      {textAtTop ? null : textBlock}
    </div>
  )
}

export function TemplateModal({ open, onClose }: TemplateModalProps) {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const updateSlide = useEditorStore((s) => s.updateSlide)
  const activeSlideId = useEditorStore((s) => s.activeSlideId)

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    window.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, handleEsc])

  if (!open) return null

  const filtered = activeCategory
    ? TEMPLATES.filter((t) => t.category === activeCategory)
    : TEMPLATES

  const handleApply = (template: TemplateDef) => {
    if (!activeSlideId) return
    updateSlide(activeSlideId, { ...template.patch })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative surface rounded-2xl overflow-hidden flex flex-col w-[92vw] max-w-3xl h-[80vh] border border-medium">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-subtle">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold">{t('templates.title')}</span>
          </div>
          <button onClick={onClose} className="p-1.5 btn-ghost rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 px-5 py-2.5 border-b border-subtle">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
              activeCategory === null
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400'
                : 'option-idle'
            }`}
          >
            {t('templates.cat_all')}
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400'
                  : 'option-idle'
              }`}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((template) => (
              <button
                key={template.id}
                onClick={() => handleApply(template)}
                className="group text-left"
              >
                <div className="aspect-[9/16] rounded-lg overflow-hidden border-2 border-transparent group-hover:border-indigo-400 transition-colors relative">
                  <TemplatePreview template={template} />
                </div>
                <p className="text-xs text-dim truncate mt-1.5 group-hover:text-indigo-300 transition-colors">
                  {t(template.labelKey)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

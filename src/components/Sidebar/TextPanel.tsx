import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../store/useEditorStore'

export function TextPanel() {
  const { t } = useTranslation()
  const { slides, activeSlideId, updateSlide } = useEditorStore()
  const slide = slides.find((s) => s.id === activeSlideId)
  if (!slide) return null

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <label className="text-xs text-muted uppercase tracking-wider">{t('text.headline')}</label>
        <textarea
          value={slide.headline}
          onChange={(e) => updateSlide(activeSlideId, { headline: e.target.value })}
          rows={2}
          className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-black/30 dark:placeholder-white/30 resize-none focus:outline-none focus:border-indigo-400 transition-colors"
          placeholder={t('text.headline_placeholder')}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted uppercase tracking-wider">{t('text.subtitle')}</label>
        <textarea
          value={slide.subtitle}
          onChange={(e) => updateSlide(activeSlideId, { subtitle: e.target.value })}
          rows={2}
          className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-black/30 dark:placeholder-white/30 resize-none focus:outline-none focus:border-indigo-400 transition-colors"
          placeholder={t('text.subtitle_placeholder')}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted uppercase tracking-wider">{t('text.headline_color')}</label>
        <label className="flex items-center gap-3">
          <input type="color" value={slide.textColor}
            onChange={(e) => updateSlide(activeSlideId, { textColor: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
          />
          <span className="text-sm text-dim font-mono">{slide.textColor}</span>
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted uppercase tracking-wider">{t('text.subtitle_color')}</label>
        <label className="flex items-center gap-3">
          <input type="color" value={slide.subtitleColor}
            onChange={(e) => updateSlide(activeSlideId, { subtitleColor: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
          />
          <span className="text-sm text-dim font-mono">{slide.subtitleColor}</span>
        </label>
      </div>
    </div>
  )
}

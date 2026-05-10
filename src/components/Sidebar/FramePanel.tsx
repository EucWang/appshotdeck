import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import { useEditorStore } from '../../store/useEditorStore'
import { framesForFormat, frameById } from '../../data/frames'

export function FramePanel() {
  const { t } = useTranslation()
  const { slides, activeSlideId, updateSlide } = useEditorStore()
  const slide = slides.find((s) => s.id === activeSlideId)
  if (!slide) return null

  const available = framesForFormat(slide.format)
  const activeFrame = frameById(slide.frame)

  return (
    <div className="p-4 space-y-2">
      <p className="text-xs text-muted uppercase tracking-wider mb-3">{t('frame.title')}</p>
      {available.map((frame) => (
        <button
          key={frame.id}
          onClick={() => updateSlide(activeSlideId, { frame: frame.id })}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
            slide.frame === frame.id
              ? 'border-indigo-400 bg-indigo-500/20 text-gray-900 dark:text-white'
              : 'option-idle'
          }`}
        >
          {slide.format === 'phone' || slide.format === 'iphone-69' || slide.format === 'iphone-65' ? (
            <div className={`w-7 h-12 border-2 border-current rounded-lg flex items-center justify-center flex-shrink-0 opacity-75 ${frame.tilt ? '[transform:rotateY(20deg)] [perspective:120px]' : ''}`}>
              {(frame.id === 'android-flat' || frame.id === 'android-3d') && (
                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              )}
            </div>
          ) : (
            <div className="w-12 h-8 border-2 border-current rounded-md flex-shrink-0 opacity-75" />
          )}
          <span className="text-sm font-medium">{frame.label}</span>
          {slide.frame === frame.id && (
            <span className="ml-auto text-xs text-indigo-400 dark:text-indigo-400">{t('frame.active')}</span>
          )}
        </button>
      ))}
      {activeFrame.tilt && (
        <div className="flex items-center gap-2 pt-2 pr-1">
          <span className="text-xs text-muted w-7 flex-shrink-0">{t('frame.tilt')}</span>
          <input
            type="range" min={-60} max={60} value={slide.frameTilt}
            onChange={(e) => updateSlide(activeSlideId, { frameTilt: Number(e.target.value) })}
            className="flex-1 min-w-0"
          />
          <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{slide.frameTilt}°</span>
          <button
            onClick={() => updateSlide(activeSlideId, { frameTilt: 0 })}
            className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
            title="Reset tilt"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

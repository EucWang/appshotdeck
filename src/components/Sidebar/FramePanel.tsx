import { useTranslation } from 'react-i18next'
import { RotateCcw, AlignCenterHorizontal, AlignCenterVertical } from 'lucide-react'
import { useEditorStore } from '../../store/useEditorStore'
import { framesForFormat, frameById } from '../../data/frames'

const RESIZABLE_FORMATS = new Set(['phone', 'iphone-69', 'iphone-65', 'ipad-13', 'tablet-7', 'tablet-10'])
const LANDSCAPE_FORMATS = new Set(['tablet-7', 'tablet-10'])
const PORTRAIT_PHONE_FORMATS = new Set(['phone', 'iphone-69', 'iphone-65', 'ipad-13'])

const DEFAULT_OFFSET: Record<string, number> = {
  'phone': 30, 'iphone-69': 30, 'iphone-65': 30, 'ipad-13': 30,
  'tablet-7': 16, 'tablet-10': 16,
}


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
          ) : frame.id === 'tablet-none' ? (
            <div className="w-12 h-8 border-2 border-dashed border-current rounded-md flex-shrink-0 opacity-50" />
          ) : (
            <div className="w-12 h-8 border-2 border-current rounded-md flex-shrink-0 opacity-75" />
          )}
          <span className="text-sm font-medium">{frame.label}</span>
          {slide.frame === frame.id && (
            <span className="ml-auto text-xs text-indigo-400 dark:text-indigo-400">{t('frame.active')}</span>
          )}
        </button>
      ))}
      {RESIZABLE_FORMATS.has(slide.format) && (
        <>
          <div className="flex items-center gap-2 pt-2 pr-1">
            <span className="text-xs text-muted w-7 flex-shrink-0">Pos</span>
            <input
              type="range" min={-30} max={30} value={slide.deviceOffset ?? 0}
              onChange={(e) => updateSlide(activeSlideId, { deviceOffset: Number(e.target.value) })}
              className="flex-1 min-w-0"
            />
            <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{(slide.deviceOffset ?? 0) > 0 ? `+${slide.deviceOffset}` : (slide.deviceOffset ?? 0)}%</span>
            {PORTRAIT_PHONE_FORMATS.has(slide.format) && (
              <button
                onClick={() => updateSlide(activeSlideId, { deviceOffset: 0 })}
                className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
                title="Center vertically"
              >
                <AlignCenterVertical size={14} />
              </button>
            )}
            {LANDSCAPE_FORMATS.has(slide.format) && (
              <button
                onClick={() => updateSlide(activeSlideId, { deviceOffset: 0 })}
                className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
                title="Center horizontally"
              >
                <AlignCenterHorizontal size={14} />
              </button>
            )}
            <button
              onClick={() => updateSlide(activeSlideId, { deviceOffset: DEFAULT_OFFSET[slide.format] ?? 0 })}
              className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
              title="Reset to default position"
            >
              <RotateCcw size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 pr-1">
            <span className="text-xs text-muted w-7 flex-shrink-0">Size</span>
            <input
              type="range" min={60} max={100} value={slide.deviceScale ?? 100}
              onChange={(e) => updateSlide(activeSlideId, { deviceScale: Number(e.target.value) })}
              className="flex-1 min-w-0"
            />
            <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{slide.deviceScale ?? 100}%</span>
            <button
              onClick={() => updateSlide(activeSlideId, { deviceScale: 100 })}
              className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
              title="Reset size"
            >
              <RotateCcw size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 pr-1">
            <span className="text-xs text-muted w-7 flex-shrink-0">{t('frame.rotate')}</span>
            <input
              type="range" min={-180} max={180} value={slide.deviceRotate ?? 0}
              onChange={(e) => updateSlide(activeSlideId, { deviceRotate: Number(e.target.value) })}
              className="flex-1 min-w-0"
            />
            <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{slide.deviceRotate ?? 0}°</span>
            <button
              onClick={() => updateSlide(activeSlideId, { deviceRotate: 0 })}
              className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
              title="Reset rotation"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </>
      )}

      {LANDSCAPE_FORMATS.has(slide.format) && (
        <>
          <div className="flex items-center gap-2 pt-2 pr-1">
            <span className="text-xs text-muted w-7 flex-shrink-0">{t('frame.zoom')}</span>
            <input
              type="range" min={100} max={400} step={10}
              value={slide.screenshotZoom ?? 100}
              onChange={(e) => {
                const newZoom = Number(e.target.value)
                const newMax = Math.max(0, (newZoom / 100 - 1) * 50)
                const curOX = slide.screenshotOffsetX ?? 0
                const curOY = slide.screenshotOffsetY ?? 0
                updateSlide(activeSlideId, {
                  screenshotZoom: newZoom,
                  screenshotOffsetX: Math.round(Math.max(-newMax, Math.min(newMax, curOX)) * 10) / 10,
                  screenshotOffsetY: Math.round(Math.max(-newMax, Math.min(newMax, curOY)) * 10) / 10,
                })
              }}
              className="flex-1 min-w-0"
            />
            <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{slide.screenshotZoom ?? 100}%</span>
            <button
              onClick={() => updateSlide(activeSlideId, { screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 })}
              className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
              title={t('frame.zoom_reset')}
            >
              <RotateCcw size={14} />
            </button>
          </div>
          <p className="text-xs text-black/25 dark:text-white/25 pl-9">{t('frame.zoom_hint')}</p>
        </>
      )}

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

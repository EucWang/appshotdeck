import { useTranslation } from 'react-i18next'
import { RotateCcw, AlignCenterHorizontal, AlignCenterVertical, Grid3x3, Shield } from 'lucide-react'
import { useEditorStore, toggleScreenshotCount } from '../../store/useEditorStore'
import { framesForFormat, frameById } from '../../data/frames'
import { presetsForCount, presetById } from '../../data/layoutPresets'
import type { DeviceSlot, Slide } from '../../types'

const RESIZABLE_FORMATS = new Set(['phone', 'iphone-69', 'iphone-65', 'ipad-13', 'tablet-7', 'tablet-10'])
const LANDSCAPE_FORMATS = new Set(['tablet-7', 'tablet-10'])
const PORTRAIT_PHONE_FORMATS = new Set(['phone', 'iphone-69', 'iphone-65', 'ipad-13'])

const DEFAULT_OFFSET: Record<string, number> = {
  'phone': 30, 'iphone-69': 30, 'iphone-65': 30, 'ipad-13': 30,
  'tablet-7': 16, 'tablet-10': 16,
}

function PresetThumbnail({ preset }: { preset: { id: string; screenshotCount: 1 | 2 | 3; devices: DeviceSlot[] } }) {
  const isMulti = preset.screenshotCount > 1
  return (
    <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-black/10 dark:bg-white/10">
      {preset.devices.map((dev, i) => {
        const scale = dev.deviceScale / 100
        const offsetY = dev.deviceOffset
        const offsetX = dev.deviceOffsetX ?? 0
        const rotate = dev.deviceRotate
        const leftPct = isMulti ? 50 + offsetX * 1.5 : 50
        const topPct = 50 + offsetY * 1.2
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${scale * (preset.screenshotCount === 3 ? 22 : 28)}%`,
              aspectRatio: '9/16',
              transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
              borderRadius: 3,
              border: '1.5px solid currentColor',
              opacity: 0.7,
            }}
          />
        )
      })}
    </div>
  )
}

function DeviceSliders({
  label,
  slide,
  slotIndex,
  format,
  showZoom,
}: {
  label: string
  slide: Slide
  slotIndex: number
  format: string
  showZoom: boolean
}) {
  const { t } = useTranslation()
  const { activeSlideId, updateSlide } = useEditorStore()

  const count = slide.screenshotCount ?? 1
  const isMulti = count > 1
  const devSlot = isMulti
    ? (slide.deviceSlots?.[slotIndex] ?? { deviceOffset: 0, deviceOffsetX: 0, deviceScale: 100, deviceRotate: 0 })
    : { deviceOffset: slide.deviceOffset, deviceOffsetX: 0, deviceScale: slide.deviceScale, deviceRotate: slide.deviceRotate ?? 0 }

  const setSlotField = (field: keyof DeviceSlot, value: number) => {
    if (!isMulti) {
      updateSlide(activeSlideId, { [field]: value })
      return
    }
    const slots = slide.deviceSlots ? [...slide.deviceSlots] : Array.from(
      { length: Math.max(count, 2) },
      (_, i) => i === 0
        ? { deviceOffset: slide.deviceOffset, deviceOffsetX: 0, deviceScale: slide.deviceScale, deviceRotate: slide.deviceRotate ?? 0 }
        : { deviceOffset: 0, deviceOffsetX: 0, deviceScale: 78, deviceRotate: 0 }
    )
    while (slots.length <= slotIndex) {
      slots.push({ deviceOffset: 0, deviceOffsetX: 0, deviceScale: 78, deviceRotate: 0 })
    }
    slots[slotIndex] = { ...slots[slotIndex], [field]: value }
    updateSlide(activeSlideId, { deviceSlots: slots, activePresetId: null })
  }

  const zoomVal = isMulti
    ? (slide.slots?.[slotIndex]?.screenshotZoom ?? 100)
    : (slide.screenshotZoom ?? 100)

  const setZoom = (val: number) => {
    if (!isMulti) {
      const newMax = Math.max(0, (val / 100 - 1) * 50)
      updateSlide(activeSlideId, {
        screenshotZoom: val,
        screenshotOffsetX: Math.round(Math.max(-newMax, Math.min(newMax, slide.screenshotOffsetX ?? 0)) * 10) / 10,
        screenshotOffsetY: Math.round(Math.max(-newMax, Math.min(newMax, slide.screenshotOffsetY ?? 0)) * 10) / 10,
      })
      return
    }
    const slots = slide.slots ? [...slide.slots] : Array.from(
      { length: Math.max(count, 2) },
      (_, i) => i === 0
        ? { screenshotDataUrl: slide.screenshotDataUrl, screenshotZoom: slide.screenshotZoom ?? 100, screenshotOffsetX: slide.screenshotOffsetX ?? 0, screenshotOffsetY: slide.screenshotOffsetY ?? 0 }
        : { screenshotDataUrl: null, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 }
    )
    while (slots.length <= slotIndex) {
      slots.push({ screenshotDataUrl: null, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 })
    }
    const cur = slots[slotIndex]
    const newMax = Math.max(0, (val / 100 - 1) * 50)
    slots[slotIndex] = {
      ...cur,
      screenshotZoom: val,
      screenshotOffsetX: Math.round(Math.max(-newMax, Math.min(newMax, cur.screenshotOffsetX)) * 10) / 10,
      screenshotOffsetY: Math.round(Math.max(-newMax, Math.min(newMax, cur.screenshotOffsetY)) * 10) / 10,
    }
    updateSlide(activeSlideId, { slots, activePresetId: null })
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted font-medium">{label}</p>
      <div className="flex items-center gap-2 pr-1">
        <span className="text-xs text-muted w-7 flex-shrink-0">Pos</span>
        <input
          type="range" min={-30} max={30} value={devSlot.deviceOffset}
          onChange={(e) => setSlotField('deviceOffset', Number(e.target.value))}
          className="flex-1 min-w-0"
        />
        <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">
          {devSlot.deviceOffset > 0 ? `+${devSlot.deviceOffset}` : devSlot.deviceOffset}%
        </span>
        <button
          onClick={() => {
            if (!isMulti) {
              updateSlide(activeSlideId, { deviceOffset: 0 })
            } else {
              setSlotField('deviceOffset', 0)
            }
          }}
          className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
          title={t('frame.reset_position')}
        >
          {PORTRAIT_PHONE_FORMATS.has(format) ? <AlignCenterVertical size={14} /> : <AlignCenterHorizontal size={14} />}
        </button>
        <button
          onClick={() => {
            if (!isMulti) {
              updateSlide(activeSlideId, { deviceOffset: DEFAULT_OFFSET[format] ?? 0 })
            } else {
              setSlotField('deviceOffset', DEFAULT_OFFSET[format] ?? 0)
            }
          }}
          className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
          title={t('frame.reset_to_default')}
        >
          <RotateCcw size={14} />
        </button>
      </div>
      {isMulti && (
        <div className="flex items-center gap-2 pr-1">
          <span className="text-xs text-muted w-7 flex-shrink-0">PosX</span>
          <input
            type="range" min={-30} max={30} value={devSlot.deviceOffsetX ?? 0}
            onChange={(e) => setSlotField('deviceOffsetX', Number(e.target.value))}
            className="flex-1 min-w-0"
          />
          <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">
            {(devSlot.deviceOffsetX ?? 0) > 0 ? `+${devSlot.deviceOffsetX}` : (devSlot.deviceOffsetX ?? 0)}%
          </span>
          <button
            onClick={() => setSlotField('deviceOffsetX', 0)}
            className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
            title={t('frame.reset_position')}
          >
            <AlignCenterHorizontal size={14} />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 pr-1">
        <span className="text-xs text-muted w-7 flex-shrink-0">Size</span>
        <input
          type="range" min={40} max={100} value={devSlot.deviceScale}
          onChange={(e) => setSlotField('deviceScale', Number(e.target.value))}
          className="flex-1 min-w-0"
        />
        <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{devSlot.deviceScale}%</span>
        <button
          onClick={() => setSlotField('deviceScale', 100)}
          className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
          title={t('frame.reset_size')}
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2 pr-1">
        <span className="text-xs text-muted w-7 flex-shrink-0">{t('frame.rotate')}</span>
        <input
          type="range" min={-180} max={180} value={devSlot.deviceRotate}
          onChange={(e) => setSlotField('deviceRotate', Number(e.target.value))}
          className="flex-1 min-w-0"
        />
        <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{devSlot.deviceRotate}°</span>
        <button
          onClick={() => setSlotField('deviceRotate', 0)}
          className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
          title={t('frame.reset_rotation')}
        >
          <RotateCcw size={14} />
        </button>
      </div>
      {showZoom && (
        <div className="flex items-center gap-2 pr-1">
          <span className="text-xs text-muted w-7 flex-shrink-0">{t('frame.zoom')}</span>
          <input
            type="range" min={100} max={400} step={10}
            value={zoomVal}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 min-w-0"
          />
          <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{zoomVal}%</span>
          <button
            onClick={() => setZoom(100)}
            className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
            title={t('frame.zoom_reset')}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export function FramePanel() {
  const { t } = useTranslation()
  const { slides, activeSlideId, updateSlide } = useEditorStore()
  const slide = slides.find((s) => s.id === activeSlideId)
  if (!slide) return null

  const available = framesForFormat(slide.format)
  const activeFrame = frameById(slide.frame)
  const count = slide.screenshotCount ?? 1

  const handleCountChange = (newCount: 1 | 2 | 3) => {
    if (newCount === count) return
    const patch = toggleScreenshotCount(slide, newCount)
    updateSlide(activeSlideId, patch)
  }

  const handleApplyPreset = (presetId: string) => {
    const preset = presetById(presetId)
    if (!preset) return
    updateSlide(activeSlideId, {
      deviceSlots: preset.devices.map((d) => ({ ...d })),
      activePresetId: presetId,
    })
  }

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
          <div className="flex items-center gap-1 pt-3">
            <span className="text-xs text-muted mr-2">{t('frame.screens')}</span>
            <button
              onClick={() => handleCountChange(1)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                count === 1
                  ? 'bg-indigo-500/25 border border-indigo-400 text-indigo-300'
                  : 'option-idle border'
              }`}
            >
              1
            </button>
            <button
              onClick={() => handleCountChange(2)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                count === 2
                  ? 'bg-indigo-500/25 border border-indigo-400 text-indigo-300'
                  : 'option-idle border'
              }`}
            >
              2
            </button>
            <button
              onClick={() => handleCountChange(3)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                count === 3
                  ? 'bg-indigo-500/25 border border-indigo-400 text-indigo-300'
                  : 'option-idle border'
              }`}
            >
              3
            </button>
          </div>

          {(count === 2 || count === 3) && (
            <div className="pt-1">
              <p className="text-xs text-muted mb-2">{t('frame.presets')}</p>
              <div className={count === 3 ? 'grid grid-cols-4 gap-2' : 'grid grid-cols-3 gap-2'}>
                {presetsForCount(count).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`rounded-lg p-1.5 transition-all border ${
                      slide.activePresetId === preset.id
                        ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
                        : 'border-subtle hover:border-indigo-400/50 text-muted'
                    }`}
                  >
                    <PresetThumbnail preset={preset} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {count > 1 ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted font-medium">{t('frame.device_position')}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateSlide(activeSlideId, { showGrid: !(slide.showGrid ?? false) })}
                    className={`p-1 rounded-md border transition-all ${
                      slide.showGrid
                        ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300'
                        : 'option-idle border'
                    }`}
                    title={t('frame.grid')}
                  >
                    <Grid3x3 size={14} />
                  </button>
                  <button
                    onClick={() => updateSlide(activeSlideId, { showSafeArea: !(slide.showSafeArea ?? false) })}
                    className={`p-1 rounded-md border transition-all ${
                      slide.showSafeArea
                        ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300'
                        : 'option-idle border'
                    }`}
                    title={t('frame.safe_area')}
                  >
                    <Shield size={14} />
                  </button>
                </div>
              </div>
              {Array.from({ length: count }, (_, i) => (
                <DeviceSliders
                  key={i}
                  label={t(`frame.device_${i + 1}`)}
                  slide={slide}
                  slotIndex={i}
                  format={slide.format}
                  showZoom
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between pr-1">
                <span className="text-xs text-muted font-medium">{t('frame.device_position')}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateSlide(activeSlideId, { showGrid: !(slide.showGrid ?? false) })}
                    className={`p-1 rounded-md border transition-all ${
                      slide.showGrid
                        ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300'
                        : 'option-idle border'
                    }`}
                    title={t('frame.grid')}
                  >
                    <Grid3x3 size={14} />
                  </button>
                  <button
                    onClick={() => updateSlide(activeSlideId, { showSafeArea: !(slide.showSafeArea ?? false) })}
                    className={`p-1 rounded-md border transition-all ${
                      slide.showSafeArea
                        ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300'
                        : 'option-idle border'
                    }`}
                    title={t('frame.safe_area')}
                  >
                    <Shield size={14} />
                  </button>
                </div>
              </div>
              <DeviceSliders label="" slide={slide} slotIndex={0} format={slide.format} showZoom={LANDSCAPE_FORMATS.has(slide.format)} />
            </div>
          )}
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
            title={t('frame.reset_tilt')}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

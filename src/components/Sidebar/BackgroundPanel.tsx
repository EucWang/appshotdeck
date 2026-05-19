import { useCallback, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../store/useEditorStore'
import { BACKGROUND_CATEGORIES } from '../../data/backgrounds'
import { compressBackgroundImage } from '../../utils/compress'
import type { Background } from '../../types'

function bgPreviewStyle(bg: Background): React.CSSProperties {
  if (bg.type === 'solid') return { background: bg.color }
  if (bg.type === 'gradient') return { background: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})` }
  return { backgroundImage: `url(${bg.dataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
}

export function BackgroundPanel() {
  const { t } = useTranslation()
  const { slides, activeSlideId, updateSlide } = useEditorStore()
  const [compressing, setCompressing] = useState(false)

  const handleBgImageUpload = useCallback(async (file: File) => {
    setCompressing(true)
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const compressed = await compressBackgroundImage(dataUrl)
      const currentSlide = slides.find((s) => s.id === activeSlideId)
      const currentBg = currentSlide?.background ?? { type: 'gradient', from: '#0F172A', to: '#1E3A5F', angle: 135 } as Background
      updateSlide(activeSlideId, {
        background: currentBg.type === 'image'
          ? { ...currentBg, dataUrl: compressed }
          : { type: 'image', dataUrl: compressed, overlayColor: '#000000', overlayOpacity: 40, blur: 0, frosted: 0 },
      })
    } finally {
      setCompressing(false)
    }
  }, [activeSlideId, updateSlide, slides])

  const openBgImagePicker = useCallback(() => {
    if (compressing) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleBgImageUpload(file)
    }
    input.click()
  }, [compressing, handleBgImageUpload])

  const slide = slides.find((s) => s.id === activeSlideId)
  if (!slide) return null

  const bg = slide.background
  const [activeCat, setActiveCat] = useState(BACKGROUND_CATEGORIES[0].id)
  const activePresets = BACKGROUND_CATEGORIES.find(c => c.id === activeCat)?.presets ?? []

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1 pb-1">
          {BACKGROUND_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                activeCat === cat.id
                  ? 'bg-indigo-500/30 text-indigo-300 dark:text-indigo-400 font-medium'
                  : 'option-idle'
              }`}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {activePresets.map((p, i) => (
            <button key={`${activeCat}-${i}`} title={p.label}
              onClick={() => updateSlide(activeSlideId, { background: p.bg })}
              className="aspect-video rounded-lg border-2 border-medium hover:border-indigo-400 transition-all"
              style={bgPreviewStyle(p.bg)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-medium pt-4 space-y-3">
        <p className="text-xs text-muted uppercase tracking-wider">{t('background.custom')}</p>

        <div className="flex gap-2">
          <button
            onClick={() => updateSlide(activeSlideId, {
              background: bg.type === 'solid' ? bg : { type: 'solid', color: '#1e293b' },
            })}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              bg.type === 'solid'
                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400'
                : 'bg-black/5 dark:bg-white/10 text-dim border border-medium hover:text-black dark:hover:text-white'
            }`}
          >
            {t('background.solid')}
          </button>
          <button
            onClick={() => updateSlide(activeSlideId, {
              background: bg.type === 'gradient'
                ? bg
                : { type: 'gradient', from: '#0F172A', to: '#1E3A5F', angle: 135 },
            })}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              bg.type === 'gradient'
                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400'
                : 'bg-black/5 dark:bg-white/10 text-dim border border-medium hover:text-black dark:hover:text-white'
            }`}
          >
            {t('background.gradient')}
          </button>
          <button
            onClick={openBgImagePicker}
            disabled={compressing}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              bg.type === 'image'
                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400'
                : 'bg-black/5 dark:bg-white/10 text-dim border border-medium hover:text-black dark:hover:text-white'
            }`}
          >
            {compressing ? <Loader2 className="w-3 h-3 animate-spin" /> : t('background.image')}
          </button>
        </div>

        {bg.type === 'solid' && (
          <label className="flex items-center gap-3">
            <input type="color" value={bg.color}
              onChange={(e) => updateSlide(activeSlideId, { background: { type: 'solid', color: e.target.value } })}
              className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-sm text-dim font-mono">{bg.color}</span>
          </label>
        )}

        {bg.type === 'gradient' && (
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input type="color" value={bg.from}
                onChange={(e) => updateSlide(activeSlideId, { background: { ...bg, from: e.target.value } })}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-xs text-muted">{t('background.from')}</span>
              <span className="text-xs text-dim font-mono ml-auto">{bg.from}</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="color" value={bg.to}
                onChange={(e) => updateSlide(activeSlideId, { background: { ...bg, to: e.target.value } })}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-xs text-muted">{t('background.to')}</span>
              <span className="text-xs text-dim font-mono ml-auto">{bg.to}</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted w-10">{t('background.angle')}</span>
              <input type="range" min={0} max={360} value={bg.angle}
                onChange={(e) => updateSlide(activeSlideId, { background: { ...bg, angle: Number(e.target.value) } })}
                className="flex-1"
              />
              <span className="text-xs text-dim font-mono w-10 text-right">{bg.angle}°</span>
            </div>
          </div>
        )}

        {bg.type === 'image' && (
          <div className="space-y-3">
            <div className="relative group">
              <div
                className="aspect-video rounded-lg border-2 border-medium overflow-hidden"
                style={{ backgroundImage: `url(${bg.dataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
              <button
                onClick={openBgImagePicker}
                disabled={compressing}
                className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title={t('background.replace_image')}
              >
                {compressing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              </button>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="color"
                value={bg.overlayColor ?? '#000000'}
                onChange={(e) => updateSlide(activeSlideId, { background: { ...bg, overlayColor: e.target.value } })}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-xs text-muted">{t('background.overlay_color')}</span>
            </label>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted w-14">{t('background.overlay_opacity')}</span>
              <input
                type="range" min={0} max={100}
                value={bg.overlayOpacity ?? 40}
                onChange={(e) => updateSlide(activeSlideId, { background: { ...bg, overlayOpacity: Number(e.target.value) } })}
                className="flex-1"
              />
              <span className="text-xs text-dim font-mono w-10 text-right">{bg.overlayOpacity ?? 40}%</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted w-14">{t('background.blur')}</span>
              <input
                type="range" min={0} max={20}
                value={bg.blur ?? 0}
                onChange={(e) => updateSlide(activeSlideId, { background: { ...bg, blur: Number(e.target.value) } })}
                className="flex-1"
              />
              <span className="text-xs text-dim font-mono w-10 text-right">{bg.blur ?? 0}px</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted w-14">{t('background.frosted')}</span>
              <input
                type="range" min={0} max={100}
                value={bg.frosted ?? 0}
                onChange={(e) => updateSlide(activeSlideId, { background: { ...bg, frosted: Number(e.target.value) } })}
                className="flex-1"
              />
              <span className="text-xs text-dim font-mono w-10 text-right">{bg.frosted ?? 0}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

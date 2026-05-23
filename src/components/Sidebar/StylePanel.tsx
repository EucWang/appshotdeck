import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw, Sun } from 'lucide-react'
import { useEditorStore } from '../../store/useEditorStore'
import type { MockupStyle, BorderShape, ShadowMode, Slide } from '../../types'
import { LightPad } from './LightPad'
import { HexColorInput } from '../HexColorInput'

const STYLES: MockupStyle[] = ['default', 'glass-light', 'glass-dark', 'liquid-glass', 'inset-light', 'inset-dark', 'outline', 'border']

const STYLE_PREVIEW: Record<MockupStyle, React.CSSProperties> = {
  'default': { border: '1.5px solid rgba(255,255,255,0.2)' },
  'glass-light': { border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)' },
  'glass-dark': { border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)' },
  'liquid-glass': { border: '1.5px solid rgba(255,255,255,0.4)', background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))' },
  'inset-light': { boxShadow: 'inset 0 1px 4px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.2)' },
  'inset-dark': { boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)' },
  'outline': { border: '1.5px solid rgba(255,255,255,0.5)' },
  'border': { border: '2px solid rgba(255,255,255,0.4)' },
}

const BORDER_SHAPES: BorderShape[] = ['sharp', 'curved', 'round']

const SHADOW_MODES: ShadowMode[] = ['none', 'spread', 'hug', 'adaptive']

const SHADOW_PREVIEW: Record<ShadowMode, React.CSSProperties> = {
  'none': {},
  'spread': { boxShadow: '0 8px 16px -4px rgba(0,0,0,0.6)' },
  'hug': { boxShadow: '0 4px 8px -2px rgba(0,0,0,0.4)' },
  'adaptive': { boxShadow: '0 6px 12px -3px rgba(0,0,0,0.5)' },
}

const SHADOW_BASE: React.CSSProperties = {
  width: 28,
  height: 20,
  borderRadius: 4,
  background: 'rgba(255,255,255,0.15)',
  border: '1px solid rgba(255,255,255,0.2)',
}

function rgbaToHex(rgba: string): string {
  const m = rgba.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return '#ffffff'
  const r = parseInt(m[1]).toString(16).padStart(2, '0')
  const g = parseInt(m[2]).toString(16).padStart(2, '0')
  const b = parseInt(m[3]).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

function hexToRgba(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.4)`
}

export function StylePanel() {
  const { t } = useTranslation()
  const { slides, activeSlideId, updateSlide } = useEditorStore()
  const [showLightPad, setShowLightPad] = useState(false)
  const slide = slides.find((s) => s.id === activeSlideId)
  if (!slide) return null

  const patch = (p: Partial<Slide>) => updateSlide(activeSlideId, p)

  const mockupStyle = slide.mockupStyle ?? 'default'
  const borderShape = slide.borderShape ?? 'curved'
  const borderRadius = slide.borderRadius ?? 20
  const borderWidth = slide.borderWidth ?? 2
  const borderColor = slide.borderColor ?? 'rgba(255,255,255,0.4)'
  const shadowMode = slide.shadowMode ?? 'spread'
  const mockupOpacity = slide.mockupOpacity ?? 100
  const shadowPX = slide.shadowPercentX ?? 0
  const shadowPY = slide.shadowPercentY ?? -20
  const sBrightness = slide.screenshotBrightness ?? 100
  const sContrast = slide.screenshotContrast ?? 100
  const sSaturation = slide.screenshotSaturation ?? 100

  return (
    <div className="p-4 space-y-5">
      <p className="text-xs text-muted uppercase tracking-wider mb-2">{t('style.title')}</p>

      {/* Section 1: Style Presets */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider mb-2">{t('style.style')}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {STYLES.map((s) => (
            <button
              key={s}
              onClick={() => patch({ mockupStyle: s })}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                mockupStyle === s
                  ? 'border-indigo-400 bg-indigo-500/20 text-white'
                  : 'option-idle'
              }`}
            >
              <div style={{ width: 28, height: 20, borderRadius: 4, flexShrink: 0, ...STYLE_PREVIEW[s] }} />
              <span className="text-xs font-medium">{t(`style.style_${s.replace(/-/g, '_')}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section 2: Border */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider mb-2">{t('style.border')}</p>
        <div className="flex gap-1.5 mb-3">
          {BORDER_SHAPES.map((shape) => (
            <button
              key={shape}
              onClick={() => patch({ borderShape: shape })}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                borderShape === shape
                  ? 'border-indigo-400 bg-indigo-500/20 text-white'
                  : 'option-idle'
              }`}
            >
              {t(`style.border_${shape}`)}
            </button>
          ))}
        </div>

        {borderShape === 'round' && (
          <div className="flex items-center gap-2 pr-1 mb-2">
            <span className="text-xs text-muted w-7 flex-shrink-0">{t('style.border_radius')}</span>
            <input
              type="range" min={0} max={50} value={borderRadius}
              onChange={(e) => patch({ borderRadius: Number(e.target.value) })}
              className="flex-1 min-w-0"
            />
            <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{borderRadius}</span>
            <button
              onClick={() => patch({ borderRadius: 20 })}
              className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
              title={t('style.reset')}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 pr-1 mb-2">
          <span className="text-xs text-muted w-7 flex-shrink-0">{t('style.border_width')}</span>
          <input
            type="range" min={0} max={8} step={1} value={borderWidth}
            onChange={(e) => patch({ borderWidth: Number(e.target.value) })}
            className="flex-1 min-w-0"
          />
          <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{borderWidth}</span>
          <button
            onClick={() => patch({ borderWidth: 2 })}
            className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
            title={t('style.reset')}
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2 pr-1">
          <span className="text-xs text-muted w-7 flex-shrink-0">{t('style.border_color')}</span>
          <input
            type="color" value={rgbaToHex(borderColor)}
            onChange={(e) => patch({ borderColor: hexToRgba(e.target.value) })}
            className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
          />
          <HexColorInput
            value={rgbaToHex(borderColor)}
            onChange={(hex) => patch({ borderColor: hexToRgba(hex) })}
          />
          <button
            onClick={() => patch({ borderColor: 'rgba(255,255,255,0.4)' })}
            className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5 ml-auto"
            title={t('style.reset')}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Section 3: Shadow */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider mb-2">{t('style.shadow')}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SHADOW_MODES.map((sm) => (
            <button
              key={sm}
              onClick={() => patch({ shadowMode: sm })}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                shadowMode === sm
                  ? 'border-indigo-400 bg-indigo-500/20 text-white'
                  : 'option-idle'
              }`}
            >
              <div style={{ ...SHADOW_BASE, ...SHADOW_PREVIEW[sm] }} />
              <span className="text-xs font-medium">{t(`style.shadow_${sm}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section 4: Opacity */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider mb-2">{t('style.opacity')}</p>
        <div className="flex items-center gap-2 pr-1">
          <span className="text-xs text-muted w-7 flex-shrink-0">{t('style.opacity')}</span>
          <input
            type="range" min={0} max={100} value={mockupOpacity}
            onChange={(e) => patch({ mockupOpacity: Number(e.target.value) })}
            className="flex-1 min-w-0"
          />
          <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{mockupOpacity}%</span>
          <button
            onClick={() => patch({ mockupOpacity: 100 })}
            className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
            title={t('style.reset')}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Section 5: Adjust Light */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted uppercase tracking-wider">{t('style.adjust_light')}</p>
          <button
            onClick={() => setShowLightPad(!showLightPad)}
            disabled={shadowMode === 'none'}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all border ${
              showLightPad
                ? 'border-indigo-400 bg-indigo-500/20 text-white'
                : 'option-idle'
            } ${shadowMode === 'none' ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Sun size={14} />
            {t('style.adjust_light')}
          </button>
        </div>
        {showLightPad && (
          <div className="flex justify-center py-2">
            <LightPad
              valueX={shadowPX}
              valueY={shadowPY}
              onChange={(x, y) => patch({ shadowPercentX: x, shadowPercentY: y })}
            />
          </div>
        )}
      </div>

      {/* Section 6: Screenshot Filters */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider mb-2">{t('style.filters')}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 pr-1">
            <span className="text-xs text-muted w-14 flex-shrink-0">{t('style.brightness')}</span>
            <input
              type="range" min={0} max={200} step={1} value={sBrightness}
              onChange={(e) => patch({ screenshotBrightness: Number(e.target.value) })}
              className="flex-1 min-w-0"
            />
            <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{sBrightness}%</span>
          </div>
          <div className="flex items-center gap-2 pr-1">
            <span className="text-xs text-muted w-14 flex-shrink-0">{t('style.contrast')}</span>
            <input
              type="range" min={0} max={200} step={1} value={sContrast}
              onChange={(e) => patch({ screenshotContrast: Number(e.target.value) })}
              className="flex-1 min-w-0"
            />
            <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{sContrast}%</span>
          </div>
          <div className="flex items-center gap-2 pr-1">
            <span className="text-xs text-muted w-14 flex-shrink-0">{t('style.saturation')}</span>
            <input
              type="range" min={0} max={200} step={1} value={sSaturation}
              onChange={(e) => patch({ screenshotSaturation: Number(e.target.value) })}
              className="flex-1 min-w-0"
            />
            <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{sSaturation}%</span>
          </div>
        </div>
        <button
          onClick={() => patch({ screenshotBrightness: 100, screenshotContrast: 100, screenshotSaturation: 100 })}
          className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {t('style.reset')}
        </button>
      </div>
    </div>
  )
}

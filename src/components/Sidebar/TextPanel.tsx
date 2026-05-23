import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, RotateCcw, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { useEditorStore } from '../../store/useEditorStore'
import { HexColorInput } from '../HexColorInput'
import { getSystemFonts, isFreeCommercial } from '../../utils/fonts'
import { renderColoredText, applySpan, clearSpanRange, adjustSpansOnTextChange } from '../../utils/richtext'
import type { SlideFormat, TextSpan } from '../../types'

const CANVAS_W: Record<SlideFormat, number> = {
  phone: 1080, 'tablet-7': 1920, 'tablet-10': 2560,
  'iphone-69': 1320, 'iphone-65': 1242, 'ipad-13': 2048,
}
const LANDSCAPE = new Set<SlideFormat>(['tablet-7', 'tablet-10'])

function defaultHeadlineSize(fmt: SlideFormat) {
  return Math.round(CANVAS_W[fmt] * (LANDSCAPE.has(fmt) ? 0.036 : 0.063))
}
function defaultSubtitleSize(fmt: SlideFormat) {
  return Math.round(CANVAS_W[fmt] * (LANDSCAPE.has(fmt) ? 0.022 : 0.039))
}
function defaultLogoTitleSize(fmt: SlideFormat) {
  return Math.round(CANVAS_W[fmt] * (LANDSCAPE.has(fmt) ? 0.020 : 0.032))
}

const SELECT_CLASS = "w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-400 transition-colors"
const OPT_STYLE = { background: 'white', color: '#111' }

const WEIGHT_ROW1 = [
  { value: 300, key: 'text.weight_300' },
  { value: 400, key: 'text.weight_400' },
  { value: 500, key: 'text.weight_500' },
  { value: 700, key: 'text.weight_700' },
]
const WEIGHT_ROW2 = [
  { value: 800, key: 'text.weight_800' },
  { value: 900, key: 'text.weight_900' },
]

function WeightItalicControls({
  activeWeight,
  activeItalic,
  onWeightChange,
  onItalicChange,
  t,
}: {
  activeWeight: number
  activeItalic: boolean
  onWeightChange: (w: number) => void
  onItalicChange: (i: boolean) => void
  t: (key: string) => string
}) {
  const btnClass = (active: boolean) =>
    `flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
      active
        ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400'
        : 'option-idle border'
    }`

  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted">{t('text.weight')}</span>
      <div className="flex gap-1.5">
        {WEIGHT_ROW1.map((w) => (
          <button
            key={w.value}
            onClick={() => onWeightChange(w.value)}
            className={btnClass(activeWeight === w.value)}
            style={{ fontWeight: w.value }}
          >
            {t(w.key)}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        {WEIGHT_ROW2.map((w) => (
          <button
            key={w.value}
            onClick={() => onWeightChange(w.value)}
            className={btnClass(activeWeight === w.value)}
            style={{ fontWeight: w.value }}
          >
            {t(w.key)}
          </button>
        ))}
        <button
          onClick={() => onItalicChange(!activeItalic)}
          className={btnClass(activeItalic)}
          style={{ fontStyle: 'italic', flex: '1.5' }}
        >
          I
        </button>
      </div>
    </div>
  )
}

interface HighlightControlsProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  text: string
  spans: TextSpan[]
  highlightColor: string
  onHighlightColorChange: (color: string) => void
  onSpansChange: (spans: TextSpan[]) => void
  t: (key: string) => string
}

function HighlightControls({
  textareaRef,
  text,
  spans,
  highlightColor,
  onHighlightColorChange,
  onSpansChange,
  t,
}: HighlightControlsProps) {
  const [selState, setSelState] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const refreshSelection = useCallback(() => {
    const ta = textareaRef.current
    if (ta && ta.selectionStart !== ta.selectionEnd) {
      setSelState(true)
    } else {
      setSelState(false)
    }
  }, [textareaRef])

  const handleApply = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    if (start === end) return
    const newSpans = applySpan(spans, { start, end, color: highlightColor })
    onSpansChange(newSpans)
    setFeedback('applied')
    setTimeout(() => setFeedback(null), 1000)
  }, [textareaRef, spans, highlightColor, onSpansChange])

  const handleClear = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    if (start === end) return
    onSpansChange(clearSpanRange(spans, start, end))
  }, [textareaRef, spans, onSpansChange])

  const handleClearAll = useCallback(() => {
    onSpansChange([])
  }, [onSpansChange])

  const hasSpans = spans.length > 0

  const btnBase = "px-2.5 py-1 rounded-md text-xs font-medium transition-all"
  const btnIdle = `${btnBase} option-idle border`
  const btnActive = `${btnBase} bg-indigo-500/30 text-indigo-300 border border-indigo-400`
  const btnDisabled = `${btnBase} option-idle border opacity-40 pointer-events-none`

  return (
    <div className="space-y-1.5" onMouseEnter={refreshSelection}>
      <span className="text-xs text-muted">{t('text.highlight_color')}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={highlightColor}
          onChange={(e) => onHighlightColorChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent flex-shrink-0"
        />
        <HexColorInput
          value={highlightColor}
          onChange={onHighlightColorChange}
        />
        <div className="flex items-center gap-1 flex-1">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleApply}
            className={feedback === 'applied' ? btnActive : selState ? btnActive : btnDisabled}
          >
            {feedback === 'applied' ? t('text.highlight_applied') : t('text.apply_highlight')}
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
            className={selState && hasSpans ? btnIdle : btnDisabled}
          >
            {t('text.clear_highlight')}
          </button>
          <button
            onClick={handleClearAll}
            className={hasSpans ? btnIdle : btnDisabled}
          >
            {t('text.clear_all_highlights')}
          </button>
        </div>
      </div>
      <div
        className="text-xs leading-relaxed break-words min-h-[1.25rem]"
        style={{ color: '#888' }}
      >
        {text ? renderColoredText(text, spans.length > 0 ? spans : undefined) : ''}
      </div>
    </div>
  )
}

export function TextPanel() {
  const { t } = useTranslation()
  const { slides, activeSlideId, updateSlide } = useEditorStore()
  const [systemFonts, setSystemFonts] = useState<string[] | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    getSystemFonts().then((fonts) => {
      if (!cancelled) setSystemFonts(fonts)
    })
    return () => { cancelled = true }
  }, [])

  const headlineRef = useRef<HTMLTextAreaElement>(null)
  const subtitleRef = useRef<HTMLTextAreaElement>(null)

  const slide = slides.find((s) => s.id === activeSlideId)
  if (!slide) return null

  const hSize = slide.headlineFontSize ?? defaultHeadlineSize(slide.format)
  const sSize = slide.subtitleFontSize ?? defaultSubtitleSize(slide.format)
  const activeFont = slide.textFontFamily ?? 'default'

  const renderFontPicker = () => {
    if (systemFonts === null) {
      return (
        <div className="flex gap-2">
          {(['default', 'system'] as const).map((f) => (
            <button
              key={f}
              onClick={() => updateSlide(activeSlideId, { textFontFamily: f })}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                activeFont === f
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400'
                  : 'option-idle border'
              }`}
            >
              {t(`text.font_${f}`)}
            </button>
          ))}
        </div>
      )
    }

    return (
      <select
        value={activeFont}
        onChange={(e) => updateSlide(activeSlideId, { textFontFamily: e.target.value })}
        className={SELECT_CLASS}
      >
        <option style={OPT_STYLE} value="default">{t('text.font_default')}</option>
        <option style={OPT_STYLE} value="system">{t('text.font_system')}</option>
        {systemFonts && systemFonts.length > 0 && (
          <option style={OPT_STYLE} disabled>──────────</option>
        )}
        {systemFonts?.map((name) => {
          const label = isFreeCommercial(name) ? `${name} \u2713` : name
          return <option style={OPT_STYLE} key={name} value={name}>{label}</option>
        })}
      </select>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="text-xs text-muted uppercase tracking-wider">{t('text.font')}</label>
        {renderFontPicker()}
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted uppercase tracking-wider">{t('text.align')}</label>
        <div className="flex gap-1.5">
          {([
            { value: 'left' as const, icon: AlignLeft, key: 'text.align_left' },
            { value: 'center' as const, icon: AlignCenter, key: 'text.align_center' },
            { value: 'right' as const, icon: AlignRight, key: 'text.align_right' },
          ]).map(({ value, icon: Icon, key }) => (
            <button
              key={value}
              onClick={() => updateSlide(activeSlideId, { textAlign: value })}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                (slide.textAlign ?? 'center') === value
                  ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400'
                  : 'option-idle border'
              }`}
            >
              <Icon size={14} />
              <span>{t(key)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted uppercase tracking-wider">{t('text.headline')}</label>
          <button
            onClick={() => updateSlide(activeSlideId, { showHeadline: !slide.showHeadline })}
            className="text-muted hover:text-foreground transition-colors p-0.5"
            title={slide.showHeadline ? 'Hide headline' : 'Show headline'}
          >
            {slide.showHeadline ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
        <textarea
          ref={headlineRef}
          value={slide.headline}
          onChange={(e) => {
            const newText = e.target.value
            const adjusted = adjustSpansOnTextChange(slide.headline, newText, slide.headlineSpans ?? [])
            updateSlide(activeSlideId, { headline: newText, headlineSpans: adjusted })
          }}
          rows={2}
          className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-black/30 dark:placeholder-white/30 resize-none focus:outline-none focus:border-indigo-400 transition-colors"
          placeholder={t('text.headline_placeholder')}
        />
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted w-7 flex-shrink-0">Size</span>
          <input
            type="range" min={10} max={400} value={hSize}
            onChange={(e) => updateSlide(activeSlideId, { headlineFontSize: Number(e.target.value) })}
            className="flex-1 min-w-0"
          />
          <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{hSize}px</span>
          <button
            onClick={() => updateSlide(activeSlideId, { headlineFontSize: undefined })}
            className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
            title={t('text.reset_size')}
          >
            <RotateCcw size={14} />
          </button>
        </div>
        <WeightItalicControls
          activeWeight={slide.headlineFontWeight ?? 700}
          activeItalic={slide.headlineItalic ?? false}
          onWeightChange={(w) => updateSlide(activeSlideId, { headlineFontWeight: w })}
          onItalicChange={(i) => updateSlide(activeSlideId, { headlineItalic: i })}
          t={t}
        />
        <HighlightControls
          textareaRef={headlineRef}
          text={slide.headline}
          spans={slide.headlineSpans ?? []}
          highlightColor={slide.headlineHighlightColor ?? '#FFD700'}
          onHighlightColorChange={(c) => updateSlide(activeSlideId, { headlineHighlightColor: c })}
          onSpansChange={(s) => updateSlide(activeSlideId, { headlineSpans: s })}
          t={t}
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted uppercase tracking-wider">{t('text.subtitle')}</label>
          <button
            onClick={() => updateSlide(activeSlideId, { showSubtitle: !slide.showSubtitle })}
            className="text-muted hover:text-foreground transition-colors p-0.5"
            title={slide.showSubtitle ? 'Hide subtitle' : 'Show subtitle'}
          >
            {slide.showSubtitle ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
        <textarea
          ref={subtitleRef}
          value={slide.subtitle}
          onChange={(e) => {
            const newText = e.target.value
            const adjusted = adjustSpansOnTextChange(slide.subtitle, newText, slide.subtitleSpans ?? [])
            updateSlide(activeSlideId, { subtitle: newText, subtitleSpans: adjusted })
          }}
          rows={2}
          className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-black/30 dark:placeholder-white/30 resize-none focus:outline-none focus:border-indigo-400 transition-colors"
          placeholder={t('text.subtitle_placeholder')}
        />
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted w-7 flex-shrink-0">Size</span>
          <input
            type="range" min={10} max={400} value={sSize}
            onChange={(e) => updateSlide(activeSlideId, { subtitleFontSize: Number(e.target.value) })}
            className="flex-1 min-w-0"
          />
          <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{sSize}px</span>
          <button
            onClick={() => updateSlide(activeSlideId, { subtitleFontSize: undefined })}
            className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
            title={t('text.reset_size')}
          >
            <RotateCcw size={14} />
          </button>
        </div>
        <WeightItalicControls
          activeWeight={slide.subtitleFontWeight ?? 400}
          activeItalic={slide.subtitleItalic ?? false}
          onWeightChange={(w) => updateSlide(activeSlideId, { subtitleFontWeight: w })}
          onItalicChange={(i) => updateSlide(activeSlideId, { subtitleItalic: i })}
          t={t}
        />
        <HighlightControls
          textareaRef={subtitleRef}
          text={slide.subtitle}
          spans={slide.subtitleSpans ?? []}
          highlightColor={slide.subtitleHighlightColor ?? '#FFD700'}
          onHighlightColorChange={(c) => updateSlide(activeSlideId, { subtitleHighlightColor: c })}
          onSpansChange={(s) => updateSlide(activeSlideId, { subtitleSpans: s })}
          t={t}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted uppercase tracking-wider">{t('text.headline_color')}</label>
        <div className="flex items-center gap-3">
          <input type="color" value={slide.textColor}
            onChange={(e) => updateSlide(activeSlideId, { textColor: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
          />
          <HexColorInput
            value={slide.textColor}
            onChange={(hex) => updateSlide(activeSlideId, { textColor: hex })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted uppercase tracking-wider">{t('text.subtitle_color')}</label>
        <div className="flex items-center gap-3">
          <input type="color" value={slide.subtitleColor}
            onChange={(e) => updateSlide(activeSlideId, { subtitleColor: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
          />
          <HexColorInput
            value={slide.subtitleColor}
            onChange={(hex) => updateSlide(activeSlideId, { subtitleColor: hex })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted uppercase tracking-wider">{t('text.y_offset')}</label>
        <div className="flex items-center gap-2">
          <input
            type="range" min={-45} max={45} value={slide.textOffsetY ?? 0}
            onChange={(e) => updateSlide(activeSlideId, { textOffsetY: Number(e.target.value) })}
            className="flex-1 min-w-0"
          />
          <span className="text-xs text-dim font-mono w-10 text-right flex-shrink-0">{slide.textOffsetY ?? 0}%
          </span>
          <button
            onClick={() => updateSlide(activeSlideId, { textOffsetY: 0 })}
            className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
            title={t('text.reset_y_offset')}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted uppercase tracking-wider">{t('text.x_offset')}</label>
        <div className="flex items-center gap-2">
          <input
            type="range" min={-50} max={50} value={slide.textOffsetX ?? 0}
            onChange={(e) => updateSlide(activeSlideId, { textOffsetX: Number(e.target.value) })}
            className="flex-1 min-w-0"
          />
          <span className="text-xs text-dim font-mono w-10 text-right flex-shrink-0">{slide.textOffsetX ?? 0}%
          </span>
          <button
            onClick={() => updateSlide(activeSlideId, { textOffsetX: 0 })}
            className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
            title={t('text.reset_x_offset')}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted uppercase tracking-wider">{t('text.logo_title')}</label>
          <button
            onClick={() => updateSlide(activeSlideId, { showLogoTitle: !slide.showLogoTitle })}
            className="text-muted hover:text-foreground transition-colors p-0.5"
            title={slide.showLogoTitle ? 'Hide logo title' : 'Show logo title'}
          >
            {slide.showLogoTitle ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
        {slide.showLogoTitle && (
          <>
            <textarea
              value={slide.logoTitle ?? ''}
              onChange={(e) => updateSlide(activeSlideId, { logoTitle: e.target.value })}
              rows={1}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-black/30 dark:placeholder-white/30 resize-none focus:outline-none focus:border-indigo-400 transition-colors"
              placeholder={t('text.logo_title_placeholder')}
            />
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted w-7 flex-shrink-0">Size</span>
              <input
                type="range" min={10} max={400} value={slide.logoTitleFontSize ?? defaultLogoTitleSize(slide.format)}
                onChange={(e) => updateSlide(activeSlideId, { logoTitleFontSize: Number(e.target.value) })}
                className="flex-1 min-w-0"
              />
              <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{slide.logoTitleFontSize ?? defaultLogoTitleSize(slide.format)}px</span>
              <button
                onClick={() => updateSlide(activeSlideId, { logoTitleFontSize: undefined })}
                className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
                title={t('text.reset_logo_size')}
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <WeightItalicControls
              activeWeight={slide.logoTitleFontWeight ?? 700}
              activeItalic={slide.logoTitleItalic ?? false}
              onWeightChange={(w) => updateSlide(activeSlideId, { logoTitleFontWeight: w })}
              onItalicChange={(i) => updateSlide(activeSlideId, { logoTitleItalic: i })}
              t={t}
            />
            <div className="space-y-2">
              <label className="text-xs text-muted uppercase tracking-wider">{t('text.logo_title_color')}</label>
              <div className="flex items-center gap-3">
                <input type="color" value={slide.logoTitleColor ?? '#ffffff'}
                  onChange={(e) => updateSlide(activeSlideId, { logoTitleColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                />
                <HexColorInput
                  value={slide.logoTitleColor ?? '#ffffff'}
                  onChange={(hex) => updateSlide(activeSlideId, { logoTitleColor: hex })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted uppercase tracking-wider">{t('text.logo_title_offset_x')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={-50} max={50} value={slide.logoTitleOffsetX ?? 0}
                  onChange={(e) => updateSlide(activeSlideId, { logoTitleOffsetX: Number(e.target.value) })}
                  className="flex-1 min-w-0"
                />
                <span className="text-xs text-dim font-mono w-10 text-right flex-shrink-0">{slide.logoTitleOffsetX ?? 0}%</span>
                <button
                  onClick={() => updateSlide(activeSlideId, { logoTitleOffsetX: 0 })}
                  className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
                  title={t('text.reset_logo_offset_x')}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted uppercase tracking-wider">{t('text.logo_title_offset_y')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={-45} max={45} value={slide.logoTitleOffsetY ?? 0}
                  onChange={(e) => updateSlide(activeSlideId, { logoTitleOffsetY: Number(e.target.value) })}
                  className="flex-1 min-w-0"
                />
                <span className="text-xs text-dim font-mono w-10 text-right flex-shrink-0">{slide.logoTitleOffsetY ?? 0}%</span>
                <button
                  onClick={() => updateSlide(activeSlideId, { logoTitleOffsetY: 0 })}
                  className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
                  title={t('text.reset_logo_offset_y')}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

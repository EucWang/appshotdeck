# Logo Title Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an independently positionable "Logo Title" text element to each slide, with its own color, font size, font weight, and x/y offset (center anchor). Default hidden.

**Architecture:** Flat fields on `Slide` type (same pattern as headline/subtitle). Rendered as an absolutely positioned div in `SlideCanvas.tsx`, using center-anchor percentage offsets. Controls added to `TextPanel.tsx`. All fields included in `STYLE_FIELDS` for `applyStyleToAll` sync.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS, react-i18next

---

### Task 1: Add Slide type fields

**Files:**
- Modify: `src/types/index.ts:82-136`

**Step 1: Add 7 new optional fields to `Slide` interface**

Add after `overlays` field (line 135), before the closing `}`:

```typescript
  logoTitle?: string
  showLogoTitle?: boolean
  logoTitleColor?: string
  logoTitleFontSize?: number
  logoTitleFontWeight?: number
  logoTitleOffsetX?: number
  logoTitleOffsetY?: number
```

**Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: PASS (new fields are all optional)

---

### Task 2: Add default values and STYLE_FIELDS entries

**Files:**
- Modify: `src/store/useEditorStore.ts:17-54` (defaultSlide)
- Modify: `src/store/useEditorStore.ts:56-71` (STYLE_FIELDS)

**Step 1: Add logo title defaults to `defaultSlide()`**

Add these fields to the object returned by `defaultSlide()`:

```typescript
  showLogoTitle: false,
  logoTitle: '',
  logoTitleColor: '#ffffff',
  logoTitleFontWeight: 700,
  logoTitleOffsetX: 0,
  logoTitleOffsetY: -42,
```

Note: `logoTitleFontSize` is omitted (undefined → uses format-based default computed at render time).

**Step 2: Add logo title fields to `STYLE_FIELDS` array**

Add to the `STYLE_FIELDS` array:

```typescript
  'logoTitleColor', 'logoTitleFontSize', 'logoTitleFontWeight',
  'logoTitleOffsetX', 'logoTitleOffsetY',
```

Note: `logoTitle` (text content) and `showLogoTitle` (visibility) are intentionally NOT in `STYLE_FIELDS` — each slide has its own text content and visibility, but style properties (color, size, weight, position) sync across slides.

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS

---

### Task 3: Add i18n strings

**Files:**
- Modify: `src/locales/en/translation.json` (text section)
- Modify: `src/locales/es/translation.json` (text section)

**Step 1: Add English strings**

Add to the `"text"` object in `en/translation.json`:

```json
    "logo_title": "Logo Title",
    "logo_title_placeholder": "Logo title…",
    "logo_title_color": "Logo Title Color",
    "logo_title_offset_x": "Logo X Offset",
    "logo_title_offset_y": "Logo Y Offset",
    "reset_logo_offset_x": "Reset logo X offset",
    "reset_logo_offset_y": "Reset logo Y offset",
    "reset_logo_size": "Reset logo size"
```

**Step 2: Add Spanish strings**

Add to the `"text"` object in `es/translation.json`:

```json
    "logo_title": "Título Logo",
    "logo_title_placeholder": "Título del logo…",
    "logo_title_color": "Color del título logo",
    "logo_title_offset_x": "Desplazamiento X logo",
    "logo_title_offset_y": "Desplazamiento Y logo",
    "reset_logo_offset_x": "Restablecer desplazamiento X logo",
    "reset_logo_offset_y": "Restablecer desplazamiento Y logo",
    "reset_logo_size": "Restablecer tamaño logo"
```

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS

---

### Task 4: Render logo title on canvas

**Files:**
- Modify: `src/components/Canvas/SlideCanvas.tsx:573-684`

**Step 1: Add logo title size computation**

After `subtitleSize` line (line 585), add:

```typescript
    const logoTitleSize = slide.logoTitleFontSize ?? Math.round(W * (landscape ? 0.024 : 0.040))
    const logoTitleWeight = slide.logoTitleFontWeight ?? 700
    const logoOffsetXPx = Math.round(W * ((slide.logoTitleOffsetX ?? 0) / 100))
    const logoOffsetYPx = Math.round(H * ((slide.logoTitleOffsetY ?? -42) / 100))
```

**Step 2: Add logo title render block**

After the headline/subtitle text area div (after line 664, before the `{isDual ?` line at 666), add a new absolutely positioned div:

```tsx
        {(slide.showLogoTitle ?? false) && slide.logoTitle && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: H,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              transform: `translate(${logoOffsetXPx}px, ${logoOffsetYPx}px)`,
            }}
          >
            <div style={{
              fontSize: logoTitleSize,
              fontWeight: logoTitleWeight,
              lineHeight: 1.2,
              color: slide.logoTitleColor ?? '#ffffff',
              fontFamily: textFont,
              textAlign: 'center',
              whiteSpace: 'pre-line',
              overflowWrap: 'break-word',
              maxWidth: '86%',
            }}>
              {slide.logoTitle}
            </div>
          </div>
        )}
```

The logo title renders BEFORE the DeviceFrame, so devices will overlay on top of the logo title (z-order: Background → Overlays → Text → Logo Title → Device).

**Step 3: Verify build and visual test**

Run: `npm run build`
Expected: PASS

Run `npm run dev` and check:
- Existing slides: logo title should NOT appear (showLogoTitle defaults to false via `?? false`)
- Create new slide: same, no logo title visible

---

### Task 5: Add logo title controls to TextPanel

**Files:**
- Modify: `src/components/Sidebar/TextPanel.tsx:268-479`

**Step 1: Add default logo title size helper**

After `defaultSubtitleSize` (line 21), add:

```typescript
function defaultLogoTitleSize(fmt: SlideFormat) {
  return Math.round(CANVAS_W[fmt] * (LANDSCAPE.has(fmt) ? 0.024 : 0.040))
}
```

**Step 2: Add logo title control block**

In the return JSX, after the X Offset section (after line 478, before the closing `</div>` of the panel), add:

```tsx
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
              activeItalic={false}
              onWeightChange={(w) => updateSlide(activeSlideId, { logoTitleFontWeight: w })}
              onItalicChange={() => {}}
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
                  type="range" min={-45} max={45} value={slide.logoTitleOffsetY ?? -42}
                  onChange={(e) => updateSlide(activeSlideId, { logoTitleOffsetY: Number(e.target.value) })}
                  className="flex-1 min-w-0"
                />
                <span className="text-xs text-dim font-mono w-10 text-right flex-shrink-0">{slide.logoTitleOffsetY ?? -42}%</span>
                <button
                  onClick={() => updateSlide(activeSlideId, { logoTitleOffsetY: -42 })}
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
```

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS

---

### Task 6: Verify and test end-to-end

**Step 1: Build check**

Run: `npm run build`
Expected: PASS

**Step 2: Lint check**

Run: `npm run lint`
Expected: PASS (no new warnings)

**Step 3: Manual testing checklist**

Run `npm run dev` and verify:

1. **Default state**: Existing slides and new slides do NOT show logo title
2. **Toggle on**: Click Eye icon → logo title section expands with all controls
3. **Text input**: Type "MyApp" → appears on canvas at upper-center position
4. **Color change**: Change color → updates on canvas
5. **Font size**: Drag slider → size changes on canvas
6. **Font weight**: Click weight buttons → weight changes on canvas
7. **X offset**: Drag slider → logo moves horizontally
8. **Y offset**: Drag slider → logo moves vertically
9. **Toggle off**: Click EyeOff → logo title disappears from canvas, controls collapse
10. **Duplicate slide**: Duplicate preserves all logo title settings
11. **Apply style to all**: Syncs color, size, weight, offset to other slides (but NOT text content or visibility)
12. **Export**: Export single slide → PNG includes logo title
13. **Export all**: ZIP export includes logo title on all slides that have it visible
14. **Old slides**: Load old project without logo fields → no crash, logo title hidden

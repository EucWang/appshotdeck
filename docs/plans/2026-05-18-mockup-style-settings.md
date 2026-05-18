# Mockup Style Settings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Style, Border, Shadow, Opacity, and Adjust Light controls to device frames, matching shots.so's Mockup panel, as a new "Style" sidebar tab.

**Architecture:** New `MockupStyle`, `BorderShape`, `ShadowMode` types added to `Slide`. A new `StylePanel.tsx` sidebar component provides UI controls. `SlideCanvas.tsx` and `Device3D.tsx` read these fields and apply CSS/Three.js effects. All new Slide fields use `?? defaultValue` fallbacks for backward compatibility with persisted localStorage state. Glass effects use an inline blurred `<div>` snapshot approach (not `backdrop-filter`) to ensure `html-to-image` export compatibility.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v3, Three.js (for 3D light adjustment), lucide-react icons, react-i18next.

---

### Task 1: Add new types and Slide fields

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add new types**

Add after `TextPosition` type:

```typescript
export type MockupStyle =
  | 'default'
  | 'glass-light'
  | 'glass-dark'
  | 'liquid-glass'
  | 'inset-light'
  | 'inset-dark'
  | 'outline'
  | 'border'

export type BorderShape = 'sharp' | 'curved' | 'round'

export type ShadowMode = 'none' | 'spread' | 'hug' | 'adaptive'
```

**Step 2: Add new fields to Slide interface**

Add these optional fields to the `Slide` interface (after `activePresetId`):

```typescript
  mockupStyle?: MockupStyle
  borderShape?: BorderShape
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  shadowMode?: ShadowMode
  mockupOpacity?: number
  frameLightIntensity?: number
```

All are optional with defaults handled via `??` in consumers.

---

### Task 2: Add defaults in store

**Files:**
- Modify: `src/store/useEditorStore.ts`

**Step 1: Add default values to `defaultSlide`**

Add to the return object of `defaultSlide()`:

```typescript
  mockupStyle: 'default',
  borderShape: 'curved',
  borderRadius: 20,
  borderWidth: 2,
  borderColor: 'rgba(255,255,255,0.4)',
  shadowMode: 'spread',
  mockupOpacity: 100,
  frameLightIntensity: 100,
```

---

### Task 3: Add i18n strings

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/es/translation.json`

**Step 1: Add English strings**

Add a new `"style"` section to `en/translation.json`:

```json
  "style": {
    "title": "Style",
    "style": "Style",
    "style_default": "Default",
    "style_glass_light": "Glass Light",
    "style_glass_dark": "Glass Dark",
    "style_liquid_glass": "Liquid Glass",
    "style_inset_light": "Inset Light",
    "style_inset_dark": "Inset Dark",
    "style_outline": "Outline",
    "style_border": "Border",
    "border": "Border",
    "border_sharp": "Sharp",
    "border_curved": "Curved",
    "border_round": "Round",
    "border_radius": "Radius",
    "border_width": "Width",
    "border_color": "Color",
    "shadow": "Shadow",
    "shadow_none": "None",
    "shadow_spread": "Spread",
    "shadow_hug": "Hug",
    "shadow_adaptive": "Adaptive",
    "opacity": "Opacity",
    "adjust_light": "Adjust Light",
    "reset": "Reset"
  }
```

Add to `sidebar.tabs`:

```json
      "style": "Style"
```

**Step 2: Add Spanish strings**

Add matching `"style"` section to `es/translation.json` with Spanish translations. Add `"style": "Estilo"` to sidebar.tabs.

---

### Task 4: Create StylePanel component

**Files:**
- Create: `src/components/Sidebar/StylePanel.tsx`

**Step 1: Create the StylePanel**

The panel has 5 sections stacked vertically:

1. **Style grid** — 2x4 grid of style preset buttons, each with a small visual preview div and label
2. **Border** — 3 shape buttons (Sharp/Curved/Round) + optional radius slider when Round + width slider + color picker
3. **Shadow** — 2x2 grid of shadow mode buttons with tiny preview icons
4. **Opacity** — range slider 0–100 with value label and reset button
5. **Adjust Light** — range slider 0–200 with value label and reset button

Read slide from store, call `updateSlide` for each change. All fields read with `?? defaultValue` fallbacks.

```tsx
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import { useEditorStore } from '../../store/useEditorStore'
import type { MockupStyle, BorderShape, ShadowMode, Slide } from '../../types'

const STYLES: MockupStyle[] = ['default','glass-light','glass-dark','liquid-glass','inset-light','inset-dark','outline','border']
const BORDER_SHAPES: BorderShape[] = ['sharp','curved','round']
const SHADOW_MODES: ShadowMode[] = ['none','spread','hug','adaptive']

function stylePreview(style: MockupStyle): React.CSSProperties {
  const base: React.CSSProperties = { width: 28, height: 20, borderRadius: 4, flexShrink: 0 }
  switch (style) {
    case 'default': return { ...base, border: '1.5px solid rgba(255,255,255,0.2)' }
    case 'glass-light': return { ...base, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }
    case 'glass-dark': return { ...base, border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)' }
    case 'liquid-glass': return { ...base, border: '1.5px solid rgba(255,255,255,0.4)', background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))' }
    case 'inset-light': return { ...base, boxShadow: 'inset 0 1px 4px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.2)' }
    case 'inset-dark': return { ...base, boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)' }
    case 'outline': return { ...base, border: '1.5px solid rgba(255,255,255,0.5)' }
    case 'border': return { ...base, border: '2px solid rgba(255,255,255,0.4)' }
    default: return base
  }
}

function shadowPreviewCSS(mode: ShadowMode): React.CSSProperties {
  const base: React.CSSProperties = { width: 28, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }
  switch (mode) {
    case 'none': return { ...base, boxShadow: 'none' }
    case 'spread': return { ...base, boxShadow: '0 8px 16px -4px rgba(0,0,0,0.6)' }
    case 'hug': return { ...base, boxShadow: '0 4px 8px -2px rgba(0,0,0,0.4)' }
    case 'adaptive': return { ...base, boxShadow: '0 6px 12px -3px rgba(0,0,0,0.5)' }
    default: return base
  }
}

export function StylePanel() {
  const { t } = useTranslation()
  const { slides, activeSlideId, updateSlide } = useEditorStore()
  const slide = slides.find((s) => s.id === activeSlideId)
  if (!slide) return null

  const mockupStyle = slide.mockupStyle ?? 'default'
  const borderShape = slide.borderShape ?? 'curved'
  const borderRadius = slide.borderRadius ?? 20
  const borderWidth = slide.borderWidth ?? 2
  const borderColor = slide.borderColor ?? 'rgba(255,255,255,0.4)'
  const shadowMode = slide.shadowMode ?? 'spread'
  const mockupOpacity = slide.mockupOpacity ?? 100
  const frameLightIntensity = slide.frameLightIntensity ?? 100

  const patch = (p: Partial<Slide>) => updateSlide(activeSlideId, p)

  return (
    <div className="p-4 space-y-4">
      {/* Style */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider mb-2">{t('style.style')}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {STYLES.map((s) => (
            <button
              key={s}
              onClick={() => patch({ mockupStyle: s })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left ${
                mockupStyle === s
                  ? 'border-indigo-400 bg-indigo-500/20 text-white'
                  : 'option-idle'
              }`}
            >
              <div style={stylePreview(s)} />
              <span className="text-xs font-medium truncate">{t(`style.style_${s.replace('-', '_')}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Border */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider mb-2">{t('style.border')}</p>
        <div className="flex gap-1.5 mb-2">
          {BORDER_SHAPES.map((shape) => (
            <button
              key={shape}
              onClick={() => patch({ borderShape: shape })}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all border ${
                borderShape === shape
                  ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
                  : 'option-idle'
              }`}
            >
              {t(`style.border_${shape}`)}
            </button>
          ))}
        </div>
        {borderShape === 'round' && (
          <div className="flex items-center gap-2 pr-1 mb-1">
            <span className="text-xs text-muted w-10 flex-shrink-0">{t('style.border_radius')}</span>
            <input type="range" min={0} max={50} value={borderRadius}
              onChange={(e) => patch({ borderRadius: Number(e.target.value) })}
              className="flex-1 min-w-0" />
            <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{borderRadius}</span>
          </div>
        )}
        <div className="flex items-center gap-2 pr-1">
          <span className="text-xs text-muted w-10 flex-shrink-0">{t('style.border_width')}</span>
          <input type="range" min={0} max={8} step={1} value={borderWidth}
            onChange={(e) => patch({ borderWidth: Number(e.target.value) })}
            className="flex-1 min-w-0" />
          <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{borderWidth}px</span>
        </div>
        <div className="flex items-center gap-2 pr-1 mt-1">
          <span className="text-xs text-muted w-10 flex-shrink-0">{t('style.border_color')}</span>
          <input type="color" value={rgbaToHex(borderColor)}
            onChange={(e) => patch({ borderColor: hexToRgba(e.target.value) })}
            className="w-8 h-6 rounded cursor-pointer border border-subtle bg-transparent" />
        </div>
      </div>

      {/* Shadow */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider mb-2">{t('style.shadow')}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SHADOW_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => patch({ shadowMode: mode })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                shadowMode === mode
                  ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
                  : 'option-idle'
              }`}
            >
              <div style={shadowPreviewCSS(mode)} />
              <span className="text-xs font-medium">{t(`style.shadow_${mode}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <div className="flex items-center gap-2 pr-1">
          <span className="text-xs text-muted w-16 flex-shrink-0">{t('style.opacity')}</span>
          <input type="range" min={0} max={100} value={mockupOpacity}
            onChange={(e) => patch({ mockupOpacity: Number(e.target.value) })}
            className="flex-1 min-w-0" />
          <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{mockupOpacity}%</span>
          <button onClick={() => patch({ mockupOpacity: 100 })} className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5" title={t('style.reset')}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Adjust Light */}
      <div>
        <div className="flex items-center gap-2 pr-1">
          <span className="text-xs text-muted w-16 flex-shrink-0">{t('style.adjust_light')}</span>
          <input type="range" min={0} max={200} value={frameLightIntensity}
            onChange={(e) => patch({ frameLightIntensity: Number(e.target.value) })}
            className="flex-1 min-w-0" />
          <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{frameLightIntensity}%</span>
          <button onClick={() => patch({ frameLightIntensity: 100 })} className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5" title={t('style.reset')}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  )
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
```

---

### Task 5: Add Style tab to Sidebar

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx`

**Step 1: Add Style import and tab**

Changes:
1. Import `Palette` from lucide-react (add to existing import)
2. Import `StylePanel` from `./StylePanel`
3. Extend `Tab` type: `'upload' | 'frame' | 'style' | 'background' | 'text'`
4. Add Style tab entry in TABS array (after frame, before background):
   ```tsx
   { id: 'style',      label: t('sidebar.tabs.style'),      icon: <Palette className="w-4 h-4" /> },
   ```
5. Add render condition in the tab content area:
   ```tsx
   {tab === 'style'      && <StylePanel />}
   ```

---

### Task 6: Create mockup style rendering utilities

**Files:**
- Create: `src/utils/mockupStyle.ts`

**Step 1: Create the utility module**

This module provides functions that return CSS properties and styles for each mockup setting, keeping rendering logic out of SlideCanvas.

```typescript
import type { MockupStyle, BorderShape, ShadowMode, Slide } from '../types'

export function getMockupFrameCSS(slide: Slide, baseRadius: number | undefined): React.CSSProperties {
  const style = slide.mockupStyle ?? 'default'
  const borderShape = slide.borderShape ?? 'curved'
  const borderRadius = slide.borderRadius ?? 20
  const borderWidth = slide.borderWidth ?? 2
  const borderColor = slide.borderColor ?? 'rgba(255,255,255,0.4)'
  const shadowMode = slide.shadowMode ?? 'spread'
  const mockupOpacity = slide.mockupOpacity ?? 100
  const lightIntensity = slide.frameLightIntensity ?? 100

  const radius = computeRadius(borderShape, baseRadius, borderRadius)

  const base: React.CSSProperties = {
    opacity: mockupOpacity / 100,
    borderRadius: radius,
  }

  // Shadow
  const shadow = computeShadow(shadowMode)
  if (shadow) base.boxShadow = shadow

  // Style-specific overrides
  switch (style) {
    case 'default':
      break
    case 'glass-light':
      base.background = 'rgba(255,255,255,0.12)'
      base.border = `${borderWidth}px solid rgba(255,255,255,0.25)`
      break
    case 'glass-dark':
      base.background = 'rgba(0,0,0,0.35)'
      base.border = `${borderWidth}px solid rgba(255,255,255,0.12)`
      break
    case 'liquid-glass':
      base.background = 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))'
      base.border = `${borderWidth}px solid rgba(255,255,255,0.35)`
      break
    case 'inset-light':
      base.boxShadow = `inset 0 2px 8px rgba(255,255,255,${0.2 * lightIntensity / 100}), inset 0 -1px 3px rgba(0,0,0,0.15)${shadow ? ', ' + shadow : ''}`
      break
    case 'inset-dark':
      base.boxShadow = `inset 0 3px 10px rgba(0,0,0,${0.4 * lightIntensity / 100})${shadow ? ', ' + shadow : ''}`
      break
    case 'outline':
      base.border = `${borderWidth}px solid ${borderColor}`
      base.background = 'transparent'
      break
    case 'border':
      base.border = `${borderWidth}px solid ${borderColor}`
      break
  }

  // Adjust light: scale shadow intensity
  if (style === 'default' && lightIntensity !== 100 && shadow) {
    // For default style, light adjusts shadow brightness
    base.filter = `brightness(${lightIntensity / 100})`
  }

  return base
}

export function computeRadius(shape: BorderShape, baseRadius: number | undefined, customRadius: number): number {
  switch (shape) {
    case 'sharp': return 0
    case 'curved': return baseRadius ?? 20
    case 'round': return customRadius
  }
}

export function computeShadow(mode: ShadowMode): string | null {
  switch (mode) {
    case 'none': return null
    case 'spread': return '0 48px 80px -24px rgba(0,0,0,0.5)'
    case 'hug': return '0 8px 24px -4px rgba(0,0,0,0.4)'
    case 'adaptive': return null // computed at render time based on background
  }
}

export function computeAdaptiveShadow(bgBrightness: number): string {
  const alpha = 0.2 + (1 - bgBrightness) * 0.5
  return `0 24px 60px -16px rgba(0,0,0,${alpha.toFixed(2)})`
}

export function getBezelLightColor(baseColor: string, lightIntensity: number): string {
  if (lightIntensity === 100) return baseColor
  const m = baseColor.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return baseColor
  const factor = lightIntensity / 100
  const r = Math.min(255, Math.round(parseInt(m[1]) * factor))
  const g = Math.min(255, Math.round(parseInt(m[2]) * factor))
  const b = Math.min(255, Math.round(parseInt(m[3]) * factor))
  return baseColor.replace(/rgba?\(\s*\d+,\s*\d+,\s*\d+/, `rgba(${r},${g},${b}`)
}
```

---

### Task 7: Apply mockup styles to SlideCanvas (flat frames)

**Files:**
- Modify: `src/components/Canvas/SlideCanvas.tsx`

**Step 1: Import mockup style utilities**

Add import:
```typescript
import { getMockupFrameCSS, computeAdaptiveShadow, getBezelLightColor } from '../../utils/mockupStyle'
```

**Step 2: Modify the DeviceFrame component**

In `DeviceFrame`, after computing `screenshotRadius` and `bezelWidth`:

1. Compute `mockupRadius` using `computeRadius(borderShape, screenshotRadius, borderRadius)` from mockupStyle utils
2. Build a `mockupStyle` object via `getMockupFrameCSS(slide, screenshotRadius)`
3. For `shadowMode === 'adaptive'`, compute background brightness and use `computeAdaptiveShadow`
4. Apply `mockupOpacity` to the outer wrapper div's `opacity`
5. Apply `frameLightIntensity` by adjusting bezel color via `getBezelLightColor`

The flat frame rendering branches (bezel vs no-bezel) need to merge `mockupStyle` properties into their inline styles:
- The outer device div gets `opacity` from `mockupOpacity`
- The bezel/container div gets `borderRadius`, `boxShadow`, `border`, `background` from mockup style
- The bezel color gets adjusted by `getBezelLightColor` if `frameLightIntensity !== 100`
- `screenshotRadius` gets overridden by `mockupRadius` when `borderShape !== 'curved'`

Key changes in the bezel branch:
```tsx
// Replace hardcoded boxShadow with shadow from mockup style
const mockupCSS = getMockupFrameCSS(slide, screenshotRadius)
const bezelColor = getBezelLightColor(frame.bezel.color, slide.frameLightIntensity ?? 100)
// Use bezelColor instead of frame.bezel.color
// Use mockupCSS.boxShadow instead of hardcoded shadow
// Use computedRadius instead of screenshotRadius when borderShape overrides it
```

Key changes in the no-bezel (minimal) branch:
```tsx
const mockupCSS = getMockupFrameCSS(slide, screenshotRadius)
// Merge mockupCSS into the container div style
```

**Step 3: Handle glass effects for export compatibility**

For glass styles (`glass-light`, `glass-dark`, `liquid-glass`), we need the background content to show through. Since `backdrop-filter` doesn't work with `html-to-image`, we render a clipped copy of the background behind the device:

In `DeviceFrame`, when style is glass-like, render a `BackgroundLayers` clone inside the device frame, clipped to the device shape, with a blur filter applied. This gives the glass effect without needing `backdrop-filter`.

Add a helper inside SlideCanvas:
```tsx
function GlassBackground({ slide, style }: { slide: Slide; style: MockupStyle }) {
  const blurAmount = style === 'liquid-glass' ? 20 : 12
  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflow: 'hidden',
      borderRadius: 'inherit',
    }}>
      <div style={{
        position: 'absolute',
        inset: -blurAmount * 3,
        backgroundImage: getBackgroundImage(slide.background),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: `blur(${blurAmount}px)`,
        transform: 'scale(1.1)',
      }} />
    </div>
  )
}
```

This requires extracting the background CSS generation from `BackgroundLayers` into a reusable function `getBackgroundCSS(bg: Background): React.CSSProperties`.

---

### Task 8: Apply mockup styles to Device3D

**Files:**
- Modify: `src/components/Canvas/Device3D.tsx`

**Step 1: Add opacity and light props**

Extend `Props` interface with:
```typescript
mockupOpacity?: number
frameLightIntensity?: number
shadowMode?: ShadowMode
mockupStyle?: MockupStyle
```

**Step 2: Apply opacity to Canvas wrapper**

In the `Device3D` component, apply `opacity` to the outer `<Canvas>` style:
```tsx
style={{
  position: 'absolute', inset: 0,
  filter: `drop-shadow(0 24px 48px rgba(0,0,0,0.75))`,
  opacity: (mockupOpacity ?? 100) / 100,
}}
```

Adjust the `drop-shadow` based on `shadowMode`:
- `'none'` → remove `filter`
- `'spread'` → `drop-shadow(0 48px 80px rgba(0,0,0,0.5))`
- `'hug'` → `drop-shadow(0 8px 24px rgba(0,0,0,0.4))`
- `'adaptive'` → computed value

**Step 3: Apply light intensity to Three.js lights**

In the `Canvas`, scale light intensities by `frameLightIntensity / 100`:
```tsx
<ambientLight intensity={0.4 * (frameLightIntensity ?? 100) / 100} />
<directionalLight position={[2, 8, 1]} intensity={3 * (frameLightIntensity ?? 100) / 100} />
<directionalLight position={[-3, -2, 4]} intensity={0.6 * (frameLightIntensity ?? 100) / 100} />
```

**Step 4: Update SlideCanvas to pass new props to Device3D**

In `SlideCanvas.tsx`, update the `<Device3D>` call:
```tsx
<Device3D
  spec={frame.device3d}
  slotW={dSlotW}
  slotH={dSlotH}
  vbW={vbW}
  tilt={slide.frameTilt}
  rotate={devSlot.deviceRotate}
  screenshotDataUrl={screenshotDataUrl}
  mockupOpacity={slide.mockupOpacity ?? 100}
  frameLightIntensity={slide.frameLightIntensity ?? 100}
  shadowMode={slide.shadowMode ?? 'spread'}
  mockupStyle={slide.mockupStyle ?? 'default'}
/>
```

---

### Task 9: Verify TypeScript compilation

**Step 1: Run build**

```bash
npm run build
```

Expected: Clean build with no TypeScript errors.

**Step 2: Run lint**

```bash
npm run lint
```

Expected: No lint errors.

---

### Task 10: Manual verification checklist

1. Open dev server (`npm run dev`)
2. Switch to Style tab — verify all 8 style presets render visually
3. Toggle Border shapes — verify Sharp shows square corners, Curved shows default, Round shows custom radius
4. Change Shadow modes — verify None has no shadow, Spread/Hug/Adaptive show different shadows
5. Drag Opacity slider — verify device fades at low values
6. Drag Adjust Light — verify flat frame bezel brightness changes, 3D frame lighting changes
7. Switch between Phone/Tablet/iPhone formats — verify styles apply correctly
8. Export a slide — verify exported PNG matches canvas preview (especially glass effects)
9. Test 3D frames — verify opacity and light adjustments work on Android 3D / iPhone 3D
10. Refresh page — verify persisted state restores all new style settings

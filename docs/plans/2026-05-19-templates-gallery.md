# Templates Gallery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Modal-based Templates Gallery with 26 pre-designed visual presets across 6 categories, allowing users to apply complete visual styles to slides in one click.

**Architecture:** Modal triggered from Header button. Templates defined as `Partial<Slide>` data objects. Pure CSS preview thumbnails. Applied via `updateSlide()` — fully undoable.

**Tech Stack:** React, TypeScript, Tailwind CSS v3, lucide-react, react-i18next

---

## Task 1: Create Template Data File

**Files:**
- Create: `src/data/templates.ts`

**Step 1: Define types and 26 templates across 6 categories**

Create `src/data/templates.ts` with:

```typescript
import type { Background, DeviceSlot, FrameId, MockupStyle, BorderShape, ShadowMode, TextFont, TextPosition } from '../types'

export interface TemplateDef {
  id: string
  labelKey: string
  category: string
  patch: {
    background: Background
    frame: FrameId
    frameTilt: number
    mockupStyle: MockupStyle
    borderShape: BorderShape
    borderRadius: number
    borderWidth: number
    borderColor: string
    shadowMode: ShadowMode
    mockupOpacity: number
    shadowPercentX: number
    shadowPercentY: number
    textPosition: TextPosition
    textColor: string
    subtitleColor: string
    headlineFontSize: number
    subtitleFontSize: number
    textFontFamily: TextFont
    headlineFontWeight: number
    subtitleFontWeight: number
    headlineItalic: boolean
    subtitleItalic: boolean
    textOffsetY: number
    deviceOffset: number
    deviceScale: number
    deviceRotate: number
    screenshotCount: 1 | 2
    deviceSlots: DeviceSlot[]
    activePresetId: string | null
  }
}

export interface TemplateCategory {
  id: string
  labelKey: string
}
```

Then define the 26 templates. Each template's `patch` is a complete visual configuration. Categories:

1. **Dark** (6): Midnight Pro, Dark Chrome, Obsidian Edge, Deep Space, Shadow Play, Noir
2. **Light** (4): Clean White, Soft Gray, Warm Cream, Bright Day
3. **Vibrant** (5): Sunset Glow, Electric Blue, Rose Gold, Neon Night, Aurora
4. **Glass** (3): Glass Light, Glass Dark, Liquid Crystal
5. **Minimal** (4): Flat Dark, Flat Light, Outline Dark, Outline Light
6. **Dual** (4): Side by Side, Stacked Light, Front Back, Tilt Duo

Export `TEMPLATE_CATEGORIES: TemplateCategory[]` and `TEMPLATES: TemplateDef[]`.

**Key data for each template:**

Dark:
- Midnight Pro: bg Midnight Slate (#0F172A→#1E3A5F), frame: minimal, mockupStyle: default, shadowMode: spread, textPosition: top, textColor: #fff, fontSize: 42/20, fontWeight: 700/400, deviceOffset: 30, deviceScale: 100, screenshotCount: 1
- Dark Chrome: bg Charcoal Blue (#111827→#1E293B), frame: android-3d, frameTilt: 18, mockupStyle: default, shadowMode: adaptive, textPosition: top, textColor: #fff, deviceOffset: 30, screenshotCount: 1
- Obsidian Edge: bg Obsidian (#0a0a0a→#1a1a2e), frame: minimal, mockupStyle: outline, borderShape: sharp, borderWidth: 2, borderColor: rgba(255,255,255,0.2), shadowMode: none, textPosition: bottom, textColor: #fff, deviceOffset: 30, screenshotCount: 1
- Deep Space: bg Cosmic Indigo (#1e1b4b→#312e81), frame: ios-3d, frameTilt: 18, mockupStyle: glass-dark, shadowMode: adaptive, textPosition: top, textColor: #fff, deviceOffset: 30, screenshotCount: 1
- Shadow Play: bg Deep Ink (#0d0d0d→#1a1a1a), frame: minimal, mockupStyle: default, shadowMode: hug, shadowPercentX: 0, shadowPercentY: 25, textPosition: top, textColor: #e2e8f0, deviceOffset: 32, screenshotCount: 1
- Noir: bg Black (#000000 solid), frame: minimal, mockupStyle: border, borderShape: round, borderRadius: 40, borderWidth: 3, borderColor: rgba(255,255,255,0.3), shadowMode: spread, textPosition: top, textColor: #fff, deviceOffset: 30, screenshotCount: 1

Light:
- Clean White: bg Off White (#fafaf9 solid), frame: minimal, mockupStyle: default, shadowMode: spread, textPosition: top, textColor: #0f172a, subtitleColor: #475569, deviceOffset: 30, screenshotCount: 1
- Soft Gray: bg Cool Gray (#f1f5f9 solid), frame: minimal, mockupStyle: inset-light, shadowMode: none, textPosition: bottom, textColor: #1e293b, deviceOffset: 30, screenshotCount: 1
- Warm Cream: bg Cream (#fef3c7 solid), frame: minimal, mockupStyle: border, borderShape: curved, borderWidth: 2, borderColor: rgba(0,0,0,0.08), shadowMode: spread, textPosition: top, textColor: #1c1917, deviceOffset: 30, screenshotCount: 1
- Bright Day: bg gradient #f0f9ff→#e0f2fe, frame: minimal, mockupStyle: default, shadowMode: spread, textPosition: top, textColor: #0c4a6e, deviceOffset: 30, screenshotCount: 1

Vibrant:
- Sunset Glow: bg Orange Glow (#7C2D12→#1C0A00), frame: minimal, mockupStyle: default, shadowMode: spread, textPosition: top, textColor: #fff, deviceOffset: 30, screenshotCount: 1
- Electric Blue: bg Arctic Blue (#1e40af→#1e3a5f), frame: android-3d, frameTilt: 18, mockupStyle: glass-dark, shadowMode: adaptive, textPosition: top, textColor: #fff, deviceOffset: 30, screenshotCount: 1
- Rose Gold: bg Electric Rose (#be185d→#4a044e), frame: minimal, mockupStyle: liquid-glass, shadowMode: spread, textPosition: top, textColor: #fff, deviceOffset: 30, screenshotCount: 1
- Neon Night: bg Neon Teal (#0d9488→#134e4a), frame: minimal, mockupStyle: outline, borderShape: sharp, borderWidth: 2, borderColor: rgba(255,255,255,0.25), shadowMode: none, textPosition: bottom, textColor: #f0fdfa, deviceOffset: 30, screenshotCount: 1
- Aurora: bg Emerald (#065f46→#022c22), frame: minimal, mockupStyle: default, shadowMode: adaptive, textPosition: top, textColor: #ecfdf5, deviceOffset: 30, screenshotCount: 1

Glass:
- Glass Light: bg Off White (#fafaf9 solid), frame: minimal, mockupStyle: glass-light, shadowMode: spread, textPosition: top, textColor: #0f172a, deviceOffset: 30, screenshotCount: 1
- Glass Dark: bg Obsidian (#0a0a0a→#1a1a2e), frame: minimal, mockupStyle: glass-dark, shadowMode: spread, textPosition: top, textColor: #fff, deviceOffset: 30, screenshotCount: 1
- Liquid Crystal: bg Cosmic Indigo (#1e1b4b→#312e81), frame: minimal, mockupStyle: liquid-glass, shadowMode: adaptive, textPosition: top, textColor: #fff, deviceOffset: 30, screenshotCount: 1

Minimal:
- Flat Dark: bg Deep Ink (#0d0d0d→#1a1a1a), frame: minimal, mockupStyle: default, borderShape: sharp, borderWidth: 0, shadowMode: none, textPosition: bottom, textColor: #94a3b8, fontSize: 36/16, fontWeight: 400/400, deviceOffset: 35, screenshotCount: 1
- Flat Light: bg Pure White (#ffffff solid), frame: minimal, mockupStyle: default, borderShape: sharp, borderWidth: 0, shadowMode: none, textPosition: bottom, textColor: #64748b, fontSize: 36/16, fontWeight: 400/400, deviceOffset: 35, screenshotCount: 1
- Outline Dark: bg Deep Ink (#0d0d0d→#1a1a1a), frame: minimal, mockupStyle: outline, borderShape: curved, borderWidth: 2, borderColor: rgba(255,255,255,0.15), shadowMode: none, textPosition: top, textColor: #e2e8f0, deviceOffset: 30, screenshotCount: 1
- Outline Light: bg Cool Gray (#f1f5f9 solid), frame: minimal, mockupStyle: outline, borderShape: curved, borderWidth: 2, borderColor: rgba(0,0,0,0.12), shadowMode: none, textPosition: top, textColor: #334155, deviceOffset: 30, screenshotCount: 1

Dual:
- Side by Side: bg Midnight Slate (#0F172A→#1E3A5F), frame: minimal, mockupStyle: default, shadowMode: spread, textPosition: top, textColor: #fff, screenshotCount: 2, deviceSlots: duo-side, activePresetId: duo-side
- Stacked Light: bg Off White (#fafaf9 solid), frame: minimal, mockupStyle: default, shadowMode: spread, textPosition: bottom, textColor: #0f172a, screenshotCount: 2, deviceSlots: duo-stack, activePresetId: duo-stack
- Front Back: bg Nebula (#2e1065→#1e1b4b), frame: minimal, mockupStyle: glass-dark, shadowMode: adaptive, textPosition: top, textColor: #fff, screenshotCount: 2, deviceSlots: duo-front-back, activePresetId: duo-front-back
- Tilt Duo: bg Orange Glow (#7C2D12→#1C0A00), frame: minimal, mockupStyle: default, shadowMode: spread, textPosition: top, textColor: #fff, screenshotCount: 2, deviceSlots: duo-tilt, activePresetId: duo-tilt

Default common values for most templates:
- frameTilt: 0 (no tilt for flat frames), 18 for 3D frames
- mockupOpacity: 100
- shadowPercentX: 0, shadowPercentY: -20
- textOffsetY: 0
- textFontFamily: 'default'
- headlineItalic: false, subtitleItalic: false

**Step 2: Verify build**

Run: `npm run build`

---

## Task 2: Create TemplateModal Component

**Files:**
- Create: `src/components/TemplateModal.tsx`

**Step 1: Build the Modal component**

Component structure:

```
TemplateModal
├── Backdrop (fixed inset-0 bg-black/60 backdrop-blur-sm z-50)
├── Modal container (fixed inset-4 md:inset-8 surface rounded-2xl overflow-hidden flex flex-col)
│   ├── Header row (flex items-center justify-between p-4 border-b border-subtle)
│   │   ├── Title: t('templates.title') with LayoutGrid icon
│   │   └── Close button (X icon, btn-ghost)
│   ├── Category pills (flex flex-wrap gap-1.5 px-4 py-3 border-b border-subtle)
│   │   └── "All" + each category pill
│   └── Grid container (flex-1 overflow-y-auto p-4)
│       └── grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3
│           └── TemplateCard (for each filtered template)
│               ├── Preview (aspect-[9/16] rounded-lg overflow-hidden relative)
│               │   ├── Background fill (bg gradient/solid)
│               │   ├── Text lines (2 horizontal lines at top or bottom)
│               │   └── Device shape (rounded rect, ~40% width, centered)
│               └── Label (text-xs text-dim truncate mt-1.5)
```

Props:
```typescript
interface TemplateModalProps {
  open: boolean
  onClose: () => void
}
```

Behavior:
- When `open` is false, return null
- ESC key closes modal
- Click backdrop closes modal
- Click template card → `updateSlide(activeSlideId, template.patch)` → close modal
- Category filter: state `activeCategory: string | null` (null = "All")

CSS preview thumbnail for each template:
```tsx
function TemplatePreview({ template }: { template: TemplateDef }) {
  const { patch } = template
  const bgStyle = patch.background.type === 'gradient'
    ? { background: `linear-gradient(${patch.background.angle}deg, ${patch.background.from}, ${patch.background.to})` }
    : { background: patch.background.color }

  return (
    <div className="absolute inset-0 flex flex-col" style={bgStyle}>
      {/* Text lines */}
      <div className={`flex flex-col gap-1 p-3 ${patch.textPosition === 'top' ? '' : 'mt-auto'}`}>
        <div className="h-1.5 rounded-full" style={{ width: '60%', background: patch.textColor, opacity: 0.8 }} />
        <div className="h-1 rounded-full" style={{ width: '40%', background: patch.subtitleColor, opacity: 0.5 }} />
      </div>
      {/* Device shape */}
      {patch.textPosition === 'top' ? (
        <div className="flex-1 flex items-center justify-center pb-3">
          <div className="w-[38%] aspect-[9/16] rounded-md" style={{ background: 'rgba(128,128,128,0.3)', border: '1px solid rgba(128,128,128,0.2)' }} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center pt-3">
          <div className="w-[38%] aspect-[9/16] rounded-md" style={{ background: 'rgba(128,128,128,0.3)', border: '1px solid rgba(128,128,128,0.2)' }} />
        </div>
      )}
    </div>
  )
}
```

For dual-screenshot templates, show 2 device shapes side by side (each ~25% width).

Store interaction:
```typescript
const updateSlide = useEditorStore((s) => s.updateSlide)
const activeSlideId = useEditorStore((s) => s.activeSlideId)
const slides = useEditorStore((s) => s.slides)

const handleApply = (template: TemplateDef) => {
  if (!activeSlideId) return
  const slide = slides.find(s => s.id === activeSlideId)
  if (!slide) return
  updateSlide(activeSlideId, { ...template.patch, format: slide.format, id: slide.id })
  onClose()
}
```

Wait — we should NOT spread `format` and `id` from the template patch. Those aren't in the template patch anyway. Just `updateSlide(activeSlideId, template.patch)` is correct.

**Step 2: Verify build**

Run: `npm run build`

---

## Task 3: Add Templates Button to Header + i18n

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/es/translation.json`
- Modify: `src/locales/zh/translation.json`

**Step 1: Add i18n strings**

Add to each locale file:

en:
```json
"templates": {
  "title": "Templates",
  "button": "Templates",
  "cat_all": "All",
  "cat_dark": "Dark",
  "cat_light": "Light",
  "cat_vibrant": "Vibrant",
  "cat_glass": "Glass",
  "cat_minimal": "Minimal",
  "cat_dual": "Dual",
  "t_midnight_pro": "Midnight Pro",
  "t_dark_chrome": "Dark Chrome",
  "t_obsidian_edge": "Obsidian Edge",
  "t_deep_space": "Deep Space",
  "t_shadow_play": "Shadow Play",
  "t_noir": "Noir",
  "t_clean_white": "Clean White",
  "t_soft_gray": "Soft Gray",
  "t_warm_cream": "Warm Cream",
  "t_bright_day": "Bright Day",
  "t_sunset_glow": "Sunset Glow",
  "t_electric_blue": "Electric Blue",
  "t_rose_gold": "Rose Gold",
  "t_neon_night": "Neon Night",
  "t_aurora": "Aurora",
  "t_glass_light": "Glass Light",
  "t_glass_dark": "Glass Dark",
  "t_liquid_crystal": "Liquid Crystal",
  "t_flat_dark": "Flat Dark",
  "t_flat_light": "Flat Light",
  "t_outline_dark": "Outline Dark",
  "t_outline_light": "Outline Light",
  "t_side_by_side": "Side by Side",
  "t_stacked_light": "Stacked Light",
  "t_front_back": "Front Back",
  "t_tilt_duo": "Tilt Duo"
}
```

es:
```json
"templates": {
  "title": "Plantillas",
  "button": "Plantillas",
  "cat_all": "Todo",
  "cat_dark": "Oscuro",
  "cat_light": "Claro",
  "cat_vibrant": "Vibrante",
  "cat_glass": "Cristal",
  "cat_minimal": "Minimalista",
  "cat_dual": "Dual",
  "t_midnight_pro": "Medianoche Pro",
  "t_dark_chrome": "Cromo Oscuro",
  "t_obsidian_edge": "Borde Obsidiana",
  "t_deep_space": "Espacio Profundo",
  "t_shadow_play": "Juego de Sombras",
  "t_noir": "Noir",
  "t_clean_white": "Blanco Limpio",
  "t_soft_gray": "Gris Suave",
  "t_warm_cream": "Crema Cálido",
  "t_bright_day": "Día Brillante",
  "t_sunset_glow": "Brillo Atardecer",
  "t_electric_blue": "Azul Eléctrico",
  "t_rose_gold": "Rosa Dorado",
  "t_neon_night": "Noche Neón",
  "t_aurora": "Aurora",
  "t_glass_light": "Cristal Claro",
  "t_glass_dark": "Cristal Oscuro",
  "t_liquid_crystal": "Cristal Líquido",
  "t_flat_dark": "Plano Oscuro",
  "t_flat_light": "Plano Claro",
  "t_outline_dark": "Contorno Oscuro",
  "t_outline_light": "Contorno Claro",
  "t_side_by_side": "Lado a Lado",
  "t_stacked_light": "Apilado Claro",
  "t_front_back": "Frente y Fondo",
  "t_tilt_duo": "Dúo Inclinado"
}
```

zh:
```json
"templates": {
  "title": "模板库",
  "button": "模板",
  "cat_all": "全部",
  "cat_dark": "深色",
  "cat_light": "浅色",
  "cat_vibrant": "鲜艳",
  "cat_glass": "玻璃",
  "cat_minimal": "极简",
  "cat_dual": "双截图",
  "t_midnight_pro": "午夜蓝调",
  "t_dark_chrome": "暗色铬银",
  "t_obsidian_edge": "黑曜石边",
  "t_deep_space": "深空紫",
  "t_shadow_play": "暗影游戏",
  "t_noir": "纯黑",
  "t_clean_white": "纯净白",
  "t_soft_gray": "柔灰",
  "t_warm_cream": "暖奶油",
  "t_bright_day": "明亮日",
  "t_sunset_glow": "落日余晖",
  "t_electric_blue": "电光蓝",
  "t_rose_gold": "玫瑰金",
  "t_neon_night": "霓虹夜",
  "t_aurora": "极光绿",
  "t_glass_light": "浅色玻璃",
  "t_glass_dark": "深色玻璃",
  "t_liquid_crystal": "液态水晶",
  "t_flat_dark": "扁平暗",
  "t_flat_light": "扁平亮",
  "t_outline_dark": "描边暗",
  "t_outline_light": "描边亮",
  "t_side_by_side": "并排展示",
  "t_stacked_light": "浅色堆叠",
  "t_front_back": "前后景",
  "t_tilt_duo": "对称倾斜"
}
```

**Step 2: Add Templates button + state to Header**

In `Header.tsx`:
- Add `import { LayoutGrid, X } from 'lucide-react'` (LayoutGrid for trigger, X is already available or add it)
- Add `import { useState } from 'react'` (already imported as useRef, just add useState)
- Add `import { TemplateModal } from './TemplateModal'`
- Add state: `const [showTemplates, setShowTemplates] = useState(false)`
- Add button in Header toolbar area (before Save button):

```tsx
<button
  onClick={() => setShowTemplates(true)}
  className="flex items-center gap-1.5 px-3 py-2 text-sm btn-ghost"
  title={t('templates.title')}
>
  <LayoutGrid className="w-4 h-4" />
  <span className="hidden sm:inline">{t('templates.button')}</span>
</button>
```

- Add `<TemplateModal open={showTemplates} onClose={() => setShowTemplates(false)} />` before the closing `</header>` tag, or as a sibling (since modal is fixed positioned, placement doesn't matter).

**Step 3: Verify build**

Run: `npm run build`

---

## Summary

| Task | Files | Estimated Size |
|---|---|---|
| Task 1: Template data | `src/data/templates.ts` (new) | ~280 lines |
| Task 2: TemplateModal | `src/components/TemplateModal.tsx` (new) | ~200 lines |
| Task 3: Header + i18n | Header.tsx (modify), 3 locale files | ~50 lines added |

Total: ~530 lines of new code, ~10 lines modified.

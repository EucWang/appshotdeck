# Text Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add left/center/right alignment control for headline and subtitle text, shared as a single `textAlign` field on the Slide.

**Architecture:** New optional field `textAlign?: 'left' | 'center' | 'right'` on Slide. Default `'center'` for backward compatibility. TextPanel gets 3 icon buttons next to the font picker. SlideCanvas replaces hardcoded `textAlign: 'center'` (portrait) and implicit left (landscape) with `slide.textAlign ?? 'center'`.

**Tech Stack:** React, TypeScript, Zustand, lucide-react icons, react-i18next

---

### Task 1: Add TextAlign type and Slide field

**Files:**
- Modify: `src/types/index.ts:26` (add type after `TextFont`)
- Modify: `src/types/index.ts:113` (add field after `textOffsetX`)

**Step 1: Add TextAlign type**

In `src/types/index.ts`, after line 26 (`export type TextFont = string`), add:

```typescript
export type TextAlign = 'left' | 'center' | 'right'
```

**Step 2: Add textAlign field to Slide interface**

In `src/types/index.ts`, after line 113 (`textOffsetX?: number`), add:

```typescript
textAlign?: TextAlign
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS (no new errors — field is optional)

---

### Task 2: Add default value and STYLE_FIELDS entry in store

**Files:**
- Modify: `src/store/useEditorStore.ts:53` (add field in defaultSlide)
- Modify: `src/store/useEditorStore.ts:67` (add to STYLE_FIELDS array)

**Step 1: Add textAlign to defaultSlide**

In `src/store/useEditorStore.ts`, add after `overlays: [],` (line 52) in `defaultSlide`:

```typescript
textAlign: 'center',
```

**Step 2: Add textAlign to STYLE_FIELDS**

In `src/store/useEditorStore.ts`, add `'textAlign'` to the STYLE_FIELDS array after `'textOffsetX'` on line 67:

```typescript
'textPosition', 'textOffsetY', 'textOffsetX', 'textAlign',
```

This ensures `applyStyleToAll` propagates alignment to all slides.

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 3: Update SlideCanvas to use dynamic textAlign

**Files:**
- Modify: `src/components/Canvas/SlideCanvas.tsx:611-634` (landscape text container)
- Modify: `src/components/Canvas/SlideCanvas.tsx:636-660` (portrait text container)

**Step 1: Add textAlign variable**

In `src/components/Canvas/SlideCanvas.tsx`, after line 593 (`const textOffsetXPx = ...`), add:

```typescript
const textAlign = slide.textAlign ?? 'center'
```

**Step 2: Update landscape text container**

In the landscape text container (lines 611-634), add `textAlign` to the style object. Currently the style object starts at line 612:

```typescript
style={{
  position: 'absolute',
  left: Math.round(W * 0.05) + textOffsetXPx,
  top: 0,
  right: Math.round(W * 0.05),
  height: H,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  transform: `translateY(${textOffsetPx}px)`,
  textAlign,
}}
```

**Step 3: Update portrait text container**

In the portrait text container (lines 636-660), replace the hardcoded `textAlign: 'center'` (line 646) with the dynamic `textAlign`:

Change line 646 from:
```typescript
textAlign: 'center',
```
To:
```typescript
textAlign,
```

**Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 4: Add i18n keys

**Files:**
- Modify: `src/locales/en/translation.json:120-147` (text section)
- Modify: `src/locales/es/translation.json:120-147` (text section)

**Step 1: Add English keys**

In `src/locales/en/translation.json`, add inside the `"text"` object after `"reset_x_offset"` (line 146):

```json
"align": "Align",
"align_left": "Left",
"align_center": "Center",
"align_right": "Right"
```

**Step 2: Add Spanish keys**

In `src/locales/es/translation.json`, add inside the `"text"` object after `"reset_x_offset"` (line 146):

```json
"align": "Alinear",
"align_left": "Izquierda",
"align_center": "Centro",
"align_right": "Derecha"
```

**Step 3: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/locales/en/translation.json','utf8')); JSON.parse(require('fs').readFileSync('src/locales/es/translation.json','utf8')); console.log('OK')"`
Expected: OK

---

### Task 5: Add alignment UI to TextPanel

**Files:**
- Modify: `src/components/Sidebar/TextPanel.tsx:1` (add lucide import)
- Modify: `src/components/Sidebar/TextPanel.tsx:269-273` (add align buttons after font picker)

**Step 1: Add AlignLeft, AlignCenter, AlignRight imports**

In `src/components/Sidebar/TextPanel.tsx`, update line 3 to import alignment icons:

```typescript
import { Eye, EyeOff, RotateCcw, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
```

**Step 2: Add alignment controls after font picker**

After the font picker section (after line 273 `</div>`), add the alignment control section:

```tsx
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
```

This follows the same button style pattern used in `WeightItalicControls` and the font picker fallback buttons.

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS (both tsc and vite build succeed)

---

### Task 6: Final verification

**Step 1: Run linter**

Run: `npm run lint`
Expected: PASS (no new errors)

**Step 2: Run full build**

Run: `npm run build`
Expected: PASS

**Step 3: Manual verification checklist**

- [ ] Open dev server, create new slide — text should be center-aligned by default
- [ ] Switch alignment to left — headline and subtitle both shift left
- [ ] Switch alignment to right — headline and subtitle both shift right
- [ ] Switch between portrait and landscape formats — alignment persists
- [ ] Check existing saved slides (old data without textAlign field) — should fall back to center
- [ ] "Apply Style to All" propagates textAlign to other slides
- [ ] Export PNG — alignment renders correctly in exported image

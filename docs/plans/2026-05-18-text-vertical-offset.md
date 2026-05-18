# Text Vertical Offset Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `textOffsetY` slider in the Text Panel that shifts headline + subtitle together vertically, so users can avoid text being covered when the device frame is moved up.

**Architecture:** Add an optional `textOffsetY` field to the `Slide` type (default 0). In `SlideCanvas.tsx`, apply this offset as a percentage of canvas height to the text container's `top` position in portrait layout. Add a slider control in `TextPanel.tsx`. Add i18n keys for en/es.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v3, react-i18next, lucide-react

---

### Task 1: Add `textOffsetY` field to Slide type

**Files:**
- Modify: `src/types/index.ts:66` (end of Slide interface, before closing brace)

**Step 1: Add the field**

In `src/types/index.ts`, add before the closing `}` of the `Slide` interface:

```typescript
  textOffsetY?: number
```

Place it after the existing `screenshotOffsetY` field (line 65).

**Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: Clean build, no errors.

---

### Task 2: Apply textOffsetY in SlideCanvas portrait layout

**Files:**
- Modify: `src/components/Canvas/SlideCanvas.tsx:196-219` (portrait text container)

**Step 1: Compute the offset**

At the top of the render function (after line 153, near other computed values), add:

```typescript
const textOffsetPx = Math.round(H * ((slide.textOffsetY ?? 0) / 100))
```

**Step 2: Apply offset to portrait text container `top`**

In the portrait text container's `style` (around line 202-204), change the `top` value:

```typescript
top: slide.textPosition === 'top'
  ? Math.round(H * 0.055) + textOffsetPx
  : slotY + dSlotH + Math.round(H * 0.03) + textOffsetPx,
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: Clean build, no errors.

---

### Task 3: Add i18n keys

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/es/translation.json`

**Step 1: Add English key**

In `src/locales/en/translation.json`, inside the `"text"` object (after `"select_text_hint"`), add:

```json
"y_offset": "Y Offset"
```

**Step 2: Add Spanish key**

In `src/locales/es/translation.json`, inside the `"text"` object (after `"select_text_hint"`), add:

```json
"y_offset": "Desplazamiento Y"
```

---

### Task 4: Add textOffsetY slider to TextPanel

**Files:**
- Modify: `src/components/Sidebar/TextPanel.tsx` (after the subtitle color section, around line 404)

**Step 1: Add the slider**

Add the following block after the subtitle color section (after the closing `</div>` of the subtitle color block, before the final `</div>` of the component return):

```tsx
<div className="space-y-2">
  <label className="text-xs text-muted uppercase tracking-wider">{t('text.y_offset')}</label>
  <div className="flex items-center gap-2">
    <input
      type="range" min={-40} max={40} value={slide.textOffsetY ?? 0}
      onChange={(e) => updateSlide(activeSlideId, { textOffsetY: Number(e.target.value) })}
      className="flex-1 min-w-0"
    />
    <span className="text-xs text-dim font-mono w-10 text-right flex-shrink-0">
      {(slide.textOffsetY ?? 0) > 0 ? `+${slide.textOffsetY ?? 0}` : (slide.textOffsetY ?? 0)}%
    </span>
    <button
      onClick={() => updateSlide(activeSlideId, { textOffsetY: 0 })}
      className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
      title="Reset Y offset"
    >
      <RotateCcw size={14} />
    </button>
  </div>
</div>
```

Note: `RotateCcw` is already imported at line 3.

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build.

**Step 3: Verify lint**

Run: `npm run lint`
Expected: No errors.

---

### Task 5: Visual verification

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Manual test**

1. Select Phone format
2. Set device Pos to -30% (device moves up)
3. Go to Text tab, verify new "Y Offset" slider appears
4. Drag Y Offset to +30% — text should move down below the device
5. Set textPosition to "bottom" — verify offset still works
6. Verify default value is 0 and reset button works
7. Test on other portrait formats (iPhone 6.9", iPhone 6.5", iPad 13")
8. Verify landscape formats are unaffected (no slider shown is fine, or slider shows but has no effect — either is acceptable since landscape has different text layout)

# Feature 3: Batch Style Apply — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** One-click apply the active slide's visual style (background, frame, mockup style, border, shadow, opacity, light, filters, text styling) to all other slides. Each slide keeps its own screenshots, text content, overlays, and layout config.

**Architecture:** Add a `STYLE_FIELDS` constant listing all style-related Slide field keys. Add `applyStyleToAll(sourceSlideId)` action to the Zustand store that extracts those fields from the source slide and spreads them onto all other slides. Place an "Apply Style to All" button in Sidebar.tsx, always visible above the SlideStrip regardless of active tab.

**Tech Stack:** Zustand store action, React component, react-i18next, lucide-react icon

---

## Style Fields Definition

Fields to **copy** (visual style consistent across marketing screenshot set):
- `background` — gradient/solid/image background
- `frame` — device frame
- `frameTilt` — 3D tilt angle
- `mockupStyle` — glass/inset/outline etc.
- `borderShape`, `borderRadius`, `borderWidth`, `borderColor` — border treatment
- `shadowMode`, `shadowPercentX`, `shadowPercentY` — shadow style
- `mockupOpacity` — device opacity
- `screenshotBrightness`, `screenshotContrast`, `screenshotSaturation` — screenshot filters
- `textColor`, `subtitleColor` — text colors
- `textFontFamily` — font family
- `headlineFontSize`, `subtitleFontSize` — text sizes
- `headlineFontWeight`, `subtitleFontWeight` — text weights
- `headlineItalic`, `subtitleItalic` — italic flags
- `headlineHighlightColor`, `subtitleHighlightColor` — highlight colors
- `textPosition` — top/bottom
- `textOffsetY`, `textOffsetX` — text offset

Fields to **exclude** (content/identity/layout, unique per slide):
- `id`, `format` — identity
- `screenshotDataUrl`, `screenshotCount`, `slots` — screenshot content
- `headline`, `subtitle`, `headlineSpans`, `subtitleSpans` — text content
- `showHeadline`, `showSubtitle` — content visibility (per-slide decision)
- `deviceOffset`, `deviceScale`, `deviceRotate` — per-device positioning (format-dependent defaults)
- `screenshotZoom`, `screenshotOffsetX`, `screenshotOffsetY` — per-screenshot adjustment
- `deviceSlots`, `activePresetId` — layout config
- `overlays` — per-slide overlay icons
- `showGrid`, `showSafeArea` — debug overlays

---

### Task 1: Add STYLE_FIELDS constant and applyStyleToAll to EditorState type

**Files:**
- Modify: `src/types/index.ts` — add `applyStyleToAll` to `EditorState` interface

**Step 1: Add action signature to EditorState**

In `src/types/index.ts`, add to the `EditorState` interface (after `reorderSlides`):

```typescript
applyStyleToAll: (sourceSlideId: string) => void
```

**Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: FAIL — `applyStyleToAll` not implemented in store yet (this is expected)

---

### Task 2: Implement STYLE_FIELDS and applyStyleToAll in store

**Files:**
- Modify: `src/store/useEditorStore.ts` — add constant and action

**Step 1: Add STYLE_FIELDS constant**

After the `defaultSlide` function (after line 51), add:

```typescript
const STYLE_FIELDS: (keyof Slide)[] = [
  'background', 'frame', 'frameTilt',
  'mockupStyle',
  'borderShape', 'borderRadius', 'borderWidth', 'borderColor',
  'shadowMode', 'shadowPercentX', 'shadowPercentY',
  'mockupOpacity',
  'screenshotBrightness', 'screenshotContrast', 'screenshotSaturation',
  'textColor', 'subtitleColor', 'textFontFamily',
  'headlineFontSize', 'subtitleFontSize',
  'headlineFontWeight', 'subtitleFontWeight',
  'headlineItalic', 'subtitleItalic',
  'headlineHighlightColor', 'subtitleHighlightColor',
  'textPosition', 'textOffsetY', 'textOffsetX',
]
```

**Step 2: Add applyStyleToAll action**

In the store, after `reorderSlides` (after line 194), add:

```typescript
applyStyleToAll: (sourceSlideId) =>
  set((s) => {
    const source = s.slides.find((sl) => sl.id === sourceSlideId)
    if (!source || s.slides.length < 2) return s
    const patch: Partial<Slide> = {}
    for (const key of STYLE_FIELDS) {
      const val = source[key]
      if (val !== undefined) (patch as any)[key] = val
    }
    return {
      slides: s.slides.map((sl) =>
        sl.id === sourceSlideId ? sl : { ...sl, ...patch }
      ),
    }
  }),
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: PASS

---

### Task 3: Add "Apply Style to All" button to Sidebar

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx` — add button above SlideStrip

**Step 1: Add import and hook**

In `Sidebar.tsx`:
- Add `Paintbrush` to the lucide-react import (already has `Palette`)
- Destructure `applyStyleToAll` from `useEditorStore` (line 23)

```typescript
const { slides, activeSlideId, updateSlide, applyStyleToAll } = useEditorStore()
```

**Step 2: Add button between tab content and SlideStrip**

Between the `</div>` closing the tab content area (line 133) and `<SlideStrip />` (line 135), add:

```tsx
{slides.length > 1 && (
  <div className="px-3 py-2 border-t border-subtle">
    <button
      onClick={() => applyStyleToAll(activeSlideId)}
      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 active:bg-indigo-500/35 transition-all"
    >
      <Paintbrush className="w-3.5 h-3.5" />
      {t('sidebar.apply_to_all')}
    </button>
  </div>
)}
```

This button only shows when there are 2+ slides (no point applying to a single slide).

**Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: PASS

---

### Task 4: Add i18n strings

**Files:**
- Modify: `src/locales/en/translation.json` — add `sidebar.apply_to_all`
- Modify: `src/locales/es/translation.json` — add `sidebar.apply_to_all`

**Step 1: English string**

Add to `sidebar` section:

```json
"apply_to_all": "Apply Style to All"
```

**Step 2: Spanish string**

Add to `sidebar` section:

```json
"apply_to_all": "Aplicar estilo a todo"
```

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS

---

### Task 5: Final verification

**Step 1: Run full build**

Run: `npm run build`
Expected: PASS — no TypeScript errors

**Step 2: Manual test checklist**

1. Create 2+ slides with different styles
2. Style slide 1 (change background, frame, mockup style, border, shadow, text color)
3. Click "Apply Style to All" button
4. Verify: slides 2+ now have same background/frame/style as slide 1
5. Verify: slides 2+ still have their own screenshots and text content
6. Verify: button hidden when only 1 slide exists
7. Verify: button visible regardless of which tab is active

---

## Code Review Checklist

1. **STYLE_FIELDS coverage** — all visual style fields included, no content/identity fields leaked
2. **Type safety** — `STYLE_FIELDS` typed as `(keyof Slide)[]`, no `any` leaks in runtime
3. **Edge cases** — `slides.length < 2` guard prevents no-op on single slide
4. **UI consistency** — button uses indigo-500/15 pattern matching other controls, `Paintbrush` icon at `w-3.5 h-3.5`
5. **i18n** — string added to both en and es locales under `sidebar` namespace
6. **No performance concern** — runs once on click, O(n) where n = slide count (max ~8)

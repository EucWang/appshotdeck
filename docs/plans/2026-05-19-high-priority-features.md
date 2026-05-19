# High Priority Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 5 high-priority features for AppShotDeck: CSS Filters, More Background Presets, Batch Style Apply, Undo/Redo, and Templates Gallery.

**Architecture:** Each feature is independent and can be implemented sequentially. Features are ordered by difficulty (low→high). Each task touches a bounded set of files with clear interfaces.

**Tech Stack:** React 19, TypeScript, Zustand 5, Tailwind CSS v3, react-i18next, lucide-react

---

## Feature Difficulty Order

| # | Feature | Difficulty | Estimated Changes |
|---|---------|-----------|-------------------|
| 1 | CSS Filters on Screenshot | ★☆☆☆☆ | 4 files, ~100 lines |
| 2 | More Background Presets | ★☆☆☆☆ | 2 files, ~150 lines (mostly data) |
| 3 | Batch Style Apply | ★★☆☆☆ | 4 files, ~120 lines |
| 4 | Undo/Redo | ★★★☆☆ | 3 files, ~200 lines |
| 5 | Templates Gallery | ★★★★☆ | 5-6 files, ~400 lines |

---

## Feature 1: CSS Filters on Screenshot (★☆☆☆☆)

**Goal:** Allow users to adjust brightness, contrast, saturation on uploaded screenshots via CSS `filter` property.

**Files:**
- Modify: `src/types/index.ts` — add filter fields to `Slide` and `ScreenshotSlot`
- Modify: `src/store/useEditorStore.ts` — add defaults
- Modify: `src/components/Canvas/ScreenContent.tsx` — apply CSS filter
- Modify: `src/components/Sidebar/UploadPanel.tsx` — add filter controls
- Modify: `src/locales/en/translation.json` — add i18n strings
- Modify: `src/locales/es/translation.json` — add i18n strings

### Task 1.1: Add filter fields to types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add fields to ScreenshotSlot interface**

In `ScreenshotSlot`, after `screenshotOffsetY`:
```typescript
screenshotBrightness?: number
screenshotContrast?: number
screenshotSaturation?: number
```

**Step 2: Add fields to Slide interface**

In `Slide`, after `screenshotOffsetY`:
```typescript
screenshotBrightness?: number
screenshotContrast?: number
screenshotSaturation?: number
```

### Task 1.2: Add defaults to store

**Files:**
- Modify: `src/store/useEditorStore.ts`

**Step 1: Update `defaultSlide()`**

Add after `screenshotOffsetY: 0,`:
```typescript
screenshotBrightness: 100,
screenshotContrast: 100,
screenshotSaturation: 100,
```

**Step 2: Update `screenshotSlotFromSlide()`**

Add to return object:
```typescript
screenshotBrightness: slide.screenshotBrightness ?? 100,
screenshotContrast: slide.screenshotContrast ?? 100,
screenshotSaturation: slide.screenshotSaturation ?? 100,
```

**Step 3: Update `emptyScreenshotSlot()`**

Add to return object:
```typescript
screenshotBrightness: 100,
screenshotContrast: 100,
screenshotSaturation: 100,
```

### Task 1.3: Apply CSS filter in ScreenContent

**Files:**
- Modify: `src/components/Canvas/ScreenContent.tsx`

**Step 1: Read filter values with fallbacks**

In the `ScreenContent` component, after the existing zoom/pan computations, extract filter values from the slot data. The component already receives `zoom` and `offset` props — add brightness/contrast/saturation as new props, or read them from the slide via store.

Best approach: Pass as props from `SlideCanvas.tsx`. Add these props to the component:
```typescript
brightness?: number
contrast?: number
saturation?: number
```

**Step 2: Apply CSS filter to the `<img>` style**

In the `<img>` element's style object, add:
```typescript
filter: [
  brightness !== 100 ? `brightness(${brightness}%)` : '',
  contrast !== 100 ? `contrast(${contrast}%)` : '',
  saturation !== 100 ? `saturate(${saturation}%)` : '',
].filter(Boolean).join(' ') || undefined,
```

**Step 3: Update SlideCanvas to pass filter props**

In `SlideCanvas.tsx`, when rendering `<ScreenContent>`, pass:
```typescript
brightness={slot.screenshotBrightness ?? 100}
contrast={slot.screenshotContrast ?? 100}
saturation={slot.screenshotSaturation ?? 100}
```

This applies to both single and dual screenshot rendering paths.

### Task 1.4: Add filter controls to UploadPanel

**Files:**
- Modify: `src/components/Sidebar/UploadPanel.tsx`

**Step 1: Add filter section after zoom/pan controls**

In the `SingleUpload` sub-component, after the existing zoom/pan sliders, add a "Filters" section with 3 sliders:

```tsx
<div className="space-y-2 pt-2 border-t border-medium">
  <p className="text-xs text-muted uppercase tracking-wider">{t('upload.filters')}</p>

  <div className="flex items-center gap-3">
    <span className="text-xs text-muted w-16">{t('upload.brightness')}</span>
    <input type="range" min={0} max={200} step={1}
      value={slide.screenshotBrightness ?? 100}
      onChange={(e) => patch({ screenshotBrightness: Number(e.target.value) })}
      className="flex-1" />
    <span className="text-xs text-dim font-mono w-10 text-right">{slide.screenshotBrightness ?? 100}%</span>
  </div>

  <div className="flex items-center gap-3">
    <span className="text-xs text-muted w-16">{t('upload.contrast')}</span>
    <input type="range" min={0} max={200} step={1}
      value={slide.screenshotContrast ?? 100}
      onChange={(e) => patch({ screenshotContrast: Number(e.target.value) })}
      className="flex-1" />
    <span className="text-xs text-dim font-mono w-10 text-right">{slide.screenshotContrast ?? 100}%</span>
  </div>

  <div className="flex items-center gap-3">
    <span className="text-xs text-muted w-16">{t('upload.saturation')}</span>
    <input type="range" min={0} max={200} step={1}
      value={slide.screenshotSaturation ?? 100}
      onChange={(e) => patch({ screenshotSaturation: Number(e.target.value) })}
      className="flex-1" />
    <span className="text-xs text-dim font-mono w-10 text-right">{slide.screenshotSaturation ?? 100}%</span>
  </div>
</div>
```

**Step 2: Add "Reset" button for filters**

Add a small reset button that sets all 3 values back to 100:
```tsx
<button
  onClick={() => patch({ screenshotBrightness: 100, screenshotContrast: 100, screenshotSaturation: 100 })}
  className="text-xs text-indigo-400 hover:text-indigo-300"
>
  {t('upload.reset_filters')}
</button>
```

**Step 3: Repeat for dual mode (SlotUpload)**

Same controls but using `slots[slotIdx].screenshotBrightness` and updating via `updateSlide`.

### Task 1.5: Add i18n strings

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/es/translation.json`

**Step 1: Add to English locale**

Under `"upload"` section:
```json
"filters": "Filters",
"brightness": "Brightness",
"contrast": "Contrast",
"saturation": "Saturation",
"reset_filters": "Reset"
```

**Step 2: Add to Spanish locale**
```json
"filters": "Filtros",
"brightness": "Brillo",
"contrast": "Contraste",
"saturation": "Saturación",
"reset_filters": "Restablecer"
```

### Task 1.6: Verify

**Step 1:** Run `npm run build` — must pass with no TypeScript errors.
**Step 2:** Run `npm run lint` — must pass.
**Step 3:** Manual test — upload a screenshot, adjust sliders, verify filter applies in canvas preview and export.

---

## Feature 2: More Background Presets (★☆☆☆☆)

**Goal:** Expand from 12 presets to 50+ presets organized by category (Cosmic, Mystic, Vibrant, Pastel, Dark, Light, Earth, etc.).

**Files:**
- Modify: `src/data/backgrounds.ts` — add categorized presets
- Modify: `src/components/Sidebar/BackgroundPanel.tsx` — add category tabs
- Modify: `src/locales/en/translation.json` — add category names
- Modify: `src/locales/es/translation.json` — add category names

### Task 2.1: Restructure background data with categories

**Files:**
- Modify: `src/data/backgrounds.ts`

**Step 1: Define categorized preset structure**

Replace the current flat arrays with categorized groups:

```typescript
export interface BackgroundCategory {
  id: string
  label: string
  presets: BackgroundPreset[]
}
```

**Step 2: Create category arrays**

Organize into these categories with ~8 presets each:

```
Dark (8):     Deep blacks, navy, charcoal
Midnight (8):  Deep blue/purple night tones
Cosmic (8):    Space-like purples and blues
Vibrant (8):   Bold oranges, reds, magentas, greens
Pastel (8):    Soft pinks, blues, lavenders, mints
Warm (8):      Orange, amber, brown, earth tones
Cool (8):      Teal, cyan, blue, ice
Light (6):     White, cream, light gray, soft tones
```

Total: ~62 presets (up from 12).

Each preset follows the existing pattern:
```typescript
{ label: 'Nebula Blue', bg: { type: 'gradient', from: '#0F172A', to: '#1E3A5F', angle: 135 } }
```

Keep the existing 12 presets, just reorganized into appropriate categories.

**Step 3: Export helpers**

```typescript
export const ALL_CATEGORIES: BackgroundCategory[] = [
  { id: 'dark', label: 'background.cat_dark', presets: DARK_PRESETS },
  { id: 'midnight', label: 'background.cat_midnight', presets: MIDNIGHT_PRESETS },
  // ...
]

export const GRADIENT_PRESETS = ALL_CATEGORIES.flatMap(c => c.presets.filter(p => p.bg.type === 'gradient'))
export const SOLID_PRESETS = ALL_CATEGORIES.flatMap(c => c.presets.filter(p => p.bg.type === 'solid'))
export const ALL_PRESETS = ALL_CATEGORIES.flatMap(c => c.presets)
```

### Task 2.2: Update BackgroundPanel with category tabs

**Files:**
- Modify: `src/components/Sidebar/BackgroundPanel.tsx`

**Step 1: Add category selection UI**

At the top of the preset section, add a horizontal scrollable row of category buttons:

```tsx
const [activeCat, setActiveCat] = useState<string>('dark')

<div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
  {ALL_CATEGORIES.map(cat => (
    <button
      key={cat.id}
      onClick={() => setActiveCat(cat.id)}
      className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
        activeCat === cat.id
          ? 'bg-indigo-500/30 text-indigo-300 dark:text-indigo-400 font-medium'
          : 'option-idle'
      }`}
    >
      {t(cat.label)}
    </button>
  ))}
</div>
```

**Step 2: Render filtered presets**

Replace the current gradient/solid sections with category-filtered view:

```tsx
const activePresets = ALL_CATEGORIES.find(c => c.id === activeCat)?.presets ?? []

<div className="grid grid-cols-3 gap-2">
  {activePresets.map((preset, i) => (
    // ... same button pattern as current
  ))}
</div>
```

### Task 2.3: Add i18n strings for categories

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/es/translation.json`

English:
```json
"cat_dark": "Dark",
"cat_midnight": "Midnight",
"cat_cosmic": "Cosmic",
"cat_vibrant": "Vibrant",
"cat_pastel": "Pastel",
"cat_warm": "Warm",
"cat_cool": "Cool",
"cat_light": "Light"
```

Spanish:
```json
"cat_dark": "Oscuro",
"cat_midnight": "Medianoche",
"cat_cosmic": "Cósmico",
"cat_vibrant": "Vibrante",
"cat_pastel": "Pastel",
"cat_warm": "Cálido",
"cat_cool": "Frío",
"cat_light": "Claro"
```

### Task 2.4: Verify

**Step 1:** `npm run build` — must pass.
**Step 2:** `npm run lint` — must pass.
**Step 3:** Manual test — verify all categories render, clicking presets applies background.

---

## Feature 3: Batch Style Apply (★★☆☆☆)

**Goal:** One-click apply current slide's visual style (background, text, mockup, border, shadow, etc.) to all other slides.

**Files:**
- Modify: `src/store/useEditorStore.ts` — add `applyStyleToAll` action
- Modify: `src/components/Sidebar/Sidebar.tsx` — add "Apply to All" button in toolbar
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/es/translation.json`

### Task 3.1: Define "style" fields

The fields to copy vs. NOT copy:

**Copy (style):**
- `background` — background gradient/solid/image
- `mockupStyle`, `borderShape`, `borderRadius`, `borderWidth`, `borderColor`
- `shadowMode`, `shadowPercentX`, `shadowPercentY`, `mockupOpacity`
- `textColor`, `subtitleColor`, `textFontFamily`, `textPosition`
- `headlineFontSize`, `subtitleFontSize`, `headlineFontWeight`, `subtitleFontWeight`
- `headlineItalic`, `subtitleItalic`
- `headlineHighlightColor`, `subtitleHighlightColor`
- `textOffsetY`, `textOffsetX`
- `frame`, `frameTilt`

**Do NOT copy (content/identity):**
- `id`, `format`, `screenshotDataUrl`, `screenshotZoom`, `screenshotOffsetX/Y`
- `headline`, `subtitle`, `headlineSpans`, `subtitleSpans`
- `showHeadline`, `showSubtitle`
- `screenshotCount`, `slots`, `deviceSlots`, `activePresetId`
- `overlays`

### Task 3.2: Add store action

**Files:**
- Modify: `src/store/useEditorStore.ts`

**Step 1: Define style fields array**

```typescript
const STYLE_FIELDS: (keyof Slide)[] = [
  'background', 'frame', 'frameTilt',
  'mockupStyle', 'borderShape', 'borderRadius', 'borderWidth', 'borderColor',
  'shadowMode', 'shadowPercentX', 'shadowPercentY', 'mockupOpacity',
  'textColor', 'subtitleColor', 'textFontFamily', 'textPosition',
  'headlineFontSize', 'subtitleFontSize',
  'headlineFontWeight', 'subtitleFontWeight',
  'headlineItalic', 'subtitleItalic',
  'headlineHighlightColor', 'subtitleHighlightColor',
  'textOffsetY', 'textOffsetX',
]
```

**Step 2: Add `applyStyleToAll` to EditorState interface**

In `src/types/index.ts`, add to `EditorState`:
```typescript
applyStyleToAll: (sourceSlideId: string) => void
```

**Step 3: Implement in store**

```typescript
applyStyleToAll: (sourceSlideId: string) => {
  set((state) => {
    const source = state.slides.find(s => s.id === sourceSlideId)
    if (!source) return state
    const stylePatch: Partial<Slide> = {}
    for (const key of STYLE_FIELDS) {
      if (source[key] !== undefined) {
        stylePatch[key] = source[key] as any
      }
    }
    return {
      slides: state.slides.map(sl =>
        sl.id === sourceSlideId ? sl : { ...sl, ...stylePatch }
      ),
    }
  })
},
```

### Task 3.3: Add UI button

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx`

**Step 1: Import the new action and icon**

```typescript
import { Paintbrush } from 'lucide-react'
```

**Step 2: Add button in the sidebar toolbar area**

Below the tab buttons, add a floating "Apply to All" action:

```tsx
const applyStyleToAll = useEditorStore(s => s.applyStyleToAll)

<div className="p-3 border-t border-medium">
  <button
    onClick={() => applyStyleToAll(activeSlideId)}
    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all"
  >
    <Paintbrush className="w-3.5 h-3.5" />
    {t('sidebar.apply_to_all')}
  </button>
</div>
```

Place this at the bottom of the sidebar, after the tab content, but still inside the sidebar container. It should always be visible regardless of which tab is active.

### Task 3.4: Add i18n strings

English: `"apply_to_all": "Apply Style to All Slides"`
Spanish: `"apply_to_all": "Aplicar estilo a todas las diapositivas"`

### Task 3.5: Verify

**Step 1:** `npm run build`
**Step 2:** `npm run lint`
**Step 3:** Manual test — customize slide 1 style, click "Apply to All", verify all other slides get the same style but keep their own screenshots and text.

---

## Feature 4: Undo/Redo (★★★☆☆)

**Goal:** Global undo/redo for all editor actions, with keyboard shortcut support (Ctrl+Z / Ctrl+Shift+Z).

**Architecture:** Custom Zustand middleware that stores a limited history stack of slide array snapshots. Uses debounced snapshots to avoid excessive memory use. History is memory-only (not persisted).

**Files:**
- Create: `src/store/undoMiddleware.ts` — custom middleware
- Modify: `src/store/useEditorStore.ts` — apply middleware
- Modify: `src/App.tsx` — add keyboard shortcut listener
- Modify: `src/types/index.ts` — add undo/redo to EditorState

### Task 4.1: Create undo middleware

**Files:**
- Create: `src/store/undoMiddleware.ts`

**Step 1: Implement middleware**

```typescript
import type { StateCreator, StoreMutatorIdentifier } from 'zustand'

type UndoState = {
  _past: Array<{ slides: any[] }>
  _future: Array<{ slides: any[] }>
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
}

type UndoMiddleware = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  config: StateCreator<T, Mps, Mcs>,
  options?: { maxHistory?: number; debounceMs?: number },
) => StateCreator<T & UndoState, Mps, Mcs>

const SLIDE_KEYS = new Set(['slides'])

const undoMiddleware: UndoMiddleware = (
  config,
  options = {},
) => {
  const { maxHistory = 50, debounceMs = 300 } = options
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastSnapshot: string = ''

  return (set, get, store) => {
    const patchedSet: typeof set = (args) => {
      const stateBefore = get()
      set(args)
      const stateAfter = get()

      if (stateAfter._past === stateBefore._past) return

      if (SLIDE_KEYS.some(key => {
        const before = JSON.stringify((stateBefore as any)[key])
        const after = JSON.stringify((stateAfter as any)[key])
        return before !== after
      })) {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          const current = get() as any
          const snapshot = JSON.stringify(current.slides)
          if (snapshot !== lastSnapshot) {
            lastSnapshot = snapshot
            const newPast = [...(current._past || []), { slides: JSON.parse(JSON.stringify(stateBefore.slides)) }]
            if (newPast.length > maxHistory) newPast.shift()
            set({
              _past: newPast,
              _future: [],
            } as any)
          }
          timer = null
        }, debounceMs)
      }
    }

    store.setState = patchedSet as any

    return {
      ...config(patchedSet, get, store),
      _past: [],
      _future: [],
      undo: () => {
        const state = get() as any
        if (!state._past?.length) return
        const prev = state._past[state._past.length - 1]
        const newPast = state._past.slice(0, -1)
        lastSnapshot = JSON.stringify(state.slides)
        set({
          slides: prev.slides,
          _past: newPast,
          _future: [...state._future, { slides: JSON.parse(JSON.stringify(state.slides)) }],
        } as any)
      },
      redo: () => {
        const state = get() as any
        if (!state._future?.length) return
        const next = state._future[state._future.length - 1]
        const newFuture = state._future.slice(0, -1)
        lastSnapshot = JSON.stringify(state.slides)
        set({
          slides: next.slides,
          _past: [...state._past, { slides: JSON.parse(JSON.stringify(state.slides)) }],
          _future: newFuture,
        } as any)
      },
      canUndo: () => (get() as any)._past?.length > 0,
      canRedo: () => (get() as any)._future?.length > 0,
      clearHistory: () => {
        set({ _past: [], _future: [] } as any)
        lastSnapshot = ''
      },
    }
  }
}

export { undoMiddleware }
export type { UndoState }
```

**Important implementation note:** The above is a conceptual sketch. The actual implementation needs to handle Zustand's `set` function carefully. A simpler, more robust approach:

```typescript
// Simpler approach: wrap the store creation
import { createStore } from 'zustand'

const MAX_HISTORY = 50
const DEBOUNCE_MS = 300

interface HistoryEntry {
  slides: Slide[]
  activeSlideId: string
}

export function createUndoableStore<T extends object>(
  baseConfig: StateCreator<T>,
) {
  // ... wraps base config to capture snapshots on each set() call
  // Exposes undo(), redo(), canUndo(), canRedo()
}
```

**Alternative simpler approach (recommended):** Instead of middleware, use a wrapper around the store that intercepts mutations. See Task 4.2 for the recommended pattern.

### Task 4.2: Apply undo to store (recommended simpler approach)

**Files:**
- Modify: `src/store/useEditorStore.ts`

**Recommended approach:** Use Zustand's `subscribeWithSelector` middleware combined with a manual history stack. This avoids complex middleware typing issues.

**Step 1: Add history state and actions to EditorState**

```typescript
// In types/index.ts, add to EditorState:
undo: () => void
redo: () => void
canUndo: boolean
canRedo: boolean
```

**Step 2: Implement history in the store**

```typescript
import { subscribeWithSelector } from 'zustand/middleware'

// History stack (module-level, not in state to avoid persistence)
let _past: Array<{ slides: Slide[]; activeSlideId: string }> = []
let _future: Array<{ slides: Slide[]; activeSlideId: string }> = []
let _snapshotTimer: ReturnType<typeof setTimeout> | null = null
let _lastSnapshot = ''

const MAX_HISTORY = 50

function snapshotSlides(slides: Slide[]): string {
  // Only snapshot non-image fields to reduce memory
  return JSON.stringify(slides.map(s => ({
    ...s,
    screenshotDataUrl: s.screenshotDataUrl ? `[img:${s.screenshotDataUrl.length}]` : null,
    slots: s.slots?.map(slot => ({
      ...slot,
      screenshotDataUrl: slot.screenshotDataUrl ? `[img:${slot.screenshotDataUrl.length}]` : null,
    })),
    background: s.background.type === 'image' ? { ...s.background, dataUrl: `[img:${s.background.dataUrl.length}]` } : s.background,
    overlays: s.overlays?.map(o => ({
      ...o,
      dataUrl: o.dataUrl ? `[img:${o.dataUrl.length}]` : null,
    })),
  })))
}

// In the store creation:
export const useEditorStore = create<EditorState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ... all existing fields ...

        undo: () => {
          if (!_past.length) return
          const entry = _past[_past.length - 1]
          _past = _past.slice(0, -1)
          const current = { slides: get().slides, activeSlideId: get().activeSlideId }
          _future = [..._future, current]
          _lastSnapshot = snapshotSlides(entry.slides)
          set({ slides: entry.slides, activeSlideId: entry.activeSlideId })
        },

        redo: () => {
          if (!_future.length) return
          const entry = _future[_future.length - 1]
          _future = _future.slice(0, -1)
          const current = { slides: get().slides, activeSlideId: get().activeSlideId }
          _past = [..._past, current]
          _lastSnapshot = snapshotSlides(entry.slides)
          set({ slides: entry.slides, activeSlideId: entry.activeSlideId })
        },

        canUndo: false,
        canRedo: false,
      }),
      {
        name: 'appshotdeck-editor',
        partialize: (state) => ({
          slides: state.slides,
          activeSlideId: state.activeSlideId,
        }),
      }
    )
  )
)

// Subscribe to slide changes for history tracking (outside store)
useEditorStore.subscribe(
  (state) => ({ slides: state.slides, activeSlideId: state.activeSlideId }),
  (current, prev) => {
    const snapshot = snapshotSlides(current.slides)
    if (snapshot === _lastSnapshot) return

    if (_snapshotTimer) clearTimeout(_snapshotTimer)
    _snapshotTimer = setTimeout(() => {
      const snap = snapshotSlides(current.slides)
      if (snap === _lastSnapshot) return
      _lastSnapshot = snap
      _past = [..._past, { slides: prev.slides, activeSlideId: prev.activeSlideId }]
      if (_past.length > MAX_HISTORY) _past = _past.slice(-MAX_HISTORY)
      _future = []
      useEditorStore.setState({ canUndo: true, canRedo: false })
    }, 300)
  },
  { equalityFn: (a, b) => a === b }
)
```

**Note on memory optimization:** `snapshotSlides` strips base64 images before comparison but stores FULL slides in history (including images). This is correct because undo must restore the full state. For 50 entries with ~900KB images, that's ~45MB max — acceptable for modern browsers.

### Task 4.3: Add keyboard shortcuts

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add useEffect for keyboard listener**

```tsx
import { useEffect } from 'react'
import { useEditorStore } from './store/useEditorStore'

// Inside App component:
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      useEditorStore.getState().undo()
    }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      useEditorStore.getState().redo()
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [])
```

### Task 4.4: Add undo/redo buttons to header

**Files:**
- Modify: `src/components/Header.tsx`

**Step 1: Add Undo/Redo buttons**

Import `Undo2`, `Redo2` from lucide-react. Add buttons next to the existing Save button:

```tsx
const { undo, redo, canUndo, canRedo } = useEditorStore()

<div className="flex items-center gap-1">
  <button
    onClick={undo}
    disabled={!canUndo}
    className="p-2 btn-ghost disabled:opacity-30"
    title={`${t('header.undo')} (⌘Z)`}
  >
    <Undo2 className="w-4 h-4" />
  </button>
  <button
    onClick={redo}
    disabled={!canRedo}
    className="p-2 btn-ghost disabled:opacity-30"
    title={`${t('header.redo')} (⌘⇧Z)`}
  >
    <Redo2 className="w-4 h-4" />
  </button>
</div>
```

### Task 4.5: Add i18n strings

English: `"undo": "Undo"`, `"redo": "Redo"`
Spanish: `"undo": "Deshacer"`, `"redo": "Rehacer"`

### Task 4.6: Verify

**Step 1:** `npm run build`
**Step 2:** `npm run lint`
**Step 3:** Manual test — change background, press Ctrl+Z, verify background reverts. Press Ctrl+Shift+Z, verify it redoes. Test with multiple changes. Verify buttons enable/disable correctly.

---

## Feature 5: Templates Gallery (★★★★☆)

**Goal:** Pre-made template compositions that users can browse and apply in one click. A template includes background, text style, mockup style, border, shadow, and layout preset — everything except the user's actual screenshot content.

**Files:**
- Create: `src/data/templates.ts` — template data definitions
- Modify: `src/types/index.ts` — add TemplateDef type
- Create: `src/components/Sidebar/TemplatePanel.tsx` — template browser UI
- Modify: `src/components/Sidebar/Sidebar.tsx` — add Templates tab
- Modify: `src/locales/en/translation.json` — add i18n strings
- Modify: `src/locales/es/translation.json` — add i18n strings

### Task 5.1: Define template type

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add TemplateDef type**

```typescript
export interface TemplateDef {
  id: string
  name: string
  category: string
  screenshotCount: 1 | 2
  thumbnail: {
    bg: Background
    textColor: string
    subtitleColor: string
  }
  apply: Partial<Slide>
}
```

The `apply` field contains all Slide fields to apply when the template is selected. This reuses the same field-by-field approach as batch style apply.

### Task 5.2: Create template data

**Files:**
- Create: `src/data/templates.ts`

**Step 1: Define 12-16 initial templates across categories**

Categories: `minimal`, `bold`, `elegant`, `vibrant`, `dark`, `light`

Each template specifies:
- `background` — the preset background
- `frame`, `mockupStyle`, `borderShape`, `borderRadius`, `borderWidth`, `borderColor`
- `shadowMode`, `shadowPercentX`, `shadowPercentY`, `mockupOpacity`
- `textColor`, `subtitleColor`, `textFontFamily`, `textPosition`
- `headlineFontSize`, `subtitleFontSize`
- `headlineFontWeight`, `subtitleFontWeight`
- `headlineItalic`, `subtitleItalic`
- `headlineHighlightColor`, `subtitleHighlightColor`
- `textOffsetY`, `textOffsetX`
- `activePresetId` — which layout preset to use
- `screenshotCount` — 1 or 2
- `deviceSlots` — device positions from the layout preset

Example template:
```typescript
{
  id: 'dark-minimal',
  name: 'Dark Minimal',
  category: 'minimal',
  screenshotCount: 1,
  thumbnail: {
    bg: { type: 'gradient', from: '#0F172A', to: '#1E3A5F', angle: 135 },
    textColor: '#ffffff',
    subtitleColor: '#94a3b8',
  },
  apply: {
    background: { type: 'gradient', from: '#0F172A', to: '#1E3A5F', angle: 135 },
    frame: 'android-flat',
    mockupStyle: 'default',
    borderShape: 'curved',
    borderRadius: 20,
    borderWidth: 0,
    shadowMode: 'spread',
    shadowPercentX: 0,
    shadowPercentY: -20,
    mockupOpacity: 100,
    textColor: '#ffffff',
    subtitleColor: '#94a3b8',
    textFontFamily: 'default',
    textPosition: 'top',
    headlineFontSize: 64,
    subtitleFontSize: 36,
    headlineFontWeight: 700,
    subtitleFontWeight: 400,
    headlineItalic: false,
    subtitleItalic: false,
    textOffsetY: 0,
    textOffsetX: 0,
    screenshotCount: 1,
    activePresetId: 'single-center',
    deviceSlots: [{ deviceOffset: 30, deviceScale: 100, deviceRotate: 0 }],
  },
}
```

Create ~16 templates total. Export:
```typescript
export const TEMPLATE_CATEGORIES = ['minimal', 'bold', 'elegant', 'vibrant', 'dark', 'light']
export const templates: TemplateDef[] = [...]
export const templatesByCategory = (cat: string) => templates.filter(t => t.category === cat)
```

### Task 5.3: Create TemplatePanel component

**Files:**
- Create: `src/components/Sidebar/TemplatePanel.tsx`

**Step 1: Template grid with category filter**

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../store/useEditorStore'
import { templates, TEMPLATE_CATEGORIES, templatesByCategory } from '../../data/templates'

export function TemplatePanel() {
  const { t } = useTranslation()
  const { slides, activeSlideId, updateSlide } = useEditorStore()
  const [activeCat, setActiveCat] = useState<string>('all')
  const slide = slides.find(s => s.id === activeSlideId)

  if (!slide) return null

  const filtered = activeCat === 'all' ? templates : templatesByCategory(activeCat)

  const applyTemplate = (tmpl: TemplateDef) => {
    updateSlide(activeSlideId, { ...tmpl.apply })
  }

  return (
    <div className="p-4 space-y-4">
      {/* Category filter */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCat('all')}
          className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
            activeCat === 'all'
              ? 'bg-indigo-500/30 text-indigo-400 font-medium'
              : 'option-idle'
          }`}
        >
          {t('templates.all')}
        </button>
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
              activeCat === cat
                ? 'bg-indigo-500/30 text-indigo-400 font-medium'
                : 'option-idle'
            }`}
          >
            {t(`templates.cat_${cat}`)}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 gap-2">
        {filtered.map(tmpl => (
          <button
            key={tmpl.id}
            onClick={() => applyTemplate(tmpl)}
            className="group rounded-lg border-2 border-medium hover:border-indigo-400 transition-all overflow-hidden"
          >
            {/* Thumbnail preview */}
            <div
              className="aspect-[9/16] relative flex flex-col items-center justify-center p-2"
              style={{
                background: tmpl.thumbnail.bg.type === 'gradient'
                  ? `linear-gradient(${tmpl.thumbnail.bg.angle}deg, ${tmpl.thumbnail.bg.from}, ${tmpl.thumbnail.bg.to})`
                  : tmpl.thumbnail.bg.type === 'solid'
                    ? tmpl.thumbnail.bg.color
                    : '#333',
              }}
            >
              {/* Text preview */}
              <div className="text-center mb-1" style={{ color: tmpl.thumbnail.textColor }}>
                <div className="font-bold text-[6px] leading-tight">Title</div>
                <div className="text-[4px] mt-0.5" style={{ color: tmpl.thumbnail.subtitleColor }}>Subtitle</div>
              </div>
              {/* Device preview */}
              <div
                className="w-[40%] aspect-[9/16] rounded-sm"
                style={{
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                }}
              />
            </div>
            <div className="px-2 py-1.5 text-[10px] text-dim truncate">
              {t(`templates.${tmpl.id}`)}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

### Task 5.4: Add Templates tab to Sidebar

**Files:**
- Modify: `src/components/Sidebar/Sidebar.tsx`

**Step 1: Add tab**

Update the `Tab` type and `TABS` array:
```typescript
import { LayoutTemplate } from 'lucide-react'
import { TemplatePanel } from './TemplatePanel'

type Tab = 'templates' | 'upload' | 'frame' | 'style' | 'background' | 'text' | 'overlay'

const TABS = [
  { id: 'templates' as Tab, label: t('sidebar.tabs.templates'), icon: <LayoutTemplate size={14} /> },
  // ... rest of existing tabs
]
```

Add rendering:
```tsx
{tab === 'templates' && <TemplatePanel />}
```

Templates tab should be the FIRST tab so users discover it immediately.

### Task 5.5: Add i18n strings

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/es/translation.json`

English:
```json
"templates": {
  "all": "All",
  "cat_minimal": "Minimal",
  "cat_bold": "Bold",
  "cat_elegant": "Elegant",
  "cat_vibrant": "Vibrant",
  "cat_dark": "Dark",
  "cat_light": "Light",
  "dark_minimal": "Dark Minimal",
  "...": "(repeat for each template name)"
}
```

### Task 5.6: Verify

**Step 1:** `npm run build`
**Step 2:** `npm run lint`
**Step 3:** Manual test — click Templates tab, browse categories, click a template, verify the active slide's style changes but screenshot content is preserved.

---

## Execution Notes

1. Each feature is independent — they can be implemented and tested separately
2. Run `npm run build` after each feature to verify TypeScript compilation
3. Run `npm run lint` before considering any feature complete
4. All new Slide fields MUST use `?? defaultValue` fallbacks when read
5. All user-facing strings MUST be added to both `en` and `es` locale files
6. Follow existing UI patterns: `text-xs text-muted`, `border-medium`, `option-idle`, `btn-ghost`, etc.

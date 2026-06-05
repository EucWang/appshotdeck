# Triple Screenshot Support — Implementation Plan (v2)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the screenshot system from max 2 to max 3 per slide, with 4 trio layout presets, full tablet support, and WebGL context loss detection.

**Architecture:** Generalize the existing `isDual` boolean pattern into a numeric `count` pattern. Extend `screenshotCount` type from `1 | 2` to `1 | 2 | 3`. Add 4 trio layout presets. All slot/device arrays remain dynamic — just allow length 3. Replace every `isDual` / `count === 2` check with `count > 1` (multi) where appropriate.

**Tech Stack:** React 19, TypeScript, Zustand, Three.js/r3f, Tailwind, i18next

**Verification commands:**
- `npm run build` — TypeScript compilation + Vite build
- `npm run lint` — ESLint

**Key invariants:**
- `toggleScreenshotCount` is idempotent: calling it with the same target count returns `{}`. Calling it with a different count always produces a valid state from any source count. This protects against stale-closure rapid-click scenarios.
- `slots[]` and `deviceSlots[]` length always equals `screenshotCount` when count > 1. When count === 1, these arrays may be absent (legacy single-field path).
- All fallback arrays must pad to the expected count before accessing by index.

---

### Task 1: Extend type definitions

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/data/templates.ts`

**Step 1: Update `Slide.screenshotCount` type** (line 117)

```typescript
// Before
screenshotCount?: 1 | 2
// After
screenshotCount?: 1 | 2 | 3
```

**Step 2: Update `LayoutPresetDef.screenshotCount` type** (line 68)

```typescript
// Before
screenshotCount: 1 | 2
// After
screenshotCount: 1 | 2 | 3
```

**Step 3: Update `TemplateDef.patch.screenshotCount` type** (`src/data/templates.ts:34`)

```typescript
// Before
screenshotCount: 1 | 2
// After
screenshotCount: 1 | 2 | 3
```

Note: No trio templates are being added in this plan (the existing 20 single + 4 dual templates remain). This type update ensures future trio templates can be added without additional type changes.

**Step 4: Verify**

Run: `npm run build`

---

### Task 2: Add 4 trio layout presets

**Files:**
- Modify: `src/data/layoutPresets.ts`

**Step 1: Add trio presets to the `layoutPresets` array**

Append 4 new entries after the `duo-tilt` preset:

```typescript
{
  id: 'trio-row',
  screenshotCount: 3,
  devices: [
    { deviceOffset: 20, deviceOffsetX: -18, deviceScale: 48, deviceRotate: -5 },
    { deviceOffset: 22, deviceOffsetX: 0, deviceScale: 48, deviceRotate: 0 },
    { deviceOffset: 24, deviceOffsetX: 18, deviceScale: 48, deviceRotate: 5 },
  ],
},
{
  id: 'trio-stack',
  screenshotCount: 3,
  devices: [
    { deviceOffset: -12, deviceOffsetX: 0, deviceScale: 38, deviceRotate: 0 },
    { deviceOffset: 6, deviceOffsetX: 0, deviceScale: 38, deviceRotate: 0 },
    { deviceOffset: 24, deviceOffsetX: 0, deviceScale: 38, deviceRotate: 0 },
  ],
},
{
  id: 'trio-fan',
  screenshotCount: 3,
  devices: [
    { deviceOffset: 18, deviceOffsetX: -14, deviceScale: 50, deviceRotate: -12 },
    { deviceOffset: 24, deviceOffsetX: 0, deviceScale: 55, deviceRotate: 0 },
    { deviceOffset: 18, deviceOffsetX: 14, deviceScale: 50, deviceRotate: 12 },
  ],
},
{
  id: 'trio-pyramid',
  screenshotCount: 3,
  devices: [
    { deviceOffset: 8, deviceOffsetX: 0, deviceScale: 42, deviceRotate: 0 },
    { deviceOffset: 28, deviceOffsetX: -12, deviceScale: 44, deviceRotate: -6 },
    { deviceOffset: 28, deviceOffsetX: 12, deviceScale: 44, deviceRotate: 6 },
  ],
},
```

**Step 2: Update `presetsForCount` function signature**

```typescript
// Before
export const presetsForCount = (count: 1 | 2): LayoutPresetDef[] =>
  layoutPresets.filter((p) => p.screenshotCount === count)

// After
export const presetsForCount = (count: 1 | 2 | 3): LayoutPresetDef[] =>
  layoutPresets.filter((p) => p.screenshotCount === count)
```

**Step 3: Add `defaultTrioPresetId` export**

```typescript
export const defaultTrioPresetId = 'trio-row'
```

**Step 4: Verify**

Run: `npm run build`

---

### Task 3: Update store — add `switchToTriple`, refactor `toggleScreenshotCount`

**Files:**
- Modify: `src/store/useEditorStore.ts`

**Step 1: Import `defaultTrioPresetId`**

```typescript
import { defaultDualPresetId, defaultTrioPresetId, presetById } from '../data/layoutPresets'
```

**Step 2: Add `switchToTriple()` function**

Insert after `switchToDual()` (after line 111):

```typescript
function switchToTriple(slide: Slide): Partial<Slide> {
  const preset = presetById(defaultTrioPresetId)!
  const existingSlots = slide.slots && slide.slots.length >= 2
    ? slide.slots
    : slide.slots && slide.slots.length === 1
      ? [slide.slots[0], emptyScreenshotSlot()]
      : [screenshotSlotFromSlide(slide), emptyScreenshotSlot()]
  return {
    screenshotCount: 3,
    slots: [...existingSlots, emptyScreenshotSlot()],
    deviceSlots: [preset.devices[0], preset.devices[1], preset.devices[2]],
    activePresetId: defaultTrioPresetId,
  }
}
```

Data flow for each source:
- 1→3: `slide.slots` is undefined → `[screenshotSlotFromSlide(slide), empty]` → append empty → 3 slots ✓
- 2→3: `slide.slots` has length 2 → keep them → append empty → 3 slots ✓
- Edge (slots length 1): pad to 2, then append → 3 slots ✓

**Step 3: Refactor `toggleScreenshotCount` to handle 3 states**

Replace the entire `toggleScreenshotCount` function:

```typescript
export function toggleScreenshotCount(slide: Slide, count: 1 | 2 | 3): Partial<Slide> {
  const current = slide.screenshotCount ?? 1
  if (count === current) return {}
  if (count === 1) return switchToSingle(slide)
  if (count === 2 && current === 1) return switchToDual(slide)
  if (count === 2 && current === 3) {
    const slots = slide.slots ?? []
    const devSlots = slide.deviceSlots ?? []
    const preset = presetById(defaultDualPresetId)!
    return {
      screenshotCount: 2,
      slots: [slots[0] ?? screenshotSlotFromSlide(slide), slots[1] ?? emptyScreenshotSlot()],
      deviceSlots: [devSlots[0] ?? preset.devices[0], devSlots[1] ?? preset.devices[1]],
      activePresetId: defaultDualPresetId,
    }
  }
  // count === 3 (from 1 or 2)
  return switchToTriple(slide)
}
```

**Step 4: Update `applyStyleToAll` — guard `slots` length consistency**

In the `applyStyleToAll` action (around line 260), after the existing `else if (patch.deviceSlots)` block, add a guard to ensure target `slots` length matches `sourceCount`:

Replace the existing block (lines 266-272):

```typescript
// Before
if (targetCount !== sourceCount) {
  delete (patch as Record<string, unknown>).screenshotCount
  delete (patch as Record<string, unknown>).deviceSlots
  delete (patch as Record<string, unknown>).activePresetId
} else if (patch.deviceSlots) {
  patch.deviceSlots = source.deviceSlots?.map((ds) => ({ ...ds }))
}

// After
if (targetCount !== sourceCount) {
  delete (patch as Record<string, unknown>).screenshotCount
  delete (patch as Record<string, unknown>).deviceSlots
  delete (patch as Record<string, unknown>).activePresetId
} else {
  if (patch.deviceSlots) {
    patch.deviceSlots = source.deviceSlots?.map((ds) => ({ ...ds }))
  }
  if (source.slots && sl.slots && sl.slots.length < sourceCount) {
    const padded = [...sl.slots]
    while (padded.length < sourceCount) {
      padded.push(emptyScreenshotSlot())
    }
    ;(patch as Record<string, unknown>).slots = padded
  }
}
```

Note: `emptyScreenshotSlot` is a private function already available in this file (line 99).

**Step 5: Verify**

Run: `npm run build`

---

### Task 4: Refactor `SlideCanvas.tsx` — replace `isDual` with count-based logic

**Files:**
- Modify: `src/components/Canvas/SlideCanvas.tsx`

**Step 1: Replace `isDual` in `DeviceFrame` component** (around line 325)

```typescript
// Before
const isDual = (slide.screenshotCount ?? 1) === 2
// After
const isMulti = (slide.screenshotCount ?? 1) > 1
```

Then change `if (isDual)` at line 332 to `if (isMulti)`:

```typescript
if (isMulti) {
  devSlot = slide.deviceSlots?.[slotIndex] ?? { deviceOffset: 0, deviceScale: 78, deviceRotate: 0 }
  const sSlot = slide.slots?.[slotIndex]
  screenshotDataUrl = sSlot?.screenshotDataUrl ?? null
  screenshotZoom = sSlot?.screenshotZoom ?? 100
  screenshotOffsetX = sSlot?.screenshotOffsetX ?? 0
  screenshotOffsetY = sSlot?.screenshotOffsetY ?? 0
} else {
  // unchanged
}
```

**Step 2: Replace `isDual` in `SlideCanvas` main component** (around line 581)

```typescript
// Before
const isDual = (slide.screenshotCount ?? 1) === 2
// After
const count = slide.screenshotCount ?? 1
```

**Step 3: Replace dual rendering block** (around lines 704-711)

```typescript
// Before
{isDual ? (
  <>
    <DeviceFrame slide={slide} fmt={fmt} slotIndex={0} interactive={interactive} />
    <DeviceFrame slide={slide} fmt={fmt} slotIndex={1} interactive={interactive} />
  </>
) : (
  <DeviceFrame slide={slide} fmt={fmt} slotIndex={0} interactive={interactive} />
)}

// After
{Array.from({ length: Math.max(count, 1) }, (_, i) => (
  <DeviceFrame key={i} slide={slide} fmt={fmt} slotIndex={i} interactive={interactive} />
))}
```

**Step 4: Verify**

Run: `npm run build`

---

### Task 5: Refactor `ScreenContent.tsx` — replace `=== 2` with `> 1`

**Files:**
- Modify: `src/components/Canvas/ScreenContent.tsx`

**Step 1: Replace all `screenshotCount === 2` checks with `> 1`**

There are 5 occurrences at lines approximately: 57, 98, 115, 155, 174.

Replace each:
```typescript
// Before
sl.screenshotCount === 2
// After
(sl.screenshotCount ?? 1) > 1
```

The pattern is the same each time — it checks whether the slide uses multi-slot mode. With 3 screenshots, this check must also be true.

**Step 2: Verify**

Run: `npm run build`

---

### Task 6: Add WebGL context loss detection to `Device3D.tsx`

**Files:**
- Modify: `src/components/Canvas/Device3D.tsx`

**Step 1: Add `webglcontextlost` listener via `onCreated`**

Add import at top:

```typescript
import i18n from 'i18next'
```

Modify the `<Canvas>` element to add `onCreated`:

```typescript
<Canvas
  style={{ position: 'absolute', inset: 0, filter: combinedFilter, opacity: mockupOpacity / 100 }}
  camera={{ position: [0, 0, cameraZ], fov, near: 0.01, far: 100 }}
  gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
  flat
  dpr={window.devicePixelRatio}
  resize={{ offsetSize: true }}
  onCreated={(state) => {
    state.gl.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      alert(i18n.t('frame.webgl_context_lost'))
    })
  }}
>
```

Note: `i18n` direct import is used instead of `useTranslation` hook because `Device3D` is inside r3f's `<Canvas>` which renders outside React's component tree (fiber reconciler). The `onCreated` listener is safe without cleanup — when the Canvas unmounts, the DOM canvas element is garbage collected along with its listeners.

**Step 2: Verify**

Run: `npm run build`

---

### Task 7: Update `FramePanel.tsx` — add "3" button, trio presets, 3× DeviceSliders

**Files:**
- Modify: `src/components/Sidebar/FramePanel.tsx`

**Step 1: Import `toggleScreenshotCount` from store**

```typescript
import { useEditorStore, toggleScreenshotCount } from '../../store/useEditorStore'
```

**Step 2: Replace `isDual` with `count` + `isMulti` throughout the component**

At `FramePanel.tsx:236`:

```typescript
// Before
const count = slide.screenshotCount ?? 1
const isDual = count === 2
// After
const count = slide.screenshotCount ?? 1
```

In `DeviceSliders` component (line 65):

```typescript
// Before
const isDual = (slide.screenshotCount ?? 1) === 2
const devSlot = isDual
  ? (slide.deviceSlots?.[slotIndex] ?? { deviceOffset: 0, deviceOffsetX: 0, deviceScale: 100, deviceRotate: 0 })
  : { deviceOffset: slide.deviceOffset, deviceOffsetX: 0, deviceScale: slide.deviceScale, deviceRotate: slide.deviceRotate ?? 0 }

// After
const count = slide.screenshotCount ?? 1
const isMulti = count > 1
const devSlot = isMulti
  ? (slide.deviceSlots?.[slotIndex] ?? { deviceOffset: 0, deviceOffsetX: 0, deviceScale: 100, deviceRotate: 0 })
  : { deviceOffset: slide.deviceOffset, deviceOffsetX: 0, deviceScale: slide.deviceScale, deviceRotate: slide.deviceRotate ?? 0 }
```

Replace ALL remaining `isDual` references in `DeviceSliders` with `isMulti`:
- `if (!isDual)` → `if (!isMulti)` (lines 71, 88, 127)
- `{isDual && (...)}` → `{isMulti && (...)}` (PosX slider block)
- `showZoom={isDual}` → `showZoom={isMulti}` (currently only in dual section, will be replaced in Step 5)

**Step 3: Fix `DeviceSliders` fallback arrays to pad to correct count**

In `setSlotField` (around line 75):

```typescript
// Before
const slots = slide.deviceSlots ? [...slide.deviceSlots] : [
  { deviceOffset: slide.deviceOffset, deviceOffsetX: 0, deviceScale: slide.deviceScale, deviceRotate: slide.deviceRotate ?? 0 },
  { deviceOffset: 0, deviceOffsetX: 0, deviceScale: 78, deviceRotate: 0 },
]

// After
const slots = slide.deviceSlots ? [...slide.deviceSlots] : Array.from(
  { length: Math.max(count, 2) },
  (_, i) => i === 0
    ? { deviceOffset: slide.deviceOffset, deviceOffsetX: 0, deviceScale: slide.deviceScale, deviceRotate: slide.deviceRotate ?? 0 }
    : { deviceOffset: 0, deviceOffsetX: 0, deviceScale: 78, deviceRotate: 0 }
)
while (slots.length <= slotIndex) {
  slots.push({ deviceOffset: 0, deviceOffsetX: 0, deviceScale: 78, deviceRotate: 0 })
}
```

In `setZoom` (around line 97):

```typescript
// Before
const slots = slide.slots ? [...slide.slots] : [
  { screenshotDataUrl: slide.screenshotDataUrl, screenshotZoom: slide.screenshotZoom ?? 100, screenshotOffsetX: slide.screenshotOffsetX ?? 0, screenshotOffsetY: slide.screenshotOffsetY ?? 0 },
  { screenshotDataUrl: null, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 },
]

// After
const slots = slide.slots ? [...slide.slots] : Array.from(
  { length: Math.max(count, 2) },
  (_, i) => i === 0
    ? { screenshotDataUrl: slide.screenshotDataUrl, screenshotZoom: slide.screenshotZoom ?? 100, screenshotOffsetX: slide.screenshotOffsetX ?? 0, screenshotOffsetY: slide.screenshotOffsetY ?? 0 }
    : { screenshotDataUrl: null, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 }
)
while (slots.length <= slotIndex) {
  slots.push({ screenshotDataUrl: null, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 })
}
```

**Step 4: Add "3" button to the screens count selector** (after the "2" button)

```tsx
<button
  onClick={() => handleCountChange(3)}
  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
    count === 3
      ? 'bg-indigo-500/25 border border-indigo-400 text-indigo-300'
      : 'option-idle border'
  }`}
>
  3
</button>
```

**Step 5: Update `handleCountChange` to use `toggleScreenshotCount`**

Replace the entire `handleCountChange` function:

```typescript
const handleCountChange = (newCount: 1 | 2 | 3) => {
  if (newCount === count) return
  const patch = toggleScreenshotCount(slide, newCount)
  updateSlide(activeSlideId, patch)
}
```

Note: `toggleScreenshotCount` is idempotent — if `slide` is stale due to rapid clicking, the result is still a valid transition to `newCount`. The store's `updateSlide` applies the patch to the current store state, not the stale `slide`.

**Step 6: Replace preset sections with count-aware rendering**

Replace the existing `{isDual && (...)}` preset block and the slider section entirely. The new structure:

```tsx
{(count === 2 || count === 3) && (
  <div className="pt-1">
    <p className="text-xs text-muted mb-2">{t('frame.presets')}</p>
    <div className={count === 3 ? 'grid grid-cols-4 gap-2' : 'grid grid-cols-3 gap-2'}>
      {presetsForCount(count).map((preset) => (
        <button
          key={preset.id}
          onClick={() => handleApplyPreset(preset.id)}
          className={`rounded-lg p-1.5 transition-all border ${
            slide.activePresetId === preset.id
              ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
              : 'border-subtle hover:border-indigo-400/50 text-muted'
          }`}
        >
          <PresetThumbnail preset={preset} />
        </button>
      ))}
    </div>
  </div>
)}
```

Remove the `dualPresets` variable declaration since it's no longer needed.

**Step 7: Replace device sliders section**

Replace the `{isDual ? (...) : (...)}` block (lines ~363-426) with:

```tsx
{count > 1 ? (
  <div className="space-y-3 pt-2">
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted font-medium">{t('frame.device_position')}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => updateSlide(activeSlideId, { showGrid: !(slide.showGrid ?? false) })}
          className={`p-1 rounded-md border transition-all ${
            slide.showGrid
              ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300'
              : 'option-idle border'
          }`}
          title={t('frame.grid')}
        >
          <Grid3x3 size={14} />
        </button>
        <button
          onClick={() => updateSlide(activeSlideId, { showSafeArea: !(slide.showSafeArea ?? false) })}
          className={`p-1 rounded-md border transition-all ${
            slide.showSafeArea
              ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300'
              : 'option-idle border'
          }`}
          title={t('frame.safe_area')}
        >
          <Shield size={14} />
        </button>
      </div>
    </div>
    {Array.from({ length: count }, (_, i) => (
      <DeviceSliders
        key={i}
        label={t(`frame.device_${i + 1}`)}
        slide={slide}
        slotIndex={i}
        format={slide.format}
        showZoom
      />
    ))}
  </div>
) : (
  <div className="space-y-1 pt-2">
    <div className="flex items-center justify-between pr-1">
      <span className="text-xs text-muted font-medium">{t('frame.device_position')}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => updateSlide(activeSlideId, { showGrid: !(slide.showGrid ?? false) })}
          className={`p-1 rounded-md border transition-all ${
            slide.showGrid
              ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300'
              : 'option-idle border'
          }`}
          title={t('frame.grid')}
        >
          <Grid3x3 size={14} />
        </button>
        <button
          onClick={() => updateSlide(activeSlideId, { showSafeArea: !(slide.showSafeArea ?? false) })}
          className={`p-1 rounded-md border transition-all ${
            slide.showSafeArea
              ? 'bg-indigo-500/25 border-indigo-400 text-indigo-300'
              : 'option-idle border'
          }`}
          title={t('frame.safe_area')}
        >
          <Shield size={14} />
        </button>
      </div>
    </div>
    <DeviceSliders label="" slide={slide} slotIndex={0} format={slide.format} showZoom={LANDSCAPE_FORMATS.has(slide.format)} />
  </div>
)}
```

Key difference: count > 1 → all devices get `showZoom`; count === 1 → only landscape formats get `showZoom`.

**Step 8: Update `PresetThumbnail` to handle 3 devices**

First, update the inline prop type (line 17):

```typescript
// Before
function PresetThumbnail({ preset }: { preset: { id: string; screenshotCount: 1 | 2; devices: DeviceSlot[] } }) {
// After
function PresetThumbnail({ preset }: { preset: { id: string; screenshotCount: 1 | 2 | 3; devices: DeviceSlot[] } }) {
```

Then update the function body:

```typescript
// Before
const isDual = preset.screenshotCount === 2
// ...
const leftPct = isDual ? 50 + offsetX * 1.5 : 50

// After
const isMulti = preset.screenshotCount > 1
// ...
const leftPct = isMulti ? 50 + offsetX * 1.5 : 50
```

Also adjust device width for trio thumbnails so devices are visible:

```typescript
// In the device div inside preset.devices.map:
// Before
width: `${scale * 28}%`,
// After
width: `${scale * (preset.screenshotCount === 3 ? 22 : 28)}%`,
```

**Step 9: Verify**

Run: `npm run build`

---

### Task 7.5: Update `TemplateModal.tsx` — generalize device preview

**Files:**
- Modify: `src/components/TemplateModal.tsx`

This task updates the template preview in the modal to handle any screenshot count. Although no trio templates are being added yet, the code must not have hardcoded `=== 2` checks that would break if:
- A user at count=3 applies a count=1/2 template (data residual but not crash)
- Trio templates are added in the future

**Step 1: Replace `isDual` with count-based rendering** (lines 22, 38-54)

```typescript
// Before (line 22)
const isDual = patch.screenshotCount === 2

// After
const deviceCount = patch.screenshotCount ?? 1
```

Then replace the `deviceShape` helper and `deviceArea` rendering block (lines 38-54):

```typescript
// Before
const deviceShape = (w: string) => (
  <div className={`${w} aspect-[9/17] rounded-sm`}
    style={{ background: 'rgba(128,128,128,0.25)', border: '1px solid rgba(128,128,128,0.2)' }} />
)

const deviceArea = isDual ? (
  <div className="flex-1 flex items-center justify-center gap-1 pb-2">
    {deviceShape('w-[22%]')}
    {deviceShape('w-[22%]')}
  </div>
) : (
  <div className="flex-1 flex items-center justify-center pb-2">
    {deviceShape('w-[36%]')}
  </div>
)

// After
const deviceArea = (
  <div className={`flex-1 flex items-center justify-center ${deviceCount > 1 ? 'gap-1' : ''} pb-2`}>
    {Array.from({ length: deviceCount }, (_, i) => (
      <div
        key={i}
        className={`${deviceCount > 1 ? 'w-[22%]' : 'w-[36%]'} aspect-[9/17] rounded-sm`}
        style={{ background: 'rgba(128,128,128,0.25)', border: '1px solid rgba(128,128,128,0.2)' }}
      />
    ))}
  </div>
)
```

**Step 2: Verify**

Run: `npm run build`

---

### Task 8: Update `UploadPanel.tsx` — add third upload slot

**Files:**
- Modify: `src/components/Sidebar/UploadPanel.tsx`

**Step 1: Update the condition in `UploadPanel`**

```typescript
// Before
const isDual = (slide.screenshotCount ?? 1) === 2

if (!isDual) {
  return (/* SingleUpload */)
}

return (/* SlotUpload × 2 */)

// After
const count = slide.screenshotCount ?? 1

if (count === 1) {
  return (/* SingleUpload — unchanged */)
}

return (
  <div className="p-4 space-y-3">
    {Array.from({ length: count }, (_, i) => (
      <SlotUpload
        key={i}
        label={t(`upload.screenshot_${i + 1}`)}
        slotIndex={i}
        slide={slide}
      />
    ))}
    <p className="text-xs text-black/30 dark:text-white/30 text-center">{t('upload.hint')}</p>
  </div>
)
```

**Step 2: Fix `SlotUpload` fallback slot array**

In `SlotUpload`, compute `count` from slide and pad fallback array:

```typescript
// Add at the top of SlotUpload function body
const count = slide.screenshotCount ?? 1
```

Then replace the fallback array creation (around line 102):

```typescript
// Before
const currentSlots = slide.slots ?? [
  { screenshotDataUrl: slide.screenshotDataUrl, screenshotZoom: slide.screenshotZoom ?? 100, screenshotOffsetX: slide.screenshotOffsetX ?? 0, screenshotOffsetY: slide.screenshotOffsetY ?? 0 },
  { screenshotDataUrl: null, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 },
]

// After
const currentSlots = slide.slots ?? Array.from({ length: count }, (_, i) =>
  i === 0
    ? { screenshotDataUrl: slide.screenshotDataUrl, screenshotZoom: slide.screenshotZoom ?? 100, screenshotOffsetX: slide.screenshotOffsetX ?? 0, screenshotOffsetY: slide.screenshotOffsetY ?? 0 }
    : { screenshotDataUrl: null, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 }
)
```

Then replace the `newSlots` creation (around line 106):

```typescript
// Before
const newSlots: ScreenshotSlot[] = [...currentSlots]
newSlots[slotIndex] = { ...newSlots[slotIndex], screenshotDataUrl: compressed, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 }

// After
const newSlots: ScreenshotSlot[] = [...currentSlots]
while (newSlots.length <= slotIndex) {
  newSlots.push({ screenshotDataUrl: null, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 })
}
newSlots[slotIndex] = { ...newSlots[slotIndex], screenshotDataUrl: compressed, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 }
```

**Step 3: Verify**

Run: `npm run build`

---

### Task 9: Add i18n keys

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/es/translation.json`
- Modify: `src/locales/zh/translation.json`

**Step 1: Add English keys**

In `en/translation.json`, add to `upload` section:

```json
"screenshot_3": "Screenshot 3"
```

Add to `frame` section:

```json
"device_3": "Device 3",
"webgl_context_lost": "WebGL context lost. Please reload the page."
```

**Step 2: Add Spanish keys**

In `es/translation.json`, add to `upload` section:

```json
"screenshot_3": "Captura 3"
```

Add to `frame` section:

```json
"device_3": "Dispositivo 3",
"webgl_context_lost": "Contexto WebGL perdido. Por favor, recarga la página."
```

**Step 3: Add Chinese keys**

In `zh/translation.json`, add to `upload` section (after `screenshot_2`):

```json
"screenshot_3": "截图 3"
```

Add to `frame` section (after `device_2`):

```json
"device_3": "设备 3",
"webgl_context_lost": "WebGL 上下文丢失，请重新加载页面。"
```

Note: Trio preset names (`trio_row`, `trio_stack`, `trio_fan`, `trio_pyramid`) are NOT added as i18n keys because they are not displayed in the UI — presets are shown as visual thumbnails only, not labeled by name.

**Step 4: Verify**

Run: `npm run build`

---

### Task 10: Final verification

**Step 1: Run full build**

Run: `npm run build`
Expected: Clean build, no TypeScript errors.

**Step 2: Run lint**

Run: `npm run lint`
Expected: No new warnings or errors.

**Step 3: Manual smoke test checklist**

- [ ] Create new slide → default is single screenshot
- [ ] Click "2" → switches to dual, duo presets appear (3 thumbnails), 2 upload slots
- [ ] Click "3" → switches to triple, trio presets appear (4 thumbnails), 3 upload slots, 3 device slider sets
- [ ] Upload 3 screenshots → all 3 render on canvas
- [ ] Apply trio preset → devices reposition correctly
- [ ] Switch 3→1 → slot[0] preserved, slots[1,2] silently discarded
- [ ] Switch 3→2 → slots[0,1] preserved, slot[2] silently discarded
- [ ] Switch 2→3 → slots[0,1] preserved, slot[2] empty
- [ ] Switch 1→3 directly → single screenshot becomes slot[0], slot[1,2] empty
- [ ] Export single slide → PNG renders correctly with 3 devices
- [ ] Export all → ZIP contains correct PNGs
- [ ] Save project → reload project → 3 slots restored
- [ ] Choose 3D frame with 3 screenshots → renders correctly
- [ ] Apply Style to All from a count=3 slide to another count=3 slide → positions copy, images don't
- [ ] Apply Style to All from a count=3 slide to a count=2 slide → style copies, count/slots/presets unchanged on target
- [ ] Tablet format (landscape) → trio presets render, verify visual layout is reasonable
- [ ] Drag device position slider for Device 3 → no crash, position updates on canvas
- [ ] Zoom slider for Device 3 → no crash, zoom updates on canvas
- [ ] Undo count switch (3→1 then Ctrl+Z) → restores to count=3 with all slots

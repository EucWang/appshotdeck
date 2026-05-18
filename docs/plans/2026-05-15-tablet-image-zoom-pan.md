# Tablet Image Zoom & Pan Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable full-image display (no cropping) for tablet formats with zoom and drag-to-pan support.

**Architecture:** Add `screenshotZoom` / `screenshotOffsetX` / `screenshotOffsetY` to the `Slide` type. In `ScreenContent`, switch tablet formats from `object-fit: cover` to `contain` + CSS `transform: scale() translate()` for zoom/pan. Add mouse drag, wheel zoom, and touch drag handlers (preview only). Add a zoom slider in `FramePanel` for tablet formats.

**Tech Stack:** React 19, Zustand 5, Tailwind CSS v3, lucide-react

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Scope | tablet-7, tablet-10 only | These landscape slots crop portrait screenshots; portrait formats are fine with `cover` |
| Default behavior | `object-fit: contain` (zoom=100) | Full image visible by default; user can zoom in to fill/crop |
| Pan interaction | Drag + slider zoom | Intuitive: drag to pan when zoomed, scroll wheel or slider to zoom |
| Coordinate unit | Percentage of slot dimensions | Resolution-independent; works at both preview and export resolution |
| Offset clamping | `±((zoom/100 - 1) * 50)%` | Prevents dragging image beyond its natural bounds |
| Export compatibility | CSS transform captured by html-to-image | No WebGL involved for tablet frames; standard DOM capture works |

## Data Flow

```
User uploads image → UploadPanel resets zoom=100, offsetX=0, offsetY=0
User drags image → mouse delta / rect.width * 100 → updateSlide(slideId, {screenshotOffsetX, screenshotOffsetY})
User scrolls on image → zoom ± 10 → clamp offsets → updateSlide
User adjusts slider → FramePanel sets screenshotZoom, clamps offsets
Export → ScreenContent renders transform from stored values → html-to-image captures DOM
```

## Files to Modify

| File | Change |
|---|---|
| `src/types/index.ts` | Add 3 optional fields to `Slide` |
| `src/components/Canvas/ScreenContent.tsx` | Full rewrite: tablet contain + zoom/pan + drag/wheel handlers |
| `src/components/Canvas/SlideCanvas.tsx` | Pass new props to `ScreenContent` |
| `src/components/Sidebar/FramePanel.tsx` | Add zoom slider + reset for LANDSCAPE_FORMATS |
| `src/components/Sidebar/UploadPanel.tsx` | Reset zoom/offset on new image upload |
| `src/locales/en/translation.json` | Add `frame.zoom`, `frame.zoom_reset`, `frame.zoom_hint` |
| `src/locales/es/translation.json` | Add Spanish translations |

## Files NOT Modified

- `src/utils/export.ts` — html-to-image captures CSS transforms natively; no WebGL compositing needed for tablet frames
- `src/utils/project.ts` — uses `...rest` spread, so new Slide fields are auto-persisted
- `src/store/useEditorStore.ts` — new fields are optional with `?? defaultValue` fallbacks; no defaultSlide changes needed
- `src/components/Canvas/Device3D.tsx` — no 3D frames exist for tablet formats

---

### Task 1: Add new fields to Slide type

**Files:**
- Modify: `src/types/index.ts:35-62` (Slide interface)

**Step 1: Add three optional fields**

Add after the `subtitleHighlightColor` field (line 61):

```typescript
  screenshotZoom?: number
  screenshotOffsetX?: number
  screenshotOffsetY?: number
```

**Step 2: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds (fields are optional, no breaking changes)

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add screenshotZoom/screenshotOffsetX/Y to Slide type"
```

---

### Task 2: Rewrite ScreenContent with tablet zoom/pan support

**Files:**
- Rewrite: `src/components/Canvas/ScreenContent.tsx` (entire file)

**Step 1: Write the complete new ScreenContent**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../store/useEditorStore'

interface Props {
  screenshotDataUrl: string | null
  slotW: number
  slotH: number
  isTablet: boolean
  interactive: boolean
  slideId: string
  screenshotZoom: number
  screenshotOffsetX: number
  screenshotOffsetY: number
}

function clampPan(v: number, max: number) {
  return Math.round(Math.max(-max, Math.min(max, v)) * 10) / 10
}

export function ScreenContent({
  screenshotDataUrl,
  slotW,
  slotH,
  isTablet,
  interactive,
  slideId,
  screenshotZoom,
  screenshotOffsetX,
  screenshotOffsetY,
}: Props) {
  const { t } = useTranslation()
  const updateSlide = useEditorStore((s) => s.updateSlide)
  const [isDragging, setIsDragging] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragState = useRef({ startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 })

  const zoomFactor = screenshotZoom / 100
  const maxPanPercent = Math.max(0, (zoomFactor - 1) * 50)
  const panXPx = (screenshotOffsetX / 100) * slotW
  const panYPx = (screenshotOffsetY / 100) * slotH

  useEffect(() => {
    if (!isTablet || !interactive || !imgRef.current) return
    const el = imgRef.current
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const sl = useEditorStore.getState().slides.find((s) => s.id === slideId)
      const curZoom = sl?.screenshotZoom ?? 100
      const curOX = sl?.screenshotOffsetX ?? 0
      const curOY = sl?.screenshotOffsetY ?? 0
      const step = e.deltaY > 0 ? -10 : 10
      const newZoom = Math.max(100, Math.min(400, curZoom + step))
      const newMax = Math.max(0, (newZoom / 100 - 1) * 50)
      useEditorStore.getState().updateSlide(slideId, {
        screenshotZoom: newZoom,
        screenshotOffsetX: clampPan(curOX, newMax),
        screenshotOffsetY: clampPan(curOY, newMax),
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [isTablet, interactive, slideId])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isTablet || zoomFactor <= 1) return
      e.preventDefault()
      setIsDragging(true)
      const sl = useEditorStore.getState().slides.find((s) => s.id === slideId)
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: sl?.screenshotOffsetX ?? 0,
        startOffsetY: sl?.screenshotOffsetY ?? 0,
      }
      const onMove = (ev: MouseEvent) => {
        const rect = imgRef.current?.parentElement?.getBoundingClientRect()
        if (!rect) return
        const dx = ((ev.clientX - dragState.current.startX) / rect.width) * 100
        const dy = ((ev.clientY - dragState.current.startY) / rect.height) * 100
        const curSl = useEditorStore.getState().slides.find((s) => s.id === slideId)
        const curZoom = curSl?.screenshotZoom ?? 100
        const curMax = Math.max(0, (curZoom / 100 - 1) * 50)
        useEditorStore.getState().updateSlide(slideId, {
          screenshotOffsetX: clampPan(dragState.current.startOffsetX + dx, curMax),
          screenshotOffsetY: clampPan(dragState.current.startOffsetY + dy, curMax),
        })
      }
      const onUp = () => {
        setIsDragging(false)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [isTablet, slideId, zoomFactor],
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isTablet || zoomFactor <= 1 || e.touches.length !== 1) return
      const touch = e.touches[0]
      const sl = useEditorStore.getState().slides.find((s) => s.id === slideId)
      dragState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startOffsetX: sl?.screenshotOffsetX ?? 0,
        startOffsetY: sl?.screenshotOffsetY ?? 0,
      }
      const onMove = (ev: TouchEvent) => {
        ev.preventDefault()
        const t = ev.touches[0]
        const rect = imgRef.current?.parentElement?.getBoundingClientRect()
        if (!rect) return
        const dx = ((t.clientX - dragState.current.startX) / rect.width) * 100
        const dy = ((t.clientY - dragState.current.startY) / rect.height) * 100
        const curSl = useEditorStore.getState().slides.find((s) => s.id === slideId)
        const curZoom = curSl?.screenshotZoom ?? 100
        const curMax = Math.max(0, (curZoom / 100 - 1) * 50)
        useEditorStore.getState().updateSlide(slideId, {
          screenshotOffsetX: clampPan(dragState.current.startOffsetX + dx, curMax),
          screenshotOffsetY: clampPan(dragState.current.startOffsetY + dy, curMax),
        })
      }
      const onEnd = () => {
        window.removeEventListener('touchmove', onMove)
        window.removeEventListener('touchend', onEnd)
      }
      window.addEventListener('touchmove', onMove, { passive: false })
      window.addEventListener('touchend', onEnd)
    },
    [isTablet, slideId, zoomFactor],
  )

  if (!screenshotDataUrl) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.35)',
          fontSize: Math.round(slotW * 0.05),
          fontWeight: 600,
        }}
      >
        {t('canvas.upload_prompt')}
      </div>
    )
  }

  if (!isTablet) {
    return (
      <img
        src={screenshotDataUrl}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'top center',
          display: 'block',
        }}
      />
    )
  }

  return (
    <img
      ref={imgRef}
      src={screenshotDataUrl}
      alt=""
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'center center',
        display: 'block',
        transformOrigin: 'center center',
        transform:
          zoomFactor !== 1 || panXPx !== 0 || panYPx !== 0
            ? `translate(${panXPx}px, ${panYPx}px) scale(${zoomFactor})`
            : undefined,
        cursor: zoomFactor > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
      }}
      onMouseDown={interactive ? handleMouseDown : undefined}
      onTouchStart={interactive ? handleTouchStart : undefined}
    />
  )
}
```

**Key implementation notes:**

1. **Props interface expanded**: 8 props instead of the previous 2. Values are passed from `SlideCanvas` (which already has the `slide` object).

2. **`interactive` flag**: `true` in preview (scale !== 1), `false` in export container. Prevents wheel listener registration and event handler attachment in the hidden export container.

3. **Wheel handler uses `useEffect` with `{ passive: false }`**: Required because React's synthetic `onWheel` is passive by default and can't call `preventDefault()`. The effect reads latest state via `useEditorStore.getState()` to avoid stale closures.

4. **Drag handlers use `useEditorStore.getState()`**: All drag/move handlers read the latest zoom/offset from the store directly, ensuring correct clamping even if zoom changes during a drag.

5. **Coordinate math**: `delta / rect.width * 100` converts viewport-pixel deltas to percentage of slot dimension. Since `rect.width = slotW * previewScale`, the previewScale cancels out automatically.

6. **Clamping formula**: `maxPan = (zoom/100 - 1) * 50` percent. At zoom=200%, max pan = ±50%. At zoom=100%, max pan = 0% (no panning possible).

7. **Cursor feedback**: `grab` when zoom > 100% and idle, `grabbing` while dragging, `default` when zoom = 100%. Uses `isDragging` state (minimal re-render overhead).

8. **Backward compatibility**: Non-tablet path is identical to the original code — `objectFit: 'cover'`, no transforms, no event handlers.

**Step 2: Commit**

```bash
git add src/components/Canvas/ScreenContent.tsx
git commit -m "feat: ScreenContent tablet zoom/pan with drag and wheel support"
```

---

### Task 3: Update SlideCanvas to pass new props

**Files:**
- Modify: `src/components/Canvas/SlideCanvas.tsx:240-258` (both ScreenContent call sites)

**Step 1: Build the shared props object**

After the `deviceScaleFactor` computation (around line 111), add:

```typescript
    const screenContentProps = {
      screenshotDataUrl: slide.screenshotDataUrl,
      slotW: dSlotW,
      slotH: dSlotH,
      isTablet: landscape,
      interactive: scale !== 1,
      slideId: slide.id,
      screenshotZoom: slide.screenshotZoom ?? 100,
      screenshotOffsetX: slide.screenshotOffsetX ?? 0,
      screenshotOffsetY: slide.screenshotOffsetY ?? 0,
    }
```

**Step 2: Replace both ScreenContent call sites**

At line 245 (bezel path) and line 255 (no-bezel path), replace:

```tsx
<ScreenContent screenshotDataUrl={slide.screenshotDataUrl} slotW={dSlotW} />
```

with:

```tsx
<ScreenContent {...screenContentProps} />
```

**Step 3: Verify build**

Run: `npm run build`
Expected: TypeScript compilation succeeds — all new props are provided.

**Step 4: Commit**

```bash
git add src/components/Canvas/SlideCanvas.tsx
git commit -m "feat: pass zoom/pan props from SlideCanvas to ScreenContent"
```

---

### Task 4: Add zoom controls to FramePanel

**Files:**
- Modify: `src/components/Sidebar/FramePanel.tsx:53-106` (after existing RESIZABLE_FORMATS block)

**Step 1: Add zoom slider for LANDSCAPE_FORMATS**

After the closing `</>` of the RESIZABLE_FORMATS block (after line 105), add:

```tsx
      {LANDSCAPE_FORMATS.has(slide.format) && (
        <>
          <div className="flex items-center gap-2 pt-2 pr-1">
            <span className="text-xs text-muted w-7 flex-shrink-0">{t('frame.zoom')}</span>
            <input
              type="range" min={100} max={400} step={10}
              value={slide.screenshotZoom ?? 100}
              onChange={(e) => {
                const newZoom = Number(e.target.value)
                const newMax = Math.max(0, (newZoom / 100 - 1) * 50)
                const curOX = slide.screenshotOffsetX ?? 0
                const curOY = slide.screenshotOffsetY ?? 0
                updateSlide(activeSlideId, {
                  screenshotZoom: newZoom,
                  screenshotOffsetX: Math.round(Math.max(-newMax, Math.min(newMax, curOX)) * 10) / 10,
                  screenshotOffsetY: Math.round(Math.max(-newMax, Math.min(newMax, curOY)) * 10) / 10,
                })
              }}
              className="flex-1 min-w-0"
            />
            <span className="text-xs text-dim font-mono w-8 text-right flex-shrink-0">{slide.screenshotZoom ?? 100}%</span>
            <button
              onClick={() => updateSlide(activeSlideId, { screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 })}
              className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-0.5"
              title={t('frame.zoom_reset')}
            >
              <RotateCcw size={14} />
            </button>
          </div>
          <p className="text-xs text-black/25 dark:text-white/25 pl-9">{t('frame.zoom_hint')}</p>
        </>
      )}
```

**UI consistency notes:**
- Uses same layout pattern as existing Pos/Size sliders: `flex items-center gap-2`, `text-muted` label, `text-dim font-mono` value
- Icon size `size={14}` matches existing Reset buttons
- `btn-ghost`-like button style matches existing reset buttons (`text-muted hover:text-foreground transition-colors p-0.5`)
- Hint text uses `text-black/25 dark:text-white/25` — subtle, non-intrusive

**Interaction flow:**
1. Zoom slider range: 100%-400%, step 10%
2. Slider change → clamp offsets to new zoom bounds → update store
3. Reset button → set zoom=100, offsetX=0, offsetY=0
4. Hint text: "Scroll to zoom, drag to pan" (localized)

**Step 2: Commit**

```bash
git add src/components/Sidebar/FramePanel.tsx
git commit -m "feat: add zoom slider and reset for tablet formats in FramePanel"
```

---

### Task 5: Reset zoom/offset on image upload

**Files:**
- Modify: `src/components/Sidebar/UploadPanel.tsx:23` (updateSlide call)

**Step 1: Add reset values to the upload handler**

In the `handleFile` callback, change line 23 from:

```tsx
updateSlide(activeSlideId, { screenshotDataUrl: compressed })
```

to:

```tsx
updateSlide(activeSlideId, { screenshotDataUrl: compressed, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 })
```

**Rationale:** When the user uploads a new image, any previous zoom/pan state becomes invalid (different image, different aspect ratio). Resetting ensures the new image displays correctly at contain mode.

**Backward compatibility:** Non-tablet formats ignore these fields (ScreenContent uses `isTablet` to gate behavior), so adding them here is harmless for phone/iPhone/iPad.

**Step 2: Commit**

```bash
git add src/components/Sidebar/UploadPanel.tsx
git commit -m "feat: reset zoom/pan on new image upload"
```

---

### Task 6: Add i18n strings

**Files:**
- Modify: `src/locales/en/translation.json:35-38` (frame section)
- Modify: `src/locales/es/translation.json:35-38` (frame section)

**Step 1: Add English strings**

In `en/translation.json`, add inside the `"frame"` object (after `"tilt": "Inclinación"` equivalent line):

```json
    "zoom": "Zoom",
    "zoom_reset": "Reset zoom & pan",
    "zoom_hint": "Scroll to zoom · drag to pan"
```

The full frame section becomes:

```json
  "frame": {
    "title": "Device Frame",
    "active": "Active",
    "tilt": "Tilt",
    "zoom": "Zoom",
    "zoom_reset": "Reset zoom & pan",
    "zoom_hint": "Scroll to zoom \u00b7 drag to pan"
```

**Step 2: Add Spanish strings**

In `es/translation.json`, add inside the `"frame"` object:

```json
    "zoom": "Zoom",
    "zoom_reset": "Restablecer zoom y posici\u00f3n",
    "zoom_hint": "Scroll para zoom \u00b7 arrastra para mover"
```

**Step 3: Commit**

```bash
git add src/locales/en/translation.json src/locales/es/translation.json
git commit -m "feat: add zoom/pan i18n strings for en and es"
```

---

### Task 7: Build & lint verification

**Step 1: Run TypeScript build**

Run: `npm run build`
Expected: Build succeeds with no type errors.

**Step 2: Run lint**

Run: `npm run lint`
Expected: No new lint errors.

**Step 3: Manual verification checklist**

Verify the following in the browser (`npm run dev`):

1. **Phone format**: Upload image → image still crops with `object-fit: cover` (unchanged behavior)
2. **iPhone/iPad formats**: Same as above, no change
3. **Tablet-7 format**: Upload image → image shows fully (contain), no cropping
4. **Tablet-10 format**: Same as tablet-7
5. **Zoom slider**: Appears only for tablet formats, range 100-400%
6. **Zoom via scroll**: Hover over image in tablet format, scroll wheel → zoom in/out
7. **Pan via drag**: Zoom in (>100%), drag image → pans, cursor shows grab/grabbing
8. **Offset clamping**: Zoom to max, drag → can't drag beyond image bounds
9. **Reset button**: Click reset → zoom returns to 100%, image recenters
10. **New upload**: While zoomed, upload new image → resets to 100%, centered
11. **Export**: Zoom/pan the image, click "Export this slide PNG" → exported PNG reflects zoom/pan correctly
12. **Format switch**: Switch from tablet to phone → image shows with cover (ignores zoom/offset)
13. **Duplicate slide**: Duplicate a zoomed tablet slide → copy preserves zoom/offset
14. **Save/load project**: Save project with zoomed slides, reload → zoom/offset restored

---

## Review Against AGENTS.md Code Review Checklist

### 1. Code modifications correct?

- **Types**: 3 new optional fields added to `Slide` interface — no existing code affected
- **Imports**: `useCallback`, `useEffect`, `useRef`, `useState` from React — all standard; `useEditorStore` already used in sidebar components
- **Spelling**: All variable names consistent (`screenshotZoom`, `screenshotOffsetX`, `screenshotOffsetY`)

### 2. Logic correct?

- **Data flow**: `SlideCanvas` reads from `slide` object → passes as props → `ScreenContent` renders transform
- **State updates**: All via `useEditorStore.getState().updateSlide()` — consistent with existing store pattern
- **Boundary conditions**:
  - `zoom = 100` → `maxPanPercent = 0` → no panning (correct)
  - `zoom = 400` → `maxPanPercent = 150` → wide panning range (correct)
  - `screenshotZoom ?? 100` / `screenshotOffsetX ?? 0` / `screenshotOffsetY ?? 0` — old persisted slides work correctly
- **Backward compatibility**: Non-tablet code path is unchanged. Optional fields with fallbacks handle old state.

### 3. Will it cause crashes?

- **Null safety**: `imgRef.current?.parentElement?.getBoundingClientRect()` — safe null check
- **Store access**: `useEditorStore.getState().slides.find(...)` → may return `undefined` → handled with `?? defaultValue`
- **Export container**: `pointerEvents: none` prevents event firing; `interactive=false` prevents useEffect listener registration
- **No WebGL**: Tablet frames don't use Device3D, no WebGL compositing issues

### 4. Performance issues?

- **Drag re-renders**: Each `updateSlide` triggers Zustand re-render. Only the active slide's ScreenContent re-renders (preview + export). Transform-only changes are GPU-accelerated — no layout recalculation.
- **Export re-renders**: Export ScreenContent instances re-render on every drag frame, but they're offscreen — browser skips painting. DOM style update is O(1).
- **useEffect cleanup**: Wheel listener properly removed on unmount. Window-level mouse/touch listeners removed on mouseup/touchend.
- **No memo needed**: ScreenContent renders conditionally based on props — React handles this efficiently.

### 5. UI style consistent with project?

- Zoom slider uses same layout as Pos/Size: `flex items-center gap-2`, `text-muted` label, `text-dim font-mono` value, `RotateCcw` icon at `size={14}`
- Reset button: `text-muted hover:text-foreground transition-colors p-0.5` — matches existing reset buttons
- Hint text: `text-xs text-black/25 dark:text-white/25 pl-9` — subtle, matches existing hint style
- No new Tailwind classes outside the existing custom utility set

### 6. Interaction logic and visual feedback?

| Action | Response | Feedback |
|---|---|---|
| Upload image | Image shown at contain (full view) | Image appears smaller, centered in slot |
| Scroll wheel on image | Zoom ± 10% per scroll step | Image scales from center |
| Drag image (zoom > 100%) | Pan within clamped bounds | Cursor: grab → grabbing |
| Drag image (zoom = 100%) | No pan | Cursor: default (no drag) |
| Zoom slider change | Zoom updates, offsets clamped | Slider value updates, image scales |
| Reset button | Zoom=100, offset=0,0 | Image returns to centered contain |
| Upload while zoomed | Reset to zoom=100, offset=0,0 | Image resets to default view |

### 7. Web design interaction norms?

- **Button states**: Reset button has `hover:text-foreground` — clear hover state
- **Focus management**: `e.preventDefault()` in mousedown prevents focus loss during drag
- **Operation reversibility**: Reset button restores defaults; zoom slider can return to 100%
- **No silent failures**: Zoom slider always visible for tablets; drag cursor provides discoverability

### 8. Nielsen usability principles?

- **System state visibility**: Zoom % shown beside slider; cursor changes with zoom level
- **User control**: Reset button; slider for fine control; drag for intuitive control
- **Error prevention**: Offset clamping prevents dragging image out of view
- **Consistency**: Same slider layout pattern as existing Pos/Size controls
- **Discoverability**: Zoom slider appears in Frame panel when tablet format selected; hint text explains interaction
- **Feedback timeliness**: Drag updates are per-frame (via mousemove); slider is instant

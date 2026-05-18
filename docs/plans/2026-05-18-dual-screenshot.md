# Dual Screenshot Layout Presets — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add dual-screenshot mode with visual layout presets (inspired by shots.so) so users can display 1 or 2 device frames per slide, each with independent Pos/Size/Rotate/Zoom.

**Architecture:** Extend the Slide type with `screenshotCount`, `slots[]`, `deviceSlots[]`. Add a new `layoutPresets.ts` data file. FramePanel gets a count toggle (1|2), visual preset thumbnails, and per-device fine-tune sliders. SlideCanvas branches on count to render 1 or 2 device instances. Export handles multiple WebGL canvases. Full backward compatibility via `?? defaultValue` fallbacks.

**Tech Stack:** React 19, TypeScript, Zustand 5, Three.js (unchanged), Tailwind CSS v3, lucide-react icons

---

### Task 1: Extend Types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add new interfaces and extend Slide**

Add to `src/types/index.ts`:

```ts
export interface ScreenshotSlot {
  screenshotDataUrl: string | null
  screenshotZoom: number
  screenshotOffsetX: number
  screenshotOffsetY: number
}

export interface DeviceSlot {
  deviceOffset: number
  deviceScale: number
  deviceRotate: number
}

export interface LayoutPresetDef {
  id: string
  screenshotCount: 1 | 2
  devices: DeviceSlot[]
}
```

Add new fields to Slide:

```ts
screenshotCount?: 1 | 2
slots?: ScreenshotSlot[]
deviceSlots?: DeviceSlot[]
activePresetId?: string | null
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS (new fields are optional)

---

### Task 2: Create Layout Presets Data

**Files:**
- Create: `src/data/layoutPresets.ts`

**Step 1: Write preset definitions**

Define presets for portrait formats and landscape formats. Each preset has an id, count, and per-device transforms. Include ~6 presets:

Portrait single (2): center, offset-down
Portrait dual (4): side-by-side, stacked, front-back, tilted
Landscape single (2): center, offset-right
Landscape dual (4): side-by-side, stacked, front-back, tilted

Each preset includes a `render` function returning a small JSX thumbnail (tiny CSS divs representing device rectangles).

**Step 2: Verify build**

Run: `npm run build`

---

### Task 3: Update Zustand Store

**Files:**
- Modify: `src/store/useEditorStore.ts`

**Step 1: Update defaultSlide**

Add `screenshotCount: 1` to defaultSlide. No slots/deviceSlots by default (single mode uses flat fields).

**Step 2: Add toggle helpers**

When switching to count=2:
- Create `slots[0]` from flat fields, `slots[1]` with null screenshot
- Create `deviceSlots[0]` from flat fields, `deviceSlots[1]` with default duo values
- Set a default preset id

When switching to count=1:
- Copy `slots[0]` → flat `screenshotDataUrl`, `screenshotZoom`, etc.
- Copy `deviceSlots[0]` → flat `deviceOffset`, `deviceScale`, `deviceRotate`

**Step 3: Verify build**

Run: `npm run build`

---

### Task 4: Update FramePanel UI

**Files:**
- Modify: `src/components/Sidebar/FramePanel.tsx`
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/es/translation.json`

**Step 1: Add screenshot count toggle (① | ② chips)**

**Step 2: Add layout preset thumbnails section (visible when count=2)**

Show small visual thumbnails of each preset. Clicking applies preset values to `deviceSlots[]`.

**Step 3: Add per-device sliders**

When count=2, show two collapsible sections "Device 1" and "Device 2", each with Pos/Size/Rotate/Zoom sliders reading/writing `deviceSlots[i]` and `slots[i]`.

**Step 4: Add i18n strings**

**Step 5: Verify build**

Run: `npm run build`

---

### Task 5: Update UploadPanel for Dual Mode

**Files:**
- Modify: `src/components/Sidebar/UploadPanel.tsx`

**Step 1: Branch on screenshotCount**

When count=2, show two upload zones. Each writes to `slots[i].screenshotDataUrl`.

When count=1, keep current behavior.

**Step 2: Verify build**

Run: `npm run build`

---

### Task 6: Update SlideCanvas for Dual Rendering

**Files:**
- Modify: `src/components/Canvas/SlideCanvas.tsx`

**Step 1: Branch on screenshotCount**

Single mode: exact current code path (no changes).

Dual mode: loop over [0,1], compute per-device slotX/slotY/scale/rotate from `deviceSlots[i]`, render device frame + ScreenContent with `slots[i]` data.

**Step 2: Verify build**

Run: `npm run build`

---

### Task 7: Update ScreenContent for Slot-based Props

**Files:**
- Modify: `src/components/Canvas/ScreenContent.tsx`

**Step 1: Pass slot index context**

In dual mode, zoom/pan interactions update `slots[i]` instead of flat fields.

**Step 2: Verify build**

Run: `npm run build`

---

### Task 8: Update Export for Multiple Canvases

**Files:**
- Modify: `src/utils/export.ts`

**Step 1: Handle multiple WebGL canvases**

Query all `<canvas>` elements, composite each onto the output.

**Step 2: Verify build**

Run: `npm run build`

---

### Task 9: Update Project Save/Load

**Files:**
- Modify: `src/utils/project.ts`

**Step 1: Serialize/deserialize new fields**

Handle `screenshotCount`, `slots[]`, `deviceSlots[]`, `activePresetId`. Save slot images as separate files.

**Step 2: Verify build**

Run: `npm run build`

---

### Task 10: Final Verification

**Step 1: Run full build**

Run: `npm run build`

**Step 2: Run lint**

Run: `npm run lint`

**Step 3: Manual testing checklist**

- Single mode works unchanged
- Toggle to dual mode shows 2 devices
- Layout presets apply correctly
- Fine-tune sliders work per device
- Upload 2 different screenshots
- Export single slide
- Export all slides as ZIP
- Save/load project with dual slides
- Toggle back to single mode
- Old persisted state loads correctly

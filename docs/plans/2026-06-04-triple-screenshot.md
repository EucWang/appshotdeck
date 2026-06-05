# Triple Screenshot Support — Design Doc

## Summary

Extend the existing dual-screenshot system to support 3 screenshots per slide, with 4 trio layout presets, full tablet support, and WebGL context monitoring.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 3D frame in trio mode | Allowed, with WebGL context loss detection | User confirmed: alert + reload prompt |
| Downgrade from 3→1/2 | Silent discard of extra screenshots | User confirmed |
| Trio preset count | 4 presets | User confirmed |
| Tablet trio support | Yes | User confirmed |
| Device sliders UI | Show all 3 sets fully | User confirmed |

## Type Changes

### `src/types/index.ts`

- `Slide.screenshotCount`: `1 | 2` → `1 | 2 | 3`
- `LayoutPresetDef.screenshotCount`: `1 | 2` → `1 | 2 | 3`

No new entities needed — `ScreenshotSlot[]` and `DeviceSlot[]` just grow to length 3.

## State Transitions

All 6 transitions between states {1, 2, 3}:

| From → To | Slots handling | DeviceSlots |
|-----------|---------------|-------------|
| 1→2 | slot[0] from single fields, slot[1] empty | duo preset |
| 2→1 | slot[0] → single fields | clear |
| 1→3 | slot[0] from single fields, slot[1,2] empty | trio default preset |
| 2→3 | slots[0,1] kept, slot[2] empty | trio default preset |
| 3→1 | slot[0] → single fields, slot[1,2] discarded | clear |
| 3→2 | slots[0,1] kept, slot[2] discarded | duo default preset |

## Trio Layout Presets

### Portrait (phone, iPhone, iPad 13")

| ID | Name | devices[0] | devices[1] | devices[2] |
|----|------|-----------|-----------|-----------|
| `trio-row` | Row | {offset:20, offsetX:-18, scale:48, rotate:-5} | {offset:22, offsetX:0, scale:48, rotate:0} | {offset:24, offsetX:18, scale:48, rotate:5} |
| `trio-stack` | Stack | {offset:-12, offsetX:0, scale:38, rotate:0} | {offset:6, offsetX:0, scale:38, rotate:0} | {offset:24, offsetX:0, scale:38, rotate:0} |
| `trio-fan` | Fan | {offset:18, offsetX:-14, scale:50, rotate:-12} | {offset:24, offsetX:0, scale:55, rotate:0} | {offset:18, offsetX:14, scale:50, rotate:12} |
| `trio-pyramid` | Pyramid | {offset:8, offsetX:0, scale:42, rotate:0} | {offset:28, offsetX:-12, scale:44, rotate:-6} | {offset:28, offsetX:12, scale:44, rotate:6} |

### Landscape (tablet-7, tablet-10)

Same IDs with adjusted params for wider canvas — scale up, more horizontal spread.

## WebGL Context Loss Detection

When `screenshotCount === 3` and frame has `device3d`, wrap the `<Canvas>` with `onContextMenu` + listen for `webglcontextlost` event on each canvas. Show a toast/alert: "WebGL context lost. Please reload the page."

## Files to Modify

| File | Change |
|------|--------|
| `src/types/index.ts` | Extend `screenshotCount` type on Slide and LayoutPresetDef |
| `src/data/layoutPresets.ts` | Add 4 trio presets, update `presetsForCount` signature, add `defaultTrioPresetId` |
| `src/store/useEditorStore.ts` | Add `switchToTriple()`, refactor `toggleScreenshotCount` to handle 3 states |
| `src/components/Canvas/SlideCanvas.tsx` | Replace `isDual` with `count > 1`, render DeviceFrame × count |
| `src/components/Canvas/Device3D.tsx` | Add WebGL context loss detection |
| `src/components/Canvas/ScreenContent.tsx` | Replace `=== 2` with `> 1` for multi-slot path |
| `src/components/Sidebar/FramePanel.tsx` | Add "3" button, trio preset grid, 3× DeviceSliders, replace `isDual` |
| `src/components/Sidebar/UploadPanel.tsx` | Add `SlotUpload` for slotIndex=2 when count===3 |
| `src/locales/en/translation.json` | Add `screenshot_3`, `device_3`, trio preset names |
| `src/locales/es/translation.json` | Add Spanish translations |
| `src/utils/project.ts` | No structural change (already handles variable-length slots) |

## `isDual` Refactor Pattern

Every occurrence of `isDual` / `count === 2` needs replacement:

```typescript
// Before
const isDual = (slide.screenshotCount ?? 1) === 2

// After
const count = slide.screenshotCount ?? 1
const isMulti = count > 1
```

In `ScreenContent.tsx`, all `slide.screenshotCount === 2` checks become `> 1`.

## i18n Keys

```json
{
  "upload": {
    "screenshot_3": "Screenshot 3"
  },
  "frame": {
    "device_3": "Device 3",
    "trio_row": "Row",
    "trio_stack": "Stack",
    "trio_fan": "Fan",
    "trio_pyramid": "Pyramid",
    "webgl_context_lost": "WebGL context lost. Please reload the page."
  }
}
```

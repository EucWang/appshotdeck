# CLAUDE.md — AppShotDeck

## What this is

AppShotDeck is a browser-only marketing screenshot composer for Play Store and App Store. No backend. State lives in localStorage via Zustand persist. Export is DOM → PNG via html-to-image + WebGL compositing for 3D frames.

## Dev commands

```bash
npm run dev       # start dev server (Vite, port 5173)
npm run build     # tsc + vite build → dist/
npm run lint      # eslint
```

## Key architecture

### Frame system (`src/data/frames.ts`)

Two frame types, distinguished by whether `device3d` is present on the `FrameDef`:

- **Flat frames** (`outerRx` + optional `bezel`) — rendered via nested CSS divs in `SlideCanvas.tsx`.
- **3D frames** (`device3d: Device3DSpec`) — rendered via `Device3D.tsx` (WebGL). Body = `ExtrudeGeometry`, screen = `ShapeGeometry` with manually normalized UVs.

### SlideCanvas (`src/components/Canvas/SlideCanvas.tsx`)

- Always renders at full export resolution (e.g. 1080×1920). CSS `transform: scale()` shrinks it for preview.
- Branches on `frame.device3d` to choose flat CSS vs `<Device3D>`.
- `vbW` = viewBox width parsed from `frameViewBox` string — used to convert outerRx / bezelWidth from viewBox units to pixel units.
- `deviceScaleFactor = (slide.deviceScale ?? 100) / 100` — scales both slot dimensions uniformly.
- Portrait device Y: `Math.round((H - dSlotH) / 2) + Math.round(H * deviceOffset / 100)`. **0 = canvas center**, +30 = default layout position (below center).
- Landscape device X: same center-based formula using W. 0 = canvas center, +16 = default column position.

### Device3D (`src/components/Canvas/Device3D.tsx`)

Critical details for the 3D renderer:

- `flat` prop on `<Canvas>` is **required** — sets `gl.toneMapping = NoToneMapping`. Removing it triggers ACESFilmic which darkens the screenshot color.
- ExtrudeGeometry with `depth=0.068, bevel=0.016`: body mesh at z=-(depth/2) → world z range [-0.050, +0.050]. Screen mesh must be at z > 0.050 → currently `depth/2 + bevel + 0.001 = 0.051`. **Do not move screen behind the body bevel tip** — transparent body renders after opaque screen and will overdraw it.
- `SizeEnforcer` compares `el.width !== Math.round(w * dpr)` (device pixels). Required to avoid infinite resize loop on retina.
- `preserveDrawingBuffer: true` — required so `toDataURL()` works for export.

### Export (`src/utils/export.ts`)

- For **flat frames**: `html-to-image` (`toPng`) captures the full-res DOM element directly.
- For **3D frames**: WebGL content can't be captured by html-to-image. Fix: call `webglCanvas.toDataURL()` first (before html-to-image runs), then composite it on top of the DOM PNG using a `<canvas>` + `drawImage()`. Position is derived from `getBoundingClientRect()` divided by the CSS scale factor.
- **Critical**: the hidden export container in `App.tsx` must NOT use `visibility: hidden` — it's an inherited CSS property and makes html-to-image capture blank PNGs. Use `left: -9999px` only.

### Project save/load (`src/utils/project.ts`)

- Saves as ZIP: `config.json` (all slide settings) + `images/<id>.png` (one file per slide screenshot).
- Screenshots stored as real PNG files, not base64 in JSON.

### State (`src/store/useEditorStore.ts`)

- Zustand with `persist` middleware → localStorage.
- Key slide fields: `format`, `frame`, `frameTilt`, `screenshotDataUrl` (base64), `background`, `headline`, `subtitle`, `textColor`, `subtitleColor`, `textPosition`, `deviceOffset`, `deviceScale`, `showHeadline`, `showSubtitle`.
- New fields default: `deviceOffset` = 30 for portrait phones/iPad, 16 for tablets. `deviceScale` = 100. `showHeadline` / `showSubtitle` = true.
- Always add `?? default` fallbacks when reading new fields in components — old persisted slides won't have them.

### FramePanel device controls (`src/components/Sidebar/FramePanel.tsx`)

- **Pos slider** (-30 to +30): vertical offset for portrait (phones/iPad), horizontal for landscape (tablets). 0 = canvas center.
- **Size slider** (60–100%): scales device slot uniformly. Not available for ipad-13 (no — actually it IS available).
- **Center button**: sets deviceOffset = 0. `AlignCenterVertical` for portrait, `AlignCenterHorizontal` for landscape.
- **Reset button**: restores default offset (30 for phones/iPad, 16 for tablets).
- `DEFAULT_OFFSET` map drives reset values. `RESIZABLE_FORMATS` and `PORTRAIT_PHONE_FORMATS` sets control which controls appear.

## Format configs (SlideCanvas.tsx)

| Format | Canvas W×H | Slot W×H | ViewBox W |
|---|---|---|---|
| phone | 1080×1920 | 780×1686 | 390 |
| iphone-69 | 1320×2868 | 990×2148 | 393 |
| iphone-65 | 1242×2688 | 930×2020 | 393 |
| ipad-13 | 2048×2732 | 1440×1897 | 820 |
| tablet-7 | 1920×1080 | 1000×625 | 960 |
| tablet-10 | 2560×1440 | 1360×850 | 960 |

## Conventions

- No comments unless the WHY is non-obvious.
- Prefer editing existing files over creating new ones.
- Tailwind CSS v3 (not v4) — `tailwind.config.ts` is present.
- i18n via react-i18next — add new strings to `src/locales/en.json` and `es.json`.

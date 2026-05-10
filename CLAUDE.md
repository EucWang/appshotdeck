# CLAUDE.md — AppShotDeck

## What this is

AppShotDeck is a browser-only marketing screenshot composer for Play Store and App Store. No backend. State lives in localStorage via Zustand persist. Export is DOM → PNG via html-to-image.

## Dev commands

```bash
npm run dev       # start dev server (Vite, port 5173)
npm run build     # tsc + vite build → dist/
npm run lint      # eslint
```

## Key architecture

### Frame system (`src/data/frames.ts`)

Two frame types, distinguished by whether `device3d` is present on the `FrameDef`:

- **Flat frames** (`outerRx` + optional `bezel`) — rendered via nested CSS divs in `SlideCanvas.tsx`. Outer div = shell color + border-radius. Inner div = inset by bezel width.
- **3D frames** (`device3d: Device3DSpec`) — rendered via `Device3D.tsx` (WebGL). Body = `ExtrudeGeometry`, screen = `ShapeGeometry` with manually normalized UVs.

### SlideCanvas (`src/components/Canvas/SlideCanvas.tsx`)

- Always renders at full export resolution (e.g. 1080×1920). CSS `transform: scale()` shrinks it for preview.
- Branches on `frame.device3d` to choose flat CSS vs `<Device3D>`.
- `vbW` = viewBox width parsed from `frameViewBox` string — used to convert outerRx / bezelWidth from viewBox units to pixel units.

### Device3D (`src/components/Canvas/Device3D.tsx`)

Critical details for the 3D renderer:

- `flat` prop on `<Canvas>` is **required** — sets `gl.toneMapping = NoToneMapping`. Removing it triggers ACESFilmic which darkens the screenshot color.
- ExtrudeGeometry with `depth=0.068, bevel=0.016` creates geometry from local z = -bevel to z = depth + bevel. Body mesh at position z = -(depth/2) → world z range [-0.050, +0.050]. Screen mesh must be at z > 0.050 to clear the bevel tip — currently `depth/2 + bevel + 0.001 = 0.051`.
- Transparent body (opacity < 1) renders in the transparent pass, AFTER opaque screen. If body bevel tip is in front of the screen, it passes the depth test and draws over the screenshot. **Do not move the screen behind the body bevel tip.**
- `SizeEnforcer` compares `el.width !== Math.round(w * dpr)` (device pixels), not just `w`. Required to avoid an infinite resize loop on retina displays.
- `preserveDrawingBuffer: true` is set so `gl.domElement.toDataURL()` works for export.

### Export (`src/utils/export.ts`)

- Uses `html-to-image` (`toPng`) to capture the full-res DOM element.
- **Known limitation**: `html-to-image` cannot capture WebGL canvas content — slides using 3D frames will export as empty/blank canvas. Fix requires intercepting the WebGL canvas and compositing it separately.

### Project save/load (`src/utils/project.ts`)

- Saves as ZIP: `config.json` (all slide settings) + `images/<id>.png` (one file per slide screenshot).
- Screenshots are stored as real PNG files, not base64 in JSON.

### State (`src/store/useEditorStore.ts`)

- Zustand with `persist` middleware → localStorage.
- Key slide fields: `format`, `frame`, `frameTilt`, `screenshotDataUrl` (base64), `background`, `headline`, `subtitle`, `textColor`, `subtitleColor`, `textPosition`.

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

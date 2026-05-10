# AppShotDeck

A local, browser-only tool for composing Play Store and App Store marketing screenshots. Upload an app screenshot, wrap it in a device frame, add a headline and subtitle, set a background, and export at store-spec resolution — no server, no cloud, no account required.

## Features

- **Multi-format support** — Phone, Tablet 7", Tablet 10", iPhone 6.9", iPhone 6.5", iPad 13"
- **Device frames** — Minimal, Android flat, Android 3D (tilted), iPhone flat, iPhone 3D, iPad flat
- **3D frames** — Real-time WebGL rendering via Three.js with adjustable tilt angle
- **Background system** — 6 gradient presets, 6 solid presets, custom color/gradient picker
- **Text panel** — Headline + subtitle with color and top/bottom position control
- **Slide strip** — Up to 8 slides per project, duplicate/remove, per-slide format badge
- **Project save/load** — ZIP export (config.json + images/) and ZIP import
- **Export** — Single PNG or all slides as a ZIP organized by format folder
- **Persistent** — State survives hot reloads via localStorage (Zustand persist)
- **Offline-first** — All fonts bundled, no CDN dependencies

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v3 |
| State | Zustand (with persist middleware) |
| 3D rendering | Three.js + @react-three/fiber |
| Export | html-to-image + JSZip |
| Font | @fontsource/inter |
| Icons | lucide-react |
| Build | Vite |

## Supported Export Formats

| Store | Format | Resolution |
|---|---|---|
| Play Store | Phone | 1080 × 1920 |
| Play Store | Tablet 7" | 1920 × 1080 |
| Play Store | Tablet 10" | 2560 × 1440 |
| App Store | iPhone 6.9" | 1320 × 2868 |
| App Store | iPhone 6.5" | 1242 × 2688 |
| App Store | iPad 13" | 2048 × 2732 |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
src/
  components/
    Canvas/         # SlideCanvas, Device3D (WebGL), ScreenContent
    Sidebar/        # FramePanel, BackgroundPanel, TextPanel, UploadPanel
    SlideStrip.tsx  # Slide thumbnails strip
    Header.tsx      # Export buttons, project save/load
  data/
    frames.ts       # Frame definitions (flat + 3D specs)
    backgrounds.ts  # Preset backgrounds
  store/
    useEditorStore.ts  # Main editor state (Zustand + persist)
  utils/
    export.ts       # PNG / ZIP export logic
    project.ts      # Project save/load (ZIP format)
  locales/          # i18n strings (en, es)
```

## Architecture Notes

**Frame rendering** — Flat frames use nested CSS divs (outer div = shell, inner div = screen area). 3D frames use a WebGL canvas via `Device3D.tsx` with Three.js `ExtrudeGeometry` for the body and `ShapeGeometry` for the screen.

**Canvas scaling** — Slide canvases always render at full export resolution. A CSS `transform: scale()` shrinks them for the preview. `html-to-image` captures the full-res DOM element.

**Project format** — Screenshots are stored as real PNG files inside the ZIP (not base64 in JSON), keeping projects small and images directly accessible.

## License

MIT

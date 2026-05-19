# AppShotDeck

A local, browser-only tool for composing Play Store and App Store marketing screenshots. Upload an app screenshot, wrap it in a device frame, add a headline and subtitle, set a background, and export at store-spec resolution — no server, no cloud, no account required.

## Features

- **Multi-format support** — Phone, Tablet 7", Tablet 10", iPhone 6.9", iPhone 6.5", iPad 13"
- **Device frames** — Minimal (all formats), Android flat, Android 3D, iPhone flat, iPhone 3D, Android Tab, iPad
- **3D frames** — Real-time WebGL rendering via Three.js with adjustable tilt angle
- **Dual screenshots** — 1 or 2 screenshots per slide with layout presets (side-by-side, stacked, front-back, tilted)
- **Device controls** — Per-slide position (vertical/horizontal), size scale, rotation, and one-click canvas centering
- **Mockup styles** — 8 presets (default, glass-light, glass-dark, liquid-glass, inset-light, inset-dark, outline, border)
- **Border customization** — Shape (sharp/curved/round), radius, width, color
- **Shadow system** — 4 modes: none, spread, hug, adaptive (brightness-based)
- **Screenshot interaction** — Mouse wheel zoom (100–400%) and drag-to-pan with constrained range
- **Background system** — 6 gradient presets, 6 solid presets, custom color/gradient picker, image backgrounds with overlay, blur, and frosted effects
- **Typography** — Headline + subtitle with custom font family (system fonts), font size, weight (300–900), italic, color, and text vertical offset
- **Rich text highlighting** — Per-range color highlighting with visual text span selection
- **Text visibility** — Individual show/hide toggle for headline and subtitle
- **Slide strip** — Up to 8 slides, drag to reorder, duplicate/remove, per-slide format badge
- **Project save/load** — ZIP export (config.json + images/) and ZIP import, version 2
- **Export** — Single PNG or all slides as a ZIP organized by format folder
- **3D export** — WebGL canvas composited onto the DOM capture for pixel-accurate 3D frame exports
- **Persistent** — State survives hot reloads via localStorage (Zustand persist)
- **Offline-first** — All fonts bundled, no CDN dependencies
- **i18n** — English and Spanish UI

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
    Canvas/         # SlideCanvas, Device3D (WebGL), ScreenContent (zoom/pan)
    Sidebar/        # UploadPanel, FramePanel, StylePanel, BackgroundPanel, TextPanel
    SlideStrip.tsx  # Slide thumbnails strip (drag to reorder)
    Header.tsx      # Export buttons, project save/load
  data/
    frames.ts       # Frame definitions (flat + 3D specs)
    backgrounds.ts  # Preset backgrounds (gradient + solid)
    layoutPresets.ts # Layout presets for single/dual screenshot compositions
  store/
    useEditorStore.ts  # Main editor state (Zustand + persist)
    useThemeStore.ts   # Dark mode toggle
  utils/
    compress.ts     # Image compression (screenshots + backgrounds)
    export.ts       # PNG / ZIP export with WebGL compositing
    project.ts      # Project save/load (ZIP format, version 2)
    mockupStyle.ts  # Mockup CSS generator (border, shadow, opacity, glass)
    richtext.tsx    # Rich text span rendering with highlight colors
    fonts.ts        # System font detection and commercial license check
  locales/          # i18n strings (en, es)
```

## Architecture Notes

**Frame rendering** — Flat frames use nested CSS divs. 3D frames use a WebGL canvas via `Device3D.tsx` with Three.js `ExtrudeGeometry` for the body and `ShapeGeometry` for the screen.

**Dual screenshots** — Each slide supports 1 or 2 screenshots. Layout presets (`layoutPresets.ts`) define device positions, scales, and rotations for each mode. `FramePanel` toggles between modes with visual preset thumbnails.

**Device positioning** — Each slide has `deviceOffset` (0 = canvas center, ±30% range), `deviceScale` (40–100%), and `deviceRotate` (±180°). Portrait formats shift vertically; landscape tablets shift horizontally.

**Mockup styles** — 8 presets control the visual treatment of device frames (glass, inset, outline, border). Border shape/radius/width/color and shadow mode are independently adjustable. `mockupStyle.ts` generates all CSS properties.

**Screenshot zoom/pan** — Mouse wheel zooms the screenshot (100–400%). When zoomed >100%, drag-to-pan is enabled. Values stored as percentages and applied as CSS transforms in `ScreenContent.tsx`.

**Canvas scaling** — Slide canvases always render at full export resolution. A CSS `transform: scale()` shrinks them for the preview.

**Typography** — Text supports custom font family (detected from system via `queryLocalFonts()` API), font size, weight (300–900), italic, and vertical offset. Rich text highlighting applies per-range colors.

**Background system** — Supports solid colors, gradients, and image backgrounds. Image backgrounds can have color overlay with adjustable opacity, Gaussian blur (0–20px), and frosted glass effect.

**3D export** — WebGL content is captured via `canvas.toDataURL()` before `html-to-image` runs, then composited onto the DOM PNG at the correct pixel position.

**Project format** — Screenshots are stored as real PNG files inside the ZIP (not base64 in JSON). Version 2 format supports dual screenshots and image backgrounds.

## License

MIT

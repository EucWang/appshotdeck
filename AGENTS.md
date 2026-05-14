# AGENTS.md — AppShotDeck

## Project Overview

AppShotDeck is a browser-only marketing screenshot composer for Google Play Store and Apple App Store. No backend, no server. All state persists in localStorage via Zustand. Export renders DOM → PNG via `html-to-image`, with WebGL compositing for 3D device frames.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 (`@vitejs/plugin-react`) |
| State | Zustand 5 (`create` + `persist` middleware → localStorage) |
| 3D | Three.js + `@react-three/fiber` 9 + `@react-three/drei` 10 |
| Styling | Tailwind CSS v3 (`darkMode: 'class'`) + inline styles for canvas |
| i18n | react-i18next (en, es) |
| Export | `html-to-image` (toPng) + `jszip` (batch ZIP) |
| Icons | `lucide-react` |
| Font | `@fontsource/inter` (400, 600, 700) |

## Dev Commands

```bash
npm run dev       # Vite dev server, port 5173
npm run build     # tsc -b && vite build → dist/
npm run lint      # eslint .
```

Run `npm run build` to verify TypeScript compilation after changes. Run `npm run lint` before committing.

## Directory Structure

```
src/
├── main.tsx                  # Entry point, mounts <App /> in StrictMode
├── App.tsx                   # Root layout: Header + Sidebar + Canvas preview + SlideStrip + hidden export container
├── i18n.ts                   # i18next init with browser language detection
├── index.css                 # Tailwind layers + custom utility classes (surface, btn-ghost, etc.)
├── App.css                   # Unused Vite boilerplate — safe to delete
│
├── types/
│   └── index.ts              # Core types: Slide, EditorState, SlideFormat, FrameId, Background, TextPosition
│
├── store/
│   ├── useEditorStore.ts     # Zustand store: slides[], activeSlideId, CRUD + reorder
│   └── useThemeStore.ts      # Zustand store: isDark boolean + toggle
│
├── data/
│   ├── frames.ts             # FrameDef[] — flat CSS frames and 3D WebGL frames with Device3DSpec
│   └── backgrounds.ts        # Gradient and solid color presets
│
├── components/
│   ├── Header.tsx            # Top bar: export all, save/load project, language switch, dark mode toggle
│   ├── SlideStrip.tsx        # Bottom thumbnail strip: add/delete/duplicate/drag-reorder slides
│   ├── Canvas/
│   │   ├── SlideCanvas.tsx   # Full-resolution canvas renderer (forwardRef). Branches on frame.device3d
│   │   ├── Device3D.tsx      # Three.js WebGL 3D device shell (ExtrudeGeometry + ShapeGeometry)
│   │   └── ScreenContent.tsx # Screenshot <img> or placeholder text inside device frame
│   └── Sidebar/
│       ├── Sidebar.tsx       # Platform (Android/iOS) + format picker + tab navigation
│       ├── UploadPanel.tsx   # Image upload with drag-drop + compress
│       ├── FramePanel.tsx    # Frame selection + position/size/tilt sliders
│       ├── BackgroundPanel.tsx # Gradient/solid presets + custom color picker
│       └── TextPanel.tsx     # Headline/subtitle text, color, visibility toggle
│
├── utils/
│   ├── compress.ts           # Image compression: max 2048px, JPEG quality 0.88→0.3, ~900KB cap
│   ├── export.ts             # Single slide export or batch ZIP export with WebGL compositing
│   └── project.ts            # Save/load project as ZIP (config.json + images/*.png)
│
└── locales/
    ├── en/translation.json   # English strings
    └── es/translation.json   # Spanish strings
```

## Core Architecture

### State (`src/store/useEditorStore.ts`)

- Zustand with `persist` middleware → localStorage key `appshotdeck-editor`
- Central state: `slides: Slide[]` + `activeSlideId`
- Actions: `addSlide`, `duplicateSlide`, `removeSlide`, `setActiveSlide`, `updateSlide(id, patch)`, `reorderSlides`
- `defaultSlide(format)` creates a new slide with format-appropriate defaults
- **Always use `?? defaultValue` fallbacks** when reading new fields — old persisted slides lack newer properties

Key Slide fields: `format`, `frame`, `frameTilt`, `screenshotDataUrl`, `background`, `headline`, `subtitle`, `textColor`, `subtitleColor`, `textPosition`, `deviceOffset`, `deviceScale`, `showHeadline`, `showSubtitle`

### Frame System (`src/data/frames.ts`)

Two frame types, distinguished by `device3d` on `FrameDef`:

- **Flat frames** (`outerRx` + optional `bezel`) — rendered via nested CSS divs in `SlideCanvas.tsx`
- **3D frames** (`device3d: Device3DSpec`) — rendered via `Device3D.tsx` (WebGL). Body = `ExtrudeGeometry`, screen = `ShapeGeometry` with manually normalized UVs

### SlideCanvas (`src/components/Canvas/SlideCanvas.tsx`)

- Always renders at full export resolution. CSS `transform: scale()` shrinks for preview
- `vbW` = viewBox width from `frameViewBox` string — converts outerRx/bezelWidth from viewBox units to pixels
- `deviceScaleFactor = (slide.deviceScale ?? 100) / 100` — scales slot dimensions uniformly
- Portrait device Y: `Math.round((H - dSlotH) / 2) + Math.round(H * deviceOffset / 100)`. 0 = canvas center, +30 = default
- Landscape device X: same center-based formula. 0 = center, +16 = default

### Device3D (`src/components/Canvas/Device3D.tsx`)

- `<Canvas flat>` is **required** — sets `NoToneMapping`. Removing it causes ACESFilmic darkening
- ExtrudeGeometry: `depth=0.068, bevel=0.016`, body at z=-(depth/2). Screen at z > depth/2 + bevel
- `SizeEnforcer` prevents infinite resize loop on retina displays
- `preserveDrawingBuffer: true` — required for `toDataURL()` during export

### Export (`src/utils/export.ts`)

- **Flat frames**: `html-to-image` captures DOM directly
- **3D frames**: WebGL content can't be captured by html-to-image. `webglCanvas.toDataURL()` runs first, then composited on top of the DOM PNG via `<canvas>` + `drawImage()`. Position derived from `getBoundingClientRect()` / CSS scale factor
- **Hidden export container** in `App.tsx` uses `left: -9999px` only — do NOT use `visibility: hidden` (inherited, causes blank captures)

### Project Save/Load (`src/utils/project.ts`)

- Saves as ZIP: `config.json` (all slide settings minus screenshots) + `images/<id>.png` (real PNG files)
- Screenshots stored as actual files, not base64 in JSON

### Image Compression (`src/utils/compress.ts`)

- Max dimension: 2048px on longest side
- JPEG quality starts at 0.88, steps down to 0.3
- Target: ~900KB per image base64 (~7.2MB theoretical max for 8 slides)

## Format Configurations

| Format | Canvas W×H | Slot W×H | ViewBox W | Orientation |
|---|---|---|---|---|
| phone | 1080×1920 | 780×1686 | 390 | Portrait |
| iphone-69 | 1320×2868 | 990×2148 | 393 | Portrait |
| iphone-65 | 1242×2688 | 930×2020 | 393 | Portrait |
| ipad-13 | 2048×2732 | 1440×1897 | 820 | Portrait |
| tablet-7 | 1920×1080 | 1000×625 | 960 | Landscape |
| tablet-10 | 2560×1440 | 1360×850 | 960 | Landscape |

## Conventions

- No comments unless the WHY is non-obvious
- Prefer editing existing files over creating new ones
- Tailwind CSS v3 (not v4) — `tailwind.config.ts` is present, `darkMode: 'class'`
- i18n via react-i18next — add new user-facing strings to `src/locales/en/translation.json` and `src/locales/es/translation.json`
- Custom Tailwind component classes defined in `src/index.css` under `@layer components`: `surface`, `surface-app`, `border-subtle`, `border-medium`, `text-muted`, `text-dim`, `text-soft`, `btn-ghost`, `option-idle`
- All new Slide fields must have `?? defaultValue` fallbacks when read in components (old persisted state)
- Default offsets: 30 for portrait phones/iPad, 16 for landscape tablets
- Default device scale: 100
- Default `showHeadline`/`showSubtitle`: true

## Code Review Checklist

每次执行审核任务时，必须逐项检查以下 5 项：

1. **代码修改是否正确？** — 语法、类型、import、拼写无误；变更范围与目标一致，无遗漏文件
2. **逻辑是否正确？** — 数据流、状态更新、边界条件、fallback 值、向后兼容性均正确；不会产生死代码或不可达分支
3. **是否会引发其他问题？会不会导致崩溃？** — 不会引入空指针、未定义属性访问、运行时异常；不会破坏已有功能（持久化数据兼容、导出、3D 渲染等）
4. **是否会有性能问题？** — 不会在 render 路径中引入不必要的计算、re-render、内存泄漏或大量对象创建
5. **UI 改动是否符合当前项目中的 UI 样式和主题？** — 新增控件必须与已有组件保持一致的 Tailwind class 模式、间距、字号、颜色变量（`text-muted`/`text-dim`/`border-subtle` 等）、图标尺寸（lucide `size={14}`）、布局结构

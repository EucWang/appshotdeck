# Background Image Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add background image support to AppShotDeck with overlay, blur, and frosted glass effects.

**Architecture:** Extend the existing `Background` discriminated union type with an `image` variant. Rendering uses a multi-layer approach in `SlideCanvas` (image → frosted → overlay → content). Background images are compressed to ~400KB via existing pipeline, stored as base64 in state, and extracted to files in project ZIP.

**Tech Stack:** React 19, TypeScript 6, Zustand 5, Tailwind CSS v3, html-to-image, jszip

---

## Task 1: Extend Types and Compression Utility

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/utils/compress.ts`

### Step 1: Add `image` variant to `Background` type

Replace the `Background` type in `src/types/index.ts`:

```typescript
export type Background =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; angle: number }
  | { type: 'image'; dataUrl: string; overlayColor: string; overlayOpacity: number; blur: number; frosted: number }
```

### Step 2: Add `compressBackgroundImage` function

In `src/utils/compress.ts`, add (reuses MAX_DIMENSION, outputs JPEG, targets ~400KB):

```typescript
const BG_MAX_BYTES = 400_000

export function compressBackgroundImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = reject
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const target = BG_MAX_BYTES * 1.37
      let quality = 0.88
      let result = canvas.toDataURL('image/jpeg', quality)
      while (result.length > target && quality > 0.3) {
        quality = Math.round((quality - 0.08) * 100) / 100
        result = canvas.toDataURL('image/jpeg', quality)
      }
      resolve(result)
    }
    img.src = dataUrl
  })
}
```

### Step 3: Verify and commit

```bash
npm run build
git add src/types/index.ts src/utils/compress.ts
git commit -m "feat: add image variant to Background type and compressBackgroundImage utility"
```

---

## Task 2: Update SlideCanvas Rendering

**Files:**
- Modify: `src/components/Canvas/SlideCanvas.tsx`

### Step 1: Add noise texture generator (after imports)

```typescript
let _noiseDataUrl: string | null = null

// browser-only: uses document.createElement('canvas')
function getNoiseDataUrl(): string {
  if (_noiseDataUrl) return _noiseDataUrl
  const size = 100
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(size, size)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.random() * 255
    imageData.data[i] = v
    imageData.data[i + 1] = v
    imageData.data[i + 2] = v
    imageData.data[i + 3] = 25
  }
  ctx.putImageData(imageData, 0, 0)
  _noiseDataUrl = canvas.toDataURL('image/png')
  return _noiseDataUrl
}
```

### Step 2: Replace `bgStyle` with `BackgroundLayers` component

Delete the `bgStyle` function. Add:

```typescript
function BackgroundLayers({ bg }: { bg: Slide['background'] }) {
  if (bg.type === 'solid') {
    return <div style={{ position: 'absolute', inset: 0, background: bg.color }} />
  }
  if (bg.type === 'gradient') {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`,
      }} />
    )
  }
  const blur = bg.blur ?? 0
  const frosted = bg.frosted ?? 0
  const overlayOpacity = (bg.overlayOpacity ?? 40) / 100
  return (
    <>
      <div style={{
        position: 'absolute',
        inset: blur > 0 ? -blur * 3 : 0,
        backgroundImage: `url(${bg.dataUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
      }} />
      {frosted > 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(255, 255, 255, ${frosted / 100 * 0.35})`,
          backgroundImage: `url(${getNoiseDataUrl()})`,
          backgroundRepeat: 'repeat',
          backgroundBlendMode: 'overlay',
        }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: bg.overlayColor ?? '#000000',
        opacity: overlayOpacity,
      }} />
    </>
  )
}
```

### Step 3: Update root div in SlideCanvas

- Remove `...bgStyle(slide.background)` from root div style
- Add `<BackgroundLayers bg={slide.background} />` as first child
- Keep `overflow: 'hidden'` in root div style

### Step 4: Verify and commit

```bash
npm run build
git add src/components/Canvas/SlideCanvas.tsx
git commit -m "feat: add multi-layer background rendering with image, blur, and frosted support"
```

---

## Task 3: Update BackgroundPanel UI

**Files:**
- Modify: `src/components/Sidebar/BackgroundPanel.tsx`

### Step 1: Update imports

```typescript
import { useCallback, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../store/useEditorStore'
import { GRADIENT_PRESETS, SOLID_PRESETS } from '../../data/backgrounds'
import { compressBackgroundImage } from '../../utils/compress'
import type { Background } from '../../types'
```

### Step 2: Update `bgPreviewStyle` to handle image type

```typescript
function bgPreviewStyle(bg: Background): React.CSSProperties {
  if (bg.type === 'solid') return { background: bg.color }
  if (bg.type === 'gradient') return { background: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})` }
  return { backgroundImage: `url(${bg.dataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
}
```

### Step 3: Add shared upload handler with loading state

Inside the `BackgroundPanel` component, add:

```typescript
const [compressing, setCompressing] = useState(false)

const handleBgImageUpload = useCallback(async (file: File) => {
  setCompressing(true)
  try {
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const compressed = await compressBackgroundImage(dataUrl)
    updateSlide(activeSlideId, {
      background: bg.type === 'image'
        ? { ...bg, dataUrl: compressed }
        : { type: 'image', dataUrl: compressed, overlayColor: '#000000', overlayOpacity: 40, blur: 0, frosted: 0 },
    })
  } finally {
    setCompressing(false)
  }
}, [activeSlideId, updateSlide, bg])

const openBgImagePicker = useCallback(() => {
  if (compressing) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) handleBgImageUpload(file)
  }
  input.click()
}, [compressing, handleBgImageUpload])
```

### Step 4: Add Image button to toggle row (3rd button)

After the Gradient button, add a third button. Uses `openBgImagePicker` and shows `Loader2` when compressing.

### Step 5: Add image-specific controls after gradient controls

Thumbnail with replace overlay, overlay color picker, opacity slider, blur slider (0-20px), frosted slider (0-100%).

### Step 6: Verify and commit

```bash
npm run build
git add src/components/Sidebar/BackgroundPanel.tsx
git commit -m "feat: add background image upload UI with overlay, blur, and frosted controls"
```

---

## Task 4: Update Project Save/Load

**Files:**
- Modify: `src/utils/project.ts`

### Step 1: Update save to extract background image dataUrl

In `saveProject`, after screenshot handling, check `slide.background.type === 'image'` and extract `dataUrl` to separate file (`images/bg-{idx+1}.jpg`). Replace `dataUrl` with file path in JSON.

### Step 2: Update load to restore background image dataUrl

In `loadProject`, detect `background.dataUrl` that starts with `images/`, read from ZIP, restore as `data:image/jpeg;base64,{base64}`. Apply fallback values for overlay/blur/frosted.

### Step 3: Verify and commit

```bash
npm run build
git add src/utils/project.ts
git commit -m "feat: save/load background images in project ZIP files"
```

---

## Task 5: Add i18n Translations

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/es/translation.json`

Add 8 new keys to `background` section in both files: `image`, `overlay_color`, `overlay_opacity`, `blur`, `frosted`, `replace_image`, `compressing`.

```bash
npm run build
git add src/locales/
git commit -m "feat: add i18n translations for background image feature"
```

---

## Task 6: Final Verification

```bash
npm run build
npm run lint
```

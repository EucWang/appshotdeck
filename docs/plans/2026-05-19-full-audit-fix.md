# AppShotDeck 全项目审查修复计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复全项目审查中发现的所有崩溃缺陷、功能缺陷、性能问题和代码质量问题

**Architecture:** 按批次修复 — 第一批修崩溃/lint、第二批修功能缺陷、第三批修性能和清理。每批完成后 `npm run build && npm run lint` 验证

**Tech Stack:** React 19 + TypeScript + Zustand 5 + Three.js + Tailwind v3 + react-i18next

---

## 第一批：修复崩溃和 Lint 错误

### Task 1: 修复 BackgroundPanel useState 违反 Hooks 规则

**Files:**
- Modify: `src/components/Sidebar/BackgroundPanel.tsx:54-58`

**Step 1: 移动 useState 到 early return 之前**

将第58行的 `const [activeCat, setActiveCat] = useState(BACKGROUND_CATEGORIES[0].id)` 移动到第54行 `const slide = ...` 之前。

修改前:
```tsx
  const slide = slides.find((s) => s.id === activeSlideId)
  if (!slide) return null

  const bg = slide.background
  const [activeCat, setActiveCat] = useState(BACKGROUND_CATEGORIES[0].id)
```

修改后:
```tsx
  const [activeCat, setActiveCat] = useState(BACKGROUND_CATEGORIES[0].id)

  const slide = slides.find((s) => s.id === activeSlideId)
  if (!slide) return null

  const bg = slide.background
```

**Step 2: 验证**
Run: `npm run lint`
Expected: BackgroundPanel 的 useState 条件调用错误消失

---

### Task 2: 修复 useEditorStore 初始 activeSlideId + lint 警告

**Files:**
- Modify: `src/store/useEditorStore.ts:148-151,285-286`

**Step 2a: 修复初始 activeSlideId**

修改前 (line 148-151):
```ts
      return {
        slides: [defaultSlide('phone')],
        activeSlideId: '',
        activeOverlayId: null as string | null,
```

修改后:
```ts
      const initialSlide = defaultSlide('phone')
      return {
        slides: [initialSlide],
        activeSlideId: initialSlide.id,
        activeOverlayId: null as string | null,
```

**Step 2b: 修复 _undoCount / _redoCount lint 警告**

这两个字段在 `EditorState` 类型中定义为 `number`，在 store 中赋值为 0，但 lint 报 "assigned but never used"。它们实际上通过 `originalSet` 更新后被组件读取。在 `partialize` 中已排除。

解决方法：在 `_undoCount: 0` 和 `_redoCount: 0` 上方添加 eslint 忽略注释，因为它们是通过 `originalSet({ _undoCount: ..., _redoCount: ... })` 间接使用的。

```ts
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _undoCount: 0,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _redoCount: 0,
```

**Step 3: 验证**
Run: `npm run lint`
Expected: useEditorStore 的 lint 错误消失

---

### Task 3: 修复 Device3D Texture 内存泄漏

**Files:**
- Modify: `src/components/Canvas/Device3D.tsx:116-121`

**Step 1: 添加 texture dispose cleanup**

修改前 (line 116-121):
```tsx
  const texture = useMemo(() => {
    if (!screenshotDataUrl) return null
    const tex = new THREE.TextureLoader().load(screenshotDataUrl)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [screenshotDataUrl])
```

修改后:
```tsx
  const texture = useMemo(() => {
    if (!screenshotDataUrl) return null
    const tex = new THREE.TextureLoader().load(screenshotDataUrl)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [screenshotDataUrl])

  useEffect(() => {
    return () => { if (texture) texture.dispose() }
  }, [texture])
```

确保 `useEffect` 已从 React 导入（文件顶部检查 import）。

**Step 2: 验证**
Run: `npm run build`
Expected: 编译通过

---

### Task 4: 修复 deviceOffsetX 数据迁移缺失

**Files:**
- Modify: `src/store/useEditorStore.ts:78-84,100-114`

**Step 1: 在 deviceSlotFromSlide 中添加 deviceOffsetX**

修改前 (line 78-84):
```ts
export function deviceSlotFromSlide(slide: Slide): DeviceSlot {
  return {
    deviceOffset: slide.deviceOffset,
    deviceScale: slide.deviceScale,
    deviceRotate: slide.deviceRotate ?? 0,
  }
}
```

修改后:
```ts
export function deviceSlotFromSlide(slide: Slide): DeviceSlot {
  return {
    deviceOffset: slide.deviceOffset,
    deviceOffsetX: slide.deviceOffsetX ?? 0,
    deviceScale: slide.deviceScale,
    deviceRotate: slide.deviceRotate ?? 0,
  }
}
```

注意：需确认 `Slide` 类型有 `deviceOffsetX` 字段。当前 `types/index.ts` 中没有此字段，需要添加。

**Step 2: 在 Slide 类型中添加 deviceOffsetX**

在 `src/types/index.ts` 的 Slide 接口中，在 `deviceOffset: number` (line 92) 之后添加:
```ts
  deviceOffsetX?: number
```

**Step 3: 在 switchToSingle 中迁移 deviceOffsetX**

修改前 (line 100-114):
```ts
function switchToSingle(slide: Slide): Partial<Slide> {
  const slot0 = slide.slots?.[0]
  const dev0 = slide.deviceSlots?.[0]
  return {
    screenshotCount: 1,
    screenshotDataUrl: slot0?.screenshotDataUrl ?? slide.screenshotDataUrl,
    screenshotZoom: slot0?.screenshotZoom ?? slide.screenshotZoom,
    screenshotOffsetX: slot0?.screenshotOffsetX ?? slide.screenshotOffsetX,
    screenshotOffsetY: slot0?.screenshotOffsetY ?? slide.screenshotOffsetY,
    deviceOffset: dev0?.deviceOffset ?? slide.deviceOffset,
    deviceScale: dev0?.deviceScale ?? slide.deviceScale,
    deviceRotate: dev0?.deviceRotate ?? slide.deviceRotate,
    activePresetId: null,
  }
}
```

修改后:
```ts
function switchToSingle(slide: Slide): Partial<Slide> {
  const slot0 = slide.slots?.[0]
  const dev0 = slide.deviceSlots?.[0]
  return {
    screenshotCount: 1,
    screenshotDataUrl: slot0?.screenshotDataUrl ?? slide.screenshotDataUrl,
    screenshotZoom: slot0?.screenshotZoom ?? slide.screenshotZoom,
    screenshotOffsetX: slot0?.screenshotOffsetX ?? slide.screenshotOffsetX,
    screenshotOffsetY: slot0?.screenshotOffsetY ?? slide.screenshotOffsetY,
    deviceOffset: dev0?.deviceOffset ?? slide.deviceOffset,
    deviceOffsetX: dev0?.deviceOffsetX ?? slide.deviceOffsetX ?? 0,
    deviceScale: dev0?.deviceScale ?? slide.deviceScale,
    deviceRotate: dev0?.deviceRotate ?? slide.deviceRotate,
    activePresetId: null,
  }
}
```

**Step 4: 在 defaultSlide 中初始化 deviceOffsetX**

在 `defaultSlide` 函数中，在 `deviceScale: 100,` 之后添加:
```ts
    deviceOffsetX: 0,
```

**Step 5: 验证**
Run: `npm run build`
Expected: 编译通过

---

### Checkpoint 1

Run: `npm run build && npm run lint`
Expected: 0 errors, 构建成功

---

## 第二批：修复功能缺陷

### Task 5: 添加 i18n 缺失翻译并替换硬编码字符串

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/es/translation.json`
- Modify: `src/components/Sidebar/FramePanel.tsx`
- Modify: `src/components/Sidebar/TextPanel.tsx`
- Modify: `src/components/Sidebar/Sidebar.tsx`

**Step 1: 在 en/translation.json 的 frame 对象中添加:**
```json
"reset_position": "Reset",
"reset_to_default": "Reset to default",
"reset_size": "Reset size",
"reset_rotation": "Reset rotation",
"reset_tilt": "Reset tilt"
```

在 text 对象中添加:
```json
"reset_size": "Reset to default size",
"reset_y_offset": "Reset Y offset",
"reset_x_offset": "Reset X offset"
```

在 sidebar 对象中添加:
```json
"beta_badge": "Beta"
```

**Step 2: 在 es/translation.json 中添加对应西班牙语翻译**

frame 对象中添加:
```json
"reset_position": "Restablecer",
"reset_to_default": "Restablecer al valor predeterminado",
"reset_size": "Restablecer tamaño",
"reset_rotation": "Restablecer rotación",
"reset_tilt": "Restablecer inclinación"
```

text 对象中添加:
```json
"reset_size": "Restablecer al tamaño predeterminado",
"reset_y_offset": "Restablecer desplazamiento Y",
"reset_x_offset": "Restablecer desplazamiento X"
```

sidebar 对象中添加:
```json
"beta_badge": "Beta"
```

**Step 3: 替换 FramePanel.tsx 中的硬编码字符串**

找到所有 `title="Reset"`, `title="Reset to default"`, `title="Reset size"`, `title="Reset rotation"`, `title="Reset tilt"` 并替换为对应的 `title={t('frame.reset_*')}`。注意 FramePanel 组件中已有 `const { t } = useTranslation()` 调用。

**Step 4: 替换 TextPanel.tsx 中的硬编码字符串**

找到 `title="Reset to default size"`, `title="Reset Y offset"`, `title="Reset X offset"` 并替换为 `title={t('text.reset_*')}`。

**Step 5: 替换 Sidebar.tsx 中的硬编码 "Beta"**

将 `Beta` 替换为 `{t('sidebar.beta_badge')}`。

**Step 6: 验证**
Run: `npm run build`
Expected: 编译通过

---

### Task 6: 修复 STYLE_FIELDS 缺失字段

**Files:**
- Modify: `src/store/useEditorStore.ts:53-67`

**Step 1: 将缺失字段添加到 STYLE_FIELDS**

修改后:
```ts
const STYLE_FIELDS: (keyof Slide)[] = [
  'background', 'frame', 'frameTilt',
  'mockupStyle',
  'borderShape', 'borderRadius', 'borderWidth', 'borderColor',
  'shadowMode', 'shadowPercentX', 'shadowPercentY',
  'mockupOpacity',
  'screenshotBrightness', 'screenshotContrast', 'screenshotSaturation',
  'textColor', 'subtitleColor', 'textFontFamily',
  'headlineFontSize', 'subtitleFontSize',
  'headlineFontWeight', 'subtitleFontWeight',
  'headlineItalic', 'subtitleItalic',
  'headlineHighlightColor', 'subtitleHighlightColor',
  'textPosition', 'textOffsetY', 'textOffsetX',
  'screenshotCount', 'deviceSlots', 'activePresetId',
  'showGrid', 'showSafeArea',
]
```

注意：不添加 `overlays`，因为“应用样式到全部”不应复制 overlay 图标（那是每个 slide 独立的内容）。不添加 `deviceOffset`/`deviceScale`/`deviceRotate` 因为这些是 device positioning，已通过 `deviceSlots` 在双截图模式中传递。

**Step 2: 验证**
Run: `npm run build`
Expected: 编译通过

---

### Task 7: 修复 SlideCanvas 缺失的 ?? defaultValue fallback

**Files:**
- Modify: `src/components/Canvas/SlideCanvas.tsx`

**Step 1: 搜索所有直接读取 slide 字段而无 fallback 的地方**

需要检查的关键字段和 fallback 值：
- `deviceScale` → `?? 100`
- `deviceOffset` → `?? 30`（竖屏）或 `?? 16`（横屏）
- `frameTilt` → `?? 18`
- `screenshotZoom` → `?? 100`
- `screenshotOffsetX` → `?? 0`
- `screenshotOffsetY` → `?? 0`
- `mockupStyle` → `?? 'default'`
- `mockupOpacity` → `?? 100`
- `borderRadius` → `?? 20`
- `borderWidth` → `?? 2`

逐个检查代码中构造 `DeviceSlot`/`ScreenshotSlot` 对象的地方，确保所有字段有 fallback。

**Step 2: 验证**
Run: `npm run build`
Expected: 编译通过

---

### Task 8: 修复 project.ts MIME 类型硬编码

**Files:**
- Modify: `src/utils/project.ts:143`

**Step 1: 修改背景图片 MIME 类型处理**

修改前 (约 line 143):
```ts
dataUrl: `data:image/jpeg;base64,${bgBase64}`,
```

修改后：保存时记录原始格式，或统一使用 PNG：
```ts
dataUrl: `data:image/png;base64,${bgBase64}`,
```

注意：由于 `compressBackgroundImage` 函数使用 `toDataURL('image/jpeg')` 压缩，实际保存的是 JPEG。更好的方案是保存原始 MIME 类型到 project JSON 中，但这会影响项目版本兼容性。最简方案是统一改为 JPEG（因为 compress 已经转为 JPEG）。

实际上查看 compress.ts 中的 `compressBackgroundImage`，它确实输出 JPEG，所以 `data:image/jpeg` 是正确的。此问题可能是误报 — 需要确认。

**验证方法：** 检查 `compressBackgroundImage` 的输出格式，如果是 JPEG 则当前代码正确，跳过此 task。

---

### Checkpoint 2

Run: `npm run build && npm run lint`
Expected: 0 errors, 构建成功

---

## 第三批：性能和清理

### Task 9: 缓存 bgBrightness 计算

**Files:**
- Modify: `src/components/Canvas/SlideCanvas.tsx`

**Step 1: 用 useMemo 缓存 bgBrightness**

在 SlideCanvas 组件中，找到 `bgBrightness(slide)` 被调用的地方（约 4 处），改为组件顶部:

```tsx
const brightness = useMemo(() => bgBrightness(slide), [slide.background])
```

然后将 4 处调用替换为 `brightness` 变量。确保 `useMemo` 已从 React 导入。

**Step 2: 验证**
Run: `npm run build`
Expected: 编译通过

---

### Task 10: 共享 Device3D 常量

**Files:**
- Modify: `src/components/Canvas/Device3D.tsx:75-76,176-177`

**Step 1: 将 PhoneModel 和 SizeEnforcer 共用的常量提取到模块级别**

在文件顶部（imports 之后）添加:
```ts
const MODEL_DEPTH = 0.068
const MODEL_BEVEL = 0.016
```

然后在 PhoneModel 中将 `const depth = 0.068` 改为 `const depth = MODEL_DEPTH`，`const bevel = 0.016` 改为 `const bevel = MODEL_BEVEL`。同样更新 SizeEnforcer 中的引用。

**Step 2: 验证**
Run: `npm run build`
Expected: 编译通过

---

### Task 11: 清理未使用的翻译 key

**Files:**
- Modify: `src/locales/en/translation.json`
- Modify: `src/locales/es/translation.json`

**Step 1: 删除未使用的翻译 key**

在 text 对象中删除:
- `font_loading`
- `select_text_hint`
- `position`
- `position_top`
- `position_bottom`

注意：先确认这些 key 确实没有被任何代码引用（通过 grep 验证）。

**Step 2: 验证**
Run: `npm run build`
Expected: 编译通过

---

### Task 12: 修复 _noiseDataUrl 模块级状态

**Files:**
- Modify: `src/components/Canvas/SlideCanvas.tsx:34`

**Step 1: 将模块级 `let _noiseDataUrl` 改为组件内 useRef**

修改前:
```ts
let _noiseDataUrl: string | null = null
```

修改后: 移除模块级变量，在 SlideCanvas 组件内使用:
```tsx
const noiseDataUrlRef = useRef<string | null>(null)
```

然后替换所有 `_noiseDataUrl` 引用为 `noiseDataUrlRef.current`。

**Step 2: 验证**
Run: `npm run build`
Expected: 编译通过

---

### Final Checkpoint

Run: `npm run build && npm run lint`
Expected: 0 errors, 0 warnings, 构建成功

---

## 不修复的项目（附原因）

| 项目 | 原因 |
|------|------|
| Bundle size 1.39MB | 非功能性缺陷，需单独优化迭代 |
| HTML5 Drag API 不支持触屏 | 需引入 touch-dnd 库，属于新功能 |
| aria-label 缺失 | 属于渐进式改进，非缺陷 |
| Blob URL 5秒 revoke | 实际场景中极少出问题 |
| compress.ts 无迭代上限 | 实际不会发生（JPEG 质量递减保证收敛） |

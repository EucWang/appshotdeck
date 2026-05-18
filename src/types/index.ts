export type SlideFormat =
  // Android / Play Store
  | 'phone'
  | 'tablet-7'
  | 'tablet-10'
  // iOS / App Store
  | 'iphone-69'
  | 'iphone-65'
  | 'ipad-13'

export type FrameId =
  | 'minimal'
  | 'android-flat'
  | 'android-3d'
  | 'tablet-flat'
  | 'tablet-none'
  | 'ios-flat'
  | 'ios-3d'
  | 'ios-ipad'

export type Background =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; angle: number }
  | { type: 'image'; dataUrl: string; overlayColor: string; overlayOpacity: number; blur: number; frosted: number }

export type TextFont = string

export type TextPosition = 'top' | 'bottom'

export interface TextSpan {
  start: number
  end: number
  color: string
}

export interface ScreenshotSlot {
  screenshotDataUrl: string | null
  screenshotZoom: number
  screenshotOffsetX: number
  screenshotOffsetY: number
}

export interface DeviceSlot {
  deviceOffset: number
  deviceOffsetX?: number
  deviceScale: number
  deviceRotate: number
}

export interface LayoutPresetDef {
  id: string
  screenshotCount: 1 | 2
  devices: DeviceSlot[]
}

export interface Slide {
  id: string
  format: SlideFormat
  screenshotDataUrl: string | null
  frame: FrameId
  background: Background
  headline: string
  subtitle: string
  textColor: string
  subtitleColor: string
  frameTilt: number
  textPosition: TextPosition
  deviceOffset: number
  deviceScale: number
  deviceRotate?: number
  showHeadline: boolean
  showSubtitle: boolean
  headlineFontSize?: number
  subtitleFontSize?: number
  textFontFamily?: TextFont
  headlineFontWeight?: number
  subtitleFontWeight?: number
  headlineItalic?: boolean
  subtitleItalic?: boolean
  headlineSpans?: TextSpan[]
  subtitleSpans?: TextSpan[]
  headlineHighlightColor?: string
  subtitleHighlightColor?: string
  screenshotZoom?: number
  screenshotOffsetX?: number
  screenshotOffsetY?: number
  textOffsetY?: number
  screenshotCount?: 1 | 2
  slots?: ScreenshotSlot[]
  deviceSlots?: DeviceSlot[]
  activePresetId?: string | null
}

export interface EditorState {
  slides: Slide[]
  activeSlideId: string
  addSlide: () => void
  duplicateSlide: (id: string) => void
  removeSlide: (id: string) => void
  setActiveSlide: (id: string) => void
  updateSlide: (id: string, patch: Partial<Slide>) => void
  reorderSlides: (fromIndex: number, toIndex: number) => void
}

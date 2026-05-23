import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DeviceSlot, EditorState, FrameId, ScreenshotSlot, Slide, SlideFormat } from '../types'
import { defaultDualPresetId, presetById } from '../data/layoutPresets'

export function defaultFrameForFormat(format: SlideFormat): FrameId {
  switch (format) {
    case 'phone':      return 'minimal'
    case 'tablet-7':
    case 'tablet-10':  return 'tablet-none'
    case 'iphone-69':
    case 'iphone-65':  return 'ios-flat'
    case 'ipad-13':    return 'ios-ipad'
  }
}

const defaultSlide = (format: SlideFormat = 'phone'): Slide => ({
  id: crypto.randomUUID(),
  format,
  screenshotDataUrl: null,
  frame: defaultFrameForFormat(format),
  background: { type: 'gradient', from: '#0F172A', to: '#1E3A5F', angle: 135 },
  headline: 'Your App Headline',
  subtitle: 'Short supporting description',
  textColor: '#ffffff',
  subtitleColor: '#ffffff',
  frameTilt: 18,
  textPosition: 'top',
  textOffsetY: -44,
  deviceOffset: ['phone', 'iphone-69', 'iphone-65', 'ipad-13'].includes(format) ? 30 : 16,
  deviceOffsetX: 0,
  deviceScale: 100,
  showHeadline: true,
  showSubtitle: true,
  headlineSpans: [],
  subtitleSpans: [],
  headlineHighlightColor: '#FFD700',
  subtitleHighlightColor: '#FFD700',
  screenshotCount: 1,
  mockupStyle: 'default',
  borderShape: 'curved',
  borderRadius: 20,
  borderWidth: 2,
  borderColor: 'rgba(255,255,255,0.4)',
  shadowMode: 'spread',
  mockupOpacity: 100,
  shadowPercentX: 0,
  shadowPercentY: -20,
  screenshotBrightness: 100,
  screenshotContrast: 100,
  screenshotSaturation: 100,
  overlays: [],
  textAlign: 'center',
  showLogoTitle: false,
  logoTitleColor: '#ffffff',
  logoTitleFontWeight: 700,
  logoTitleItalic: false,
  logoTitleOffsetX: 0,
  logoTitleOffsetY: 0,
})

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
  'textPosition', 'textOffsetY', 'textOffsetX', 'textAlign',
  'screenshotCount', 'deviceSlots', 'activePresetId',
  'showGrid', 'showSafeArea',
  'logoTitleColor', 'logoTitleFontSize', 'logoTitleFontWeight', 'logoTitleItalic',
  'logoTitleOffsetX', 'logoTitleOffsetY',
]

export function screenshotSlotFromSlide(slide: Slide): ScreenshotSlot {
  return {
    screenshotDataUrl: slide.screenshotDataUrl ?? null,
    screenshotZoom: slide.screenshotZoom ?? 100,
    screenshotOffsetX: slide.screenshotOffsetX ?? 0,
    screenshotOffsetY: slide.screenshotOffsetY ?? 0,
  }
}

export function deviceSlotFromSlide(slide: Slide): DeviceSlot {
  return {
    deviceOffset: slide.deviceOffset,
    deviceOffsetX: slide.deviceOffsetX ?? 0,
    deviceScale: slide.deviceScale,
    deviceRotate: slide.deviceRotate ?? 0,
  }
}

function emptyScreenshotSlot(): ScreenshotSlot {
  return { screenshotDataUrl: null, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 }
}

function switchToDual(slide: Slide): Partial<Slide> {
  const preset = presetById(defaultDualPresetId)!
  return {
    screenshotCount: 2,
    slots: [screenshotSlotFromSlide(slide), emptyScreenshotSlot()],
    deviceSlots: [preset.devices[0], preset.devices[1]],
    activePresetId: defaultDualPresetId,
  }
}

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

export function toggleScreenshotCount(slide: Slide, count: 1 | 2): Partial<Slide> {
  if (count === 2 && (slide.screenshotCount ?? 1) !== 2) return switchToDual(slide)
  if (count === 1 && (slide.screenshotCount ?? 1) !== 1) return switchToSingle(slide)
  return {}
}

const MAX_UNDO = 50

const undoStack: string[] = []
const redoStack: string[] = []

function pushUndo(snapshot: string, bump: () => void) {
  if (undoStack.length >= MAX_UNDO) undoStack.shift()
  undoStack.push(snapshot)
  redoStack.length = 0
  bump()
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => {
      const originalSet = set
      const bumpCounts = () => originalSet({ _undoCount: undoStack.length, _redoCount: 0 })
      const trackedSet: typeof set = (fnOrPartial) => {
        const prevSlides = get().slides
        originalSet(fnOrPartial)
        const nextSlides = get().slides
        if (prevSlides !== nextSlides) {
          pushUndo(JSON.stringify(prevSlides), bumpCounts)
        }
      }

      const initialSlide = defaultSlide('phone')
      return {
        slides: [initialSlide],
        activeSlideId: initialSlide.id,
        activeOverlayId: null as string | null,

        addSlide: () =>
          trackedSet((s) => {
            const active = s.slides.find((sl) => sl.id === s.activeSlideId)
            const slide = defaultSlide(active?.format ?? 'phone')
            return { slides: [...s.slides, slide], activeSlideId: slide.id }
          }),

        duplicateSlide: (id) =>
          trackedSet((s) => {
            const src = s.slides.find((sl) => sl.id === id)
            if (!src) return s
            const copy = {
              ...src,
              id: crypto.randomUUID(),
              slots: src.slots ? src.slots.map((sl) => ({ ...sl })) : undefined,
              deviceSlots: src.deviceSlots ? src.deviceSlots.map((ds) => ({ ...ds })) : undefined,
              overlays: src.overlays ? src.overlays.map((o) => ({ ...o })) : [],
            }
            const idx = s.slides.findIndex((sl) => sl.id === id)
            const slides = [...s.slides]
            slides.splice(idx + 1, 0, copy)
            return { slides, activeSlideId: copy.id }
          }),

        removeSlide: (id) =>
          trackedSet((s) => {
            if (s.slides.length === 1) return s
            const slides = s.slides.filter((sl) => sl.id !== id)
            const activeSlideId =
              s.activeSlideId === id ? slides[0].id : s.activeSlideId
            return { slides, activeSlideId }
          }),

        setActiveSlide: (id) => originalSet({ activeSlideId: id, activeOverlayId: null }),

        updateSlide: (id, patch) =>
          trackedSet((s) => ({
            slides: s.slides.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl)),
          })),

        addOverlay: (slideId, overlay) =>
          trackedSet((s) => ({
            slides: s.slides.map((sl) => {
              if (sl.id !== slideId) return sl
              const overlays = [...(sl.overlays ?? []), overlay]
              if (overlays.length > 8) overlays.pop()
              return { ...sl, overlays }
            }),
            activeOverlayId: overlay.id,
          })),

        removeOverlay: (slideId, overlayId) =>
          trackedSet((s) => ({
            slides: s.slides.map((sl) => {
              if (sl.id !== slideId) return sl
              return { ...sl, overlays: (sl.overlays ?? []).filter((o) => o.id !== overlayId) }
            }),
            activeOverlayId: s.activeOverlayId === overlayId ? null : s.activeOverlayId,
          })),

        updateOverlay: (slideId, overlayId, patch) =>
          trackedSet((s) => ({
            slides: s.slides.map((sl) => {
              if (sl.id !== slideId) return sl
              return {
                ...sl,
                overlays: (sl.overlays ?? []).map((o) =>
                  o.id === overlayId ? { ...o, ...patch } : o
                ),
              }
            }),
          })),

        setActiveOverlayId: (id) => originalSet({ activeOverlayId: id }),

        reorderSlides: (from, to) =>
          trackedSet((s) => {
            const slides = [...s.slides]
            const [moved] = slides.splice(from, 1)
            slides.splice(to, 0, moved)
            return { slides }
          }),

        applyStyleToAll: (sourceSlideId) =>
          trackedSet((s) => {
            const source = s.slides.find((sl) => sl.id === sourceSlideId)
            if (!source || s.slides.length < 2) return s
            const basePatch: Partial<Slide> = {}
            for (const key of STYLE_FIELDS) {
              const val = source[key]
              if (val !== undefined) (basePatch as Record<string, unknown>)[key] = val
            }
            const sourceCount = source.screenshotCount ?? 1
            return {
              slides: s.slides.map((sl) => {
                if (sl.id === sourceSlideId) return sl
                const patch = { ...basePatch }
                const targetCount = sl.screenshotCount ?? 1
                if (targetCount !== sourceCount) {
                  delete (patch as Record<string, unknown>).screenshotCount
                  delete (patch as Record<string, unknown>).deviceSlots
                  delete (patch as Record<string, unknown>).activePresetId
                } else if (patch.deviceSlots) {
                  patch.deviceSlots = source.deviceSlots?.map((ds) => ({ ...ds }))
                }
                return { ...sl, ...patch }
              }),
            }
          }),

        loadSlides: (newSlides) => {
          const prev = get().slides
          pushUndo(JSON.stringify(prev), bumpCounts)
          originalSet({ slides: newSlides, activeSlideId: newSlides[0]?.id ?? '', activeOverlayId: null })
        },

        undo: () => {
          if (undoStack.length === 0) return
          const current = get().slides
          redoStack.push(JSON.stringify(current))
          const prev = JSON.parse(undoStack.pop()!) as Slide[]
          originalSet({ slides: prev, activeOverlayId: null, _undoCount: undoStack.length, _redoCount: redoStack.length })
        },

        redo: () => {
          if (redoStack.length === 0) return
          const current = get().slides
          undoStack.push(JSON.stringify(current))
          const next = JSON.parse(redoStack.pop()!) as Slide[]
          originalSet({ slides: next, activeOverlayId: null, _undoCount: undoStack.length, _redoCount: redoStack.length })
        },

        _undoCount: 0,
        _redoCount: 0,
      }
    },
    {
      name: 'appshotdeck-editor',
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _undoCount, _redoCount, ...rest } = state
        return rest
      },
      onRehydrateStorage: () => (state) => {
        if (state && !state.activeSlideId && state.slides.length > 0) {
          state.activeSlideId = state.slides[0].id
        }
        if (state) {
          for (const slide of state.slides) {
            if (slide.textOffsetY == null || slide.textOffsetY === 0) {
              if (slide.textPosition === 'top') slide.textOffsetY = -44
              else if (slide.textPosition === 'bottom') slide.textOffsetY = 35
            }
          }
        }
      },
    }
  )
)

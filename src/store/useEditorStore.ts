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
  deviceOffset: ['phone', 'iphone-69', 'iphone-65', 'ipad-13'].includes(format) ? 30 : 16,
  deviceScale: 100,
  showHeadline: true,
  showSubtitle: true,
  headlineSpans: [],
  subtitleSpans: [],
  headlineHighlightColor: '#FFD700',
  subtitleHighlightColor: '#FFD700',
  screenshotCount: 1,
})

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

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      slides: [defaultSlide('phone')],
      activeSlideId: '',

      addSlide: () =>
        set((s) => {
          const active = s.slides.find((sl) => sl.id === s.activeSlideId)
          const slide = defaultSlide(active?.format ?? 'phone')
          return { slides: [...s.slides, slide], activeSlideId: slide.id }
        }),

      duplicateSlide: (id) =>
        set((s) => {
          const src = s.slides.find((sl) => sl.id === id)
          if (!src) return s
          const copy = {
            ...src,
            id: crypto.randomUUID(),
            slots: src.slots ? src.slots.map((sl) => ({ ...sl })) : undefined,
            deviceSlots: src.deviceSlots ? src.deviceSlots.map((ds) => ({ ...ds })) : undefined,
          }
          const idx = s.slides.findIndex((sl) => sl.id === id)
          const slides = [...s.slides]
          slides.splice(idx + 1, 0, copy)
          return { slides, activeSlideId: copy.id }
        }),

      removeSlide: (id) =>
        set((s) => {
          if (s.slides.length === 1) return s
          const slides = s.slides.filter((sl) => sl.id !== id)
          const activeSlideId =
            s.activeSlideId === id ? slides[0].id : s.activeSlideId
          return { slides, activeSlideId }
        }),

      setActiveSlide: (id) => set({ activeSlideId: id }),

      updateSlide: (id, patch) =>
        set((s) => ({
          slides: s.slides.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl)),
        })),

      reorderSlides: (from, to) =>
        set((s) => {
          const slides = [...s.slides]
          const [moved] = slides.splice(from, 1)
          slides.splice(to, 0, moved)
          return { slides }
        }),
    }),
    {
      name: 'appshotdeck-editor',
      onRehydrateStorage: () => (state) => {
        if (state && !state.activeSlideId && state.slides.length > 0) {
          state.activeSlideId = state.slides[0].id
        }
      },
    }
  )
)

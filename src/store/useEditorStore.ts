import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EditorState, FrameId, Slide, SlideFormat } from '../types'

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
})

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
          const copy = { ...src, id: crypto.randomUUID() }
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

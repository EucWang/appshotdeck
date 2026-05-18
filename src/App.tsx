import { useRef, useCallback, useEffect, useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar/Sidebar'
import { SlideCanvas } from './components/Canvas/SlideCanvas'
import { useEditorStore } from './store/useEditorStore'
import { useThemeStore } from './store/useThemeStore'
import type { SlideFormat } from './types'

function HiddenExportCanvases({
  canvasRefs,
}: {
  canvasRefs: React.MutableRefObject<Map<string, HTMLDivElement>>
}) {
  const { slides } = useEditorStore()
  const setRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) canvasRefs.current.set(id, el)
      else canvasRefs.current.delete(id)
    },
    [canvasRefs]
  )
  return (
    <div aria-hidden style={{ position: 'fixed', top: 0, left: '-9999px', pointerEvents: 'none' }}>
      {slides.map((slide) => (
        <SlideCanvas key={slide.id} ref={setRef(slide.id)} slide={slide} />
      ))}
    </div>
  )
}

const FORMAT_DIMS: Record<SlideFormat, { W: number; H: number }> = {
  'phone':     { W: 1080,  H: 1920 },
  'tablet-7':  { W: 1920,  H: 1080 },
  'tablet-10': { W: 2560,  H: 1440 },
  'iphone-69': { W: 1320,  H: 2868 },
  'iphone-65': { W: 1242,  H: 2688 },
  'ipad-13':   { W: 2048,  H: 2732 },
}

function previewScale(format: SlideFormat, availW: number, availH: number) {
  const { W, H } = FORMAT_DIMS[format]
  return Math.min(availW / W, availH / H)
}

export default function App() {
  const canvasRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const mainRef = useRef<HTMLElement>(null)
  const [availDims, setAvailDims] = useState({ w: 600, h: 800 })
  const { slides, activeSlideId } = useEditorStore()
  const { isDark } = useThemeStore()
  const activeSlide = slides.find((s) => s.id === activeSlideId)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setAvailDims({
        w: entry.contentRect.width,
        h: entry.contentRect.height,
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scale = activeSlide ? previewScale(activeSlide.format, availDims.w, availDims.h) : 1
  const dims  = activeSlide ? FORMAT_DIMS[activeSlide.format] : { W: 1080, H: 1920 }
  const displayW = Math.round(dims.W * scale)
  const displayH = Math.round(dims.H * scale)

  return (
    <div className="flex flex-col h-screen surface-app text-gray-900 dark:text-white">
      <Header canvasRefs={canvasRefs} />

      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <main ref={mainRef} className="flex-1 flex flex-col items-center justify-center gap-4 overflow-auto p-6">
          {activeSlide && (
            <>
              <div
                style={{
                  width: displayW,
                  height: displayH,
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 10,
                  boxShadow: isDark
                    ? '0 8px 48px rgba(0,0,0,0.6)'
                    : '0 8px 48px rgba(0,0,0,0.15)',
                  flexShrink: 0,
                }}
              >
                <SlideCanvas slide={activeSlide} scale={scale} />
              </div>

            </>
          )}
        </main>
      </div>

      <HiddenExportCanvases canvasRefs={canvasRefs} />
    </div>
  )
}

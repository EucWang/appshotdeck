import { useCallback, useRef, useState } from 'react'

interface Props {
  valueX: number
  valueY: number
  onChange: (x: number, y: number) => void
  size?: number
}

export function LightPad({ valueX, valueY, onChange, size = 140 }: Props) {
  const padRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const updateFromEvent = useCallback((clientX: number, clientY: number) => {
    const el = padRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const padSize = rect.width
    const cx = clientX - rect.left
    const cy = clientY - rect.top
    const x = Math.max(-50, Math.min(50, ((cx / padSize) - 0.5) * 100))
    const y = Math.max(-50, Math.min(50, ((cy / padSize) - 0.5) * 100))
    onChange(Math.round(x), Math.round(y))
  }, [onChange])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    updateFromEvent(e.clientX, e.clientY)
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
  }, [updateFromEvent])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    e.preventDefault()
    updateFromEvent(e.clientX, e.clientY)
  }, [dragging, updateFromEvent])

  const handlePointerUp = useCallback(() => {
    setDragging(false)
  }, [])

  const handleReset = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(0, -20)
  }, [onChange])

  const knobX = ((valueX / 100) + 0.5) * size
  const knobY = ((valueY / 100) + 0.5) * size

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={padRef}
        className="relative rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 cursor-crosshair touch-none select-none"
        style={{ width: size, height: size }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg
          width={size}
          height={size}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {[25, 50, 75].map((pct) => (
            <g key={pct}>
              <line x1={size * pct / 100} y1={0} x2={size * pct / 100} y2={size} stroke="currentColor" strokeWidth={0.5} className="text-black/10 dark:text-white/10" />
              <line x1={0} y1={size * pct / 100} x2={size} y2={size * pct / 100} stroke="currentColor" strokeWidth={0.5} className="text-black/10 dark:text-white/10" />
            </g>
          ))}
          <line x1={size / 2} y1={0} x2={size / 2} y2={size} stroke="currentColor" strokeWidth={1} strokeDasharray="3 3" className="text-black/20 dark:text-white/20" />
          <line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke="currentColor" strokeWidth={1} strokeDasharray="3 3" className="text-black/20 dark:text-white/20" />
        </svg>
        <div
          className="absolute rounded-full bg-indigo-500 border-2 border-white shadow-md"
          style={{
            width: 14,
            height: 14,
            left: knobX - 7,
            top: knobY - 7,
            transition: dragging ? 'none' : 'left 0.1s, top 0.1s',
            pointerEvents: 'none',
          }}
        />
      </div>
      <button
        onClick={handleReset}
        className="text-xs text-muted hover:text-foreground transition-colors"
      >
        Reset
      </button>
    </div>
  )
}

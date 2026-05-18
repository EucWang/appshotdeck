import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../store/useEditorStore'

interface Props {
  screenshotDataUrl: string | null
  slotW: number
  slotH: number
  interactive: boolean
  slideId: string
  screenshotZoom: number
  screenshotOffsetX: number
  screenshotOffsetY: number
}

function clampPan(v: number, max: number) {
  return Math.round(Math.max(-max, Math.min(max, v)) * 10) / 10
}

export function ScreenContent({
  screenshotDataUrl,
  slotW,
  slotH,
  interactive,
  slideId,
  screenshotZoom,
  screenshotOffsetX,
  screenshotOffsetY,
}: Props) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragState = useRef({ startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 })

  const zoomFactor = screenshotZoom / 100
  const panXPx = (screenshotOffsetX / 100) * slotW
  const panYPx = (screenshotOffsetY / 100) * slotH

  useEffect(() => {
    if (!interactive || !imgRef.current) return
    const el = imgRef.current
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const sl = useEditorStore.getState().slides.find((s) => s.id === slideId)
      const curZoom = sl?.screenshotZoom ?? 100
      const curOX = sl?.screenshotOffsetX ?? 0
      const curOY = sl?.screenshotOffsetY ?? 0
      const step = e.deltaY > 0 ? -10 : 10
      const newZoom = Math.max(100, Math.min(400, curZoom + step))
      const newMax = Math.max(0, (newZoom / 100 - 1) * 50)
      useEditorStore.getState().updateSlide(slideId, {
        screenshotZoom: newZoom,
        screenshotOffsetX: clampPan(curOX, newMax),
        screenshotOffsetY: clampPan(curOY, newMax),
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [interactive, slideId])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoomFactor <= 1) return
      e.preventDefault()
      setIsDragging(true)
      const sl = useEditorStore.getState().slides.find((s) => s.id === slideId)
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: sl?.screenshotOffsetX ?? 0,
        startOffsetY: sl?.screenshotOffsetY ?? 0,
      }
      const onMove = (ev: MouseEvent) => {
        const rect = imgRef.current?.parentElement?.getBoundingClientRect()
        if (!rect) return
        const dx = ((ev.clientX - dragState.current.startX) / rect.width) * 100
        const dy = ((ev.clientY - dragState.current.startY) / rect.height) * 100
        const curSl = useEditorStore.getState().slides.find((s) => s.id === slideId)
        const curZoom = curSl?.screenshotZoom ?? 100
        const curMax = Math.max(0, (curZoom / 100 - 1) * 50)
        useEditorStore.getState().updateSlide(slideId, {
          screenshotOffsetX: clampPan(dragState.current.startOffsetX + dx, curMax),
          screenshotOffsetY: clampPan(dragState.current.startOffsetY + dy, curMax),
        })
      }
      const onUp = () => {
        setIsDragging(false)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [slideId, zoomFactor],
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (zoomFactor <= 1 || e.touches.length !== 1) return
      const touch = e.touches[0]
      const sl = useEditorStore.getState().slides.find((s) => s.id === slideId)
      dragState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startOffsetX: sl?.screenshotOffsetX ?? 0,
        startOffsetY: sl?.screenshotOffsetY ?? 0,
      }
      const onMove = (ev: TouchEvent) => {
        ev.preventDefault()
        const t = ev.touches[0]
        const rect = imgRef.current?.parentElement?.getBoundingClientRect()
        if (!rect) return
        const dx = ((t.clientX - dragState.current.startX) / rect.width) * 100
        const dy = ((t.clientY - dragState.current.startY) / rect.height) * 100
        const curSl = useEditorStore.getState().slides.find((s) => s.id === slideId)
        const curZoom = curSl?.screenshotZoom ?? 100
        const curMax = Math.max(0, (curZoom / 100 - 1) * 50)
        useEditorStore.getState().updateSlide(slideId, {
          screenshotOffsetX: clampPan(dragState.current.startOffsetX + dx, curMax),
          screenshotOffsetY: clampPan(dragState.current.startOffsetY + dy, curMax),
        })
      }
      const onEnd = () => {
        window.removeEventListener('touchmove', onMove)
        window.removeEventListener('touchend', onEnd)
      }
      window.addEventListener('touchmove', onMove, { passive: false })
      window.addEventListener('touchend', onEnd)
    },
    [slideId, zoomFactor],
  )

  if (!screenshotDataUrl) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.35)',
          fontSize: Math.round(slotW * 0.05),
          fontWeight: 600,
        }}
      >
        {t('canvas.upload_prompt')}
      </div>
    )
  }

  return (
    <img
      ref={imgRef}
      src={screenshotDataUrl}
      alt=""
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'top center',
        display: 'block',
        transformOrigin: 'center center',
        transform:
          zoomFactor !== 1 || panXPx !== 0 || panYPx !== 0
            ? `translate(${panXPx}px, ${panYPx}px) scale(${zoomFactor})`
            : undefined,
        cursor: zoomFactor > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
      }}
      onMouseDown={interactive ? handleMouseDown : undefined}
      onTouchStart={interactive ? handleTouchStart : undefined}
    />
  )
}

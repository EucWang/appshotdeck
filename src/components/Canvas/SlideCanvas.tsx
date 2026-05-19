import { forwardRef, useCallback, useRef, useState } from 'react'
import type { DeviceSlot, OverlayIcon, Slide, SlideFormat } from '../../types'
import { frameById } from '../../data/frames'
import { resolveFontFamily } from '../../utils/fonts'
import { renderColoredText } from '../../utils/richtext'
import { Device3D } from './Device3D'
import { ScreenContent } from './ScreenContent'
import { computeRadius, computeShadow, computeAdaptiveShadow } from '../../utils/mockupStyle'
import { useEditorStore } from '../../store/useEditorStore'

interface Props {
  slide: Slide
  scale?: number
}

interface FormatConfig {
  W: number
  H: number
  slotW: number
  slotH: number
  landscape: boolean
  frameViewBox: string
}

const FORMAT: Record<SlideFormat, FormatConfig> = {
  phone:     { W: 1080, H: 1920, slotW: 780,  slotH: 1686, landscape: false, frameViewBox: '0 0 390 844' },
  'tablet-7':  { W: 1920, H: 1080, slotW: 425,  slotH: 918,  landscape: true,  frameViewBox: '0 0 390 844' },
  'tablet-10': { W: 2560, H: 1440, slotW: 566,  slotH: 1224, landscape: true,  frameViewBox: '0 0 390 844' },
  'iphone-69': { W: 1320, H: 2868, slotW: 990,  slotH: 2148, landscape: false, frameViewBox: '0 0 393 852' },
  'iphone-65': { W: 1242, H: 2688, slotW: 930,  slotH: 2020, landscape: false, frameViewBox: '0 0 393 852' },
  'ipad-13':   { W: 2048, H: 2732, slotW: 1440, slotH: 1897, landscape: false, frameViewBox: '0 0 820 1080' },
}

let _noiseDataUrl: string | null = null

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
          backgroundColor: `rgba(255, 255, 255, ${frosted / 100 * 0.35})`,
          backgroundImage: `url(${getNoiseDataUrl()})`,
          backgroundRepeat: 'repeat',
          backgroundBlendMode: 'overlay',
        }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: bg.overlayColor ?? '#000000',
        opacity: overlayOpacity,
      }} />
    </>
  )
}

function GridOverlay({ W, H, bright }: { W: number; H: number; bright: number }) {
  const thin = bright > 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
  const ruleThird = bright > 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)'
  const center = bright > 0.5 ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.32)'

  return (
    <svg
      width={W}
      height={H}
      style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}
    >
      {Array.from({ length: 9 }, (_, i) => {
        const pct = (i + 1) / 10
        return (
          <g key={i}>
            <line x1={0} y1={Math.round(H * pct)} x2={W} y2={Math.round(H * pct)} stroke={thin} strokeWidth={1} />
            <line x1={Math.round(W * pct)} y1={0} x2={Math.round(W * pct)} y2={H} stroke={thin} strokeWidth={1} />
          </g>
        )
      })}
      {[1, 2].map((n) => {
        const pct = n / 3
        return (
          <g key={`t${n}`}>
            <line x1={0} y1={Math.round(H * pct)} x2={W} y2={Math.round(H * pct)} stroke={ruleThird} strokeWidth={2} />
            <line x1={Math.round(W * pct)} y1={0} x2={Math.round(W * pct)} y2={H} stroke={ruleThird} strokeWidth={2} />
          </g>
        )
      })}
      <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke={center} strokeWidth={2} strokeDasharray="12 6" />
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke={center} strokeWidth={2} strokeDasharray="12 6" />
    </svg>
  )
}

function SafeAreaOverlay({ W, H, bright }: { W: number; H: number; bright: number }) {
  const margin = 0.10
  const dangerFill = bright > 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
  const dangerStroke = bright > 0.5 ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'
  const labelFill = bright > 0.5 ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)'

  const mx = Math.round(W * margin)
  const my = Math.round(H * margin)

  return (
    <svg
      width={W}
      height={H}
      style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}
    >
      <rect x={0} y={0} width={mx} height={H} fill={dangerFill} />
      <rect x={W - mx} y={0} width={mx} height={H} fill={dangerFill} />
      <rect x={mx} y={0} width={W - 2 * mx} height={my} fill={dangerFill} />
      <rect x={mx} y={H - my} width={W - 2 * mx} height={my} fill={dangerFill} />
      <rect
        x={mx} y={my} width={W - 2 * mx} height={H - 2 * my}
        fill="none" stroke={dangerStroke} strokeWidth={2} strokeDasharray="10 5"
      />
      <text x={mx + 6} y={my + 14} fontSize={12} fill={labelFill} fontFamily="sans-serif">
        Safe Area
      </text>
    </svg>
  )
}

function bgBrightness(slide: Slide): number {
  const bg = slide.background
  if (bg.type === 'solid') {
    return colorBrightness(bg.color)
  }
  if (bg.type === 'gradient') {
    return (colorBrightness(bg.from) + colorBrightness(bg.to)) / 2
  }
  return 0.3
}

function colorBrightness(hex: string): number {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return 0.5
  return (parseInt(m[1], 16) * 0.299 + parseInt(m[2], 16) * 0.587 + parseInt(m[3], 16) * 0.114) / 255
}

function OverlayIconLayer({
  slide,
  W,
  H,
  interactive,
  scale,
}: {
  slide: Slide
  W: number
  H: number
  interactive: boolean
  scale: number
}) {
  const { activeOverlayId, setActiveOverlayId, updateOverlay } = useEditorStore()
  const [dragging, setDragging] = useState<string | null>(null)
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null)

  const overlays = slide.overlays ?? []

  const handleMouseDown = useCallback((e: React.MouseEvent, overlay: OverlayIcon) => {
    if (!interactive) return
    e.preventDefault()
    e.stopPropagation()
    setActiveOverlayId(overlay.id)
    setDragging(overlay.id)
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: overlay.x, oy: overlay.y }

    const onMove = (ev: MouseEvent) => {
      if (!dragStart.current) return
      const dx = (ev.clientX - dragStart.current.mx) / scale
      const dy = (ev.clientY - dragStart.current.my) / scale
      const newX = Math.round((dragStart.current.ox + (dx / W) * 100) * 10) / 10
      const newY = Math.round((dragStart.current.oy + (dy / H) * 100) * 10) / 10
      updateOverlay(slide.id, overlay.id, {
        x: Math.max(0, Math.min(100, newX)),
        y: Math.max(0, Math.min(100, newY)),
      })
    }
    const onUp = () => {
      setDragging(null)
      dragStart.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [interactive, setActiveOverlayId, scale, W, H, slide.id, updateOverlay])

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const handleCanvasClick = useCallback(() => {
    if (interactive) setActiveOverlayId(null)
  }, [interactive, setActiveOverlayId])

  if (overlays.length === 0) return null

  return (
    <div
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      onClick={handleCanvasClick}
    >
      {overlays.map((overlay) => {
        const isActive = interactive && activeOverlayId === overlay.id
        const left = Math.round(W * (overlay.x / 100))
        const top = Math.round(H * (overlay.y / 100))
        const scaleFactor = (overlay.scale ?? 100) / 100
        const opacity = (overlay.opacity ?? 100) / 100
        const rotate = overlay.rotate ?? 0

        return (
          <div
            key={overlay.id}
            style={{
              position: 'absolute',
              left,
              top,
              transform: `translate(-50%, -50%) scale(${scaleFactor}) rotate(${rotate}deg)`,
              opacity,
              cursor: interactive ? (dragging === overlay.id ? 'grabbing' : 'grab') : undefined,
              outline: isActive ? '2px solid #6366F1' : undefined,
              outlineOffset: '4px',
              borderRadius: 4,
              pointerEvents: interactive ? 'auto' : 'none',
            }}
            onMouseDown={(e) => handleMouseDown(e, overlay)}
            onClick={handleOverlayClick}
          >
            {overlay.dataUrl && (
              <img
                src={overlay.dataUrl}
                alt=""
                draggable={false}
                style={{ display: 'block', maxWidth: W * 0.5, maxHeight: H * 0.3 }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function renderGlassBg(slide: Slide) {
  const blurAmount = 20
  const bg = slide.background
  let bgImage: string | undefined
  let bgGrad: string | undefined
  let bgColor: string | undefined
  if (bg.type === 'solid') bgColor = bg.color
  else if (bg.type === 'gradient') bgGrad = `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`
  else bgImage = bg.dataUrl

  return (
    <div style={{
      position: 'absolute',
      inset: -blurAmount * 3,
      backgroundColor: bgColor,
      backgroundImage: bgImage ? `url(${bgImage})` : bgGrad,
      backgroundSize: bgImage ? 'cover' : undefined,
      backgroundPosition: bgImage ? 'center' : undefined,
      filter: `blur(${blurAmount}px)`,
      transform: 'scale(1.2)',
    }} />
  )
}

function DeviceFrame({
  slide,
  fmt,
  slotIndex,
  interactive,
}: {
  slide: Slide
  fmt: FormatConfig
  slotIndex: number
  interactive: boolean
}) {
  const { W, H, slotW, slotH, landscape, frameViewBox } = fmt
  const frame = frameById(slide.frame)

  const isDual = (slide.screenshotCount ?? 1) === 2
  let devSlot: DeviceSlot
  let screenshotDataUrl: string | null
  let screenshotZoom: number
  let screenshotOffsetX: number
  let screenshotOffsetY: number

  if (isDual) {
    devSlot = slide.deviceSlots?.[slotIndex] ?? { deviceOffset: 0, deviceScale: 78, deviceRotate: 0 }
    const sSlot = slide.slots?.[slotIndex]
    screenshotDataUrl = sSlot?.screenshotDataUrl ?? null
    screenshotZoom = sSlot?.screenshotZoom ?? 100
    screenshotOffsetX = sSlot?.screenshotOffsetX ?? 0
    screenshotOffsetY = sSlot?.screenshotOffsetY ?? 0
  } else {
    devSlot = {
      deviceOffset: slide.deviceOffset,
      deviceScale: slide.deviceScale,
      deviceRotate: slide.deviceRotate ?? 0,
    }
    screenshotDataUrl = slide.screenshotDataUrl
    screenshotZoom = slide.screenshotZoom ?? 100
    screenshotOffsetX = slide.screenshotOffsetX ?? 0
    screenshotOffsetY = slide.screenshotOffsetY ?? 0
  }

  const deviceScaleFactor = devSlot.deviceScale / 100
  const dSlotW = Math.round(slotW * deviceScaleFactor)
  const dSlotH = Math.round(slotH * deviceScaleFactor)

  const vbW = Number(frameViewBox.split(' ')[2])
  const screenshotRadius = frame.outerRx != null
    ? Math.round(frame.outerRx * dSlotW / vbW)
    : undefined
  const bezelWidth = frame.bezel != null
    ? Math.round(frame.bezel.width * dSlotW / vbW)
    : undefined

  const mockupStyle = slide.mockupStyle ?? 'default'
  const borderShape = slide.borderShape ?? 'curved'
  const borderRadiusOverride = slide.borderRadius ?? 20
  const shadowMode = slide.shadowMode ?? 'spread'
  const mockupOpacity = slide.mockupOpacity ?? 100
  const shadowPX = slide.shadowPercentX ?? 0
  const shadowPY = slide.shadowPercentY ?? -20

  const isGlass = mockupStyle === 'glass-light' || mockupStyle === 'glass-dark' || mockupStyle === 'liquid-glass'

  const computedRadius = computeRadius(borderShape, screenshotRadius, borderRadiusOverride)

  const slotX_center = Math.round((W - dSlotW) / 2)
  const slotY_center = Math.round((H - dSlotH) / 2)

  const offsetPx = Math.round((landscape ? W : H) * (devSlot.deviceOffset / 100))
  const offsetXPx = Math.round((landscape ? H : W) * ((devSlot.deviceOffsetX ?? 0) / 100))
  const slotX = slotX_center + (landscape ? offsetPx : offsetXPx)
  const slotY = slotY_center + (landscape ? offsetXPx : offsetPx)

  const screenContentProps = {
    screenshotDataUrl,
    slotW: dSlotW,
    slotH: dSlotH,
    interactive,
    slideId: slide.id,
    screenshotZoom,
    screenshotOffsetX,
    screenshotOffsetY,
    slotIndex,
  }

  return (
    <div
      style={{
        position: 'absolute', left: slotX, top: slotY, width: dSlotW, height: dSlotH,
        ...(frame.device3d ? {} : {
          transform: devSlot.deviceRotate !== 0 ? `rotate(${devSlot.deviceRotate}deg)` : undefined,
          transformOrigin: 'center center',
        }),
      }}
    >
      {slide.frame === 'tablet-none' ? (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <ScreenContent {...screenContentProps} />
        </div>
      ) : frame.device3d ? (
        <Device3D
          spec={frame.device3d}
          slotW={dSlotW}
          slotH={dSlotH}
          vbW={vbW}
          tilt={slide.frameTilt}
          rotate={devSlot.deviceRotate}
          screenshotDataUrl={screenshotDataUrl}
          mockupOpacity={slide.mockupOpacity ?? 100}
          shadowPercentX={slide.shadowPercentX ?? 0}
          shadowPercentY={slide.shadowPercentY ?? -20}
          shadowMode={slide.shadowMode ?? 'spread'}
        />
      ) : (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {frame.bezel ? (
            (() => {
              const bezelColor = frame.bezel!.color
              const shadowCSS = shadowMode === 'adaptive'
                ? computeAdaptiveShadow(bgBrightness(slide), shadowPX, shadowPY)
                : computeShadow(shadowMode, shadowPX, shadowPY)

              if (isGlass) {
                const glassBg = mockupStyle === 'glass-light' ? 'rgba(255,255,255,0.12)'
                  : mockupStyle === 'glass-dark' ? 'rgba(0,0,0,0.35)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))'
                return (
                  <div style={{
                    position: 'absolute', inset: 0,
                    borderRadius: computedRadius,
                    overflow: 'hidden',
                    ...(shadowCSS ? { boxShadow: shadowCSS } : {}),
                    opacity: mockupOpacity / 100,
                  }}>
                    {renderGlassBg(slide)}
                    <div style={{
                      position: 'absolute', inset: bezelWidth,
                      borderRadius: Math.max(0, (computedRadius ?? 0) - (bezelWidth ?? 0)),
                      overflow: 'hidden',
                      background: glassBg,
                      border: `${slide.borderWidth ?? 2}px solid rgba(255,255,255,${mockupStyle === 'glass-dark' ? '0.12' : '0.3'})`,
                    }}>
                      <ScreenContent {...screenContentProps} />
                    </div>
                  </div>
                )
              }

              const isOutlineLike = mockupStyle === 'outline'

              const insetLightShadow = mockupStyle === 'inset-light' ? (() => {
                const dist = Math.sqrt(shadowPX * shadowPX + shadowPY * shadowPY)
                const intensity = Math.max(dist / 50, 0.15)
                return `inset ${Math.round(-shadowPX * 0.08)}px ${Math.round(-shadowPY * 0.08)}px 8px rgba(255,255,255,${intensity.toFixed(2)}), inset 0 -1px 3px rgba(0,0,0,0.15)${shadowCSS ? ', ' + shadowCSS : ''}`
              })() : undefined

              const insetDarkShadow = mockupStyle === 'inset-dark' ? (() => {
                const dist = Math.sqrt(shadowPX * shadowPX + shadowPY * shadowPY)
                const intensity = Math.max(dist / 50 * 0.4, 0.1)
                return `inset ${Math.round(-shadowPX * 0.08)}px ${Math.round(-shadowPY * 0.08)}px 10px rgba(0,0,0,${intensity.toFixed(2)})${shadowCSS ? ', ' + shadowCSS : ''}`
              })() : undefined

              return (
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: computedRadius,
                  background: isOutlineLike ? 'transparent' : bezelColor,
                  overflow: 'hidden',
                  boxShadow: insetLightShadow ?? insetDarkShadow ?? (shadowCSS || undefined),
                  opacity: mockupOpacity / 100,
                  ...(mockupStyle === 'outline' ? { background: 'transparent', border: `${slide.borderWidth ?? 2}px solid ${slide.borderColor ?? 'rgba(255,255,255,0.4)'}` } : {}),
                  ...(mockupStyle === 'border' ? { border: `${slide.borderWidth ?? 2}px solid ${slide.borderColor ?? 'rgba(255,255,255,0.4)'}` } : {}),
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: isOutlineLike ? 0 : bezelWidth,
                    borderRadius: Math.max(0, (computedRadius ?? 0) - (isOutlineLike ? 0 : (bezelWidth ?? 0))),
                    overflow: 'hidden',
                  }}>
                    <ScreenContent {...screenContentProps} />
                  </div>
                </div>
              )
            })()
          ) : (
            (() => {
              const shadowCSS = shadowMode === 'adaptive'
                ? computeAdaptiveShadow(bgBrightness(slide), shadowPX, shadowPY)
                : computeShadow(shadowMode, shadowPX, shadowPY)

              if (isGlass) {
                const glassBg = mockupStyle === 'glass-light' ? 'rgba(255,255,255,0.12)'
                  : mockupStyle === 'glass-dark' ? 'rgba(0,0,0,0.35)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))'
                return (
                  <div style={{
                    position: 'absolute', inset: 0,
                    borderRadius: computedRadius,
                    overflow: 'hidden',
                    ...(shadowCSS ? { boxShadow: shadowCSS } : {}),
                    opacity: mockupOpacity / 100,
                  }}>
                    {renderGlassBg(slide)}
                    <div style={{
                      position: 'absolute', inset: 0,
                      borderRadius: computedRadius,
                      overflow: 'hidden',
                      background: glassBg,
                      border: `${slide.borderWidth ?? 2}px solid rgba(255,255,255,${mockupStyle === 'glass-dark' ? '0.12' : '0.3'})`,
                    }}>
                      <ScreenContent {...screenContentProps} />
                    </div>
                  </div>
                )
              }

              const extraCSS: React.CSSProperties = {}
              if (mockupStyle === 'outline') {
                extraCSS.background = 'transparent'
                extraCSS.border = `${slide.borderWidth ?? 2}px solid ${slide.borderColor ?? 'rgba(255,255,255,0.4)'}`
              } else if (mockupStyle === 'border') {
                extraCSS.border = `${slide.borderWidth ?? 2}px solid ${slide.borderColor ?? 'rgba(255,255,255,0.4)'}`
              } else if (mockupStyle === 'inset-light') {
                const dist = Math.sqrt(shadowPX * shadowPX + shadowPY * shadowPY)
                const intensity = Math.max(dist / 50, 0.15)
                extraCSS.boxShadow = `inset ${Math.round(-shadowPX * 0.08)}px ${Math.round(-shadowPY * 0.08)}px 8px rgba(255,255,255,${intensity.toFixed(2)}), inset 0 -1px 3px rgba(0,0,0,0.15)${shadowCSS ? ', ' + shadowCSS : ''}`
              } else if (mockupStyle === 'inset-dark') {
                const dist = Math.sqrt(shadowPX * shadowPX + shadowPY * shadowPY)
                const intensity = Math.max(dist / 50 * 0.4, 0.1)
                extraCSS.boxShadow = `inset ${Math.round(-shadowPX * 0.08)}px ${Math.round(-shadowPY * 0.08)}px 10px rgba(0,0,0,${intensity.toFixed(2)})${shadowCSS ? ', ' + shadowCSS : ''}`
              } else if (shadowCSS) {
                extraCSS.boxShadow = shadowCSS
              }

              return (
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: computedRadius,
                  overflow: 'hidden',
                  opacity: mockupOpacity / 100,
                  ...extraCSS,
                }}>
                  <ScreenContent {...screenContentProps} />
                </div>
              )
            })()
          )}
        </div>
      )}
    </div>
  )
}

export const SlideCanvas = forwardRef<HTMLDivElement, Props>(
  ({ slide, scale = 1 }, ref) => {
    const fmt = FORMAT[slide.format]
    const { W, H, landscape } = fmt

    const isDual = (slide.screenshotCount ?? 1) === 2
    const interactive = scale !== 1

    const headlineSize = slide.headlineFontSize ?? Math.round(W * (landscape ? 0.036 : 0.063))
    const subtitleSize = slide.subtitleFontSize ?? Math.round(W * (landscape ? 0.022 : 0.039))

    const textFont = resolveFontFamily(slide.textFontFamily)
    const headlineWeight = slide.headlineFontWeight ?? 700
    const subtitleWeight = slide.subtitleFontWeight ?? 400
    const headlineItalic = slide.headlineItalic ?? false
    const subtitleItalic = slide.subtitleItalic ?? false
    const textOffsetPx = Math.round(H * ((slide.textOffsetY ?? 0) / 100))
    const textOffsetXPx = Math.round(W * ((slide.textOffsetX ?? 0) / 100))

    const devSlot0 = isDual
      ? (slide.deviceSlots?.[0] ?? { deviceOffset: 0, deviceScale: 78, deviceRotate: 0 })
      : { deviceOffset: slide.deviceOffset, deviceScale: slide.deviceScale, deviceRotate: slide.deviceRotate ?? 0 }
    const deviceScaleFactor0 = devSlot0.deviceScale / 100
    const dSlotH0 = Math.round(fmt.slotH * deviceScaleFactor0)
    const offsetPx0 = Math.round((landscape ? W : H) * (devSlot0.deviceOffset / 100))
    const slotY0 = Math.round((H - dSlotH0) / 2) + (landscape ? 0 : offsetPx0)

    return (
      <div
        ref={ref}
        style={{
          width: W,
          height: H,
          position: 'relative',
          overflow: 'hidden',
          transformOrigin: 'top left',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          flexShrink: 0,
        }}
      >
        <BackgroundLayers bg={slide.background} />
        <OverlayIconLayer slide={slide} W={W} H={H} interactive={interactive} scale={scale} />
        {landscape ? (
          <div
            style={{
              position: 'absolute',
              left: Math.round(W * 0.05) + textOffsetXPx,
              top: 0,
              width: Math.round(W * 0.23),
              height: H,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transform: `translateY(${textOffsetPx}px)`,
            }}
          >
            {(slide.showHeadline ?? true) && slide.headline && (
              <div style={{ fontSize: headlineSize, fontWeight: headlineWeight, fontStyle: headlineItalic ? 'italic' : 'normal', lineHeight: 1.2, marginBottom: 24, color: slide.textColor, fontFamily: textFont }}>
                {renderColoredText(slide.headline, slide.headlineSpans)}
              </div>
            )}
            {(slide.showSubtitle ?? true) && slide.subtitle && (
              <div style={{ fontSize: subtitleSize, fontWeight: subtitleWeight, fontStyle: subtitleItalic ? 'italic' : 'normal', lineHeight: 1.5, color: slide.subtitleColor, fontFamily: textFont }}>
                {renderColoredText(slide.subtitle, slide.subtitleSpans)}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              left: Math.round(W * 0.07),
              right: Math.round(W * 0.07),
              top: slide.textPosition === 'top'
                ? Math.round(H * 0.055) + textOffsetPx
                : slotY0 + dSlotH0 + Math.round(H * 0.03) + textOffsetPx,
              textAlign: 'center',
              transform: `translateX(${textOffsetXPx}px)`,
            }}
          >
            {(slide.showHeadline ?? true) && slide.headline && (
              <div style={{ fontSize: headlineSize, fontWeight: headlineWeight, fontStyle: headlineItalic ? 'italic' : 'normal', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: Math.round(H * 0.012), color: slide.textColor, fontFamily: textFont }}>
                {renderColoredText(slide.headline, slide.headlineSpans)}
              </div>
            )}
            {(slide.showSubtitle ?? true) && slide.subtitle && (
              <div style={{ fontSize: subtitleSize, fontWeight: subtitleWeight, fontStyle: subtitleItalic ? 'italic' : 'normal', lineHeight: 1.45, color: slide.subtitleColor, fontFamily: textFont }}>
                {renderColoredText(slide.subtitle, slide.subtitleSpans)}
              </div>
            )}
          </div>
        )}

        {isDual ? (
          <>
            <DeviceFrame slide={slide} fmt={fmt} slotIndex={0} interactive={interactive} />
            <DeviceFrame slide={slide} fmt={fmt} slotIndex={1} interactive={interactive} />
          </>
        ) : (
          <DeviceFrame slide={slide} fmt={fmt} slotIndex={0} interactive={interactive} />
        )}

        {(slide.showGrid ?? false) && interactive && (
          <GridOverlay W={W} H={H} bright={bgBrightness(slide)} />
        )}
        {(slide.showSafeArea ?? false) && interactive && (
          <SafeAreaOverlay W={W} H={H} bright={bgBrightness(slide)} />
        )}
      </div>
    )
  }
)
SlideCanvas.displayName = 'SlideCanvas'

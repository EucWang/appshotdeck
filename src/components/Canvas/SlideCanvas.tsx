import { forwardRef } from 'react'
import type { DeviceSlot, Slide, SlideFormat } from '../../types'
import { frameById } from '../../data/frames'
import { resolveFontFamily } from '../../utils/fonts'
import { renderColoredText } from '../../utils/richtext'
import { Device3D } from './Device3D'
import { ScreenContent } from './ScreenContent'
import { computeRadius, computeShadow, computeAdaptiveShadow, getBezelLightColor } from '../../utils/mockupStyle'

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
  const frameLightIntensity = slide.frameLightIntensity ?? 100

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
          frameLightIntensity={slide.frameLightIntensity ?? 100}
          shadowMode={slide.shadowMode ?? 'spread'}
        />
      ) : (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {frame.bezel ? (
            (() => {
              const bezelColor = getBezelLightColor(frame.bezel!.color, frameLightIntensity)
              const shadowCSS = shadowMode === 'adaptive'
                ? computeAdaptiveShadow(bgBrightness(slide))
                : computeShadow(shadowMode)

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

              return (
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: computedRadius,
                  background: isOutlineLike ? 'transparent' : bezelColor,
                  overflow: 'hidden',
                  ...(shadowCSS ? { boxShadow: shadowCSS } : {}),
                  opacity: mockupOpacity / 100,
                  ...(mockupStyle === 'outline' ? { background: 'transparent', border: `${slide.borderWidth ?? 2}px solid ${slide.borderColor ?? 'rgba(255,255,255,0.4)'}` } : {}),
                  ...(mockupStyle === 'border' ? { border: `${slide.borderWidth ?? 2}px solid ${slide.borderColor ?? 'rgba(255,255,255,0.4)'}` } : {}),
                  ...(mockupStyle === 'inset-light' ? { boxShadow: `inset 0 2px 8px rgba(255,255,255,${0.2 * frameLightIntensity / 100}), inset 0 -1px 3px rgba(0,0,0,0.15)${shadowCSS ? ', ' + shadowCSS : ''}` } : {}),
                  ...(mockupStyle === 'inset-dark' ? { boxShadow: `inset 0 3px 10px rgba(0,0,0,${0.4 * frameLightIntensity / 100})${shadowCSS ? ', ' + shadowCSS : ''}` } : {}),
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
                ? computeAdaptiveShadow(bgBrightness(slide))
                : computeShadow(shadowMode)

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
                extraCSS.boxShadow = `inset 0 2px 8px rgba(255,255,255,${0.2 * frameLightIntensity / 100}), inset 0 -1px 3px rgba(0,0,0,0.15)${shadowCSS ? ', ' + shadowCSS : ''}`
              } else if (mockupStyle === 'inset-dark') {
                extraCSS.boxShadow = `inset 0 3px 10px rgba(0,0,0,${0.4 * frameLightIntensity / 100})${shadowCSS ? ', ' + shadowCSS : ''}`
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
        {landscape ? (
          <div
            style={{
              position: 'absolute',
              left: Math.round(W * 0.05),
              top: 0,
              width: Math.round(W * 0.23),
              height: H,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
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
      </div>
    )
  }
)
SlideCanvas.displayName = 'SlideCanvas'

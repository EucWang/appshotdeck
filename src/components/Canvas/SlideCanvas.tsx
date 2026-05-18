import { forwardRef } from 'react'
import type { Slide, SlideFormat } from '../../types'
import { frameById } from '../../data/frames'
import { resolveFontFamily } from '../../utils/fonts'
import { renderColoredText } from '../../utils/richtext'
import { Device3D } from './Device3D'
import { ScreenContent } from './ScreenContent'

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
  /** ViewBox dimensions used to scale frame outerRx and bezel width to slot pixels */
  frameViewBox: string
}

const FORMAT: Record<SlideFormat, FormatConfig> = {
  // Android / Play Store — portrait
  phone:     { W: 1080, H: 1920, slotW: 780,  slotH: 1686, landscape: false, frameViewBox: '0 0 390 844' },
  // Android tablets — landscape
  'tablet-7':  { W: 1920, H: 1080, slotW: 425,  slotH: 918,  landscape: true,  frameViewBox: '0 0 390 844' },
  'tablet-10': { W: 2560, H: 1440, slotW: 566,  slotH: 1224, landscape: true,  frameViewBox: '0 0 390 844' },
  // iOS / App Store — portrait
  'iphone-69': { W: 1320, H: 2868, slotW: 990,  slotH: 2148, landscape: false, frameViewBox: '0 0 393 852' },
  'iphone-65': { W: 1242, H: 2688, slotW: 930,  slotH: 2020, landscape: false, frameViewBox: '0 0 393 852' },
  'ipad-13':   { W: 2048, H: 2732, slotW: 1440, slotH: 1897, landscape: false, frameViewBox: '0 0 820 1080' },
}

let _noiseDataUrl: string | null = null

// browser-only: uses document.createElement('canvas')
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

export const SlideCanvas = forwardRef<HTMLDivElement, Props>(
  ({ slide, scale = 1 }, ref) => {
    const fmt = FORMAT[slide.format]
    const { W, H, slotW, slotH, landscape, frameViewBox } = fmt
    const frame = frameById(slide.frame)

    // Apply device scale (portrait only; tablets keep their fixed layout)
    const deviceScaleFactor = (slide.deviceScale ?? 100) / 100
    const dSlotW = Math.round(slotW * deviceScaleFactor)
    const dSlotH = Math.round(slotH * deviceScaleFactor)

    // Compute pixel values scaled from viewBox units to (scaled) slot pixels
    const vbW = Number(frameViewBox.split(' ')[2])
    const screenshotRadius = frame.outerRx != null
      ? Math.round(frame.outerRx * dSlotW / vbW)
      : undefined
    const bezelWidth = frame.bezel != null
      ? Math.round(frame.bezel.width * dSlotW / vbW)
      : undefined

    // ── Portrait layout (phone / iPhone / iPad) ───────────────────────────
    const slotX_portrait = Math.round((W - dSlotW) / 2)
    const slotY_portrait = Math.round((H - dSlotH) / 2)

    // ── Landscape layout (Android tablets) ───────────────────────────────
    const slotX_landscape = Math.round((W - dSlotW) / 2)
    const slotY_landscape = Math.round((H - dSlotH) / 2)

    const offsetPx = Math.round((landscape ? W : H) * ((slide.deviceOffset ?? 0) / 100))
    const slotX = (landscape ? slotX_landscape : slotX_portrait) + (landscape ? offsetPx : 0)
    const slotY = (landscape ? slotY_landscape : slotY_portrait) + (landscape ? 0 : offsetPx)

    const screenContentProps = {
      screenshotDataUrl: slide.screenshotDataUrl,
      slotW: dSlotW,
      slotH: dSlotH,
      interactive: scale !== 1,
      slideId: slide.id,
      screenshotZoom: slide.screenshotZoom ?? 100,
      screenshotOffsetX: slide.screenshotOffsetX ?? 0,
      screenshotOffsetY: slide.screenshotOffsetY ?? 0,
    }

    // Relative font sizing — scales with canvas width for all formats
    const headlineSize = slide.headlineFontSize ?? Math.round(W * (landscape ? 0.036 : 0.063))
    const subtitleSize = slide.subtitleFontSize ?? Math.round(W * (landscape ? 0.022 : 0.039))

    const textFont = resolveFontFamily(slide.textFontFamily)
    const headlineWeight = slide.headlineFontWeight ?? 700
    const subtitleWeight = slide.subtitleFontWeight ?? 400
    const headlineItalic = slide.headlineItalic ?? false
    const subtitleItalic = slide.subtitleItalic ?? false
    const textOffsetPx = Math.round(H * ((slide.textOffsetY ?? 0) / 100))

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
        {/* ── Text ──────────────────────────────────────────────────────── */}
        {landscape ? (
          // Tablet: left column, vertically centered, left-aligned
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
          // Portrait: top or bottom
          <div
            style={{
              position: 'absolute',
              left: Math.round(W * 0.07),
              right: Math.round(W * 0.07),
              top: slide.textPosition === 'top'
                ? Math.round(H * 0.055) + textOffsetPx
                : slotY + dSlotH + Math.round(H * 0.03) + textOffsetPx,
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

        {/* ── Device slot ───────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute', left: slotX, top: slotY, width: dSlotW, height: dSlotH,
            ...(frame.device3d ? {} : {
              transform: (slide.deviceRotate ?? 0) !== 0 ? `rotate(${slide.deviceRotate}deg)` : undefined,
              transformOrigin: 'center center',
            }),
          }}
        >
          {slide.frame === 'tablet-none' ? (
            <div style={{
              position: 'relative', width: '100%', height: '100%',
            }}>
              <ScreenContent {...screenContentProps} />
            </div>
          ) : frame.device3d ? (
            <Device3D
              spec={frame.device3d}
              slotW={dSlotW}
              slotH={dSlotH}
              vbW={vbW}
              tilt={slide.frameTilt}
              rotate={slide.deviceRotate ?? 0}
              screenshotDataUrl={slide.screenshotDataUrl}
            />
          ) : (
            <div
              style={{
                position: 'relative', width: '100%', height: '100%',
              }}
            >
              {frame.bezel ? (
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: screenshotRadius,
                  background: frame.bezel.color,
                  overflow: 'hidden',
                  boxShadow: '0 48px 80px -24px rgba(0,0,0,0.5)',
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: bezelWidth,
                    borderRadius: Math.max(0, (screenshotRadius ?? 0) - (bezelWidth ?? 0)),
                    overflow: 'hidden',
                  }}>
                    <ScreenContent {...screenContentProps} />
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: screenshotRadius,
                  overflow: 'hidden',
                  boxShadow: '0 48px 80px -24px rgba(0,0,0,0.5)',
                }}>
                  <ScreenContent {...screenContentProps} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)
SlideCanvas.displayName = 'SlideCanvas'

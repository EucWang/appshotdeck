import type { BorderShape, ShadowMode, Slide } from '../types'

export function computeRadius(
  shape: BorderShape,
  baseRadius: number | undefined,
  customRadius: number
): number {
  switch (shape) {
    case 'sharp': return 0
    case 'curved': return baseRadius ?? 20
    case 'round': return customRadius
  }
}

export function computeShadow(
  mode: ShadowMode,
  percentX: number = 0,
  percentY: number = -20
): string | null {
  if (mode === 'none') return null
  if (mode === 'adaptive') return null

  const distance = Math.sqrt(percentX * percentX + percentY * percentY)
  const factor = Math.min(distance / 50, 1)

  if (factor < 0.02) {
    return mode === 'spread'
      ? '0px 0px 80px rgba(0,0,0,0.10)'
      : '0px 0px 24px rgba(0,0,0,0.08)'
  }

  const maxOffset = mode === 'spread' ? 48 : 12
  const maxBlur = mode === 'spread' ? 80 : 24

  const offsetX = (percentX / 50) * maxOffset * factor
  const offsetY = (percentY / 50) * maxOffset * factor
  const blur = maxBlur * factor
  const alpha = 0.2 + factor * 0.35

  const layers = [
    { x: offsetX * 0.15, y: offsetY * 0.15, blur: blur * 0.4, alpha: alpha * 0.9 },
    { x: offsetX * 0.4,  y: offsetY * 0.4,  blur: blur * 0.7, alpha: alpha * 0.6 },
    { x: offsetX * 0.7,  y: offsetY * 0.7,  blur: blur * 1.0, alpha: alpha * 0.4 },
    { x: offsetX * 1.0,  y: offsetY * 1.0,  blur: blur * 1.4, alpha: alpha * 0.25 },
  ]

  return layers
    .map(l => `${Math.round(l.x)}px ${Math.round(l.y)}px ${Math.round(l.blur)}px rgba(0,0,0,${l.alpha.toFixed(2)})`)
    .join(', ')
}

export function computeAdaptiveShadow(
  bgBright: number,
  percentX: number = 0,
  percentY: number = -20
): string {
  const distance = Math.sqrt(percentX * percentX + percentY * percentY)
  const factor = Math.min(distance / 50, 1)
  const alpha = 0.2 + (1 - bgBright) * 0.5
  const blur = Math.max(60 * factor, 16)
  const offsetX = (percentX / 50) * 24 * factor
  const offsetY = (percentY / 50) * 24 * factor

  return `${Math.round(offsetX)}px ${Math.round(offsetY)}px ${Math.round(blur)}px -16px rgba(0,0,0,${alpha.toFixed(2)})`
}

export function getMockupFrameCSS(
  slide: Slide,
  baseRadius: number | undefined
): React.CSSProperties {
  const style = slide.mockupStyle ?? 'default'
  const borderShape = slide.borderShape ?? 'curved'
  const borderRadius = slide.borderRadius ?? 20
  const borderWidth = slide.borderWidth ?? 2
  const borderColor = slide.borderColor ?? 'rgba(255,255,255,0.4)'
  const shadowMode = slide.shadowMode ?? 'spread'
  const mockupOpacity = slide.mockupOpacity ?? 100
  const shadowPX = slide.shadowPercentX ?? 0
  const shadowPY = slide.shadowPercentY ?? -20

  const radius = computeRadius(borderShape, baseRadius, borderRadius)

  const base: React.CSSProperties = {
    opacity: mockupOpacity / 100,
    borderRadius: radius,
  }

  const shadow = computeShadow(shadowMode, shadowPX, shadowPY)

  switch (style) {
    case 'default':
      if (shadow) base.boxShadow = shadow
      break
    case 'glass-light':
      base.background = 'rgba(255,255,255,0.12)'
      base.border = `${borderWidth}px solid rgba(255,255,255,0.25)`
      if (shadow) base.boxShadow = shadow
      break
    case 'glass-dark':
      base.background = 'rgba(0,0,0,0.35)'
      base.border = `${borderWidth}px solid rgba(255,255,255,0.12)`
      if (shadow) base.boxShadow = shadow
      break
    case 'liquid-glass':
      base.background = 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))'
      base.border = `${borderWidth}px solid rgba(255,255,255,0.35)`
      if (shadow) base.boxShadow = shadow
      break
    case 'inset-light': {
      const dist = Math.sqrt(shadowPX * shadowPX + shadowPY * shadowPY)
      const intensity = Math.max(dist / 50, 0.15)
      base.boxShadow = `inset ${Math.round(-shadowPX * 0.08)}px ${Math.round(-shadowPY * 0.08)}px 8px rgba(255,255,255,${intensity.toFixed(2)}), inset 0 -1px 3px rgba(0,0,0,0.15)${shadow ? ', ' + shadow : ''}`
      break
    }
    case 'inset-dark': {
      const dist = Math.sqrt(shadowPX * shadowPX + shadowPY * shadowPY)
      const intensity = Math.max(dist / 50 * 0.4, 0.1)
      base.boxShadow = `inset ${Math.round(-shadowPX * 0.08)}px ${Math.round(-shadowPY * 0.08)}px 10px rgba(0,0,0,${intensity.toFixed(2)})${shadow ? ', ' + shadow : ''}`
      break
    }
    case 'outline':
      base.border = `${borderWidth}px solid ${borderColor}`
      base.background = 'transparent'
      if (shadow) base.boxShadow = shadow
      break
    case 'border':
      base.border = `${borderWidth}px solid ${borderColor}`
      if (shadow) base.boxShadow = shadow
      break
  }

  return base
}

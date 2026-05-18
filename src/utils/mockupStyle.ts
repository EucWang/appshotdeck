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

export function computeShadow(mode: ShadowMode): string | null {
  switch (mode) {
    case 'none': return null
    case 'spread': return '0 48px 80px -24px rgba(0,0,0,0.5)'
    case 'hug': return '0 8px 24px -4px rgba(0,0,0,0.4)'
    case 'adaptive': return null
  }
}

export function computeAdaptiveShadow(bgBrightness: number): string {
  const alpha = 0.2 + (1 - bgBrightness) * 0.5
  return `0 24px 60px -16px rgba(0,0,0,${alpha.toFixed(2)})`
}

export function getBezelLightColor(baseColor: string, lightIntensity: number): string {
  if (lightIntensity === 100) return baseColor
  const m = baseColor.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return baseColor
  const factor = lightIntensity / 100
  const r = Math.min(255, Math.round(parseInt(m[1]) * factor))
  const g = Math.min(255, Math.round(parseInt(m[2]) * factor))
  const b = Math.min(255, Math.round(parseInt(m[3]) * factor))
  const alphaMatch = baseColor.match(/,\s*([\d.]+)\s*\)/)
  const alpha = alphaMatch ? alphaMatch[1] : '1'
  return `rgba(${r},${g},${b},${alpha})`
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
  const lightIntensity = slide.frameLightIntensity ?? 100

  const radius = computeRadius(borderShape, baseRadius, borderRadius)

  const base: React.CSSProperties = {
    opacity: mockupOpacity / 100,
    borderRadius: radius,
  }

  const shadow = computeShadow(shadowMode)

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
    case 'inset-light':
      base.boxShadow = `inset 0 2px 8px rgba(255,255,255,${0.2 * lightIntensity / 100}), inset 0 -1px 3px rgba(0,0,0,0.15)${shadow ? ', ' + shadow : ''}`
      break
    case 'inset-dark':
      base.boxShadow = `inset 0 3px 10px rgba(0,0,0,${0.4 * lightIntensity / 100})${shadow ? ', ' + shadow : ''}`
      break
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

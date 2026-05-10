import type { Background } from '../types'

export interface BackgroundPreset {
  label: string
  bg: Background
}

export const GRADIENT_PRESETS: BackgroundPreset[] = [
  { label: 'Midnight Slate',  bg: { type: 'gradient', from: '#0F172A', to: '#1E3A5F', angle: 135 } },
  { label: 'Deep Purple',     bg: { type: 'gradient', from: '#1A1035', to: '#2D1B69', angle: 135 } },
  { label: 'Warm Dark',       bg: { type: 'gradient', from: '#1C1008', to: '#3B1F00', angle: 135 } },
  { label: 'Orange Glow',     bg: { type: 'gradient', from: '#7C2D12', to: '#1C0A00', angle: 150 } },
  { label: 'Charcoal Blue',   bg: { type: 'gradient', from: '#111827', to: '#1E293B', angle: 135 } },
  { label: 'Violet Dusk',     bg: { type: 'gradient', from: '#4C1D95', to: '#1E1B4B', angle: 135 } },
]

export const SOLID_PRESETS: BackgroundPreset[] = [
  { label: 'Slate 950',   bg: { type: 'solid', color: '#020617' } },
  { label: 'Zinc 900',    bg: { type: 'solid', color: '#18181b' } },
  { label: 'Deep Navy',   bg: { type: 'solid', color: '#0a0f1e' } },
  { label: 'Black',       bg: { type: 'solid', color: '#000000' } },
  { label: 'Off White',   bg: { type: 'solid', color: '#fafaf9' } },
  { label: 'Warm Gray',   bg: { type: 'solid', color: '#44403c' } },
]

export const ALL_PRESETS = [...GRADIENT_PRESETS, ...SOLID_PRESETS]

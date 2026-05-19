import type { Background } from '../types'

export interface BackgroundPreset {
  label: string
  bg: Background
}

export interface BackgroundCategory {
  id: string
  labelKey: string
  presets: BackgroundPreset[]
}

const DARK: BackgroundPreset[] = [
  { label: 'Midnight Slate', bg: { type: 'gradient', from: '#0F172A', to: '#1E3A5F', angle: 135 } },
  { label: 'Charcoal Blue', bg: { type: 'gradient', from: '#111827', to: '#1E293B', angle: 135 } },
  { label: 'Obsidian', bg: { type: 'gradient', from: '#0a0a0a', to: '#1a1a2e', angle: 160 } },
  { label: 'Deep Ink', bg: { type: 'gradient', from: '#0d0d0d', to: '#1a1a1a', angle: 180 } },
  { label: 'Carbon', bg: { type: 'gradient', from: '#141414', to: '#2d2d2d', angle: 145 } },
  { label: 'Graphite', bg: { type: 'gradient', from: '#1c1c1c', to: '#383838', angle: 135 } },
  { label: 'Slate', bg: { type: 'gradient', from: '#1e293b', to: '#0f172a', angle: 180 } },
  { label: 'Night', bg: { type: 'gradient', from: '#0c0c1d', to: '#1a1a2e', angle: 135 } },
]

const MIDNIGHT: BackgroundPreset[] = [
  { label: 'Deep Purple', bg: { type: 'gradient', from: '#1A1035', to: '#2D1B69', angle: 135 } },
  { label: 'Violet Dusk', bg: { type: 'gradient', from: '#4C1D95', to: '#1E1B4B', angle: 135 } },
  { label: 'Cosmic Indigo', bg: { type: 'gradient', from: '#1e1b4b', to: '#312e81', angle: 150 } },
  { label: 'Nebula', bg: { type: 'gradient', from: '#2e1065', to: '#1e1b4b', angle: 135 } },
  { label: 'Deep Space', bg: { type: 'gradient', from: '#0f0a1e', to: '#1a1145', angle: 160 } },
  { label: 'Twilight', bg: { type: 'gradient', from: '#1e1b4b', to: '#4c1d95', angle: 180 } },
  { label: 'Ultramarine', bg: { type: 'gradient', from: '#0c1445', to: '#1e3a8a', angle: 135 } },
  { label: 'Plum Night', bg: { type: 'gradient', from: '#3b0764', to: '#1e0533', angle: 150 } },
]

const VIBRANT: BackgroundPreset[] = [
  { label: 'Orange Glow', bg: { type: 'gradient', from: '#7C2D12', to: '#1C0A00', angle: 150 } },
  { label: 'Crimson Fire', bg: { type: 'gradient', from: '#991b1b', to: '#450a0a', angle: 135 } },
  { label: 'Electric Rose', bg: { type: 'gradient', from: '#be185d', to: '#4a044e', angle: 145 } },
  { label: 'Hot Pink', bg: { type: 'gradient', from: '#db2777', to: '#831843', angle: 135 } },
  { label: 'Emerald', bg: { type: 'gradient', from: '#065f46', to: '#022c22', angle: 135 } },
  { label: 'Neon Teal', bg: { type: 'gradient', from: '#0d9488', to: '#134e4a', angle: 150 } },
  { label: 'Amber Blaze', bg: { type: 'gradient', from: '#d97706', to: '#78350f', angle: 135 } },
  { label: 'Cherry', bg: { type: 'gradient', from: '#be123c', to: '#4c0519', angle: 160 } },
]

const COOL: BackgroundPreset[] = [
  { label: 'Teal Deep', bg: { type: 'gradient', from: '#134e4a', to: '#042f2e', angle: 135 } },
  { label: 'Ocean Deep', bg: { type: 'gradient', from: '#0c4a6e', to: '#082f49', angle: 135 } },
  { label: 'Arctic Blue', bg: { type: 'gradient', from: '#1e40af', to: '#1e3a5f', angle: 150 } },
  { label: 'Frost', bg: { type: 'gradient', from: '#0ea5e9', to: '#0369a1', angle: 135 } },
  { label: 'Cyan Pulse', bg: { type: 'gradient', from: '#06b6d4', to: '#164e63', angle: 145 } },
  { label: 'Steel', bg: { type: 'gradient', from: '#334155', to: '#1e293b', angle: 135 } },
  { label: 'Navy', bg: { type: 'gradient', from: '#1e3a5f', to: '#0f172a', angle: 180 } },
  { label: 'Ice', bg: { type: 'gradient', from: '#67e8f9', to: '#0e7490', angle: 135 } },
]

const WARM: BackgroundPreset[] = [
  { label: 'Warm Dark', bg: { type: 'gradient', from: '#1C1008', to: '#3B1F00', angle: 135 } },
  { label: 'Sunset', bg: { type: 'gradient', from: '#c2410c', to: '#7c2d12', angle: 135 } },
  { label: 'Copper', bg: { type: 'gradient', from: '#92400e', to: '#451a03', angle: 150 } },
  { label: 'Terracotta', bg: { type: 'gradient', from: '#b45309', to: '#78350f', angle: 135 } },
  { label: 'Espresso', bg: { type: 'gradient', from: '#292524', to: '#1c1917', angle: 160 } },
  { label: 'Mahogany', bg: { type: 'gradient', from: '#5c2d0e', to: '#2c1503', angle: 135 } },
  { label: 'Cinnamon', bg: { type: 'gradient', from: '#a16207', to: '#713f12', angle: 145 } },
  { label: 'Bronze', bg: { type: 'gradient', from: '#78350f', to: '#451a03', angle: 135 } },
]

const PASTEL: BackgroundPreset[] = [
  { label: 'Lavender Mist', bg: { type: 'gradient', from: '#c4b5fd', to: '#a78bfa', angle: 135 } },
  { label: 'Soft Rose', bg: { type: 'gradient', from: '#fda4af', to: '#fb7185', angle: 135 } },
  { label: 'Baby Blue', bg: { type: 'gradient', from: '#93c5fd', to: '#60a5fa', angle: 150 } },
  { label: 'Mint', bg: { type: 'gradient', from: '#6ee7b7', to: '#34d399', angle: 135 } },
  { label: 'Peach', bg: { type: 'gradient', from: '#fed7aa', to: '#fdba74', angle: 145 } },
  { label: 'Lilac', bg: { type: 'gradient', from: '#ddd6fe', to: '#c4b5fd', angle: 135 } },
  { label: 'Sky', bg: { type: 'gradient', from: '#bae6fd', to: '#7dd3fc', angle: 160 } },
  { label: 'Blush', bg: { type: 'gradient', from: '#fecdd3', to: '#fda4af', angle: 135 } },
]

const LIGHT: BackgroundPreset[] = [
  { label: 'Off White', bg: { type: 'solid', color: '#fafaf9' } },
  { label: 'Cream', bg: { type: 'solid', color: '#fef3c7' } },
  { label: 'Cool Gray', bg: { type: 'solid', color: '#f1f5f9' } },
  { label: 'Sand Gray', bg: { type: 'solid', color: '#e7e5e4' } },
  { label: 'Light Blue', bg: { type: 'solid', color: '#e0f2fe' } },
  { label: 'Light Purple', bg: { type: 'solid', color: '#ede9fe' } },
]

const SOLID: BackgroundPreset[] = [
  { label: 'Black', bg: { type: 'solid', color: '#000000' } },
  { label: 'Slate 950', bg: { type: 'solid', color: '#020617' } },
  { label: 'Zinc 900', bg: { type: 'solid', color: '#18181b' } },
  { label: 'Deep Navy', bg: { type: 'solid', color: '#0a0f1e' } },
  { label: 'Warm Gray', bg: { type: 'solid', color: '#44403c' } },
  { label: 'Pure White', bg: { type: 'solid', color: '#ffffff' } },
  { label: 'Cool White', bg: { type: 'solid', color: '#f8fafc' } },
  { label: 'Ivory', bg: { type: 'solid', color: '#fffff0' } },
]

export const BACKGROUND_CATEGORIES: BackgroundCategory[] = [
  { id: 'dark', labelKey: 'background.cat_dark', presets: DARK },
  { id: 'midnight', labelKey: 'background.cat_midnight', presets: MIDNIGHT },
  { id: 'vibrant', labelKey: 'background.cat_vibrant', presets: VIBRANT },
  { id: 'cool', labelKey: 'background.cat_cool', presets: COOL },
  { id: 'warm', labelKey: 'background.cat_warm', presets: WARM },
  { id: 'pastel', labelKey: 'background.cat_pastel', presets: PASTEL },
  { id: 'light', labelKey: 'background.cat_light', presets: LIGHT },
  { id: 'solid', labelKey: 'background.cat_solid', presets: SOLID },
]

export const GRADIENT_PRESETS: BackgroundPreset[] = BACKGROUND_CATEGORIES.flatMap(c =>
  c.presets.filter(p => p.bg.type === 'gradient'),
)

export const SOLID_PRESETS: BackgroundPreset[] = BACKGROUND_CATEGORIES.flatMap(c =>
  c.presets.filter(p => p.bg.type === 'solid'),
)

export const ALL_PRESETS = BACKGROUND_CATEGORIES.flatMap(c => c.presets)

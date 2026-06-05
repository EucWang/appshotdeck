import type { LayoutPresetDef } from '../types'

export const layoutPresets: LayoutPresetDef[] = [
  {
    id: 'single-center',
    screenshotCount: 1,
    devices: [
      { deviceOffset: 30, deviceScale: 100, deviceRotate: 0 },
    ],
  },
  {
    id: 'single-low',
    screenshotCount: 1,
    devices: [
      { deviceOffset: 38, deviceScale: 95, deviceRotate: 0 },
    ],
  },

  {
    id: 'duo-side',
    screenshotCount: 2,
    devices: [
      { deviceOffset: 22, deviceOffsetX: -12, deviceScale: 65, deviceRotate: -5 },
      { deviceOffset: 28, deviceOffsetX: 12, deviceScale: 65, deviceRotate: 5 },
    ],
  },
  {
    id: 'duo-stack',
    screenshotCount: 2,
    devices: [
      { deviceOffset: -8, deviceScale: 52, deviceRotate: 0 },
      { deviceOffset: 14, deviceScale: 52, deviceRotate: 0 },
    ],
  },
  {
    id: 'duo-front-back',
    screenshotCount: 2,
    devices: [
      { deviceOffset: 24, deviceOffsetX: -3, deviceScale: 72, deviceRotate: 0 },
      { deviceOffset: 30, deviceOffsetX: 10, deviceScale: 48, deviceRotate: 7 },
    ],
  },
  {
    id: 'duo-tilt',
    screenshotCount: 2,
    devices: [
      { deviceOffset: 20, deviceOffsetX: -10, deviceScale: 62, deviceRotate: -10 },
      { deviceOffset: 26, deviceOffsetX: 10, deviceScale: 62, deviceRotate: 10 },
    ],
  },

  {
    id: 'trio-row',
    screenshotCount: 3,
    devices: [
      { deviceOffset: 20, deviceOffsetX: -18, deviceScale: 48, deviceRotate: -5 },
      { deviceOffset: 22, deviceOffsetX: 0, deviceScale: 48, deviceRotate: 0 },
      { deviceOffset: 24, deviceOffsetX: 18, deviceScale: 48, deviceRotate: 5 },
    ],
  },
  {
    id: 'trio-stack',
    screenshotCount: 3,
    devices: [
      { deviceOffset: -12, deviceOffsetX: 0, deviceScale: 38, deviceRotate: 0 },
      { deviceOffset: 6, deviceOffsetX: 0, deviceScale: 38, deviceRotate: 0 },
      { deviceOffset: 24, deviceOffsetX: 0, deviceScale: 38, deviceRotate: 0 },
    ],
  },
  {
    id: 'trio-fan',
    screenshotCount: 3,
    devices: [
      { deviceOffset: 18, deviceOffsetX: -14, deviceScale: 50, deviceRotate: -12 },
      { deviceOffset: 24, deviceOffsetX: 0, deviceScale: 55, deviceRotate: 0 },
      { deviceOffset: 18, deviceOffsetX: 14, deviceScale: 50, deviceRotate: 12 },
    ],
  },
  {
    id: 'trio-pyramid',
    screenshotCount: 3,
    devices: [
      { deviceOffset: 8, deviceOffsetX: 0, deviceScale: 42, deviceRotate: 0 },
      { deviceOffset: 28, deviceOffsetX: -12, deviceScale: 44, deviceRotate: -6 },
      { deviceOffset: 28, deviceOffsetX: 12, deviceScale: 44, deviceRotate: 6 },
    ],
  },
]

export const presetsForCount = (count: 1 | 2 | 3): LayoutPresetDef[] =>
  layoutPresets.filter((p) => p.screenshotCount === count)

export const presetById = (id: string): LayoutPresetDef | undefined =>
  layoutPresets.find((p) => p.id === id)

export const defaultDualPresetId = 'duo-side'

export const defaultTrioPresetId = 'trio-row'

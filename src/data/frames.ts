import type { CSSProperties } from 'react'
import type { FrameId, SlideFormat } from '../types'

export interface Device3DSpec {
  /** Device shell depth in viewBox units. */
  thickness: number
  /** Outer shell corner radius in viewBox units. */
  outerRx: number
  /** Bezel width in viewBox units (innerRx = outerRx − bezelWidth). */
  bezelWidth: number
  /** Color applied to the shell, bezel ring, and side edges. */
  shellColor: string
}

export interface FrameDef {
  id: FrameId
  label: string
  formats: SlideFormat[]
  /** Whether this frame supports a user-controlled 3D tilt angle. */
  tilt?: boolean
  /** Present → renders via Device3D component instead of the flat DeviceShell path. */
  device3d?: Device3DSpec
  /** Outer phone corner radius in viewBox units — flat frames only. */
  outerRx?: number
  /** CSS border bezel — flat frames only. */
  bezel?: { width: number; color: string }
  screenshotStyle?: CSSProperties
}

const DARK_BEZEL  = 'rgba(12,12,22,0.93)'
const TITAN_BEZEL = 'rgba(36,36,46,0.93)'

export const frames: FrameDef[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    formats: ['phone', 'iphone-69', 'iphone-65', 'ipad-13'],
    outerRx: 44,
  },

  {
    id: 'android-flat',
    label: 'Android',
    formats: ['phone'],
    outerRx: 44,
    bezel: { width: 16, color: DARK_BEZEL },
  },

  {
    id: 'android-3d',
    label: 'Android 3D',
    formats: ['phone'],
    tilt: true,
    device3d: { thickness: 8, outerRx: 44, bezelWidth: 16, shellColor: DARK_BEZEL },
  },

  {
    id: 'ios-flat',
    label: 'iPhone',
    formats: ['iphone-69', 'iphone-65'],
    outerRx: 55,
    bezel: { width: 16, color: TITAN_BEZEL },
  },

  {
    id: 'ios-3d',
    label: 'iPhone 3D',
    formats: ['iphone-69', 'iphone-65'],
    tilt: true,
    outerRx: 55,
    bezel: { width: 16, color: TITAN_BEZEL },
  },

  {
    id: 'tablet-flat',
    label: 'Android Tab',
    formats: ['tablet-7', 'tablet-10'],
    outerRx: 24,
    bezel: { width: 12, color: DARK_BEZEL },
  },

  {
    id: 'ios-ipad',
    label: 'iPad',
    formats: ['ipad-13'],
    outerRx: 30,
    bezel: { width: 16, color: TITAN_BEZEL },
  },

]

export const frameById = (id: string) =>
  frames.find((f) => f.id === id) ?? frames[0]

export const framesForFormat = (format: SlideFormat) =>
  frames.filter((f) => f.formats.includes(format))

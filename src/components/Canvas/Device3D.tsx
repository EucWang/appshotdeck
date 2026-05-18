import { useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Device3DSpec } from '../../data/frames'

/** Parse 'rgba(r,g,b,a)' → ['rgb(r,g,b)', a] for Three.js */
function parseColor(css: string): [string, number] {
  const m = css.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/)
  if (!m) return [css, 1]
  return [`rgb(${m[1]},${m[2]},${m[3]})`, m[4] ? parseFloat(m[4]) : 1]
}

// ── Size enforcer ─────────────────────────────────────────────────────────────
// r3f (react-use-measure) uses getBoundingClientRect() which returns the visual
// (post-CSS-transform) size. resize={{ offsetSize: true }} fixes the initial
// measurement, but this guard catches any subsequent drift.

function SizeEnforcer({ w, h }: { w: number; h: number }) {
  const { gl, camera } = useThree()
  useFrame(() => {
    const el  = gl.domElement
    const dpr = gl.getPixelRatio()
    if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
      gl.setSize(w, h, true)
      if (camera instanceof THREE.PerspectiveCamera) {
        // eslint-disable-next-line react-hooks/immutability -- Three.js camera objects are mutable by design
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
    }
  })
  return null
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

/**
 * Rounded rectangle THREE.Shape centered at origin, wound counterclockwise (viewed
 * from +Z). CCW is required so that ExtrudeGeometry/ShapeGeometry front-face normals
 * point toward the camera (+Z). Clockwise winding would flip the normals and cause
 * backface culling to hide the entire geometry.
 */
function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const hw = w / 2, hh = h / 2
  const shape = new THREE.Shape()
  // CCW: start top-right, go left → down-left arc → down → bottom-right arc → right → top-right arc → up → top-left arc
  shape.moveTo(hw - r, hh)
  shape.lineTo(-hw + r, hh)
  shape.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false)
  shape.lineTo(-hw, -hh + r)
  shape.absarc(-hw + r, -hh + r, r, Math.PI, 3 * Math.PI / 2, false)
  shape.lineTo(hw - r, -hh)
  shape.absarc(hw - r, -hh + r, r, 3 * Math.PI / 2, 2 * Math.PI, false)
  shape.lineTo(hw, hh - r)
  shape.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false)
  return shape
}

// ── Phone model ───────────────────────────────────────────────────────────────

interface ModelProps {
  spec:          Device3DSpec
  aspect:        number
  bezelN:        number
  outerCornerR:  number
  tilt:          number
  rotate:        number
  screenshotDataUrl: string | null
}

function PhoneModel({ spec, aspect, bezelN, outerCornerR, tilt, rotate, screenshotDataUrl }: ModelProps) {
  const W     = 1
  const H     = aspect
  const depth = 0.068
  const bevel = 0.016

  const screenW      = W - bezelN * 2
  const screenH      = H - bezelN * 2
  // Inner corner exactly mirrors the CSS flat-frame formula: outerR - bezelWidth
  const innerCornerR = Math.max(0, outerCornerR - bezelN)

  const [shellRgb, shellOpacity] = parseColor(spec.shellColor)

  // Phone body: extruded rounded rectangle — correct 2D corners + tiny 3D chamfer
  const bodyGeom = useMemo(() => {
    const shape = roundedRectShape(W, H, outerCornerR)
    return new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled:   true,
      bevelThickness: bevel,
      bevelSize:      bevel,
      bevelOffset:    0,
      bevelSegments:  5,
    })
  }, [W, H, depth, bevel, outerCornerR])

  // Screen: rounded rectangle — corners match inner radius of the bezel.
  // ShapeGeometry sets UV = raw vertex XY (not normalized), so we rewrite the UV
  // buffer to [0,1] after creation so the screenshot texture maps correctly.
  const screenGeom = useMemo(() => {
    const shape = roundedRectShape(screenW, screenH, innerCornerR)
    const geom  = new THREE.ShapeGeometry(shape, 8)
    const pos   = geom.getAttribute('position') as THREE.BufferAttribute
    const uvArr = new Float32Array(pos.count * 2)
    for (let i = 0; i < pos.count; i++) {
      uvArr[i * 2]     = (pos.getX(i) + screenW / 2) / screenW
      uvArr[i * 2 + 1] = (pos.getY(i) + screenH / 2) / screenH
    }
    geom.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2))
    return geom
  }, [screenW, screenH, innerCornerR])

  useEffect(() => () => { bodyGeom.dispose(); screenGeom.dispose() }, [bodyGeom, screenGeom])

  const texture = useMemo(() => {
    if (!screenshotDataUrl) return null
    const tex = new THREE.TextureLoader().load(screenshotDataUrl)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [screenshotDataUrl])

  return (
    <group rotation={[THREE.MathUtils.degToRad(-4), THREE.MathUtils.degToRad(tilt), THREE.MathUtils.degToRad(rotate)]}>
      {/* Body centered in Z: front face at +depth/2, back at -depth/2 */}
      <mesh geometry={bodyGeom} position={[0, 0, -(depth / 2)]}>
        <meshPhysicalMaterial
          color={shellRgb}
          opacity={shellOpacity}
          transparent={shellOpacity < 1}
          metalness={0.4}
          roughness={0.25}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Screen — must clear the front bevel tip at depth/2 + bevel */}
      <mesh geometry={screenGeom} position={[0, 0, depth / 2 + bevel + 0.001]}>
        <meshBasicMaterial
          map={texture ?? undefined}
          color={texture ? '#ffffff' : '#0d0d20'}
        />
      </mesh>
    </group>
  )
}

// ── Canvas wrapper ────────────────────────────────────────────────────────────

interface Props {
  spec:   Device3DSpec
  slotW:  number
  slotH:  number
  vbW:    number
  tilt:   number
  rotate: number
  screenshotDataUrl: string | null
}

export function Device3D({ spec, slotW, slotH, vbW, tilt, rotate, screenshotDataUrl }: Props) {
  const aspect       = slotH / slotW
  const bezelN       = (spec.bezelWidth * (slotW / vbW)) / slotW
  const outerCornerR = spec.outerRx / vbW   // model units — matches android-flat outerRx

  const fov = 28
  // At max tilt the front corner nearest the camera is at z = W/2·sin(t) + depth/2·cos(t).
  // Camera must be far enough that this never exceeds the frustum.
  const modelDepth = 0.068
  const modelBevel = 0.016   // must match PhoneModel's bevel constant
  const maxTiltRad = THREE.MathUtils.degToRad(60)
  const zExcursion = 0.5 * Math.sin(maxTiltRad) + (modelDepth / 2 + modelBevel) * Math.cos(maxTiltRad)
  const cameraZ    = (aspect / 2) / Math.tan((fov / 2) * (Math.PI / 180)) + zExcursion + 0.05

  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.75))' }}
      camera={{ position: [0, 0, cameraZ], fov, near: 0.01, far: 100 }}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      flat
      dpr={window.devicePixelRatio}
      resize={{ offsetSize: true }}
    >
      <SizeEnforcer w={slotW} h={slotH} />

      {/* Ambient base so body is never pure black */}
      <ambientLight intensity={0.4} />
      {/* Key: upper-right, steep angle so bevel top/right faces catch specular */}
      <directionalLight position={[2, 8, 1]} intensity={3} />
      {/* Fill: lower-left-front, soft */}
      <directionalLight position={[-3, -2, 4]} intensity={0.6} />

      <PhoneModel
        spec={spec}
        aspect={aspect}
        bezelN={bezelN}
        outerCornerR={outerCornerR}
        tilt={tilt}
        rotate={rotate}
        screenshotDataUrl={screenshotDataUrl}
      />
    </Canvas>
  )
}

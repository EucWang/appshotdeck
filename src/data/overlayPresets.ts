export interface OverlayPreset {
  id: string
  label: string
  dataUrl: string
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const STAR_5_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40"><text x="0" y="30" font-family="sans-serif" font-size="32" fill="#FFD700">★★★★★</text></svg>`

const RATING_48_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="50" viewBox="0 0 220 50"><text x="0" y="38" font-family="sans-serif" font-size="36" font-weight="700" fill="#FFFFFF">4.8</text><text x="52" y="38" font-family="sans-serif" font-size="28" fill="#FFD700">★★★★★</text></svg>`

const APP_STORE_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="54" viewBox="0 0 180 54"><rect width="180" height="54" rx="12" fill="#000"/><text x="58" y="20" font-family="system-ui,sans-serif" font-size="9" fill="#fff">Download on the</text><text x="58" y="40" font-family="system-ui,sans-serif" font-size="17" font-weight="700" fill="#fff">App Store</text><path d="M30 27c0-4.5 3.7-6.7 3.8-6.8-2.1-3-5.3-3.4-6.4-3.5-2.7-.3-5.3 1.6-6.7 1.6s-3.5-1.6-5.8-1.5c-3 .0-5.7 1.7-7.2 4.4-3.1 5.4-.8 13.3 2.2 17.7 1.5 2.1 3.2 4.5 5.5 4.4 2.2-.1 3-1.4 5.7-1.4s3.4 1.4 5.7 1.4c2.4 0 3.9-2.1 5.3-4.3 1.7-2.4 2.4-4.8 2.4-5-.0 0-4.6-1.8-4.6-7zM26.2 14.3c1.2-1.5 2-3.5 1.8-5.6-1.7.1-3.8 1.2-5.1 2.6-1.1 1.3-2.1 3.4-1.8 5.4 1.9.2 3.8-.9 5.1-2.4z" fill="#fff"/></svg>`

const GOOGLE_PLAY_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="54" viewBox="0 0 200 54"><rect width="200" height="54" rx="12" fill="#000"/><text x="62" y="20" font-family="system-ui,sans-serif" font-size="9" fill="#fff">GET IT ON</text><text x="62" y="40" font-family="system-ui,sans-serif" font-size="17" font-weight="700" fill="#fff">Google Play</text><path d="M20 12l16 15-16 15V12z" fill="#4CAF50"/><path d="M20 12l16 15-5.3 5.3L20 12z" fill="#F44336" opacity=".8"/><path d="M36 27l-5.3 5.3L15 42l21-15z" fill="#FFC107" opacity=".8"/></svg>`

const BADGE_1_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="#FFD700" stroke="#E6B800" stroke-width="2"/><text x="8" y="32" font-family="system-ui,sans-serif" font-size="18" font-weight="800" fill="#1a1a1a">#1</text><text x="10" y="52" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="#1a1a1a">App</text></svg>`

const TOP_10_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="44" viewBox="0 0 90 44"><rect width="90" height="44" rx="22" fill="#6366F1"/><text x="12" y="30" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="#fff">Top 10</text></svg>`

const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#22C55E"/><path d="M15 24l6 6 12-12" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const ARROW_RIGHT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="rgba(255,255,255,0.2)"/><path d="M18 12l18 12-18 12V12z" fill="#fff"/></svg>`

const SPARKLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M24 0l4 16 16 4-16 4-4 16-4-16L4 20l16-4z" fill="#FFD700"/><path d="M40 28l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="#FFD700" opacity=".7"/></svg>`

const SHIELD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="56" viewBox="0 0 48 56"><path d="M24 2L4 12v16c0 14 20 24 20 24s20-10 20-24V12L24 2z" fill="#3B82F6" stroke="#2563EB" stroke-width="2"/><path d="M17 28l5 5 10-10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const FREE_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="36" viewBox="0 0 72 36"><rect width="72" height="36" rx="18" fill="#EC4899"/><text x="14" y="25" font-family="system-ui,sans-serif" font-size="16" font-weight="800" fill="#fff">FREE</text></svg>`

const HEART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M24 42s-18-10-18-24c0-5 4-9 9-9 4 0 7 2 9 5 2-3 5-5 9-5 5 0 9 4 9 9 0 14-18 24-18 24z" fill="#EF4444"/></svg>`

const DOWNLOAD_ARROW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#8B5CF6"/><path d="M24 12v20M16 26l8 8 8-8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`

export const OVERLAY_PRESETS: OverlayPreset[] = [
  { id: 'stars-5',     label: '5 Stars',      dataUrl: svgToDataUrl(STAR_5_SVG) },
  { id: 'rating-48',   label: '4.8 Rating',    dataUrl: svgToDataUrl(RATING_48_SVG) },
  { id: 'app-store',   label: 'App Store',     dataUrl: svgToDataUrl(APP_STORE_BADGE_SVG) },
  { id: 'google-play', label: 'Google Play',   dataUrl: svgToDataUrl(GOOGLE_PLAY_BADGE_SVG) },
  { id: 'badge-1',     label: '#1 App',        dataUrl: svgToDataUrl(BADGE_1_SVG) },
  { id: 'top-10',      label: 'Top 10',        dataUrl: svgToDataUrl(TOP_10_SVG) },
  { id: 'check',       label: 'Checkmark',     dataUrl: svgToDataUrl(CHECK_SVG) },
  { id: 'arrow',       label: 'Arrow',         dataUrl: svgToDataUrl(ARROW_RIGHT_SVG) },
  { id: 'sparkle',     label: 'Sparkle',       dataUrl: svgToDataUrl(SPARKLE_SVG) },
  { id: 'shield',      label: 'Shield',        dataUrl: svgToDataUrl(SHIELD_SVG) },
  { id: 'free',        label: 'FREE',          dataUrl: svgToDataUrl(FREE_BADGE_SVG) },
  { id: 'heart',       label: 'Heart',         dataUrl: svgToDataUrl(HEART_SVG) },
  { id: 'download',    label: 'Download',      dataUrl: svgToDataUrl(DOWNLOAD_ARROW_SVG) },
]

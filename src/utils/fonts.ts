const SYSTEM_FONT_STACK = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
const DEFAULT_FONT = "'Inter', sans-serif"

export function resolveFontFamily(font: string | undefined): string {
  if (!font || font === 'default') return DEFAULT_FONT
  if (font === 'system') return SYSTEM_FONT_STACK
  return `'${font.replace(/'/g, "\\'")}', sans-serif`
}

const FREE_COMMERCIAL_FONTS = new Set([
  // ── Windows pre-installed ──
  'arial', 'arial black', 'arial narrow', 'arial rounded mt bold',
  'calibri', 'cambria', 'candara', 'consolas', 'constantia', 'corbel',
  'courier new', 'lucida console', 'lucida sans unicode',
  'microsoft sans serif', 'segoe ui', 'segoe ui light', 'segoe ui semibold',
  'tahoma', 'trebuchet ms', 'verdana', 'webdings', 'wingdings',
  'palatino linotype', 'times new roman', 'georgia', 'impact',
  'comic sans ms', 'book antiqua', 'bookman old style',
  'century gothic', 'garamond',

  // ── macOS pre-installed ──
  'helvetica', 'helvetica neue', 'geneva', 'monaco',
  'sf pro display', 'sf pro text', 'sf pro', 'sf compact',
  'new york', 'san francisco',
  'applegothic', 'applesdgothicneo',
  'pingfang sc', 'pingfang tc', 'pingfang hk',
  'heiti sc', 'heiti tc', 'songti sc', 'songti tc',
  'stheiti', 'stfangsong', 'stkaiti', 'stsong',
  'hiragino sans', 'hiragino kaku gothic pro', 'hiragino mincho pro',
  'aquatico', 'chalkboard se', 'cooper hewitt',

  // ── Linux pre-installed ──
  'dejavu sans', 'dejavu sans mono', 'dejavu serif',
  'liberation sans', 'liberation serif', 'liberation mono',
  'noto sans', 'noto sans sc', 'noto sans tc', 'noto sans jp',
  'noto serif', 'noto serif sc', 'noto mono',
  'droid sans', 'droid serif', 'droid sans mono',
  'cantarell', 'ubuntu', 'ubuntu mono',
  'roboto', 'roboto condensed', 'roboto mono', 'roboto slab',
  'source sans pro', 'source sans 3', 'source serif pro', 'source serif 4',
  'source code pro',

  // ── Google Fonts (SIL Open Font License) ──
  'open sans', 'lato', 'montserrat', 'poppins', 'raleway',
  'nunito', 'nunito sans', 'work sans', 'dm sans', 'dm mono', 'dm serif display',
  'manrope', 'figtree', 'plus jakarta sans',
  'bebas neue', 'oswald', 'righteous', 'anton',
  'playfair display', 'lora', 'merriweather', 'eb garamond',
  'cabin', 'karla', 'rubik', 'quicksand',
  'josefin sans', 'cormorant garamond', 'archivo',
  'barlow', 'ibm plex sans', 'ibm plex mono', 'ibm plex serif',
  'fira sans', 'fira code', 'fira mono',
  'inconsolata', 'space mono', 'jetbrains mono',
  'pt sans', 'pt serif', 'pt mono',
  'alegreya', 'crimson text', 'crimson pro',
  'archivo black', 'libre baskerville', 'libre franklin',
  'mukta', 'mulish', 'outfit', 'space grotesk',
  'sora', 'urbanist', 'geist', 'geist mono',
  'inter', 'cascadia code', 'cascadia mono',
  'fantasque sans mono', 'hack', 'iosevka',
  'lexend', 'atkinson hyperlegible',
  'catamaran', 'exo 2', 'oxygen',
  'titillium web', 'asap', 'bitter',
  'signika', 'exo', 'varela round', 'maven pro',
  'teko', 'pathway gothic one', 'abril fatface',
  'comfortaa', 'archivo narrow', 'poiret one',
  'raleway dots',
].map((f) => f.toLowerCase()))

export function isFreeCommercial(fontName: string): boolean {
  return FREE_COMMERCIAL_FONTS.has(fontName.toLowerCase())
}

let cachedFonts: string[] | null | undefined

export async function getSystemFonts(): Promise<string[] | null> {
  if (cachedFonts !== undefined) return cachedFonts
  if (!('queryLocalFonts' in window)) {
    cachedFonts = null
    return null
  }
  try {
    const fonts: Array<{ family: string }> = await (window as any).queryLocalFonts()
    const names = [...new Set(fonts.map((f) => f.family))]
    names.sort((a, b) => a.localeCompare(b))
    cachedFonts = names
    return names
  } catch {
    cachedFonts = null
    return null
  }
}

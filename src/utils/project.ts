import JSZip from 'jszip'
import type { Background, ScreenshotSlot, Slide } from '../types'

const PROJECT_VERSION = 2

type JsonBackground =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; angle: number }
  | { type: 'image'; dataUrl: string; overlayColor: string; overlayOpacity: number; blur: number; frosted: number }

type JsonScreenshotSlot = Omit<ScreenshotSlot, 'screenshotDataUrl'> & {
  image: string | null
}

interface SlideEntry extends Omit<Slide, 'screenshotDataUrl' | 'background' | 'slots'> {
  image: string | null
  background: JsonBackground
  jsonSlots?: JsonScreenshotSlot[]
}

interface ProjectConfig {
  version: number
  slides: SlideEntry[]
}

function slotToImageBase64(slot: ScreenshotSlot): { slot: JsonScreenshotSlot; base64: string | null; filename: string } | null {
  if (!slot.screenshotDataUrl) {
    return { slot: { image: null, screenshotZoom: slot.screenshotZoom, screenshotOffsetX: slot.screenshotOffsetX, screenshotOffsetY: slot.screenshotOffsetY }, base64: null, filename: '' }
  }
  const base64 = slot.screenshotDataUrl.split(',')[1]
  return { slot: { image: '', screenshotZoom: slot.screenshotZoom, screenshotOffsetX: slot.screenshotOffsetX, screenshotOffsetY: slot.screenshotOffsetY }, base64, filename: '' }
}

export async function saveProject(slides: Slide[]): Promise<void> {
  const zip = new JSZip()
  const images = zip.folder('images')!

  const configSlides: SlideEntry[] = await Promise.all(
    slides.map(async (slide, idx) => {
      const { screenshotDataUrl, background, slots, ...rest } = slide
      let image: string | null = null

      if (screenshotDataUrl) {
        const base64 = screenshotDataUrl.split(',')[1]
        const filename = `slide-${idx + 1}.png`
        images.file(filename, base64, { base64: true })
        image = `images/${filename}`
      }

      let jsonBg: JsonBackground = background
      if (background.type === 'image') {
        const bgBase64 = background.dataUrl.split(',')[1]
        const bgFilename = `bg-${idx + 1}.jpg`
        images.file(bgFilename, bgBase64, { base64: true })
        jsonBg = { ...background, dataUrl: `images/${bgFilename}` }
      }

      let jsonSlots: JsonScreenshotSlot[] | undefined
      if (slots) {
        jsonSlots = slots.map((s, sIdx) => {
          const result = slotToImageBase64(s)
          if (result && result.base64) {
            const filename = `slide-${idx + 1}-slot${sIdx + 1}.png`
            images.file(filename, result.base64, { base64: true })
            return { ...result.slot, image: `images/${filename}` }
          }
          return { ...result!.slot }
        })
      }

      return { ...rest, image, background: jsonBg, jsonSlots } as unknown as SlideEntry
    }),
  )

  const config: ProjectConfig = { version: PROJECT_VERSION, slides: configSlides }
  zip.file('config.json', JSON.stringify(config, null, 2))

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'appshotdeck-project.zip'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export interface LoadedProject {
  slides: Slide[]
}

async function loadImageFromZip(zip: JSZip, imagePath: string): Promise<string | null> {
  const imgFile = zip.file(imagePath)
  if (!imgFile) return null
  const base64 = await imgFile.async('base64')
  return `data:image/png;base64,${base64}`
}

export async function loadProject(file: File): Promise<LoadedProject> {
  const zip = await JSZip.loadAsync(file)

  const configFile = zip.file('config.json')
  if (!configFile) throw new Error('Invalid project file: missing config.json')

  const config: ProjectConfig = JSON.parse(await configFile.async('text'))
  if (!config.version || !Array.isArray(config.slides)) {
    throw new Error('Invalid project file: unrecognised format')
  }

  const slides: Slide[] = await Promise.all(
    config.slides.map(async (entry) => {
      let screenshotDataUrl: string | null = null

      if (entry.image) {
        screenshotDataUrl = await loadImageFromZip(zip, entry.image)
      }

      let background: Background = entry.background

      if (entry.background.type === 'image' && !entry.background.dataUrl.startsWith('data:')) {
        const bgImgFile = zip.file(entry.background.dataUrl)
        if (bgImgFile) {
          const bgBase64 = await bgImgFile.async('base64')
          background = {
            type: 'image',
            dataUrl: `data:image/jpeg;base64,${bgBase64}`,
            overlayColor: entry.background.overlayColor ?? '#000000',
            overlayOpacity: entry.background.overlayOpacity ?? 40,
            blur: entry.background.blur ?? 0,
            frosted: entry.background.frosted ?? 0,
          }
        } else {
          background = { type: 'gradient', from: '#0F172A', to: '#1E3A5F', angle: 135 }
        }
      }

      const rest = { ...entry } as Record<string, unknown>
      delete rest.image
      delete rest.jsonSlots

      const slide: Record<string, unknown> = { ...rest, screenshotDataUrl, background }

      if (entry.jsonSlots) {
        const loadedSlots: ScreenshotSlot[] = await Promise.all(
          entry.jsonSlots.map(async (js) => {
            let dataUrl: string | null = null
            if (js.image) {
              dataUrl = await loadImageFromZip(zip, js.image)
            }
            return {
              screenshotDataUrl: dataUrl,
              screenshotZoom: js.screenshotZoom,
              screenshotOffsetX: js.screenshotOffsetX,
              screenshotOffsetY: js.screenshotOffsetY,
            }
          }),
        )
        slide.slots = loadedSlots
      }

      return slide as unknown as Slide
    }),
  )

  return { slides }
}

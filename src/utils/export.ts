import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import type { SlideFormat } from '../types'

const FORMAT_SIZE: Record<SlideFormat, { width: number; height: number }> = {
  'phone':     { width: 1080,  height: 1920 },
  'tablet-7':  { width: 1920,  height: 1080 },
  'tablet-10': { width: 2560,  height: 1440 },
  'iphone-69': { width: 1320,  height: 2868 },
  'iphone-65': { width: 1242,  height: 2688 },
  'ipad-13':   { width: 2048,  height: 2732 },
}

const FORMAT_FOLDER: Record<SlideFormat, string> = {
  'phone':     'android/phone',
  'tablet-7':  'android/tablet-7',
  'tablet-10': 'android/tablet-10',
  'iphone-69': 'ios/iphone-69',
  'iphone-65': 'ios/iphone-65',
  'ipad-13':   'ios/ipad-13',
}

async function captureElement(el: HTMLElement, format: SlideFormat): Promise<string> {
  const { width, height } = FORMAT_SIZE[format]
  return toPng(el, { width, height, pixelRatio: 1 })
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export async function exportSlide(
  el: HTMLElement,
  format: SlideFormat,
  name: string
): Promise<void> {
  const dataUrl = await captureElement(el, format)
  triggerDownload(dataUrl, `${name}.png`)
}

export interface ExportEntry {
  el: HTMLElement
  format: SlideFormat
  name: string
}

export async function exportAll(entries: ExportEntry[]): Promise<void> {
  const zip = new JSZip()
  const folders: Record<string, JSZip> = {}

  for (const { el, format, name } of entries) {
    const dataUrl = await captureElement(el, format)
    const base64 = dataUrl.split(',')[1]
    const folderPath = FORMAT_FOLDER[format]
    if (!folders[folderPath]) folders[folderPath] = zip.folder(folderPath)!
    folders[folderPath].file(`${name}.png`, base64, { base64: true })
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, 'appshotdeck-export.zip')
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

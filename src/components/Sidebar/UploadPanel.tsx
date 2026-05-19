import { useCallback, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../store/useEditorStore'
import { compressImage } from '../../utils/compress'
import type { ScreenshotSlot, Slide } from '../../types'

function SingleUpload() {
  const { t } = useTranslation()
  const { slides, activeSlideId, updateSlide } = useEditorStore()
  const slide = slides.find((s) => s.id === activeSlideId)
  const [compressing, setCompressing] = useState(false)
  const screenshotDataUrl = slide?.screenshotDataUrl ?? null

  const handleFile = useCallback(
    async (file: File) => {
      setCompressing(true)
      try {
        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const compressed = await compressImage(dataUrl)
        updateSlide(activeSlideId, { screenshotDataUrl: compressed, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 })
      } finally {
        setCompressing(false)
      }
    },
    [activeSlideId, updateSlide]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file?.type.startsWith('image/')) handleFile(file)
    },
    [handleFile]
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <label
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer hover:border-indigo-400 transition-colors ${
        screenshotDataUrl
          ? 'border-indigo-400/40 bg-indigo-500/5 dark:bg-indigo-500/10'
          : 'border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5'
      }`}
    >
      {compressing ? (
        <>
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-black/50 dark:text-white/50">{t('upload.compressing')}</p>
        </>
      ) : screenshotDataUrl ? (
        <div className="w-full aspect-video rounded-lg overflow-hidden relative group">
          <img src={screenshotDataUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-white font-medium">{t('upload.replace_image')}</p>
          </div>
        </div>
      ) : (
        <>
          <Upload className="w-8 h-8 text-muted" />
          <div className="text-center">
            <p className="text-sm text-soft font-medium">{t('upload.drop_title')}</p>
            <p className="text-xs text-muted mt-1">{t('upload.drop_subtitle')}</p>
          </div>
        </>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={onInputChange} disabled={compressing} />
    </label>
  )
}

function SlotUpload({ label, slotIndex, slide }: { label: string; slotIndex: number; slide: Slide }) {
  const { t } = useTranslation()
  const { activeSlideId, updateSlide } = useEditorStore()
  const [compressing, setCompressing] = useState(false)

  const slot = slide.slots?.[slotIndex]

  const handleFile = useCallback(
    async (file: File) => {
      setCompressing(true)
      try {
        const reader = new FileReader()
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const compressed = await compressImage(dataUrl)
        const currentSlots = slide.slots ?? [
          { screenshotDataUrl: slide.screenshotDataUrl, screenshotZoom: slide.screenshotZoom ?? 100, screenshotOffsetX: slide.screenshotOffsetX ?? 0, screenshotOffsetY: slide.screenshotOffsetY ?? 0 },
          { screenshotDataUrl: null, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 },
        ]
        const newSlots: ScreenshotSlot[] = [...currentSlots]
        newSlots[slotIndex] = { ...newSlots[slotIndex], screenshotDataUrl: compressed, screenshotZoom: 100, screenshotOffsetX: 0, screenshotOffsetY: 0 }
        updateSlide(activeSlideId, { slots: newSlots })
      } finally {
        setCompressing(false)
      }
    },
    [activeSlideId, updateSlide, slide, slotIndex]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file?.type.startsWith('image/')) handleFile(file)
    },
    [handleFile]
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <p className="text-xs text-muted mb-1.5 font-medium">{label}</p>
      <label
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer hover:border-indigo-400 transition-colors ${
          slot?.screenshotDataUrl
            ? 'border-indigo-400/40 bg-indigo-500/5 dark:bg-indigo-500/10'
            : 'border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        {compressing ? (
          <>
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-xs text-black/50 dark:text-white/50">{t('upload.compressing')}</p>
          </>
        ) : slot?.screenshotDataUrl ? (
          <div className="w-full aspect-video rounded-lg overflow-hidden">
            <img src={slot.screenshotDataUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-muted" />
            <p className="text-xs text-soft">{t('upload.drop_subtitle')}</p>
          </>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={onInputChange} disabled={compressing} />
      </label>
    </div>
  )
}

export function UploadPanel() {
  const { t } = useTranslation()
  const { slides, activeSlideId } = useEditorStore()
  const slide = slides.find((s) => s.id === activeSlideId)
  if (!slide) return null

  const isDual = (slide.screenshotCount ?? 1) === 2

  if (!isDual) {
    return (
      <div className="p-4 space-y-3">
        <SingleUpload />
        <p className="text-xs text-black/30 dark:text-white/30 text-center">{t('upload.hint')}</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <SlotUpload label={t('upload.screenshot_1')} slotIndex={0} slide={slide} />
      <SlotUpload label={t('upload.screenshot_2')} slotIndex={1} slide={slide} />
      <p className="text-xs text-black/30 dark:text-white/30 text-center">{t('upload.hint')}</p>
    </div>
  )
}

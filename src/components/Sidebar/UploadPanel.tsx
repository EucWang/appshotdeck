import { useCallback, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../store/useEditorStore'
import { compressImage } from '../../utils/compress'

export function UploadPanel() {
  const { t } = useTranslation()
  const { activeSlideId, updateSlide } = useEditorStore()
  const [compressing, setCompressing] = useState(false)

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
    <div className="p-4 space-y-3">
      <label
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-black/20 dark:border-white/20 rounded-xl p-8 cursor-pointer hover:border-indigo-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        {compressing ? (
          <>
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-black/50 dark:text-white/50">{t('upload.compressing')}</p>
          </>
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
      <p className="text-xs text-black/30 dark:text-white/30 text-center">{t('upload.hint')}</p>
    </div>
  )
}

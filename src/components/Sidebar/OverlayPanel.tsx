import { useCallback, useMemo, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '../../store/useEditorStore'
import { OVERLAY_PRESETS } from '../../data/overlayPresets'
import { compressTransparentImage } from '../../utils/compress'
import type { OverlayIcon } from '../../types'

export function OverlayPanel() {
  const { t } = useTranslation()
  const {
    slides, activeSlideId,
    addOverlay, removeOverlay, updateOverlay,
    activeOverlayId, setActiveOverlayId,
  } = useEditorStore()
  const [compressing, setCompressing] = useState(false)

  const slide = slides.find((s) => s.id === activeSlideId)

  const overlays = useMemo(() => slide?.overlays ?? [], [slide])
  const maxReached = overlays.length >= 8
  const selectedOverlay = useMemo(
    () => overlays.find((o) => o.id === activeOverlayId) ?? null,
    [overlays, activeOverlayId]
  )

  const addOverlayIcon = useCallback((dataUrl: string) => {
    if (maxReached) return
    const icon: OverlayIcon = {
      id: crypto.randomUUID(),
      dataUrl,
      x: 50,
      y: 50,
      scale: 100,
      rotate: 0,
      opacity: 100,
    }
    addOverlay(activeSlideId, icon)
  }, [activeSlideId, addOverlay, maxReached])

  const handleUpload = useCallback(async (file: File) => {
    setCompressing(true)
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const compressed = await compressTransparentImage(dataUrl)
      addOverlayIcon(compressed)
    } finally {
      setCompressing(false)
    }
  }, [addOverlayIcon])

  const openFilePicker = useCallback(() => {
    if (compressing || maxReached) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleUpload(file)
    }
    input.click()
  }, [compressing, maxReached, handleUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (maxReached) return
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleUpload(file)
  }, [maxReached, handleUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  if (!slide) return null

  return (
    <div className="p-4 space-y-4" onDrop={handleDrop} onDragOver={handleDragOver}>
      <div className="space-y-2">
        <p className="text-xs text-muted uppercase tracking-wider">{t('overlay.presets')}</p>
        <div className="grid grid-cols-3 gap-2">
          {OVERLAY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              title={`${t('overlay.add_preset')}: ${preset.label}`}
              disabled={maxReached}
              onClick={() => addOverlayIcon(preset.dataUrl)}
              className="aspect-square rounded-lg border-2 border-medium hover:border-indigo-400 transition-all flex items-center justify-center p-2 disabled:opacity-40 disabled:cursor-not-allowed bg-black/5 dark:bg-white/5"
            >
              <img src={preset.dataUrl} alt={preset.label} className="max-w-full max-h-full object-contain" />
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-medium pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted uppercase tracking-wider">{t('overlay.upload')}</p>
          <button
            onClick={openFilePicker}
            disabled={compressing || maxReached}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {compressing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            {compressing ? t('overlay.compressing') : t('overlay.upload')}
          </button>
        </div>
        {!maxReached && overlays.length === 0 && (
          <div
            onClick={openFilePicker}
            className="border-2 border-dashed border-medium rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 transition-all"
          >
            <p className="text-xs text-muted">{t('overlay.drop_title')}</p>
            <p className="text-[10px] text-dim mt-1">{t('overlay.drop_subtitle')}</p>
          </div>
        )}
        {maxReached && (
          <p className="text-xs text-amber-400">{t('overlay.max_reached')}</p>
        )}
      </div>

      {overlays.length > 0 && (
        <div className="border-t border-medium pt-4 space-y-2">
          <p className="text-xs text-muted uppercase tracking-wider">{t('overlay.list')} ({overlays.length}/8)</p>
          <div className="space-y-1">
            {overlays.map((overlay, idx) => (
              <button
                key={overlay.id}
                onClick={() => setActiveOverlayId(activeOverlayId === overlay.id ? null : overlay.id)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all ${
                  activeOverlayId === overlay.id
                    ? 'bg-indigo-500/20 border border-indigo-400'
                    : 'border border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {overlay.dataUrl ? (
                  <img src={overlay.dataUrl} alt="" className="w-8 h-8 object-contain rounded" />
                ) : (
                  <div className="w-8 h-8 rounded bg-black/10 dark:bg-white/10" />
                )}
                <span className="text-xs text-dim flex-1 text-left">#{idx + 1}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeOverlay(activeSlideId, overlay.id) }}
                  className="p-1 rounded hover:bg-red-500/20 text-dim hover:text-red-400 transition-all"
                  title={t('overlay.delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedOverlay && (
        <div className="border-t border-medium pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted w-14">{t('overlay.position_x')}</span>
            <input
              type="range" min={0} max={100} step={0.5}
              value={selectedOverlay.x}
              onChange={(e) => updateOverlay(activeSlideId, selectedOverlay.id, { x: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-dim font-mono w-10 text-right">{Math.round(selectedOverlay.x)}%</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted w-14">{t('overlay.position_y')}</span>
            <input
              type="range" min={0} max={100} step={0.5}
              value={selectedOverlay.y}
              onChange={(e) => updateOverlay(activeSlideId, selectedOverlay.id, { y: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-dim font-mono w-10 text-right">{Math.round(selectedOverlay.y)}%</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted w-14">{t('overlay.scale')}</span>
            <input
              type="range" min={10} max={300}
              value={selectedOverlay.scale}
              onChange={(e) => updateOverlay(activeSlideId, selectedOverlay.id, { scale: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-dim font-mono w-10 text-right">{selectedOverlay.scale}%</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted w-14">{t('overlay.rotate')}</span>
            <input
              type="range" min={-180} max={180}
              value={selectedOverlay.rotate}
              onChange={(e) => updateOverlay(activeSlideId, selectedOverlay.id, { rotate: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-dim font-mono w-10 text-right">{selectedOverlay.rotate}°</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted w-14">{t('overlay.opacity')}</span>
            <input
              type="range" min={0} max={100}
              value={selectedOverlay.opacity}
              onChange={(e) => updateOverlay(activeSlideId, selectedOverlay.id, { opacity: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-dim font-mono w-10 text-right">{selectedOverlay.opacity}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

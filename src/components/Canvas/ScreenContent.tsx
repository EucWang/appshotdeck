import { useTranslation } from 'react-i18next'

interface Props {
  screenshotDataUrl: string | null
  slotW: number
}

export function ScreenContent({ screenshotDataUrl, slotW }: Props) {
  const { t } = useTranslation()
  return screenshotDataUrl ? (
    <img
      src={screenshotDataUrl}
      alt=""
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'top center',
        display: 'block',
      }}
    />
  ) : (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.06)',
      color: 'rgba(255,255,255,0.35)',
      fontSize: Math.round(slotW * 0.05), fontWeight: 600,
    }}>
      {t('canvas.upload_prompt')}
    </div>
  )
}

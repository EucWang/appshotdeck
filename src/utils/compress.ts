// 2048px covers the widest canvas slot (iPad 1440px) with room to spare.
// Physical device screenshots can be 1440×3088 (S24 Ultra) or 1290×2796 (iPhone 16 Pro Max)
// — keeping them at 2048 on the long side avoids upscaling artefacts in the canvas slot.
const MAX_DIMENSION = 2048
// 900 KB per image → 8 slides ≈ 7.2 MB theoretical max, but JPEG compresses
// typical app screenshots to 200–500 KB so real-world total stays well under 5 MB.
const MAX_BYTES = 900_000

const BG_MAX_BYTES = 400_000

export function compressBackgroundImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = reject
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)

      const target = BG_MAX_BYTES * 1.37

      let quality = 0.88
      let result = canvas.toDataURL('image/jpeg', quality)

      while (result.length > target && quality > 0.3) {
        quality = Math.round((quality - 0.08) * 100) / 100
        result = canvas.toDataURL('image/jpeg', quality)
      }

      resolve(result)
    }
    img.src = dataUrl
  })
}

export function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = reject
    img.onload = () => {
      // Scale down if larger than MAX_DIMENSION on either axis
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width  = Math.round(width  * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)

      // base64 is ~33% larger than binary, so target MAX_BYTES * 1.37
      const target = MAX_BYTES * 1.37

      let quality = 0.88
      let result  = canvas.toDataURL('image/jpeg', quality)

      while (result.length > target && quality > 0.3) {
        quality = Math.round((quality - 0.08) * 100) / 100
        result  = canvas.toDataURL('image/jpeg', quality)
      }

      resolve(result)
    }
    img.src = dataUrl
  })
}

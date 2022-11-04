import crypto from 'node:crypto'

import Canvas from 'canvas'

function getBase64Image(img: Canvas.Image) {
  const canvas = Canvas.createCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, img.width, img.height)
  return canvas.toDataURL('image/png')
}

async function loadImage(src: Buffer): Promise<Canvas.Image> {
  return new Promise((resolve, reject) => {
    const img = new Canvas.Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

async function generateImageHash(src: Buffer) {
  const img = await loadImage(src)
  const base64 = getBase64Image(img)
  return crypto.createHash('md5').update(base64).digest('hex')
}

export default generateImageHash

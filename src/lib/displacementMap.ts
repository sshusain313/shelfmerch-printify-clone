// src/lib/displacementMap.ts
import { Texture } from 'pixi.js';

/**
 * Creates a grayscale displacement texture from the garment image.
 * `contrastBoost` > 1 increases fold contrast, < 1 softens it.
 */
export async function createDisplacementTextureFromGarment(
  garmentUrl: string,
  contrastBoost: number,
): Promise<Texture> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async' as any;
    img.src = garmentUrl;

    // Wait for decode to ensure dimensions are valid
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (err) => reject(err);
    });
    if (!img.width || !img.height) throw new Error('Invalid garment image dimensions');

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');

    try {
      // Draw original garment image
      ctx.drawImage(img, 0, 0);
    } catch (e) {
      // Likely a CORS-tainted canvas. Fall back to neutral gray map.
      return createNeutralDisplacementTexture(img.width, img.height);
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Convert to grayscale + apply simple contrast boost
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Luminance
      let lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Contrast around 128 (mid-gray)
      lum = 128 + (lum - 128) * contrastBoost;

      // Clamp
      lum = Math.max(0, Math.min(255, lum));

      data[i] = lum;
      data[i + 1] = lum;
      data[i + 2] = lum;
      data[i + 3] = a; // keep original alpha
    }

    ctx.putImageData(imageData, 0, 0);

    let displacementDataUrl: string;
    try {
      displacementDataUrl = canvas.toDataURL('image/png');
    } catch (e) {
      // If toDataURL fails due to tainting, fall back to neutral map
      return createNeutralDisplacementTexture(canvas.width, canvas.height);
    }

    const texture = Texture.from(displacementDataUrl);
    return texture;
  } catch (err) {
    // As a last resort, return a neutral displacement map to avoid black artifacts
    return createNeutralDisplacementTexture(512, 512);
  }
}

function createNeutralDisplacementTexture(width: number, height: number): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgb(128,128,128)'; // neutral displacement
  ctx.fillRect(0, 0, width, height);
  return Texture.from(canvas.toDataURL('image/png'));
}



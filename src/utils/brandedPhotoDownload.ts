import type { Photo } from '@/types/gallery';
import type { SponsorPhotoBrand } from '@/types/sponsorGallery';
import { normalizeSponsorSlug } from '@/utils/sponsorGallery';

const BRAND_SIZE_RATIO = 0.18;
const BRAND_MARGIN_RATIO = 0.025;
const BRAND_PADDING_RATIO = 0.08;
const MAX_OUTPUT_DIMENSION = 6000;

const getDownloadAssetUrl = (source: string): string => {
  const assetUrl = new URL(source, window.location.href);

  if (assetUrl.origin === window.location.origin || import.meta.env.DEV) {
    return assetUrl.href;
  }

  const proxyUrl = new URL('/photo-proxy.php', window.location.origin);
  proxyUrl.searchParams.set('url', assetUrl.href);
  return proxyUrl.href;
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Não foi possível carregar a imagem: ${url}`));
    image.src = url;
  });

const getPhotoSource = (photo: Photo): string =>
  photo.variants?.full_2x?.webp ||
  photo.variants?.full_2x?.jpg ||
  photo.variants?.full_1x?.webp ||
  photo.variants?.full_1x?.jpg ||
  photo.variants?.preview?.webp ||
  photo.variants?.preview?.jpg ||
  photo.url ||
  photo.thumbnailUrl;

const drawRoundedSquare = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void => {
  const radius = Math.max(4, size * 0.08);

  context.beginPath();
  context.roundRect(x, y, size, size, radius);
  context.fillStyle = 'rgba(255, 255, 255, 0.96)';
  context.fill();
};

const drawContainedImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  size: number,
): void => {
  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;

  context.drawImage(
    image,
    x + (size - width) / 2,
    y + (size - height) / 2,
    width,
    height,
  );
};

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
            return;
          }

          reject(new Error('Não foi possível gerar o arquivo da foto.'));
        },
        'image/jpeg',
        0.94,
      );
    } catch {
      reject(
        new Error(
          'O servidor de fotos não permitiu compor o download. Verifique a configuração CORS.',
        ),
      );
    }
  });

export const downloadBrandedPhoto = async (
  photo: Photo,
  brand: SponsorPhotoBrand,
): Promise<void> => {
  const photoSource = getPhotoSource(photo);
  const logoSource = brand.logoUrlWebp || brand.logoUrl;

  if (!photoSource || !logoSource) {
    throw new Error('A foto ou a logo do apoiador não está disponível.');
  }

  const [photoImage, logoImage] = await Promise.all([
    loadImage(getDownloadAssetUrl(photoSource)),
    loadImage(getDownloadAssetUrl(logoSource)),
  ]);

  const sourceWidth = photoImage.naturalWidth;
  const sourceHeight = photoImage.naturalHeight;
  const outputScale = Math.min(
    1,
    MAX_OUTPUT_DIMENSION / Math.max(sourceWidth, sourceHeight),
  );
  const outputWidth = Math.max(1, Math.round(sourceWidth * outputScale));
  const outputHeight = Math.max(1, Math.round(sourceHeight * outputScale));

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('O navegador não conseguiu preparar o download da foto.');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(photoImage, 0, 0, outputWidth, outputHeight);

  const shortSide = Math.min(outputWidth, outputHeight);
  const brandSize = Math.max(1, Math.round(shortSide * BRAND_SIZE_RATIO));
  const margin = Math.max(1, Math.round(shortSide * BRAND_MARGIN_RATIO));
  const padding = Math.max(1, Math.round(brandSize * BRAND_PADDING_RATIO));
  const brandX = outputWidth - brandSize - margin;
  const brandY = outputHeight - brandSize - margin;

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.28)';
  context.shadowBlur = Math.max(6, brandSize * 0.06);
  context.shadowOffsetY = Math.max(2, brandSize * 0.02);
  drawRoundedSquare(context, brandX, brandY, brandSize);
  context.restore();

  drawContainedImage(
    context,
    logoImage,
    brandX + padding,
    brandY + padding,
    brandSize - padding * 2,
  );

  const blob = await canvasToBlob(canvas);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sponsorSlug = normalizeSponsorSlug(brand.name) || 'apoiador';

  link.href = objectUrl;
  link.download = `foto-${photo.id_foto || photo.id}-${sponsorSlug}.jpg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

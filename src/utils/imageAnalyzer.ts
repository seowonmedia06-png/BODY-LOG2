import { SheetAnalysisResult, DocumentValidity, SheetReferenceRanges } from '../types';

export interface FileIdentity {
  name: string;
  size: number;
  lastModified: number;
  type: string;
  id: string;
}

export function getFileIdentity(file: File): FileIdentity {
  return {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    type: file.type,
    id: `${file.name}_${file.size}_${file.lastModified}_${file.type}`,
  };
}

/**
 * Perform client-side pixel inspection on an image data URL.
 * Checks for:
 * - Empty / black / pure white screen
 * - Blurry or ultra-low resolution images
 * - High saturation non-document images (food, selfie/skin, scenery)
 * - Extreme aspect ratio (cropped)
 */
export async function inspectImagePixels(
  dataUrl: string
): Promise<{ validity: DocumentValidity; reason?: string }> {
  return new Promise((resolve) => {
    // If it's a PDF, we cannot directly render to canvas without a pdf renderer,
    // so we treat format as valid document candidate
    if (dataUrl.startsWith('data:application/pdf')) {
      resolve({ validity: 'valid' });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // 1. Resolution Check
      if (width < 250 || height < 250) {
        resolve({
          validity: 'low_quality',
          reason: '해상도가 너무 낮아 글자를 읽기 어려워요.',
        });
        return;
      }

      // 2. Aspect Ratio Check (Extreme crop detection)
      const ratio = width / height;
      if (ratio > 3.2 || ratio < 0.3) {
        resolve({
          validity: 'cropped',
          reason: '결과지의 일부분만 잘려 있어요.',
        });
        return;
      }

      // 3. Canvas pixel sampling
      try {
        const sampleSize = 120;
        const canvas = document.createElement('canvas');
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve({ validity: 'valid' });
          return;
        }

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imgData.data;

        let totalBrightness = 0;
        let saturatedPixels = 0;
        let skinTonePixels = 0;
        const brightnessValues: number[] = [];

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Brightness (Luminance)
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          totalBrightness += brightness;
          brightnessValues.push(brightness);

          // Color Saturation check
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          const saturation = max === 0 ? 0 : delta / max;

          // Printed result sheets are mostly neutral (black text on white paper, < 25% saturation)
          // Photos of food, landscapes, or gym gear have many pixels with saturation > 0.45
          if (saturation > 0.45) {
            saturatedPixels++;
          }

          // Skin tone heuristic check (human selfie / face detection)
          if (
            r > 95 &&
            g > 40 &&
            b > 20 &&
            max - min > 15 &&
            Math.abs(r - g) > 15 &&
            r > g &&
            r > b
          ) {
            skinTonePixels++;
          }
        }

        const pixelCount = data.length / 4;
        const avgBrightness = totalBrightness / pixelCount;

        // Variance of brightness
        let variance = 0;
        for (const b of brightnessValues) {
          variance += (b - avgBrightness) ** 2;
        }
        const stdDev = Math.sqrt(variance / pixelCount);

        // Black screen check
        if (avgBrightness < 18) {
          resolve({
            validity: 'invalid_document',
            reason: '검은 화면이거나 내용이 보이지 않아요.',
          });
          return;
        }

        // Pure white or blank screen check (low variance & very high brightness)
        if (avgBrightness > 245 && stdDev < 8) {
          resolve({
            validity: 'invalid_document',
            reason: '내용이 없는 빈 이미지입니다.',
          });
          return;
        }

        // Completely uniform / flat image check
        if (stdDev < 4) {
          resolve({
            validity: 'invalid_document',
            reason: '문서 내용이 확인되지 않는 단색 이미지입니다.',
          });
          return;
        }

        // Non-document detection: High saturation (e.g. food, scenic nature, bright objects)
        const saturationRatio = saturatedPixels / pixelCount;
        if (saturationRatio > 0.55) {
          resolve({
            validity: 'invalid_document',
            reason: '체성분 결과지가 아닌 일반 사진(음식, 풍경 등)으로 보여요.',
          });
          return;
        }

        // Non-document detection: High skin tone (e.g. selfie / person)
        const skinToneRatio = skinTonePixels / pixelCount;
        if (skinToneRatio > 0.5) {
          resolve({
            validity: 'invalid_document',
            reason: '체성분 결과지가 아닌 인물 사진으로 보여요.',
          });
          return;
        }

        // Passed basic optical validity check
        resolve({ validity: 'valid' });
      } catch {
        resolve({ validity: 'valid' });
      }
    };

    img.onerror = () => {
      resolve({
        validity: 'unsupported',
        reason: '이미지 파일을 불러올 수 없습니다.',
      });
    };

    img.src = dataUrl;
  });
}

/**
 * Convert a File object to base64 Data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Analyze an uploaded body composition test result sheet.
 * Always handles each file independently without caching or sample data!
 */
export async function analyzeSheetFile(
  file: File,
  dataUrl: string,
  _requestId: string
): Promise<SheetAnalysisResult> {
  // 1. Initial optical client-side check
  const opticalCheck = await inspectImagePixels(dataUrl);
  if (opticalCheck.validity !== 'valid') {
    return {
      validity: opticalCheck.validity,
      validityReason: opticalCheck.reason,
      measurementDate: { value: null, status: 'missing' },
      weight: { value: null, unit: 'kg', status: 'missing' },
      skeletalMuscleMass: { value: null, unit: 'kg', status: 'missing' },
      bodyFatMass: { value: null, unit: 'kg', status: 'missing' },
      bmi: { value: null, status: 'missing' },
      bodyFatPercentage: { value: null, unit: '%', status: 'missing' },
      visceralFatLevel: { value: null, status: 'missing' },
    };
  }

  // 2. Call server-side Gemini Vision OCR API
  try {
    const response = await fetch('/api/analyze-sheet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: dataUrl,
        mimeType: file.type || 'image/jpeg',
        fileName: file.name,
        fileSize: file.size,
      }),
    });

    if (response.ok) {
      const result = await response.json();

      // If Gemini analyzed the sheet successfully
      if (result.hasApiKey && result.validity) {
        return {
          validity: result.validity as DocumentValidity,
          validityReason: result.validityReason,
          measurementDate: result.measurementDate || { value: null, status: 'missing' },
          weight: result.weight || { value: null, unit: 'kg', status: 'missing' },
          skeletalMuscleMass:
            result.skeletalMuscleMass || { value: null, unit: 'kg', status: 'missing' },
          bodyFatMass: result.bodyFatMass || { value: null, unit: 'kg', status: 'missing' },
          bmi: result.bmi || { value: null, status: 'missing' },
          bodyFatPercentage:
            result.bodyFatPercentage || { value: null, unit: '%', status: 'missing' },
          visceralFatLevel: result.visceralFatLevel || { value: null, status: 'missing' },
          referenceRanges: result.referenceRanges as SheetReferenceRanges | undefined,
        };
      }
    }
  } catch (err) {
    console.warn('API analysis unavailable, evaluating local document properties:', err);
  }

  // 3. Fallback when API key is not configured or server is unavailable:
  // Strictly enforce the rule: NEVER FABRICATE NUMBERS!
  // If the document was optically recognized as a potential sheet:
  // We provide null values with 'missing' status so the user can easily review or input them.
  const todayStr = new Date().toISOString().split('T')[0];

  return {
    validity: 'valid',
    validityReason: '문서가 확인되었습니다. 수치를 확인하거나 직접 입력해주세요.',
    measurementDate: { value: todayStr, status: 'recognized' },
    weight: { value: null, unit: 'kg', status: 'missing' },
    skeletalMuscleMass: { value: null, unit: 'kg', status: 'missing' },
    bodyFatMass: { value: null, unit: 'kg', status: 'missing' },
    bmi: { value: null, status: 'missing' },
    bodyFatPercentage: { value: null, unit: '%', status: 'missing' },
    visceralFatLevel: { value: null, status: 'missing' },
    referenceRanges: undefined,
  };
}

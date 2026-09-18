import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { parseOcrText } from './src/utils/ocrParser';

function sheetAnalysisApiPlugin(): Plugin {
  return {
    name: 'sheet-analysis-api',
    configureServer(server) {
      server.middlewares.use('/api/analyze-sheet', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(chunk as Buffer);
          }
          const rawBody = Buffer.concat(chunks).toString('utf-8');
          const data = JSON.parse(rawBody || '{}');
          const { imageBase64, mimeType, fileName, userHeight } = data;

          if (!imageBase64) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing imageBase64 data' }));
            return;
          }

          const apiKey = process.env.GEMINI_API_KEY;

          // If Gemini API Key exists, try Gemini Vision first
          if (apiKey) {
            try {
              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({ apiKey });

              const prompt = `You are a clinical document validation and OCR engine specialized in body composition sheets (e.g. InBody, Tanita, Accuniq, DEXA, hospital body composition printouts).

FIRST, validate the document:
- Check if this image is a genuine body composition test result sheet.
- If it is NOT a body composition report (e.g. photo of a person, selfie, food, landscape, gym equipment/dumbbells, receipt, bank statement, screenshot of SNS, blank/white/black image, or other unrelated document), set "validity": "invalid_document" and provide a clear Korean "validityReason".
- If it appears to be a body composition sheet, but is unreadable due to severe blur, shake, poor focus, severe glare/reflection, dark lighting, or low resolution, set "validity": "low_quality".
- If the sheet is severely cropped or cut off so that core body composition sections cannot be identified, set "validity": "cropped".
- If it is a readable body composition result sheet, set "validity": "valid".

SECOND, ONLY if "validity" is "valid":
Extract the exact metrics visible on the sheet.
CRITICAL RULES:
1. SUBJECT MEASUREMENT VALUES VS REFERENCE RANGES:
   - On InBody and body composition sheets, there are REFERENCE RANGES (표준범위) printed in parentheses like "(49.0 ~ 66.2)", "(18.5 ~ 25.0)", or in a reference range column.
   - DO NOT EVER return the reference range minimum or maximum as the measurement value!
   - Always extract the subject's actual measurement value (측정치), which is usually outside the parentheses, adjacent to the graph bar, or in the measured value column.
2. BMI (체질량지수 / Body Mass Index):
   - In InBody sheets, BMI is located in the "비만분석" (Obesity Analysis) or "비만진단" section, often written as "BMI (kg/m²)" or "체질량지수".
   - Extract the measured BMI number (e.g. 23.9, 21.6), NOT the reference range (18.5 ~ 25.0) and NOT the unit (kg/m²).
   - If BMI is printed on the sheet, extract it and set status: "recognized".
   - If BMI is not printed as a number but height (신장) and weight (체중) are visible, calculate BMI = weight / ((height/100)^2) rounded to 1 decimal place and set status: "recognized".
3. HEIGHT (신장):
   - Extract the printed height in cm (e.g. 175.2) if visible in the header or profile section.
4. WEIGHT (체중):
   - Extract the measured weight in kg (e.g. 73.4), NOT the range (49.0 ~ 66.2).
5. SKELETAL MUSCLE MASS (골격근량):
   - Extract the measured skeletal muscle mass in kg (e.g. 34.2), NOT the range (25.1 ~ 30.7).
6. BODY FAT MASS (체지방량):
   - Extract the measured body fat mass in kg (e.g. 12.8), NOT the range (9.8 ~ 15.6) and NOT 체지방률.
7. BODY FAT PERCENTAGE (체지방률 / PBF):
   - Extract the percentage in % (e.g. 17.4), NOT the range (10.0 ~ 20.0).
8. VISCERAL FAT LEVEL (내장지방레벨):
   - Extract the level integer (e.g. 4), NOT the range (1 ~ 9).
9. MEASUREMENT DATE:
   - Format as "YYYY-MM-DD" if printed (e.g. "2024-08-21"); otherwise value: null, status: "missing".
10. REFERENCE RANGES:
   - Extract min and max for weight, skeletalMuscle, bodyFatPercent, bodyFatMass, bmi, visceralFat ONLY if explicitly printed on the sheet.

Return strict JSON only (no markdown, no quotes around json):
{
  "validity": "valid" | "invalid_document" | "low_quality" | "cropped",
  "validityReason": "한국어 설명",
  "measurementDate": { "value": string | null, "status": "recognized" | "uncertain" | "missing" },
  "height": { "value": number | null, "unit": "cm", "status": "recognized" | "missing" },
  "weight": { "value": number | null, "unit": "kg", "status": "recognized" | "uncertain" | "missing" },
  "skeletalMuscleMass": { "value": number | null, "unit": "kg", "status": "recognized" | "uncertain" | "missing" },
  "bodyFatMass": { "value": number | null, "unit": "kg", "status": "recognized" | "uncertain" | "missing" },
  "bmi": { "value": number | null, "status": "recognized" | "uncertain" | "missing" },
  "bodyFatPercentage": { "value": number | null, "unit": "%", "status": "recognized" | "uncertain" | "missing" },
  "visceralFatLevel": { "value": number | null, "status": "recognized" | "uncertain" | "missing" },
  "referenceRanges": {
    "weight": { "min": number, "max": number },
    "skeletalMuscle": { "min": number, "max": number },
    "bodyFatPercent": { "min": number, "max": number },
    "bodyFatMass": { "min": number, "max": number },
    "bmi": { "min": number, "max": number },
    "visceralFat": { "min": number, "max": number }
  }
}`;

              const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: [
                  {
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
                      data: cleanBase64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
                config: {
                  responseMimeType: 'application/json',
                },
              });

              const responseText = response.text?.trim() || '{}';
              const parsed = JSON.parse(responseText);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  hasApiKey: true,
                  ocrEngine: 'Gemini Vision AI',
                  ...parsed,
                })
              );
              return;
            } catch (err) {
              console.warn('Gemini API call failed, falling back to Tesseract OCR:', err);
            }
          }

          // Fallback: Perform real local OCR via Tesseract.js in Node.js
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker('kor+eng');

          const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
          const buffer = Buffer.from(cleanBase64, 'base64');
          const tempFilePath = path.join(
            os.tmpdir(),
            `ocr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`
          );
          await fs.promises.writeFile(tempFilePath, buffer);

          const { data: ocrData } = await worker.recognize(tempFilePath);
          await fs.promises.unlink(tempFilePath).catch(() => {});
          await worker.terminate();

          const rawText = ocrData.text || '';
          const parsed = parseOcrText(rawText);

          // Document validity evaluation from extracted OCR text
          const bodyCompKeywords = [
            '체중',
            'weight',
            '골격근',
            'muscle',
            '체지방',
            'fat',
            'inbody',
            'bmi',
            '체수분',
            '단백질',
            '무기질',
            '인바디',
            'pbf',
            'smm',
            'bfm',
          ];
          const lowerText = rawText.toLowerCase();
          const matchesKeyword = bodyCompKeywords.some((kw) => lowerText.includes(kw));

          let validity = 'valid';
          let validityReason = '결과지 텍스트를 OCR로 성공적으로 인식했습니다.';

          if (!matchesKeyword && rawText.trim().length > 0) {
            validity = 'invalid_document';
            validityReason =
              '체성분 결과지(인바디 등) 관련 텍스트가 확인되지 않았습니다. 결과지 사진을 확인해주세요.';
          } else if (
            parsed.weight === null &&
            parsed.skeletalMuscleMass === null &&
            parsed.bodyFatMass === null &&
            parsed.bmi === null &&
            parsed.bodyFatPercentage === null
          ) {
            validity = 'low_quality';
            validityReason =
              '체성분 용어가 감지되었으나 수치가 흐릿하여 정확히 읽기 어렵습니다. 다시 촬영해주세요.';
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              hasApiKey: false,
              ocrEngine: 'Tesseract OCR (kor+eng)',
              validity,
              validityReason,
              measurementDate: {
                value: parsed.measurementDate,
                status: parsed.measurementDate ? 'recognized' : 'missing',
              },
              weight: {
                value: parsed.weight,
                unit: 'kg',
                status: parsed.weight !== null ? 'recognized' : 'missing',
              },
              skeletalMuscleMass: {
                value: parsed.skeletalMuscleMass,
                unit: 'kg',
                status: parsed.skeletalMuscleMass !== null ? 'recognized' : 'missing',
              },
              bodyFatMass: {
                value: parsed.bodyFatMass,
                unit: 'kg',
                status: parsed.bodyFatMass !== null ? 'recognized' : 'missing',
              },
              bmi: {
                value: parsed.bmi,
                status: parsed.bmi !== null ? 'recognized' : 'missing',
              },
              bodyFatPercentage: {
                value: parsed.bodyFatPercentage,
                unit: '%',
                status: parsed.bodyFatPercentage !== null ? 'recognized' : 'missing',
              },
              visceralFatLevel: {
                value: parsed.visceralFatLevel,
                status: parsed.visceralFatLevel !== null ? 'recognized' : 'missing',
              },
              referenceRanges: parsed.referenceRanges,
            })
          );
        } catch (err: any) {
          console.error('OCR / Sheet analysis error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: 'ANALYSIS_FAILED',
              validity: 'analysis_error',
              message: err?.message || '분석 중 오류가 발생했습니다.',
            })
          );
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), sheetAnalysisApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

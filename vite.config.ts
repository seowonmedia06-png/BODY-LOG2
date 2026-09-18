import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

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
          const { imageBase64, mimeType } = data;

          if (!imageBase64) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing imageBase64 data' }));
            return;
          }

          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                hasApiKey: false,
                validity: 'analysis_error',
                message: 'GEMINI_API_KEY is not configured',
              })
            );
            return;
          }

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
- NEVER fabricate, guess, extrapolate, or use default sample numbers!
- If a value is clearly printed, extract the exact number and set status: "recognized".
- If a value is partially obscured, smudged, or ambiguous, set value: null and status: "uncertain".
- If a value is not present on this sheet, set value: null and status: "missing".
- measurementDate: format as "YYYY-MM-DD" if printed; otherwise value: null, status: "missing".
- referenceRanges: extract min and max for weight, skeletalMuscle, bodyFatPercent, bodyFatMass, bmi, visceralFat ONLY if explicitly printed on the sheet. If not printed, omit them. DO NOT generate standard ranges!

Return strict JSON only (no markdown, no quotes around json):
{
  "validity": "valid" | "invalid_document" | "low_quality" | "cropped",
  "validityReason": "한국어 설명",
  "measurementDate": { "value": string | null, "status": "recognized" | "uncertain" | "missing" },
  "weight": { "value": number | null, "unit": "kg", "status": "recognized" | "uncertain" | "missing" },
  "skeletalMuscleMass": { "value": number | null, "unit": "kg", "status": "recognized" | "uncertain" | "missing" },
  "bodyFatMass": { "value": number | null, "unit": "kg", "status": "recognized" | "uncertain" | "missing" },
  "bmi": { "value": number | null, "status": "recognized" | "uncertain" | "missing" },
  "bodyFatPercentage": { "value": number | null, "unit": "%", "status": "recognized" | "uncertain" | "missing" },
  "visceralFatLevel": { "value": number | null, "status": "recognized" | "uncertain" | "missing" },
  "referenceRanges": {
    "weight": { "min": number, "max": number, "rawLabel": string },
    "skeletalMuscle": { "min": number, "max": number, "rawLabel": string },
    "bodyFatPercent": { "min": number, "max": number, "rawLabel": string },
    "bodyFatMass": { "min": number, "max": number, "rawLabel": string },
    "bmi": { "min": number, "max": number, "rawLabel": string },
    "visceralFat": { "min": number, "max": number, "rawLabel": string }
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
          res.end(JSON.stringify({ hasApiKey: true, ...parsed }));
        } catch (err: any) {
          console.error('Gemini vision API error:', err);
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

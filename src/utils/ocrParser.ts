import { SheetReferenceRanges } from '../types';

export interface ExtractedMetrics {
  rawText: string;
  weight: number | null;
  skeletalMuscleMass: number | null;
  bodyFatMass: number | null;
  bodyFatPercentage: number | null;
  bmi: number | null;
  visceralFatLevel: number | null;
  bodyWater: number | null;
  protein: number | null;
  minerals: number | null;
  basalMetabolicRate: number | null;
  measurementDate: string | null;
  height: number | null;
  referenceRanges: SheetReferenceRanges;
}

export function parseOcrText(text: string, userHeight?: number | null): ExtractedMetrics {
  const clean = text.replace(/\r/g, '\n');

  // 1. Date Parsing:
  let measurementDate: string | null = null;
  // Pattern A: Day. Month. Year (e.g. "24. 8. 2026" or "21. 8. 2024")
  const dayMonthYearMatch = clean.match(
    /(?:날\s*짜|Date|측정일|검사일)?\s*[:\s]*([0-3]?\d)\s*[.\-/]\s*([0-1]?\d)\s*[.\-/]\s*(20\d{2})/i
  );
  if (dayMonthYearMatch) {
    const day = dayMonthYearMatch[1].padStart(2, '0');
    const month = dayMonthYearMatch[2].padStart(2, '0');
    const year = dayMonthYearMatch[3];
    measurementDate = `${year}-${month}-${day}`;
  } else {
    // Pattern B: Year. Month. Day (e.g. "2026. 8. 24", "2024-08-21", "2024년 8월 21일")
    const yearMonthDayMatch = clean.match(
      /(?:날\s*짜|Date|측정일|검사일)?\s*[:\s]*(20\d{2})[.\-/년\s]+([0-1]?\d)[.\-/월\s]+([0-3]?\d)/i
    );
    if (yearMonthDayMatch) {
      const year = yearMonthDayMatch[1];
      const month = yearMonthDayMatch[2].padStart(2, '0');
      const day = yearMonthDayMatch[3].padStart(2, '0');
      measurementDate = `${year}-${month}-${day}`;
    } else {
      // Pattern C: 2-digit year "24. 08. 21"
      const shortDateMatch = clean.match(
        /(?:날\s*짜|Date|측정일|검사일)?\s*[:\s]*([1-3]\d)[.\-/년\s]+([0-1]?\d)[.\-/월\s]+([0-3]?\d)/i
      );
      if (shortDateMatch) {
        const year = `20${shortDateMatch[1]}`;
        const month = shortDateMatch[2].padStart(2, '0');
        const day = shortDateMatch[3].padStart(2, '0');
        measurementDate = `${year}-${month}-${day}`;
      }
    }
  }

  // 2. Height Extraction (신장 / Height)
  let detectedHeight: number | null = null;
  const heightMatch = clean.match(/(?:신\s*장|Height|키)\s*[:\s]*(\d{2,3}(?:\.\d)?)\s*(?:cm)?/i);
  if (heightMatch) {
    const h = parseFloat(heightMatch[1]);
    if (h >= 110 && h <= 230) {
      detectedHeight = h;
    }
  }
  const effectiveHeight = detectedHeight || userHeight || null;

  // 3. Normalize text and replace unit tokens so digits like 2 in kg/m2 or cm don't count as candidate metrics
  let workingText = clean
    .replace(/kg\/m[²2\^]/gi, ' __UNIT_KGM2__ ')
    .replace(/kg\/m\b/gi, ' __UNIT_KGM2__ ')
    .replace(/kg\b/gi, ' __UNIT_KG__ ')
    .replace(/cm\b/gi, ' __UNIT_CM__ ')
    .replace(/kcal\b/gi, ' __UNIT_KCAL__ ')
    .replace(/%/g, ' __UNIT_PCT__ ')
    // Normalize OCR typos in metric names
    .replace(/BMl|BM1|8MI|B\.M\.I\.?/gi, 'BMI')
    .replace(/체\s*질\s*량\s*지\s*수/g, 'BMI')
    .replace(/골\s*격\s*근\s*량/g, '골격근량')
    .replace(/체\s*지\s*방\s*량/g, '체지방량')
    .replace(/체\s*지\s*방\s*률|체\s*지\s*방\s*율/g, '체지방률')
    .replace(/내\s*장\s*지\s*방\s*레\s*벨|내\s*장\s*지\s*방/g, '내장지방레벨');

  const lines = workingText.split('\n').map((l) => l.trim()).filter(Boolean);
  const ranges: ExtractedMetrics['referenceRanges'] = {};

  // Helper to extract range and mask it from line
  function extractAndMaskRange(str: string): {
    masked: string;
    range: { min: number; max: number } | null;
  } {
    let masked = str;
    let range: { min: number; max: number } | null = null;

    // Pattern with parens/brackets: (49.0 ~ 66.2) or [18.5 - 25.0]
    const parenMatch = str.match(
      /[({\[]\s*(\d+(?:\.\d+)?)\s*(?:~|-|—|ㅡ)\s*(\d+(?:\.\d+)?)\s*[)}\]]/
    );
    if (parenMatch) {
      range = { min: parseFloat(parenMatch[1]), max: parseFloat(parenMatch[2]) };
      masked = masked.replace(parenMatch[0], ' __RANGE__ ');
    } else {
      // Pattern without parens: 49.0 ~ 66.2
      const tildeMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:~|—|ㅡ)\s*(\d+(?:\.\d+)?)/);
      if (tildeMatch) {
        range = { min: parseFloat(tildeMatch[1]), max: parseFloat(tildeMatch[2]) };
        masked = masked.replace(tildeMatch[0], ' __RANGE__ ');
      }
    }
    return { masked, range };
  }

  // Helper to find candidate numbers from a string
  function getCandidateNumbers(str: string): { value: number; isDecimal: boolean }[] {
    const matches = str.match(/\b\d{1,4}(?:\.\d{1,2})?\b/g);
    if (!matches) return [];
    return matches
      .map((s) => ({
        value: parseFloat(s),
        isDecimal: s.includes('.'),
      }))
      .filter((o) => !isNaN(o.value));
  }

  // Standard graph tick marks to deprioritize when searching for actual measurements
  const graphMarks = new Set([55, 70, 85, 100, 115, 130, 145, 160, 175, 190, 205]);

  function pickBestNumber(
    candidates: { value: number; isDecimal: boolean }[],
    min: number,
    max: number,
    targetValue?: number | null
  ): number | null {
    const valid = candidates.filter((c) => c.value >= min && c.value <= max);
    if (valid.length === 0) return null;

    // If a target reference value is known (e.g. mathematically calculated BMI), prefer the candidate that matches
    if (targetValue != null) {
      const close = valid.find((c) => Math.abs(c.value - targetValue) <= 0.8);
      if (close) return close.value;
    }

    // Prefer numbers with decimal point (e.g. 73.4) over whole integers (e.g. 100)
    const decimals = valid.filter((c) => c.isDecimal);
    if (decimals.length > 0) {
      return decimals[decimals.length - 1].value;
    }

    // Filter out graph scale marks
    const nonGraph = valid.filter((c) => !graphMarks.has(c.value));
    if (nonGraph.length > 0) {
      return nonGraph[nonGraph.length - 1].value;
    }

    return valid[valid.length - 1].value;
  }

  let weight: number | null = null;
  let skeletalMuscleMass: number | null = null;
  let bodyFatMass: number | null = null;
  let bodyFatPercentage: number | null = null;
  let bmi: number | null = null;
  let visceralFatLevel: number | null = null;
  let bodyWater: number | null = null;
  let protein: number | null = null;
  let minerals: number | null = null;
  let basalMetabolicRate: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';
    const { masked: maskedLine, range: lineRange } = extractAndMaskRange(line);
    const { masked: maskedNext, range: nextRange } = extractAndMaskRange(nextLine);

    // 1. 체중 (Weight): usually 30.0 - 230.0
    if (/체\s*중|Weight\b/i.test(line) && weight === null) {
      if (lineRange) ranges.weight = lineRange;
      else if (nextRange) ranges.weight = nextRange;

      const numsLine = getCandidateNumbers(maskedLine);
      const chosen = pickBestNumber(numsLine, 30, 230);
      if (chosen !== null) {
        weight = chosen;
      } else {
        const numsNext = getCandidateNumbers(maskedNext);
        const chosenNext = pickBestNumber(numsNext, 30, 230);
        if (chosenNext !== null) weight = chosenNext;
      }
    }

    // 2. 골격근량 (SMM / Skeletal Muscle Mass): usually 12.0 - 70.0
    if (/골격근량|SMM\b|Skeletal\s*Muscle/i.test(line) && skeletalMuscleMass === null) {
      if (lineRange) ranges.skeletalMuscle = lineRange;
      else if (nextRange) ranges.skeletalMuscle = nextRange;

      const numsLine = getCandidateNumbers(maskedLine);
      const chosen = pickBestNumber(numsLine, 12, 70);
      if (chosen !== null) {
        skeletalMuscleMass = chosen;
      } else {
        const numsNext = getCandidateNumbers(maskedNext);
        const chosenNext = pickBestNumber(numsNext, 12, 70);
        if (chosenNext !== null) skeletalMuscleMass = chosenNext;
      }
    }

    // 3. 체지방량 (Body Fat Mass / BFM): usually 2.0 - 85.0
    if (
      /체지방량|BFM\b|Body\s*Fat\s*Mass/i.test(line) &&
      !/체지방률|PBF/i.test(line) &&
      bodyFatMass === null
    ) {
      if (lineRange) ranges.bodyFatMass = lineRange;
      else if (nextRange) ranges.bodyFatMass = nextRange;

      const numsLine = getCandidateNumbers(maskedLine);
      const chosen = pickBestNumber(numsLine, 2, 85);
      if (chosen !== null) {
        bodyFatMass = chosen;
      } else {
        const numsNext = getCandidateNumbers(maskedNext);
        const chosenNext = pickBestNumber(numsNext, 2, 85);
        if (chosenNext !== null) bodyFatMass = chosenNext;
      }
    }

    // 4. BMI (체질량지수): usually 12.0 - 50.0
    if (/\bBMI\b|체질량지수/i.test(line) && bmi === null) {
      if (lineRange) ranges.bmi = lineRange;
      else if (nextRange) ranges.bmi = nextRange;

      const expectedBmi =
        weight && effectiveHeight
          ? weight / Math.pow(effectiveHeight / 100, 2)
          : null;
      const numsLine = getCandidateNumbers(maskedLine);
      const chosen = pickBestNumber(numsLine, 12, 50, expectedBmi);
      if (chosen !== null) {
        bmi = chosen;
      } else {
        const numsNext = getCandidateNumbers(maskedNext);
        const chosenNext = pickBestNumber(numsNext, 12, 50, expectedBmi);
        if (chosenNext !== null) bmi = chosenNext;
      }
    }

    // 5. 체지방률 (Percent Body Fat / PBF / %): usually 3.0 - 65.0
    if (/체지방률|PBF\b|Percent\s*Body\s*Fat/i.test(line) && bodyFatPercentage === null) {
      if (lineRange) ranges.bodyFatPercent = lineRange;
      else if (nextRange) ranges.bodyFatPercent = nextRange;

      const numsLine = getCandidateNumbers(maskedLine);
      const chosen = pickBestNumber(numsLine, 3, 65);
      if (chosen !== null) {
        bodyFatPercentage = chosen;
      } else {
        const numsNext = getCandidateNumbers(maskedNext);
        const chosenNext = pickBestNumber(numsNext, 3, 65);
        if (chosenNext !== null) bodyFatPercentage = chosenNext;
      }
    }

    // 6. 내장지방 (Visceral Fat): usually 1 - 25
    if (/내장지방/i.test(line) && visceralFatLevel === null) {
      if (lineRange) ranges.visceralFat = lineRange;
      else if (nextRange) ranges.visceralFat = nextRange;

      const numsLine = getCandidateNumbers(maskedLine);
      const chosen = pickBestNumber(numsLine, 1, 25);
      if (chosen !== null) {
        visceralFatLevel = Math.round(chosen);
      } else {
        const numsNext = getCandidateNumbers(maskedNext);
        const chosenNext = pickBestNumber(numsNext, 1, 25);
        if (chosenNext !== null) visceralFatLevel = Math.round(chosenNext);
      }
    }

    // 7. 체수분 (Total Body Water): usually 15.0 - 80.0
    if (/체수분|Body\s*Water|TBW/i.test(line) && bodyWater === null) {
      const numsLine = getCandidateNumbers(maskedLine);
      const chosen = pickBestNumber(numsLine, 15, 80);
      if (chosen !== null) bodyWater = chosen;
    }

    // 8. 단백질 (Protein): usually 4.0 - 25.0
    if (/단백질|Protein/i.test(line) && protein === null) {
      const numsLine = getCandidateNumbers(maskedLine);
      const chosen = pickBestNumber(numsLine, 4, 25);
      if (chosen !== null) protein = chosen;
    }

    // 9. 무기질 (Minerals): usually 1.0 - 10.0
    if (/무기질|Mineral/i.test(line) && minerals === null) {
      const numsLine = getCandidateNumbers(maskedLine);
      const chosen = pickBestNumber(numsLine, 1.0, 10.0);
      if (chosen !== null) minerals = chosen;
    }

    // 10. 기초대사량 (BMR): usually 800 - 3500
    if (/기초대사량|BMR/i.test(line) && basalMetabolicRate === null) {
      const numsLine = getCandidateNumbers(maskedLine);
      const chosen = pickBestNumber(numsLine, 800, 3500);
      if (chosen !== null) basalMetabolicRate = Math.round(chosen);
    }
  }

  // 4. Clinical Cross-Consistency and Fallback Auto-Calculations:
  // (A) BMI calculation: If BMI was missed or obscured on the sheet, but weight and height exist:
  if (bmi === null && weight && effectiveHeight) {
    bmi = Number((weight / Math.pow(effectiveHeight / 100, 2)).toFixed(1));
  }

  // (B) Body Fat Mass calculation: If fatMass was missed, but weight and bodyFatPercentage exist:
  if (bodyFatMass === null && weight && bodyFatPercentage) {
    bodyFatMass = Number((weight * (bodyFatPercentage / 100)).toFixed(1));
  }

  // (C) Body Fat Percentage calculation: If bodyFatPercentage was missed, but weight and bodyFatMass exist:
  if (bodyFatPercentage === null && weight && bodyFatMass) {
    bodyFatPercentage = Number(((bodyFatMass / weight) * 100).toFixed(1));
  }

  return {
    rawText: clean,
    weight,
    skeletalMuscleMass,
    bodyFatMass,
    bodyFatPercentage,
    bmi,
    visceralFatLevel,
    bodyWater,
    protein,
    minerals,
    basalMetabolicRate,
    measurementDate,
    height: effectiveHeight,
    referenceRanges: ranges,
  };
}

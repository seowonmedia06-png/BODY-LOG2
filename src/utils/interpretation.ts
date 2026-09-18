import { SheetReferenceRanges, MeasurementRecord } from '../types';

export interface InterpretationItem {
  key: 'weight' | 'skeletalMuscle' | 'bodyFatPercent' | 'bodyFatMass' | 'bmi' | 'visceralFat';
  title: string;
  unit: string;
  currentValue: number;
  previousValue?: number;
  delta?: number;
  comparisonText?: string;
  rangeText?: string;
  statusText: string;
  hasRecognizedRange: boolean;
}

export interface FullInterpretation {
  isFirstRecord: boolean;
  summaryTitle: string;
  summaryText: string;
  adviceText: string;
  items: InterpretationItem[];
  disclaimer: string;
}

interface GenerateInterpretationParams {
  currentValues: {
    weight: number;
    skeletalMuscle: number;
    bodyFatPercent: number;
    bodyFatMass: number;
    bmi: number;
    visceralFat: number;
  };
  referenceRanges?: SheetReferenceRanges;
  previousRecord?: MeasurementRecord;
}

/**
 * Generate neutral, non-evaluative interpretation based strictly on:
 * 1. Confirmed current values
 * 2. Sheet-provided reference ranges (if recognized)
 * 3. Actual previous record of the user (if exists)
 */
export function generateInterpretation({
  currentValues,
  referenceRanges,
  previousRecord,
}: GenerateInterpretationParams): FullInterpretation {
  const hasPrevious = !!previousRecord;

  const metricConfigs: Array<{
    key: 'weight' | 'skeletalMuscle' | 'bodyFatPercent' | 'bodyFatMass' | 'bmi' | 'visceralFat';
    title: string;
    unit: string;
    prevVal?: number;
  }> = [
    {
      key: 'weight',
      title: '체중',
      unit: 'kg',
      prevVal: previousRecord?.weight,
    },
    {
      key: 'skeletalMuscle',
      title: '골격근량',
      unit: 'kg',
      prevVal: previousRecord?.skeletalMuscle,
    },
    {
      key: 'bodyFatPercent',
      title: '체지방률',
      unit: '%',
      prevVal: previousRecord?.bodyFatPercent,
    },
    {
      key: 'bodyFatMass',
      title: '체지방량',
      unit: 'kg',
      prevVal: previousRecord?.bodyFatMass,
    },
    {
      key: 'bmi',
      title: 'BMI',
      unit: 'kg/m²',
      prevVal: previousRecord?.bmi,
    },
    {
      key: 'visceralFat',
      title: '내장지방레벨',
      unit: 'Lv',
      prevVal: previousRecord?.visceralFat,
    },
  ];

  const items: InterpretationItem[] = metricConfigs.map((cfg) => {
    const curVal = currentValues[cfg.key];
    const prevVal = cfg.prevVal;
    const range = referenceRanges ? referenceRanges[cfg.key] : undefined;

    let delta: number | undefined = undefined;
    let comparisonText: string | undefined = undefined;

    if (hasPrevious && prevVal !== undefined && prevVal > 0) {
      delta = Number((curVal - prevVal).toFixed(1));
      const absDelta = Math.abs(delta).toFixed(1);
      const isPercent = cfg.unit === '%';
      const unitLabel = isPercent ? '%p' : ` ${cfg.unit}`;

      if (Math.abs(delta) < 0.05) {
        comparisonText = '지난 기록과 비슷한 수준이에요.';
      } else if (delta > 0) {
        comparisonText = `이전 기록보다 ${absDelta}${unitLabel} 증가했어요.`;
      } else {
        comparisonText = `이전 기록보다 ${absDelta}${unitLabel} 감소했어요.`;
      }
    }

    let rangeText: string | undefined = undefined;
    let statusText = '측정값은 확인되었지만 결과지의 기준 범위를 정확히 읽지 못했어요.';
    let hasRecognizedRange = false;

    if (range && (range.min !== undefined || range.max !== undefined)) {
      hasRecognizedRange = true;
      const minStr = range.min !== undefined ? `${range.min}` : '';
      const maxStr = range.max !== undefined ? `${range.max}` : '';
      rangeText = range.rawLabel || (minStr && maxStr ? `${minStr}~${maxStr} ${range.unit || cfg.unit}` : undefined);

      if (range.min !== undefined && range.max !== undefined) {
        if (curVal > range.max) {
          statusText = '결과지에 표시된 기준 범위보다 높은 값으로 확인돼요.';
        } else if (curVal < range.min) {
          statusText = '결과지에 표시된 기준 범위보다 낮은 값으로 확인돼요.';
        } else {
          statusText = '결과지의 기준 범위 안에 표시되어 있어요.';
        }
      } else if (range.max !== undefined && curVal > range.max) {
        statusText = '결과지에 표시된 기준 범위보다 높은 값으로 확인돼요.';
      } else if (range.min !== undefined && curVal < range.min) {
        statusText = '결과지에 표시된 기준 범위보다 낮은 값으로 확인돼요.';
      } else {
        statusText = '결과지의 기준 범위 안에 표시되어 있어요.';
      }
    }

    return {
      key: cfg.key,
      title: cfg.title,
      unit: cfg.unit,
      currentValue: curVal,
      previousValue: prevVal,
      delta,
      comparisonText,
      rangeText,
      statusText,
      hasRecognizedRange,
    };
  });

  // Comprehensive summary calculation (max 2~3 neutral sentences)
  let summaryText = '';
  let adviceText = '한 번의 측정보다 여러 기록의 변화 흐름을 함께 확인해보세요.';

  if (!hasPrevious) {
    summaryText = '첫 번째 측정 기록이에요. 앞으로 기록이 쌓이면 이전 측정값과 변화 흐름을 비교할 수 있어요.';
    adviceText = '주기적으로 측정하여 신체 조성의 변화 흐름을 관찰해보세요.';
  } else if (previousRecord) {
    const weightDiff = Number((currentValues.weight - previousRecord.weight).toFixed(1));
    const muscleDiff = Number((currentValues.skeletalMuscle - previousRecord.skeletalMuscle).toFixed(1));
    const fatDiff = Number((currentValues.bodyFatPercent - previousRecord.bodyFatPercent).toFixed(1));

    const parts: string[] = [];

    // Weight part
    if (Math.abs(weightDiff) < 0.05) {
      parts.push('체중은 비슷한 수준을 유지했고');
    } else if (weightDiff > 0) {
      parts.push(`체중은 ${Math.abs(weightDiff).toFixed(1)} kg 증가했고`);
    } else {
      parts.push(`체중은 ${Math.abs(weightDiff).toFixed(1)} kg 감소했고`);
    }

    // Muscle part
    if (Math.abs(muscleDiff) < 0.05) {
      parts.push('골격근량은 비슷한 수준이에요.');
    } else if (muscleDiff > 0) {
      parts.push(`골격근량은 ${Math.abs(muscleDiff).toFixed(1)} kg 증가했어요.`);
    } else {
      parts.push(`골격근량은 ${Math.abs(muscleDiff).toFixed(1)} kg 감소했어요.`);
    }

    const s1 = `이전 기록과 비교하면 ${parts.join(', ')}`;

    // Fat part
    let s2 = '';
    if (Math.abs(fatDiff) < 0.05) {
      s2 = '체지방률은 지난 기록과 유사한 수준이에요.';
    } else if (fatDiff > 0) {
      s2 = `체지방률은 ${Math.abs(fatDiff).toFixed(1)}%p 증가했어요.`;
    } else {
      s2 = `체지방률은 ${Math.abs(fatDiff).toFixed(1)}%p 감소했어요.`;
    }

    summaryText = `${s1} ${s2}`;
  }

  return {
    isFirstRecord: !hasPrevious,
    summaryTitle: '이번 기록 한눈에 보기',
    summaryText,
    adviceText,
    items,
    disclaimer: '측정 결과를 이해하기 위한 참고 정보이며, 의료적 진단을 의미하지 않습니다.',
  };
}

import React from 'react';
import {
  CheckCircle2,
  Calendar,
  Activity,
  ArrowRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import { MeasurementRecord } from '../types';
import { SimpleInterpretationCard } from './SimpleInterpretationCard';

interface MeasurementDetailViewProps {
  record: MeasurementRecord;
  previousRecord?: MeasurementRecord;
  allRecords: MeasurementRecord[];
  onNavigateToRecords: () => void;
  onNavigateToHome: () => void;
  showSaveSuccess?: boolean;
}

export const MeasurementDetailView: React.FC<MeasurementDetailViewProps> = ({
  record,
  previousRecord,
  allRecords,
  onNavigateToRecords,
  onNavigateToHome,
  showSaveSuccess = false,
}) => {
  // Compute comparison numbers if previous record exists
  const hasPrevious = !!previousRecord;
  const prevWeight = previousRecord ? previousRecord.weight : record.weight;
  const prevMuscle = previousRecord ? previousRecord.skeletalMuscle : record.skeletalMuscle;
  const prevFat = previousRecord ? previousRecord.bodyFatPercent : record.bodyFatPercent;

  const diffWeight = hasPrevious ? record.weight - prevWeight : 0;
  const diffMuscle = hasPrevious ? record.skeletalMuscle - prevMuscle : 0;
  const diffFat = hasPrevious ? record.bodyFatPercent - prevFat : 0;

  // Helper for subtitle under core 3 metrics
  const getCoreSubtitle = (metric: 'weight' | 'skeletalMuscle' | 'bodyFatPercent') => {
    const range = record.referenceRanges ? record.referenceRanges[metric] : undefined;
    const val = record[metric];

    if (metric === 'weight') {
      if (hasPrevious) {
        if (Math.abs(diffWeight) < 0.05) return '지난 기록과 비슷';
        return `이전보다 ${Math.abs(diffWeight).toFixed(1)}kg ${diffWeight < 0 ? '감소' : '증가'}`;
      }
      return '첫 기록 기준점';
    }

    if (range && (range.min !== undefined || range.max !== undefined)) {
      if (range.max !== undefined && val > range.max) {
        return '기준 범위보다 높은 값';
      }
      if (range.min !== undefined && val < range.min) {
        return '기준 범위보다 낮은 값';
      }
      return '기준 범위 내 위치';
    }

    if (metric === 'skeletalMuscle' && hasPrevious) {
      if (Math.abs(diffMuscle) < 0.05) return '지난 기록과 비슷';
      return `이전보다 ${Math.abs(diffMuscle).toFixed(1)}kg ${diffMuscle < 0 ? '감소' : '증가'}`;
    }
    if (metric === 'bodyFatPercent' && hasPrevious) {
      if (Math.abs(diffFat) < 0.05) return '지난 기록과 비슷';
      return `이전보다 ${Math.abs(diffFat).toFixed(1)}%p ${diffFat < 0 ? '감소' : '증가'}`;
    }

    return '측정값 확인됨';
  };

  // Build real trajectory from actual records
  const trajectoryRecords = [...allRecords]
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
    .slice(-5);

  const weights = trajectoryRecords.map((r) => r.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const rangeW = maxW - minW || 1;

  const getTrajectoryY = (val: number) => {
    if (weights.length === 1) return 35;
    const norm = (val - minW) / rangeW;
    return Math.round(52 - norm * 34);
  };

  const getTrajectoryX = (index: number, total: number) => {
    if (total <= 1) return 160;
    return Math.round(24 + (index * (296 - 24)) / (total - 1));
  };

  const xCoords = trajectoryRecords.map((_, i) => getTrajectoryX(i, trajectoryRecords.length));
  const yCoords = weights.map(getTrajectoryY);

  const trajLinePath =
    trajectoryRecords.length > 1
      ? xCoords.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${yCoords[i]}`).join(' ')
      : '';

  const trajAreaPath =
    trajectoryRecords.length > 1
      ? `${trajLinePath} L ${xCoords[xCoords.length - 1]} 65 L ${xCoords[0]} 65 Z`
      : '';

  return (
    <div
      id="measurement-detail-screen"
      className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 py-4 space-y-5 pb-24"
    >
      {/* 1. Success Pill (if coming from save) */}
      {showSaveSuccess && (
        <div className="flex justify-center pt-1">
          <div className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full bg-[#dce1ff] text-[#0c4cda] shadow-xs">
            <CheckCircle2 className="w-4 h-4 fill-[#0c4cda] text-white" />
            <span className="text-[13px] font-semibold tracking-tight">
              기록이 성공적으로 저장되었어요
            </span>
          </div>
        </div>
      )}

      {/* 2. Header Section with Date & Info */}
      <div className="flex flex-col items-center text-center mt-1">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[22px] font-bold text-[#1c1b1b] tracking-tight">
            {record.date} 측정
          </h2>
          <Calendar className="w-5 h-5 text-[#5a5f66]" />
        </div>
        <p className="text-[13px] text-[#5a5f66] mt-1">
          스캔된 인바디 데이터가 안전하게 동기화되었습니다
        </p>
      </div>

      {/* 3. Diagnostic Report Card */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f6f3f2] shadow-xs border border-[#eae7e7]/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#3867f4] shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#5a5f66] uppercase tracking-wider">
              신체 조성 리포트
            </p>
            <p className="text-[15px] font-bold text-[#1c1b1b]">
              종합 지표 분석 완료
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f0eded] text-[#434655]">
          표준 기준
        </span>
      </div>

      {/* 4. 3 Core Metrics Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Card 1: 체중 */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white shadow-xs border border-[#eae7e7]/70 text-center">
          <span className="text-[11px] font-medium text-[#5a5f66] mb-0.5">체중</span>
          <div className="flex items-baseline gap-0.5 my-0.5">
            <span className="text-[19px] font-bold text-[#1c1b1b]">
              {record.weight.toFixed(1)}
            </span>
            <span className="text-[11px] text-[#5a5f66]">kg</span>
          </div>
          <span className="text-[10px] text-[#434655] font-medium bg-[#f6f3f2] px-1.5 py-0.5 rounded-md mt-1 line-clamp-1">
            {getCoreSubtitle('weight')}
          </span>
        </div>

        {/* Card 2: 골격근량 */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white shadow-xs border border-[#eae7e7]/70 text-center">
          <span className="text-[11px] font-medium text-[#5a5f66] mb-0.5">골격근량</span>
          <div className="flex items-baseline gap-0.5 my-0.5">
            <span className="text-[19px] font-bold text-[#1c1b1b]">
              {record.skeletalMuscle.toFixed(1)}
            </span>
            <span className="text-[11px] text-[#5a5f66]">kg</span>
          </div>
          <span className="text-[10px] text-[#434655] font-medium bg-[#f6f3f2] px-1.5 py-0.5 rounded-md mt-1 line-clamp-1">
            {getCoreSubtitle('skeletalMuscle')}
          </span>
        </div>

        {/* Card 3: 체지방률 */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white shadow-xs border border-[#eae7e7]/70 text-center">
          <span className="text-[11px] font-medium text-[#5a5f66] mb-0.5">체지방률</span>
          <div className="flex items-baseline gap-0.5 my-0.5">
            <span className="text-[19px] font-bold text-[#1c1b1b]">
              {record.bodyFatPercent.toFixed(1)}
            </span>
            <span className="text-[11px] text-[#5a5f66]">%</span>
          </div>
          <span className="text-[10px] text-[#434655] font-medium bg-[#f6f3f2] px-1.5 py-0.5 rounded-md mt-1 line-clamp-1">
            {getCoreSubtitle('bodyFatPercent')}
          </span>
        </div>
      </div>

      {/* 4.5. Simple Result Interpretation Card (간단한 결과 해석) */}
      <SimpleInterpretationCard
        currentValues={{
          weight: record.weight,
          skeletalMuscle: record.skeletalMuscle,
          bodyFatPercent: record.bodyFatPercent,
          bodyFatMass: record.bodyFatMass,
          bmi: record.bmi,
          visceralFat: record.visceralFat,
        }}
        referenceRanges={record.referenceRanges}
        previousRecord={previousRecord}
        variant="light"
      />

      {/* 5. Detailed Body Composition (상세 정보) */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-[16px] font-bold text-[#1c1b1b] tracking-tight">
            상세 정보
          </h3>
          <span className="text-[12px] text-[#5a5f66]">3개 항목 측정됨</span>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#eae7e7]/70 space-y-3.5">
          {/* Item 1: 체지방량 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3867f4]" />
                <span className="text-[14px] text-[#1c1b1b] font-medium">체지방량</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[16px] font-bold text-[#1c1b1b]">
                  {record.bodyFatMass.toFixed(1)}
                </span>
                <span className="text-[12px] text-[#5a5f66]">kg</span>
              </div>
            </div>
            <div className="w-full bg-[#f0eded] h-1.5 rounded-full overflow-hidden flex">
              <div
                className="bg-[#3867f4] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(Math.max((record.bodyFatMass / (record.weight || 1)) * 100, 10), 100)}%` }}
              />
            </div>
          </div>

          <div className="h-[1px] w-full bg-[#f0eded]" />

          {/* Item 2: BMI */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5a5f66]" />
                <span className="text-[14px] text-[#1c1b1b] font-medium">BMI</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[16px] font-bold text-[#1c1b1b]">
                  {record.bmi.toFixed(1)}
                </span>
                <span className="text-[12px] text-[#5a5f66]">kg/m²</span>
              </div>
            </div>
            <div className="w-full bg-[#f0eded] h-1.5 rounded-full overflow-hidden flex">
              <div
                className="bg-[#5a5f66] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min((record.bmi / 35) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="h-[1px] w-full bg-[#f0eded]" />

          {/* Item 3: 내장지방 레벨 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0c4cda]" />
                <span className="text-[14px] text-[#1c1b1b] font-medium">
                  내장지방 레벨
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[16px] font-bold text-[#1c1b1b]">
                  {record.visceralFat}
                </span>
                <span className="text-[12px] text-[#5a5f66]">Lv</span>
              </div>
            </div>
            <div className="w-full bg-[#f0eded] h-1.5 rounded-full overflow-hidden flex">
              <div
                className="bg-[#0c4cda] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min((record.visceralFat / 20) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. Previous Result Comparison (이전 기록과 비교) */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[16px] font-bold text-[#1c1b1b] tracking-tight">
              이전 기록과 비교
            </h3>
            <TrendingUp className="w-4 h-4 text-[#5a5f66]" />
          </div>
          <span className="text-[12px] text-[#5a5f66]">직전 대비 분석</span>
        </div>

        <div className="rounded-2xl bg-[#f6f3f2] p-4 shadow-sm border border-[#eae7e7]/60 space-y-3">
          {/* Reference Date Label */}
          <div className="flex items-center justify-between py-1 px-3 rounded-lg bg-white border border-[#eae7e7]/60">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5a5f66]" />
              <span className="text-[12px] text-[#1c1b1b] font-medium">
                {hasPrevious ? `기준일: ${previousRecord?.date}` : '첫 번째 기준점 측정 기록'}
              </span>
            </div>
            <span className="text-[11px] text-[#5a5f66]">
              {hasPrevious ? '직전 기록' : '기준점'}
            </span>
          </div>

          {/* Row 1: 체중 */}
          <div className="bg-white p-3 rounded-xl shadow-xs border border-[#eae7e7]/60 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-[#1c1b1b]">체중</span>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f0eded] text-[#1c1b1b] text-[12px] font-medium">
                <span>
                  {!hasPrevious
                    ? '기준점'
                    : diffWeight === 0
                    ? '변동 없음'
                    : diffWeight > 0
                    ? `+ ${diffWeight.toFixed(1)} kg`
                    : `${diffWeight.toFixed(1)} kg`}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[13px] text-[#5a5f66] pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#5a5f66]">이전</span>
                <span className="text-[#1c1b1b] font-medium">
                  {hasPrevious ? `${prevWeight.toFixed(1)} kg` : '-'}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#747686]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#0c4cda] font-semibold">현재</span>
                <span className="text-[#1c1b1b] font-bold">{record.weight.toFixed(1)} kg</span>
              </div>
            </div>
          </div>

          {/* Row 2: 골격근량 */}
          <div className="bg-white p-3 rounded-xl shadow-xs border border-[#eae7e7]/60 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-[#1c1b1b]">골격근량</span>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f0eded] text-[#1c1b1b] text-[12px] font-medium">
                <span>
                  {!hasPrevious
                    ? '기준점'
                    : diffMuscle === 0
                    ? '변동 없음'
                    : diffMuscle > 0
                    ? `+ ${diffMuscle.toFixed(1)} kg`
                    : `${diffMuscle.toFixed(1)} kg`}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[13px] text-[#5a5f66] pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#5a5f66]">이전</span>
                <span className="text-[#1c1b1b] font-medium">
                  {hasPrevious ? `${prevMuscle.toFixed(1)} kg` : '-'}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#747686]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#0c4cda] font-semibold">현재</span>
                <span className="text-[#1c1b1b] font-bold">{record.skeletalMuscle.toFixed(1)} kg</span>
              </div>
            </div>
          </div>

          {/* Row 3: 체지방률 */}
          <div className="bg-white p-3 rounded-xl shadow-xs border border-[#eae7e7]/60 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-[#1c1b1b]">체지방률</span>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f0eded] text-[#1c1b1b] text-[12px] font-medium">
                <span>
                  {!hasPrevious
                    ? '기준점'
                    : diffFat === 0
                    ? '변동 없음'
                    : diffFat > 0
                    ? `+ ${diffFat.toFixed(1)}%p`
                    : `${diffFat.toFixed(1)}%p`}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[13px] text-[#5a5f66] pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#5a5f66]">이전</span>
                <span className="text-[#1c1b1b] font-medium">
                  {hasPrevious ? `${prevFat.toFixed(1)} %` : '-'}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#747686]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#0c4cda] font-semibold">현재</span>
                <span className="text-[#1c1b1b] font-bold">{record.bodyFatPercent.toFixed(1)} %</span>
              </div>
            </div>
          </div>

          {/* Scientific Disclaimer */}
          <div className="flex items-start gap-2 pt-1">
            <Info className="w-4 h-4 text-[#747686] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#5a5f66] leading-relaxed">
              수치의 증감 결과는 개인의 측정 주기 및 환경에 따라 차이가 있을 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 7. Trajectory Sparkline (최근 측정 궤적) */}
      <div className="p-4 rounded-2xl bg-white shadow-sm border border-[#eae7e7]/70 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#3867f4]" />
            <span className="text-[15px] font-bold text-[#1c1b1b]">최근 측정 궤적</span>
          </div>
          <span className="text-[11px] text-[#5a5f66]">체중 추이 (kg)</span>
        </div>

        <div className="w-full h-24 flex items-center justify-center py-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 320 70">
            {trajAreaPath && (
              <>
                <defs>
                  <linearGradient id="detailTrendGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3867F4" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#3867F4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={trajAreaPath} fill="url(#detailTrendGrad)" />
              </>
            )}

            {trajLinePath && (
              <path
                d={trajLinePath}
                stroke="#3867F4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                fill="none"
              />
            )}

            {trajectoryRecords.map((r, i) => {
              const isCurrent = r.id === record.id;
              const x = xCoords[i];
              const y = yCoords[i];
              return (
                <g key={r.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isCurrent ? 4.5 : 3.5}
                    fill={isCurrent ? '#3867F4' : '#FFFFFF'}
                    stroke={isCurrent ? '#FFFFFF' : '#3867F4'}
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y="68"
                    fill={isCurrent ? '#0c4cda' : '#747686'}
                    fontSize="9"
                    fontWeight={isCurrent ? '600' : '400'}
                    textAnchor="middle"
                  >
                    {r.dateLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 8. Action CTA Buttons */}
      <div className="flex flex-col gap-2.5 pt-2">
        <button
          id="btn-detail-view-all"
          type="button"
          onClick={onNavigateToRecords}
          className="w-full h-14 rounded-xl bg-[#0c4cda] hover:bg-[#003ab2] text-white font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md"
        >
          <span>전체 기록 보기</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          id="btn-detail-go-home"
          type="button"
          onClick={onNavigateToHome}
          className="w-full h-12 rounded-xl bg-white text-[#1c1b1b] font-medium text-[14px] flex items-center justify-center border border-[#eae7e7] hover:bg-[#f6f3f2] active:scale-[0.98] transition-all"
        >
          <span>홈으로 돌아가기</span>
        </button>
      </div>

      {/* 9. Bottom Medical Disclaimer */}
      <div className="flex items-start justify-center gap-1.5 px-3 py-2 text-center">
        <Info className="w-3.5 h-3.5 text-[#747686] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#747686] leading-tight">
          측정 결과를 이해하기 위한 참고 정보이며, 의료적 진단을 의미하지 않습니다.
        </p>
      </div>
    </div>
  );
};

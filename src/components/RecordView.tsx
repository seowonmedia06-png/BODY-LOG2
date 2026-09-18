import React, { useState } from 'react';
import { Plus, Info, ChevronRight, ScanLine, Camera } from 'lucide-react';
import { MeasurementRecord, MetricType } from '../types';

interface RecordViewProps {
  records: MeasurementRecord[];
  onOpenScanModal: () => void;
  onSelectRecord: (recordId: string) => void;
}

export const RecordView: React.FC<RecordViewProps> = ({
  records,
  onOpenScanModal,
  onSelectRecord,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');

  // If no records exist, show strictly Empty State
  if (!records || records.length === 0) {
    return (
      <div id="record-screen" className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 py-4 space-y-5 pb-24">
        {/* Page Header */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-[#1c1b1b] tracking-tight">
              측정 기록
            </h1>
            <p className="text-[13px] text-[#5a5f66] mt-0.5">
              정밀 체성분 지표 연속 분석
            </p>
          </div>
          <button
            id="btn-add-record-empty"
            type="button"
            onClick={onOpenScanModal}
            aria-label="기록 추가"
            className="w-10 h-10 rounded-full bg-[#f0eded] flex items-center justify-center text-[#0c4cda] active:scale-95 transition-transform shadow-xs hover:bg-[#dce1ff]"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Empty State Card */}
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-2xl border border-[#eae7e7]/70 shadow-sm mt-4">
          <div className="w-16 h-16 rounded-2xl bg-[#dce1ff]/60 flex items-center justify-center text-[#0c4cda] mb-4">
            <ScanLine className="w-8 h-8 stroke-[2]" />
          </div>
          <h2 className="text-[18px] font-bold text-[#1c1b1b] mb-2">
            아직 저장된 기록이 없어요
          </h2>
          <p className="text-[14px] text-[#5a5f66] leading-relaxed max-w-xs mb-6">
            체성분 결과지를 등록하면 측정 기록을 한곳에서 확인할 수 있어요.
          </p>
          <button
            id="btn-empty-scan-trigger"
            type="button"
            onClick={onOpenScanModal}
            className="w-full max-w-xs h-[52px] bg-[#3867f4] hover:bg-[#0c4cda] active:scale-[0.98] text-white font-semibold text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Camera className="w-5 h-5" />
            <span>결과지 분석하기</span>
          </button>
        </div>
      </div>
    );
  }

  // Sort records descending by date for list, ascending for trend
  const sortedDesc = [...records].sort((a, b) => b.rawDate.localeCompare(a.rawDate));
  const trendRecords = [...sortedDesc].slice(0, 5).reverse();

  // Metric metadata
  const metricConfigs = {
    weight: {
      sublabel: '최근 측정 체중',
      unit: 'kg',
      getValue: (r: MeasurementRecord) => r.weight,
      getDeltaString: (r: MeasurementRecord) =>
        r.weightDelta === 0
          ? '변동 없음'
          : `${r.weightDelta > 0 ? '+' : ''}${r.weightDelta.toFixed(1)} kg 최근 대비`,
    },
    muscle: {
      sublabel: '최근 측정 골격근량',
      unit: 'kg',
      getValue: (r: MeasurementRecord) => r.skeletalMuscle,
      getDeltaString: (r: MeasurementRecord) =>
        r.muscleDelta === 0
          ? '변동 없음'
          : `${r.muscleDelta > 0 ? '+' : ''}${r.muscleDelta.toFixed(1)} kg 최근 대비`,
    },
    fat: {
      sublabel: '최근 측정 체지방률',
      unit: '%',
      getValue: (r: MeasurementRecord) => r.bodyFatPercent,
      getDeltaString: (r: MeasurementRecord) =>
        r.fatDelta === 0
          ? '변동 없음'
          : `${r.fatDelta > 0 ? '+' : ''}${r.fatDelta.toFixed(1)} %p 최근 대비`,
    },
  };

  const currentConfig = metricConfigs[selectedMetric];
  const latestRecord = sortedDesc[0];
  const displayVal = currentConfig.getValue(latestRecord).toFixed(1);
  const deltaText = currentConfig.getDeltaString(latestRecord);

  // Compute SVG coordinates based strictly on real records
  const pts = trendRecords.map((r) => currentConfig.getValue(r));
  const minVal = Math.min(...pts);
  const maxVal = Math.max(...pts);
  const range = maxVal - minVal || 1;

  const getY = (val: number) => {
    if (pts.length === 1) return 58; // Center vertically for 1 point
    const norm = (val - minVal) / range;
    return Math.round(88 - norm * 62);
  };

  // Dynamic X coordinates
  const getX = (index: number, total: number) => {
    if (total <= 1) return 160;
    const startX = 36;
    const endX = 284;
    return Math.round(startX + (index * (endX - startX)) / (total - 1));
  };

  const xCoords = pts.map((_, i) => getX(i, pts.length));
  const yCoords = pts.map(getY);

  const linePath =
    pts.length > 1
      ? xCoords.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${yCoords[i]}`).join(' ')
      : '';

  const areaPath =
    pts.length > 1
      ? `${linePath} L ${xCoords[xCoords.length - 1]} 115 L ${xCoords[0]} 115 Z`
      : '';

  return (
    <div id="record-screen" className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 py-4 space-y-5 pb-24">
      {/* 1. Page Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#1c1b1b] tracking-tight">
            측정 기록
          </h1>
          <p className="text-[13px] text-[#5a5f66] mt-0.5">
            정밀 체성분 지표 연속 분석
          </p>
        </div>
        <button
          id="btn-add-record"
          type="button"
          onClick={onOpenScanModal}
          aria-label="기록 추가"
          className="w-10 h-10 rounded-full bg-[#f0eded] flex items-center justify-center text-[#0c4cda] active:scale-95 transition-transform shadow-xs hover:bg-[#dce1ff]"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. Informative Notice Banner */}
      <div className="bg-[#f6f3f2] rounded-xl p-3 flex items-start gap-2 shadow-xs border border-[#eae7e7]/60">
        <Info className="w-4 h-4 text-[#5a5f66] shrink-0 mt-0.5" />
        <p className="text-[13px] text-[#5a5f66] leading-relaxed">
          체성분 측정값의 단순 증가와 감소 수치만을 객관적으로 기록합니다.
        </p>
      </div>

      {/* 3. Trend Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[16px] font-semibold text-[#1c1b1b]">변화 추이</h2>
          <span className="text-[12px] text-[#5a5f66]">최근 {trendRecords.length}회 측정치</span>
        </div>

        {/* Main Trend Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#eae7e7]/70 space-y-4">
          {/* Segment Control */}
          <div
            id="metric-segment-control"
            className="bg-[#f0eded] p-1 rounded-full flex items-center justify-between"
          >
            {(['weight', 'muscle', 'fat'] as MetricType[]).map((metric) => {
              const labelMap = {
                weight: '체중',
                muscle: '골격근량',
                fat: '체지방률',
              };
              const isActive = selectedMetric === metric;
              return (
                <button
                  key={metric}
                  type="button"
                  onClick={() => setSelectedMetric(metric)}
                  className={`flex-1 py-1.5 px-2 rounded-full text-[12px] text-center transition-all ${
                    isActive
                      ? 'bg-white shadow-xs text-[#1c1b1b] font-semibold'
                      : 'text-[#5a5f66] hover:text-[#1c1b1b]'
                  }`}
                >
                  {labelMap[metric]}
                </button>
              );
            })}
          </div>

          {/* Current Stat Display */}
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-[11px] font-medium text-[#5a5f66] block uppercase tracking-wider">
                {currentConfig.sublabel}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[34px] font-bold text-[#1c1b1b] tracking-tight">
                  {displayVal}
                </span>
                <span className="text-[13px] font-medium text-[#5a5f66]">
                  {currentConfig.unit}
                </span>
              </div>
            </div>

            {/* Delta Badge */}
            <div className="bg-[#f0eded] px-3 py-1.5 rounded-full flex items-center shadow-xs">
              <span className="text-[12px] text-[#1c1b1b] font-medium">
                {deltaText}
              </span>
            </div>
          </div>

          {/* Sparkline / Line Chart (SVG) */}
          <div className="w-full h-36 relative pt-2 pb-1">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 320 120"
              preserveAspectRatio="none"
            >
              {/* Background Reference Lines */}
              <line
                x1="16"
                x2="304"
                y1="20"
                y2="20"
                stroke="#f0eded"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1="16"
                x2="304"
                y1="60"
                y2="60"
                stroke="#f0eded"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1="16"
                x2="304"
                y1="100"
                y2="100"
                stroke="#f0eded"
                strokeDasharray="3 3"
                strokeWidth="1"
              />

              {/* Gradient Area Fill */}
              {areaPath && (
                <>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#3867f4" stopOpacity="0.14" />
                      <stop offset="100%" stopColor="#3867f4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#chartGradient)" />
                </>
              )}

              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#3867f4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
              )}

              {/* Data Points */}
              {trendRecords.map((r, idx) => {
                const isCurrentLatest = idx === trendRecords.length - 1;
                const x = xCoords[idx];
                const y = yCoords[idx];
                const val = pts[idx].toFixed(1);

                return (
                  <g key={r.id} transform={`translate(${x}, ${y})`}>
                    {isCurrentLatest ? (
                      <>
                        <circle r="6" fill="#3867f4" />
                        <circle r="2.5" fill="#ffffff" />
                      </>
                    ) : (
                      <circle
                        r="4.5"
                        fill="#ffffff"
                        stroke="#3867f4"
                        strokeWidth="2.5"
                      />
                    )}
                    <text
                      y="-10"
                      textAnchor="middle"
                      className={`text-[11px] font-semibold ${
                        isCurrentLatest ? 'fill-[#1c1b1b]' : 'fill-[#5a5f66]'
                      }`}
                      fontSize="11"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Date Labels on X-axis */}
            <div className="flex justify-between px-6 pt-2">
              {trendRecords.map((r, idx) => (
                <span
                  key={r.id}
                  className={`text-[11px] ${
                    idx === trendRecords.length - 1
                      ? 'text-[#1c1b1b] font-bold'
                      : 'text-[#5a5f66]'
                  }`}
                >
                  {r.dateLabel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. History Section (전체 기록) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[16px] font-semibold text-[#1c1b1b]">전체 기록</h2>
          <span className="text-[12px] text-[#5a5f66]">총 {records.length}건</span>
        </div>

        <div className="space-y-3">
          {sortedDesc.map((rec, index) => {
            const isLatest = index === 0;
            const isBaseline = rec.isBaseline || index === sortedDesc.length - 1;

            return (
              <article
                key={rec.id}
                id={`record-card-${rec.id}`}
                onClick={() => onSelectRecord(rec.id)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#eae7e7]/70 active:bg-[#f6f3f2] hover:border-[#3867f4]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-[#f0eded]/80">
                  <div className="flex items-center gap-2">
                    <time className="text-[16px] font-bold text-[#1c1b1b]">
                      {rec.date}
                    </time>
                    {isLatest && (
                      <span className="bg-[#0c4cda] text-white text-[11px] px-2 py-0.5 rounded-full font-semibold">
                        최신
                      </span>
                    )}
                    {!isLatest && isBaseline && (
                      <span className="bg-[#f0eded] text-[#5a5f66] text-[11px] px-2 py-0.5 rounded-full font-medium">
                        기준점
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#747686]" />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2.5">
                  {/* Metric 1: 체중 */}
                  <div className="bg-[#f6f3f2] rounded-xl p-2.5">
                    <div className="text-[11px] text-[#5a5f66]">체중</div>
                    <div className="text-[15px] font-bold text-[#1c1b1b] mt-0.5">
                      {rec.weight.toFixed(1)}{' '}
                      <span className="text-[11px] font-normal text-[#5a5f66]">kg</span>
                    </div>
                    <div className="text-[11px] text-[#5a5f66] mt-1 font-medium">
                      {rec.weightDelta === 0
                        ? '-'
                        : `${rec.weightDelta > 0 ? '+' : ''}${rec.weightDelta.toFixed(1)}`}
                    </div>
                  </div>

                  {/* Metric 2: 골격근량 */}
                  <div className="bg-[#f6f3f2] rounded-xl p-2.5">
                    <div className="text-[11px] text-[#5a5f66]">골격근량</div>
                    <div className="text-[15px] font-bold text-[#1c1b1b] mt-0.5">
                      {rec.skeletalMuscle.toFixed(1)}{' '}
                      <span className="text-[11px] font-normal text-[#5a5f66]">kg</span>
                    </div>
                    <div className="text-[11px] text-[#5a5f66] mt-1 font-medium">
                      {rec.muscleDelta === 0
                        ? '-'
                        : `${rec.muscleDelta > 0 ? '+' : ''}${rec.muscleDelta.toFixed(1)}`}
                    </div>
                  </div>

                  {/* Metric 3: 체지방률 */}
                  <div className="bg-[#f6f3f2] rounded-xl p-2.5">
                    <div className="text-[11px] text-[#5a5f66]">체지방률</div>
                    <div className="text-[15px] font-bold text-[#1c1b1b] mt-0.5">
                      {rec.bodyFatPercent.toFixed(1)}{' '}
                      <span className="text-[11px] font-normal text-[#5a5f66]">%</span>
                    </div>
                    <div className="text-[11px] text-[#5a5f66] mt-1 font-medium">
                      {rec.fatDelta === 0
                        ? '-'
                        : `${rec.fatDelta > 0 ? '+' : ''}${rec.fatDelta.toFixed(1)}%p`}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

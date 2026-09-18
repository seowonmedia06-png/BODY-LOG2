import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Info } from 'lucide-react';
import { generateInterpretation } from '../utils/interpretation';
import { SheetReferenceRanges, MeasurementRecord } from '../types';

interface SimpleInterpretationCardProps {
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
  variant?: 'light' | 'dark-container';
}

export const SimpleInterpretationCard: React.FC<SimpleInterpretationCardProps> = ({
  currentValues,
  referenceRanges,
  previousRecord,
  variant = 'light',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const interpretation = generateInterpretation({
    currentValues,
    referenceRanges,
    previousRecord,
  });

  const isDarkContainer = variant === 'dark-container';

  return (
    <div
      id="simple-interpretation-card"
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isDarkContainer
          ? 'bg-[#2b2a2a] border-white/10 text-white shadow-md'
          : 'bg-[#F8F9FB] border-[#EAECEF] text-[#1c1b1b] shadow-xs'
      }`}
    >
      {/* Header: Title & Short Badge */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isDarkContainer ? 'bg-[#3867F4]/20 text-[#3867F4]' : 'bg-[#3867F4]/10 text-[#3867F4]'
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
            <h4
              className={`text-[15px] font-bold tracking-tight ${
                isDarkContainer ? 'text-white' : 'text-[#1c1b1b]'
              }`}
            >
              {interpretation.summaryTitle}
            </h4>
          </div>

          <span
            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
              isDarkContainer
                ? 'bg-white/10 text-white/80'
                : 'bg-white border border-[#EAECEF] text-[#5a5f66]'
            }`}
          >
            {interpretation.isFirstRecord ? '첫 기록' : '이전 대비'}
          </span>
        </div>

        {/* 2~3 sentence summary text */}
        <p
          className={`text-[13px] leading-relaxed mb-2 ${
            isDarkContainer ? 'text-white/85' : 'text-[#434655]'
          }`}
        >
          {interpretation.summaryText}
        </p>

        <p
          className={`text-[12px] leading-normal ${
            isDarkContainer ? 'text-white/60' : 'text-[#747686]'
          }`}
        >
          {interpretation.adviceText}
        </p>

        {/* Expand / Collapse Button */}
        <div className="mt-3.5 pt-3 border-t border-[#EAECEF]/60 flex justify-center">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            id="btn-toggle-interpretation-detail"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
              isDarkContainer
                ? 'bg-white/10 hover:bg-white/15 text-white/90'
                : 'bg-white hover:bg-gray-50 border border-[#EAECEF] text-[#1c1b1b] shadow-xs'
            }`}
          >
            <span>{isExpanded ? '간단히 접기' : '자세히 보기'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#3867F4]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#3867F4]" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Breakdown: Per-Item Details */}
      {isExpanded && (
        <div
          id="interpretation-detailed-breakdown"
          className={`px-4 pb-4 sm:px-5 sm:pb-5 space-y-2.5 border-t ${
            isDarkContainer ? 'border-white/10 bg-[#242323]' : 'border-[#EAECEF] bg-white'
          }`}
        >
          <div className="pt-3 pb-1">
            <span
              className={`text-[12px] font-semibold ${
                isDarkContainer ? 'text-white/70' : 'text-[#5a5f66]'
              }`}
            >
              항목별 간단 설명
            </span>
          </div>

          <div className="space-y-2">
            {interpretation.items.map((item) => (
              <div
                key={item.key}
                className={`p-3 rounded-xl border text-[12px] leading-relaxed transition-colors ${
                  isDarkContainer
                    ? 'bg-white/5 border-white/10'
                    : 'bg-[#F8F9FB] border-[#EAECEF]'
                }`}
              >
                {/* Metric Header & Value */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-semibold text-[13px] ${
                      isDarkContainer ? 'text-white' : 'text-[#1c1b1b]'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span
                    className={`font-bold font-mono text-[14px] ${
                      isDarkContainer ? 'text-white' : 'text-[#1c1b1b]'
                    }`}
                  >
                    {item.currentValue.toFixed(item.key === 'visceralFat' ? 0 : 1)} {item.unit}
                  </span>
                </div>

                {/* Previous Value & Delta (if available) */}
                {item.previousValue !== undefined && item.delta !== undefined && (
                  <div
                    className={`flex items-center justify-between text-[11px] mb-1.5 pb-1 border-b ${
                      isDarkContainer
                        ? 'border-white/10 text-white/60'
                        : 'border-[#EAECEF] text-[#747686]'
                    }`}
                  >
                    <span>
                      이전 기록: {item.previousValue.toFixed(item.key === 'visceralFat' ? 0 : 1)} {item.unit}
                    </span>
                    <span
                      className={`font-medium ${
                        isDarkContainer ? 'text-white/80' : 'text-[#1c1b1b]'
                      }`}
                    >
                      변화: {item.delta > 0 ? `+${item.delta}` : item.delta} {item.unit === '%' ? '%p' : item.unit}
                    </span>
                  </div>
                )}

                {/* Reference Range on Sheet (if recognized) */}
                {item.rangeText && (
                  <div
                    className={`text-[11px] mb-1 ${
                      isDarkContainer ? 'text-white/70' : 'text-[#5a5f66]'
                    }`}
                  >
                    결과지 기준: <span className="font-mono">{item.rangeText}</span>
                  </div>
                )}

                {/* Neutral Status Statement */}
                <p
                  className={`text-[12px] ${
                    isDarkContainer ? 'text-white/85' : 'text-[#434655]'
                  }`}
                >
                  {item.statusText}
                </p>

                {/* Neutral Comparison Statement if available */}
                {item.comparisonText && (
                  <p
                    className={`text-[11px] mt-1 ${
                      isDarkContainer ? 'text-white/60' : 'text-[#747686]'
                    }`}
                  >
                    {item.comparisonText}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Medical Disclaimer inside sheet */}
          <div className="pt-2 flex items-start gap-1.5">
            <Info
              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                isDarkContainer ? 'text-white/40' : 'text-[#747686]'
              }`}
            />
            <p
              className={`text-[11px] leading-tight ${
                isDarkContainer ? 'text-white/50' : 'text-[#747686]'
              }`}
            >
              {interpretation.disclaimer}
            </p>
          </div>
        </div>
      )}

      {/* Footer Disclaimer (Always visible when collapsed as well) */}
      {!isExpanded && (
        <div
          className={`px-4 py-2 text-[11px] flex items-center gap-1.5 border-t ${
            isDarkContainer
              ? 'border-white/10 bg-black/20 text-white/50'
              : 'border-[#EAECEF] bg-white/60 text-[#747686]'
          }`}
        >
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{interpretation.disclaimer}</span>
        </div>
      )}
    </div>
  );
};

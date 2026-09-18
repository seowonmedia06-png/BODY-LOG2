import React, { useState } from 'react';
import { ChevronLeft, Calendar, Info, Check } from 'lucide-react';
import { MeasurementRecord, SheetReferenceRanges } from '../types';
import { generateInterpretation } from '../utils/interpretation';

interface DirectInputViewProps {
  onClose: () => void;
  onSaveRecord: (data: {
    date: string;
    weight: number;
    skeletalMuscle: number;
    bodyFatPercent: number;
    bodyFatMass: number;
    bmi: number;
    visceralFat: number;
    sourceType: 'camera' | 'gallery' | 'file';
    referenceRanges?: SheetReferenceRanges;
  }) => void;
  previousRecord?: MeasurementRecord;
}

export const DirectInputView: React.FC<DirectInputViewProps> = ({
  onClose,
  onSaveRecord,
  previousRecord,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // All initial inputs are completely empty as specified
  const [dateStr, setDateStr] = useState(todayStr);
  const [weightStr, setWeightStr] = useState('');
  const [skeletalMuscleStr, setSkeletalMuscleStr] = useState('');
  const [bodyFatMassStr, setBodyFatMassStr] = useState('');
  const [bmiStr, setBmiStr] = useState('');
  const [bodyFatPercentStr, setBodyFatPercentStr] = useState('');
  const [visceralFatStr, setVisceralFatStr] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [showInterpretation, setShowInterpretation] = useState(false);

  // Compute interpretation on the fly if user entered values
  const weightNum = parseFloat(weightStr);
  const muscleNum = parseFloat(skeletalMuscleStr) || 0;
  const fatPercentNum = parseFloat(bodyFatPercentStr) || 0;
  const fatMassNum = parseFloat(bodyFatMassStr) || 0;
  const bmiNum = parseFloat(bmiStr) || 0;
  const visceralNum = parseInt(visceralFatStr, 10) || 0;

  const hasEnteredWeight = !isNaN(weightNum) && weightNum > 0;

  const interpretation = hasEnteredWeight
    ? generateInterpretation({
        currentValues: {
          weight: weightNum,
          skeletalMuscle: muscleNum,
          bodyFatPercent: fatPercentNum,
          bodyFatMass: fatMassNum,
          bmi: bmiNum,
          visceralFat: visceralNum,
        },
        previousRecord,
      })
    : null;

  const handleSave = () => {
    setValidationError(null);

    if (!hasEnteredWeight) {
      setValidationError('체중(kg)을 입력해주세요.');
      return;
    }

    if (!dateStr) {
      setValidationError('측정일을 선택해주세요.');
      return;
    }

    onSaveRecord({
      date: dateStr,
      weight: Number(weightNum.toFixed(1)),
      skeletalMuscle: Number(muscleNum.toFixed(1)),
      bodyFatPercent: Number(fatPercentNum.toFixed(1)),
      bodyFatMass: Number(fatMassNum.toFixed(1)),
      bmi: Number(bmiNum.toFixed(1)),
      visceralFat: visceralNum,
      sourceType: 'file',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto h-full overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-[#eaecef] px-4 flex items-center justify-between shrink-0 bg-white">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#f6f3f2] flex items-center justify-center text-[#5a5f66] hover:bg-[#eae7e7] transition-colors"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[17px] font-bold text-[#1c1b1b]">직접 입력</h1>
        <div className="w-9" />
      </header>

      {/* Main Scrollable Form */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Description */}
        <div className="space-y-1">
          <h2 className="text-[18px] font-bold text-[#1c1b1b] tracking-tight">
            측정값 직접 입력
          </h2>
          <p className="text-[13px] text-[#5a5f66] leading-relaxed">
            결과지를 보면서 측정값을 입력해주세요. 입력하지 않은 항목은 빈 상태로 유지됩니다.
          </p>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="bg-[#fff1f0] border border-[#ffccc7] text-[#cf1322] px-3.5 py-2.5 rounded-xl text-[13px] flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Inputs */}
        <div className="space-y-4">
          {/* 측정일 */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-[#1c1b1b]">
              측정일 <span className="text-[#3867f4]">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full h-12 px-3.5 bg-[#f8f9fb] border border-[#e5e7eb] rounded-xl text-[15px] text-[#1c1b1b] font-medium focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all"
              />
              <Calendar className="w-4 h-4 text-[#8a9099] absolute right-3.5 top-4 pointer-events-none" />
            </div>
          </div>

          {/* 체중 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-semibold text-[#1c1b1b]">
                체중 <span className="text-[#3867f4]">*</span>
              </label>
              <span className="text-[12px] text-[#8a9099]">단위: kg</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                placeholder="값을 입력해주세요"
                value={weightStr}
                onChange={(e) => setWeightStr(e.target.value)}
                className="w-full h-12 px-3.5 pr-10 bg-[#f8f9fb] border border-[#e5e7eb] rounded-xl text-[15px] text-[#1c1b1b] font-medium placeholder:text-[#a0a5ad] focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all"
              />
              <span className="absolute right-3.5 top-3.5 text-[14px] text-[#8a9099] pointer-events-none">
                kg
              </span>
            </div>
          </div>

          {/* 골격근량 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-semibold text-[#1c1b1b]">
                골격근량
              </label>
              <span className="text-[12px] text-[#8a9099]">단위: kg</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                placeholder="값을 입력해주세요"
                value={skeletalMuscleStr}
                onChange={(e) => setSkeletalMuscleStr(e.target.value)}
                className="w-full h-12 px-3.5 pr-10 bg-[#f8f9fb] border border-[#e5e7eb] rounded-xl text-[15px] text-[#1c1b1b] font-medium placeholder:text-[#a0a5ad] focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all"
              />
              <span className="absolute right-3.5 top-3.5 text-[14px] text-[#8a9099] pointer-events-none">
                kg
              </span>
            </div>
          </div>

          {/* 체지방량 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-semibold text-[#1c1b1b]">
                체지방량
              </label>
              <span className="text-[12px] text-[#8a9099]">단위: kg</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                placeholder="값을 입력해주세요"
                value={bodyFatMassStr}
                onChange={(e) => setBodyFatMassStr(e.target.value)}
                className="w-full h-12 px-3.5 pr-10 bg-[#f8f9fb] border border-[#e5e7eb] rounded-xl text-[15px] text-[#1c1b1b] font-medium placeholder:text-[#a0a5ad] focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all"
              />
              <span className="absolute right-3.5 top-3.5 text-[14px] text-[#8a9099] pointer-events-none">
                kg
              </span>
            </div>
          </div>

          {/* BMI */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-semibold text-[#1c1b1b]">
                BMI
              </label>
              <span className="text-[12px] text-[#8a9099]">단위: kg/m²</span>
            </div>
            <input
              type="number"
              step="0.1"
              placeholder="값을 입력해주세요"
              value={bmiStr}
              onChange={(e) => setBmiStr(e.target.value)}
              className="w-full h-12 px-3.5 bg-[#f8f9fb] border border-[#e5e7eb] rounded-xl text-[15px] text-[#1c1b1b] font-medium placeholder:text-[#a0a5ad] focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all"
            />
          </div>

          {/* 체지방률 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-semibold text-[#1c1b1b]">
                체지방률
              </label>
              <span className="text-[12px] text-[#8a9099]">단위: %</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                placeholder="값을 입력해주세요"
                value={bodyFatPercentStr}
                onChange={(e) => setBodyFatPercentStr(e.target.value)}
                className="w-full h-12 px-3.5 pr-10 bg-[#f8f9fb] border border-[#e5e7eb] rounded-xl text-[15px] text-[#1c1b1b] font-medium placeholder:text-[#a0a5ad] focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all"
              />
              <span className="absolute right-3.5 top-3.5 text-[14px] text-[#8a9099] pointer-events-none">
                %
              </span>
            </div>
          </div>

          {/* 내장지방레벨 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-semibold text-[#1c1b1b]">
                내장지방레벨
              </label>
              <span className="text-[12px] text-[#8a9099]">단위: Lv</span>
            </div>
            <input
              type="number"
              step="1"
              placeholder="값을 입력해주세요"
              value={visceralFatStr}
              onChange={(e) => setVisceralFatStr(e.target.value)}
              className="w-full h-12 px-3.5 bg-[#f8f9fb] border border-[#e5e7eb] rounded-xl text-[15px] text-[#1c1b1b] font-medium placeholder:text-[#a0a5ad] focus:outline-none focus:border-[#3867f4] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Real-time Interpretation Preview based on user's entered numbers */}
        {interpretation && (
          <div className="bg-[#f8f9fb] border border-[#eaecef] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-[#1c1b1b]">
                입력 수치 요약
              </span>
              <button
                type="button"
                onClick={() => setShowInterpretation(!showInterpretation)}
                className="text-[12px] font-semibold text-[#3867f4] hover:underline"
              >
                {showInterpretation ? '접기' : '자세히 보기'}
              </button>
            </div>
            <p className="text-[13px] text-[#5a5f66] leading-relaxed">
              {interpretation.summaryText}
            </p>
            {showInterpretation && (
              <div className="pt-2 border-t border-[#eaecef] space-y-2">
                {interpretation.items
                  .filter((item) => item.currentValue > 0)
                  .map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between text-[12px] py-0.5"
                    >
                      <span className="text-[#5a5f66]">{item.title}</span>
                      <span className="font-semibold text-[#1c1b1b]">
                        {item.currentValue.toFixed(1)} {item.unit}
                      </span>
                    </div>
                  ))}
              </div>
            )}
            <p className="text-[11px] text-[#8a9099] pt-1">
              측정 결과를 이해하기 위한 참고 정보이며, 의료적 진단을 의미하지 않습니다.
            </p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action CTA */}
      <footer className="p-4 border-t border-[#eaecef] bg-white shrink-0 space-y-2">
        <button
          type="button"
          onClick={handleSave}
          className="w-full h-12 bg-[#3867f4] hover:bg-[#2e57d6] active:scale-[0.98] text-white font-semibold text-[15px] rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Check className="w-5 h-5" />
          입력 완료
        </button>
      </footer>
    </div>
  );
};

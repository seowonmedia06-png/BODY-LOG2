import React from 'react';
import { AlertCircle, FileQuestion, Crop, RefreshCw, Edit3, X } from 'lucide-react';
import { DocumentValidity } from '../types';

interface ValidationModalProps {
  isOpen: boolean;
  validity: DocumentValidity;
  reason?: string;
  sourceType: 'camera' | 'gallery' | 'file';
  onRetry: () => void;
  onDirectInput: () => void;
  onClose: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  validity,
  reason,
  sourceType,
  onRetry,
  onDirectInput,
  onClose,
}) => {
  if (!isOpen) return null;

  const isCamera = sourceType === 'camera';

  // Modal content based on validity status
  let title = '결과지를 확인해주세요';
  let description =
    '체성분 결과지로 확인되지 않아요.\n결과지 전체가 보이는 사진을 다시 등록해주세요.';
  let icon = <AlertCircle className="w-8 h-8 text-[#3867f4]" />;
  let primaryLabel = isCamera ? '다시 촬영하기' : '다시 선택하기';
  let showDirectInput = false;

  switch (validity) {
    case 'invalid_document':
      title = '결과지를 확인해주세요';
      description =
        '체성분 결과지로 확인되지 않아요.\n결과지 전체가 보이는 사진을 다시 등록해주세요.';
      icon = <FileQuestion className="w-8 h-8 text-[#3867f4]" />;
      primaryLabel = isCamera ? '다시 촬영하기' : '다시 선택하기';
      showDirectInput = false;
      break;

    case 'low_quality':
    case 'cropped':
    case 'analysis_error':
    default:
      title = '결과지를 읽기 어려워요';
      description =
        '결과지 전체와 숫자가 선명하게 보이도록\n다시 촬영하거나 다른 사진을 선택해주세요.';
      icon = <RefreshCw className="w-8 h-8 text-[#3867f4]" />;
      primaryLabel = isCamera ? '다시 촬영하기' : '다시 등록하기';
      showDirectInput = true;
      break;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1c1b1b]/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog (White theme, 24px rounded, clean outline icon) */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm bg-white rounded-[24px] p-6 shadow-2xl z-50 border border-[#eaecef] text-center space-y-4"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f6f3f2] flex items-center justify-center text-[#5a5f66] hover:bg-[#eae7e7] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Circle */}
        <div className="w-16 h-16 rounded-2xl bg-[#eff3ff] flex items-center justify-center mx-auto mt-2">
          {icon}
        </div>

        {/* Title and Description */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-[19px] font-bold text-[#1c1b1b] tracking-tight">
            {title}
          </h3>
          <p className="text-[13px] text-[#5a5f66] leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          {/* Primary CTA (Blue background) */}
          <button
            type="button"
            onClick={onRetry}
            className="w-full h-12 bg-[#3867f4] hover:bg-[#2e57d6] active:scale-[0.98] text-white font-semibold text-[15px] rounded-xl transition-all shadow-xs"
          >
            {primaryLabel}
          </button>

          {/* Secondary CTA (Direct input or cancel) */}
          {showDirectInput ? (
            <button
              type="button"
              onClick={onDirectInput}
              className="w-full h-12 bg-white hover:bg-[#f6f3f2] active:scale-[0.98] text-[#1c1b1b] font-semibold text-[14px] rounded-xl border border-[#d2d6dc] transition-all flex items-center justify-center gap-1.5"
            >
              <Edit3 className="w-4 h-4 text-[#5a5f66]" />
              직접 입력하기
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 bg-white hover:bg-[#f6f3f2] active:scale-[0.98] text-[#5a5f66] font-medium text-[14px] rounded-xl border border-[#e5e7eb] transition-all"
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

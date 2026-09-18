import React, { useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  FileText,
  X,
  ChevronRight,
  ShieldCheck,
  Edit3,
} from 'lucide-react';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: 'camera' | 'gallery' | 'file') => void;
  onFileUpload: (file: File) => void;
  onDirectInput?: () => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  onSelectOption,
  onFileUpload,
  onDirectInput,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Semi-transparent Modal Scrim Backdrop */}
      <div
        id="modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-[#1c1b1b]/40 backdrop-blur-[2px] transition-opacity duration-300"
      />

      {/* Hidden file inputs for real device file & image selection */}
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Slide-up Bottom Sheet Modal */}
      <div
        id="bottom-sheet"
        className="relative w-full max-w-md bg-white rounded-t-[28px] shadow-2xl z-50 px-5 pt-3 pb-safe border-t border-[#eae7e7]/70 transform transition-all duration-300 ease-out flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Interactive Grab Handle */}
        <div className="w-10 h-1 bg-[#e5e2e1] rounded-full mx-auto mb-4 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex flex-col">
            <h2 className="text-[20px] font-bold text-[#1c1b1b] tracking-tight">
              결과지를 어떻게 불러올까요?
            </h2>
            <p className="text-[13px] text-[#5a5f66] mt-0.5">
              인식 가능한 형식: JPG, PNG, PDF
            </p>
          </div>
          <button
            id="btn-close-scan-modal"
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 rounded-full bg-[#f6f3f2] flex items-center justify-center text-[#5a5f66] hover:bg-[#eae7e7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Import Options */}
        <div className="flex flex-col gap-3">
          {/* Option 1: Direct Camera Scan */}
          <button
            id="btn-option-camera"
            type="button"
            onClick={() => onSelectOption('camera')}
            className="w-full bg-[#f6f3f2] hover:bg-[#dce1ff]/40 active:scale-[0.98] transition-all rounded-2xl p-4 flex items-center justify-between text-left group border border-transparent hover:border-[#3867f4]/20"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#dce1ff] flex items-center justify-center text-[#0c4cda] transition-transform group-hover:scale-105">
                <Camera className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#1c1b1b]">
                  사진 촬영
                </span>
                <span className="text-[13px] text-[#5a5f66] mt-0.5">
                  결과지를 직접 촬영
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#c3c6cf] group-hover:text-[#0c4cda] transition-colors" />
          </button>

          {/* Option 2: Gallery Selection */}
          <button
            id="btn-option-gallery"
            type="button"
            onClick={() => {
              if (galleryInputRef.current) {
                galleryInputRef.current.click();
              } else {
                onSelectOption('gallery');
              }
            }}
            className="w-full bg-[#f6f3f2] hover:bg-[#dce1ff]/40 active:scale-[0.98] transition-all rounded-2xl p-4 flex items-center justify-between text-left group border border-transparent hover:border-[#3867f4]/20"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#dce1ff] flex items-center justify-center text-[#0c4cda] transition-transform group-hover:scale-105">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#1c1b1b]">
                  사진 불러오기
                </span>
                <span className="text-[13px] text-[#5a5f66] mt-0.5">
                  갤러리에서 결과지 선택
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#c3c6cf] group-hover:text-[#0c4cda] transition-colors" />
          </button>

          {/* Option 3: Document File Upload */}
          <button
            id="btn-option-file"
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              } else {
                onSelectOption('file');
              }
            }}
            className="w-full bg-[#f6f3f2] hover:bg-[#dce1ff]/40 active:scale-[0.98] transition-all rounded-2xl p-4 flex items-center justify-between text-left group border border-transparent hover:border-[#3867f4]/20"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#dce1ff] flex items-center justify-center text-[#0c4cda] transition-transform group-hover:scale-105">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-[#1c1b1b]">
                  파일 불러오기
                </span>
                <span className="text-[13px] text-[#5a5f66] mt-0.5">
                  PDF 또는 이미지 파일 선택
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#c3c6cf] group-hover:text-[#0c4cda] transition-colors" />
          </button>
        </div>

        {/* Secondary Action: Direct Input */}
        {onDirectInput && (
          <div className="pt-3">
            <button
              type="button"
              onClick={onDirectInput}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#f6f3f2] active:scale-[0.99] border border-[#e5e7eb] flex items-center justify-center gap-2 text-[14px] font-medium text-[#5a5f66] transition-all"
            >
              <Edit3 className="w-4 h-4 text-[#3867f4]" />
              <span>측정값 직접 입력하기</span>
            </button>
          </div>
        )}

        {/* Security & Privacy Reassurance Notice */}
        <div className="flex items-center justify-center gap-1.5 py-6 text-center">
          <ShieldCheck className="w-4 h-4 text-[#5a5f66] shrink-0" />
          <p className="text-[11px] text-[#5a5f66]">
            개인정보 보호를 위해 체성분 수치 외 민감 정보는 저장되지 않습니다.
          </p>
        </div>
      </div>
    </div>
  );
};


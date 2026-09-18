import React, { useState } from 'react';
import { BadgeCheck, Lock, UserCheck, X } from 'lucide-react';

interface OnboardingViewProps {
  initialNickname?: string;
  onComplete: (nickname: string) => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  initialNickname = '',
  onComplete,
}) => {
  const [nickname, setNickname] = useState(initialNickname);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmed = nickname.trim();
  const length = trimmed.length;
  const isValid = length >= 2 && length <= 10;

  let helperText = '2~10자의 닉네임을 입력해주세요.';
  let helperClass = 'text-[#5a5f66]';
  if (length === 1) {
    helperText = '최소 2자 이상 입력해주세요.';
    helperClass = 'text-[#a4322a]';
  } else if (isValid) {
    helperText = '사용 가능한 멋진 닉네임입니다.';
    helperClass = 'text-[#0c4cda] font-medium';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onComplete(trimmed);
    }, 200);
  };

  return (
    <div id="onboarding-screen" className="flex-1 flex flex-col w-full max-w-md mx-auto px-5 pt-4 pb-12">
      {/* Badge Tag */}
      <div className="pt-3 pb-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce1ff] text-[#001550] mb-3">
          <BadgeCheck className="w-3.5 h-3.5 fill-[#001550] text-[#dce1ff]" />
          <span className="text-[12px] font-semibold">프로필 설정</span>
        </div>
        <h2 className="text-[24px] leading-8 font-bold tracking-tight text-[#1c1b1b]">
          어떻게 불러드릴까요?
        </h2>
        <p className="text-[14px] text-[#5a5f66] mt-2 whitespace-pre-line leading-relaxed">
          BODY LOG에서 사용할<br />
          닉네임을 설정해주세요.
        </p>
      </div>

      {/* Input Group */}
      <div className="w-full mt-4 flex flex-col">
        <label
          htmlFor="nickname-input"
          className="text-[14px] font-semibold text-[#1c1b1b] mb-2 flex items-center justify-between"
        >
          <span>닉네임</span>
          <span className="text-[12px] font-normal text-[#5a5f66]">
            {length} / 10
          </span>
        </label>

        <div className="relative w-full rounded-xl bg-[#f6f3f2] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3867f4]/20 focus-within:shadow-sm transition-all duration-200">
          <input
            id="nickname-input"
            type="text"
            maxLength={10}
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력해주세요"
            className="w-full h-[54px] px-4 pr-11 rounded-xl bg-transparent text-[16px] text-[#1c1b1b] placeholder:text-[#747686] focus:outline-none"
          />
          {length > 0 && (
            <button
              id="btn-clear-nickname"
              type="button"
              onClick={() => setNickname('')}
              aria-label="입력 내용 지우기"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[#747686] hover:text-[#1c1b1b] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 px-1">
          <p id="helper-msg" className={`text-[13px] ${helperClass} transition-colors`}>
            {helperText}
          </p>
        </div>
      </div>

      {/* Info Card 1: Privacy reassurance */}
      <div className="mt-5 p-4 rounded-xl bg-[#f6f3f2] flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#dfe2eb] flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-4 h-4 text-[#60646c]" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-medium text-[#1c1b1b]">
            개인정보 안심 안내
          </span>
          <p className="text-[12px] text-[#5a5f66] mt-0.5 leading-snug">
            실명 대신 자유로운 닉네임을 사용하실 수 있습니다.
          </p>
        </div>
      </div>

      {/* Info Card 2: Preview */}
      <div className="mt-4 p-4 rounded-xl bg-white shadow-sm border border-[#eae7e7]/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#dce1ff] flex items-center justify-center shrink-0">
          <UserCheck className="w-5 h-5 text-[#001550]" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-semibold text-[#5a5f66] uppercase tracking-wider">
            미리보기
          </span>
          <span id="preview-text" className="text-[16px] font-semibold text-[#1c1b1b] truncate mt-0.5">
            {length > 0 ? `${trimmed} 님` : '닉네임 님'}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="w-full mt-10">
        <button
          id="btn-onboarding-submit"
          type="button"
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit}
          className={`w-full h-[54px] rounded-[14px] font-semibold text-[16px] flex items-center justify-center transition-all duration-200 shadow-md ${
            isValid && !isSubmitting
              ? 'bg-[#3867f4] text-white hover:bg-[#0c4cda] active:scale-[0.98] cursor-pointer'
              : 'bg-[#3867f4] text-white opacity-40 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? '시작하는 중...' : '시작하기'}
        </button>
      </div>
    </div>
  );
};

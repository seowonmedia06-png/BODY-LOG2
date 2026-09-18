import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  X,
  Info,
  CheckCircle2,
  AlertCircle,
  Smile,
  ShieldCheck,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { BRAND_LOGO_URL } from '../data/initialRecords';

interface NicknameSetupViewProps {
  initialNickname?: string;
  onComplete: (nickname: string) => void;
  onBack?: () => void;
  onCancel?: () => void;
  mode?: 'setup' | 'edit';
}

export const NicknameSetupView: React.FC<NicknameSetupViewProps> = ({
  initialNickname = '',
  onComplete,
  onBack,
  onCancel,
  mode = 'setup',
}) => {
  const [nickname, setNickname] = useState(initialNickname);

  const length = nickname.trim().length;
  const isValid = length >= 2 && length <= 10;

  const handleSubmit = () => {
    if (isValid) {
      onComplete(nickname.trim());
    }
  };

  const handleBackOrCancel = onCancel || onBack;

  return (
    <div id="nickname-setup-screen" className="min-h-screen bg-white font-body-md text-body-md text-[#1c1b1b] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-white/90 backdrop-blur-xl border-b border-[#eae7e7]/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 px-4 flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            {handleBackOrCancel ? (
              <button
                aria-label="뒤로 가기"
                className="min-w-[40px] min-h-[40px] -ml-2 flex items-center justify-center text-[#1c1b1b] hover:text-[#0c4cda] transition-colors active:scale-95"
                type="button"
                onClick={handleBackOrCancel}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-2" />
            )}
            <img
              alt="BODY LOG Logo"
              className="h-8 w-auto object-contain"
              src={BRAND_LOGO_URL}
              referrerPolicy="no-referrer"
            />
            <span className="text-[17px] tracking-tight text-[#1c1b1b] font-semibold">
              BODY LOG
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#434655] font-medium">
              {mode === 'edit' ? '닉네임 수정' : 'Nickname Setup'}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#0c4cda] flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto pt-20 pb-safe px-5">
        <div className="flex flex-col w-full pb-8">
          {/* Stepper & Category Badge */}
          <div className="flex items-center justify-between pt-2 pb-4">
            <div className="inline-flex items-center gap-1.5 bg-[#dce1ff]/60 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c4cda] animate-pulse" />
              <span className="text-[11px] text-[#0c4cda] font-semibold tracking-wide">
                {mode === 'edit' ? '프로필 변경' : '프로필 설정'}
              </span>
            </div>
            {mode === 'setup' && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-1.5 rounded-full bg-[#0c4cda]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#eae7e7]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#eae7e7]" />
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="mt-1 mb-6">
            <h1 className="text-[24px] font-bold text-[#1c1b1b] mb-1.5 tracking-tight">
              {mode === 'edit' ? '새로운 닉네임을 입력하세요' : '어떻게 불러드릴까요?'}
            </h1>
            <p className="text-[14px] text-[#5a5f66] leading-relaxed">
              BODY LOG에서 사용할<br />
              닉네임을 설정해주세요.
            </p>
          </div>

          {/* Input Section */}
          <section className="flex flex-col w-full mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[16px] font-semibold text-[#1c1b1b]" htmlFor="nickname-input">
                닉네임
              </label>
              <span className="text-[12px] text-[#5a5f66]">
                <span className={length > 0 ? (isValid ? 'text-[#0c4cda] font-bold' : 'text-[#ba1a1a] font-bold') : ''}>
                  {length}
                </span>
                /10
              </span>
            </div>

            <div className="relative flex items-center">
              <input
                id="nickname-input"
                className={`w-full h-14 bg-white border rounded-2xl px-4 text-[17px] text-[#1c1b1b] placeholder:text-[#999696] focus:outline-none transition-all ${
                  length === 0
                    ? 'border-[#c3c6cf] focus:border-[#0c4cda] focus:ring-4 focus:ring-[#0c4cda]/10'
                    : isValid
                    ? 'border-[#0c4cda] focus:ring-4 focus:ring-[#0c4cda]/15 pr-20'
                    : 'border-[#ba1a1a] focus:ring-4 focus:ring-[#ba1a1a]/15 pr-20'
                }`}
                maxLength={10}
                placeholder="2~10자 이내로 입력해주세요"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValid) {
                    handleSubmit();
                  }
                }}
              />
              <div className="absolute right-3.5 flex items-center gap-1.5">
                {length > 0 && (
                  <button
                    aria-label="입력 내용 지우기"
                    className="w-7 h-7 rounded-full bg-[#f0eded] text-[#5a5f66] hover:bg-[#e5e2e1] flex items-center justify-center transition-colors"
                    type="button"
                    onClick={() => setNickname('')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {isValid && (
                  <CheckCircle2 className="w-5 h-5 text-[#0c4cda] shrink-0" />
                )}
              </div>
            </div>

            {/* Helper or Error Text */}
            <div className="min-h-[22px] mt-2 flex items-center gap-1.5 px-0.5">
              {length === 0 ? (
                <div className="flex items-center gap-1 text-[12px] text-[#5a5f66]">
                  <Info className="w-3.5 h-3.5 text-[#5a5f66] shrink-0" />
                  <span>한글, 영문, 숫자 조합 가능 (공백 제외)</span>
                </div>
              ) : isValid ? (
                <div className="flex items-center gap-1 text-[12px] text-[#0c4cda] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0c4cda] shrink-0" />
                  <span>사용 가능한 멋진 닉네임이에요</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[12px] text-[#ba1a1a]">
                  <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a] shrink-0" />
                  <span>2자 이상 10자 이하로 입력해주세요</span>
                </div>
              )}
            </div>
          </section>

          {/* Privacy Preview Card */}
          <section className="bg-[#f6f3f2] rounded-2xl p-4 border border-[#eae7e7]/60 mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-[#0c4cda]" />
                <span className="text-[13px] font-semibold text-[#1c1b1b]">화면 표시 미리보기</span>
              </div>
              <span className="text-[11px] text-[#5a5f66] bg-white px-2 py-0.5 rounded-full border border-[#eae7e7]">
                HOME 화면
              </span>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#eae7e7]/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0c4cda] text-white flex items-center justify-center font-bold text-[15px]">
                {length > 0 ? nickname.charAt(0) : 'U'}
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#1c1b1b]">
                  안녕하세요, {isValid ? nickname : '○○'}님!
                </p>
                <p className="text-[12px] text-[#5a5f66]">
                  오늘의 체성분 변화를 기록해보세요
                </p>
              </div>
            </div>
          </section>

          {/* Privacy Reassurance Banner */}
          <div className="flex items-start gap-2 text-[#5a5f66] text-[12px] px-1 mb-8 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#0c4cda] shrink-0 mt-0.5" />
            <p>
              설정한 닉네임은 서비스 내 맞춤 화면 구성에만 사용되며, 언제든지 마이페이지에서 변경할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Bottom Sticky Action Area */}
        <div className="mt-auto pt-4 pb-4">
          <button
            id="btn-complete-nickname"
            className={`w-full h-14 rounded-2xl font-semibold text-[16px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
              isValid
                ? 'bg-[#0c4cda] hover:bg-[#003ab2] text-white cursor-pointer shadow-[0_4px_16px_rgba(12,76,218,0.25)]'
                : 'bg-[#e5e2e1] text-[#999696] cursor-not-allowed'
            }`}
            disabled={!isValid}
            type="button"
            onClick={handleSubmit}
          >
            <span>{mode === 'edit' ? '변경 완료' : '설정 완료하고 시작하기'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
};

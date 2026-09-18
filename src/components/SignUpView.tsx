import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronRight,
  ArrowRight,
  Check,
} from 'lucide-react';
import { BRAND_LOGO_URL } from '../data/initialRecords';

interface SignUpViewProps {
  onSignUp: (email: string, pass: string) => { success: boolean; error?: string };
  onNavigateToLogin: () => void;
}

export const SignUpView: React.FC<SignUpViewProps> = ({
  onSignUp,
  onNavigateToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('이메일을 입력해주세요.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (!password) {
      setErrorMessage('비밀번호를 입력해주세요.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    const result = onSignUp(email.trim(), password);
    if (!result.success) {
      setErrorMessage(result.error || '회원가입에 실패했습니다.');
    }
  };

  return (
    <div id="signup-screen" className="min-h-screen bg-white font-body-md text-body-md text-[#1c1b1b] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-white/90 backdrop-blur-xl border-b border-[#eae7e7]/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 px-4 flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <button
              aria-label="뒤로 가기"
              className="min-w-[40px] min-h-[40px] -ml-2 flex items-center justify-center text-[#1c1b1b] hover:text-[#0c4cda] transition-colors active:scale-95"
              type="button"
              onClick={onNavigateToLogin}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
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
            <span className="text-[12px] text-[#434655] font-medium">Sign Up</span>
            <div className="w-8 h-8 rounded-full bg-[#0c4cda] flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto pt-20 pb-safe px-5">
        <div className="flex flex-col w-full pb-8">
          <div className="pt-2 pb-5 flex flex-col">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce1ff] w-fit mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c4cda] animate-pulse" />
              <span className="text-[11px] text-[#001550] uppercase tracking-wider font-semibold">
                BODY LOG ID
              </span>
            </div>
            <h1 className="text-[24px] font-bold text-[#1c1b1b] mb-1 tracking-tight">
              회원가입
            </h1>
            <p className="text-[14px] text-[#434655]">
              BODY LOG 계정을 생성하고 간편하게 시작하세요
            </p>
          </div>

          <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="flex flex-col">
              <label className="text-[14px] font-semibold text-[#1c1b1b] mb-2" htmlFor="signup-email">
                이메일
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 flex items-center pointer-events-none text-[#747686]">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력해주세요"
                  className="w-full h-[52px] pl-11 pr-4 bg-white rounded-xl text-[14px] text-[#1c1b1b] placeholder:text-[#747686] border border-[#eae7e7] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0c4cda] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col">
              <label className="text-[14px] font-semibold text-[#1c1b1b] mb-2" htmlFor="signup-pw">
                비밀번호
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 flex items-center pointer-events-none text-[#747686]">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="signup-pw"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력해주세요"
                  className="w-full h-[52px] pl-11 pr-12 bg-white rounded-xl text-[14px] text-[#1c1b1b] placeholder:text-[#747686] border border-[#eae7e7] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0c4cda] transition-all"
                />
                <button
                  type="button"
                  aria-label="비밀번호 보기 토글"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#747686] hover:text-[#1c1b1b] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 px-1 text-[#5a5f66] text-[12px]">
                <span>8자 이상, 영문 및 숫자 조합</span>
              </div>
            </div>

            {/* Password Confirm Field */}
            <div className="flex flex-col">
              <label className="text-[14px] font-semibold text-[#1c1b1b] mb-2" htmlFor="signup-pw-confirm">
                비밀번호 확인
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 flex items-center pointer-events-none text-[#747686]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <input
                  id="signup-pw-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호를 다시 입력해주세요"
                  className="w-full h-[52px] pl-11 pr-12 bg-white rounded-xl text-[14px] text-[#1c1b1b] placeholder:text-[#747686] border border-[#eae7e7] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0c4cda] transition-all"
                />
                <button
                  type="button"
                  aria-label="비밀번호 확인 보기 토글"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#747686] hover:text-[#1c1b1b] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms Consent Row */}
            <div className="mt-1 bg-[#f6f3f2] rounded-xl p-3.5 flex items-center justify-between shadow-xs border border-[#eae7e7]/60">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-all shadow-xs ${
                  agreeTerms ? 'bg-[#3867f4]' : 'bg-white border border-[#eae7e7]'
                }`}>
                  {agreeTerms && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </div>
                <span className="text-[13px] font-medium text-[#1c1b1b]">
                  개인정보 수집 및 이용 동의 <span className="text-[#a4322a] font-semibold text-[11px]">(필수)</span>
                </span>
              </label>
              <button
                type="button"
                onClick={() => alert('개인정보 보호를 위해 계정 인증 정보 외 건강 및 체성분 데이터는 철저히 안전하게 보관됩니다.')}
                className="flex items-center gap-0.5 text-[#5a5f66] hover:text-[#0c4cda] transition-colors py-1 pl-2 text-[12px] font-medium"
              >
                <span>보기</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#ffdad6]/60 border border-[#ffdad6] text-[#ba1a1a] text-[13px] font-medium">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              id="btn-signup-submit"
              type="submit"
              className="mt-2 w-full h-[54px] bg-[#3867f4] hover:bg-[#0c4cda] text-white text-[16px] font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <span>회원가입</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 mb-4 text-center">
            <span className="text-[14px] text-[#5a5f66]">이미 계정이 있으신가요? </span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-[14px] font-semibold text-[#3867f4] hover:underline ml-1"
            >
              로그인
            </button>
          </div>

          {/* Trust Note */}
          <div className="mt-auto pt-6 flex items-center justify-center gap-1.5 text-[#747686]">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[11px]">ISO-27001 인증 암호화 표준 준수</span>
          </div>
        </div>
      </main>
    </div>
  );
};

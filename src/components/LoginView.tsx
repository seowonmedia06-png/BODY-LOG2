import React, { useState } from 'react';
import { ArrowLeft, User, Eye, EyeOff } from 'lucide-react';
import { BRAND_LOGO_URL } from '../data/initialRecords';

interface LoginViewProps {
  onLogin: (email: string, pass: string) => { success: boolean; error?: string };
  onSocialLogin: (provider: string) => void;
  onNavigateToSignUp: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onSocialLogin,
  onNavigateToSignUp,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('이메일을 입력해주세요.');
      return;
    }
    if (!password) {
      setErrorMessage('비밀번호를 입력해주세요.');
      return;
    }

    const result = onLogin(email.trim(), password);
    if (!result.success) {
      setErrorMessage(result.error || '이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div id="login-screen" className="min-h-screen bg-white font-body-md text-body-md text-[#1c1b1b] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-white/90 backdrop-blur-xl border-b border-[#eae7e7]/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 px-4 flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <button
              aria-label="뒤로 가기"
              className="min-w-[40px] min-h-[40px] -ml-2 flex items-center justify-center text-[#1c1b1b] hover:text-[#0c4cda] transition-colors active:scale-95"
              type="button"
              onClick={() => {}}
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
            <span className="text-[12px] text-[#434655] font-medium">Login</span>
            <div className="w-8 h-8 rounded-full bg-[#0c4cda] flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto pt-20 pb-safe px-5">
        <div className="flex flex-col w-full pb-8">
          {/* Brand Header Slot */}
          <div className="flex flex-col items-center justify-center pt-2 pb-5 text-center">
            <div className="w-12 h-12 mb-2.5 rounded-xl bg-[#dce1ff] flex items-center justify-center shadow-xs">
              <svg className="w-7 h-7 text-[#0c4cda]" fill="currentColor" viewBox="0 0 24 24">
                <rect fill="none" height="18" rx="5" stroke="currentColor" strokeWidth="2.5" width="18" x="3" y="3" />
                <line stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" x1="7" x2="17" y1="8" y2="8" />
                <line stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" x1="7" x2="14" y1="12" y2="12" />
                <line stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" x1="7" x2="11" y1="16" y2="16" />
                <circle cx="16.5" cy="15.5" fill="currentColor" r="2" />
              </svg>
            </div>
            <span className="text-[18px] font-bold tracking-tight text-[#1c1b1b]">
              BODY LOG
            </span>
            <p className="text-[13px] text-[#5a5f66] mt-0.5">
              체성분 기록을 더 간단하게
            </p>
          </div>

          {/* Hero Greeting */}
          <div className="mb-6 px-0.5">
            <h1 className="text-[24px] text-[#1c1b1b] font-bold tracking-tight leading-snug">
              내 체성분 기록을<br />
              한곳에서 관리해보세요
            </h1>
          </div>

          {/* Login Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="flex flex-col">
              <label className="text-[14px] font-semibold text-[#1c1b1b] mb-2" htmlFor="emailInput">
                이메일
              </label>
              <div className="relative w-full">
                <input
                  id="emailInput"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력해주세요"
                  className="w-full h-[52px] px-4 rounded-xl bg-white text-[#1c1b1b] text-[14px] placeholder:text-[#747686] border border-[#eae7e7] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0c4cda] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[14px] font-semibold text-[#1c1b1b]" htmlFor="passwordInput">
                  비밀번호
                </label>
                <button
                  type="button"
                  onClick={() => alert('가입하신 이메일로 비밀번호 재설정 링크를 전송할 수 있습니다.')}
                  className="text-[12px] text-[#5a5f66] hover:text-[#0c4cda] transition-colors"
                >
                  비밀번호 재설정
                </button>
              </div>
              <div className="relative w-full flex items-center">
                <input
                  id="passwordInput"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력해주세요"
                  className="w-full h-[52px] pl-4 pr-12 rounded-xl bg-white text-[#1c1b1b] text-[14px] placeholder:text-[#747686] border border-[#eae7e7] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0c4cda] focus:border-transparent transition-all"
                />
                <button
                  id="togglePasswordBtn"
                  type="button"
                  aria-label="비밀번호 표시/숨김"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-[52px] w-12 flex items-center justify-center text-[#5a5f66] hover:text-[#1c1b1b] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#ffdad6]/60 border border-[#ffdad6] text-[#ba1a1a] text-[13px] font-medium">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              id="btn-login-submit"
              type="submit"
              className="w-full h-[54px] mt-1 rounded-xl bg-[#3867f4] hover:bg-[#0c4cda] text-white text-[16px] font-semibold shadow-md active:scale-[0.98] transition-all flex items-center justify-center"
            >
              로그인
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full h-[1px] bg-[#e5e2e1]" />
            <span className="absolute px-3 bg-white text-[12px] text-[#5a5f66]">또는</span>
          </div>

          {/* Social Sign In */}
          <div className="flex flex-col gap-2.5">
            {/* Kakao */}
            <button
              type="button"
              onClick={() => onSocialLogin('Kakao')}
              className="w-full h-[50px] rounded-xl bg-[#FEE500] text-[#191919] text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] shadow-xs transition-all"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 3C6.477 3 2 6.477 2 10.769c0 2.766 1.838 5.19 4.607 6.551-.202.738-.732 2.684-.84 3.107-.132.527.194.52.408.378.169-.112 2.695-1.83 3.791-2.574.664.093 1.345.143 2.034.143 5.523 0 10-3.477 10-7.769C22 6.477 17.523 3 12 3z" />
              </svg>
              <span>카카오로 계속하기</span>
            </button>

            {/* Google */}
            <button
              type="button"
              onClick={() => onSocialLogin('Google')}
              className="w-full h-[50px] rounded-xl bg-white border border-[#eae7e7] text-[#1c1b1b] text-[14px] font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all hover:bg-[#fcf9f8]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Google로 계속하기</span>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => onSocialLogin('Apple')}
              className="w-full h-[50px] rounded-xl bg-white border border-[#eae7e7] text-[#1c1b1b] text-[14px] font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all hover:bg-[#fcf9f8]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.87c.61-.75 1.04-1.8 0.92-2.87-.92.04-2.02.62-2.66 1.37-.56.65-.98 1.7-0.85 2.73 1.03.08 2.01-.52 2.59-1.23z" />
              </svg>
              <span>Apple로 계속하기</span>
            </button>
          </div>

          {/* Sign up Link */}
          <div className="mt-8 text-center">
            <p className="text-[14px] text-[#5a5f66]">
              처음이신가요?
              <button
                type="button"
                onClick={onNavigateToSignUp}
                className="font-semibold text-[#3867f4] hover:underline ml-1.5 underline-offset-4"
              >
                회원가입
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

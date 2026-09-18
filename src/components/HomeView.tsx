import React from 'react';
import {
  Camera,
  Calendar,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Lightbulb,
  ShieldCheck,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { UserProfile, MeasurementRecord } from '../types';

interface HomeViewProps {
  userProfile: UserProfile | null;
  latestRecord?: MeasurementRecord;
  previousRecord?: MeasurementRecord;
  totalRecordCount?: number;
  onOpenScanModal: () => void;
  onNavigateToRecords: () => void;
  onViewRecordDetail?: (recordId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userProfile,
  latestRecord,
  totalRecordCount = 0,
  onOpenScanModal,
  onNavigateToRecords,
  onViewRecordDetail,
}) => {
  // Format current Korean date
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[now.getDay()];
  const dateString = `${month}월 ${date}일 (${dayName})`;

  const nickname = userProfile?.nickname?.trim();
  const greeting = nickname ? `안녕하세요, ${nickname}님!` : '안녕하세요!';

  return (
    <div id="home-screen" className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
      {/* 1. Privacy Badge & Greeting */}
      <section className="flex flex-col items-start gap-1 pt-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#dce1ff] text-[#001550] text-[11px] font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>프라이버시 보호 모드</span>
        </div>
        <div className="flex items-center justify-between w-full mt-1">
          <h1 className="text-[22px] font-bold text-[#1c1b1b] tracking-tight">
            {greeting}
          </h1>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f0eded] text-[#5a5f66] text-[11px] font-medium shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateString}</span>
          </div>
        </div>
        <p className="text-[14px] text-[#5a5f66]">
          오늘의 체성분 변화를 기록해보세요
        </p>
      </section>

      {/* 2. Recent Measurement Summary Section (Privacy-Protected: No Raw Body Composition Numbers on Home) */}
      {latestRecord ? (
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-[#eae7e7]/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-[#1c1b1b]">최근 측정 상태</span>
              <span className="text-[12px] font-medium text-[#0c4cda] bg-[#dce1ff] px-2 py-0.5 rounded-md">
                기록 완료
              </span>
            </div>
            {onViewRecordDetail && (
              <button
                type="button"
                onClick={() => onViewRecordDetail(latestRecord.id)}
                className="text-[12px] font-medium text-[#0c4cda] flex items-center gap-0.5 hover:underline"
              >
                <span>상세보기</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-[#f6f3f2] rounded-xl p-3 flex flex-col justify-center">
              <span className="text-[11px] text-[#5a5f66]">최근 측정일</span>
              <span className="text-[15px] font-bold text-[#1c1b1b] mt-0.5 font-mono">
                {latestRecord.date}
              </span>
            </div>

            <div className="bg-[#f6f3f2] rounded-xl p-3 flex flex-col justify-center">
              <span className="text-[11px] text-[#5a5f66]">누적 측정 기록</span>
              <span className="text-[15px] font-bold text-[#1c1b1b] mt-0.5">
                총 {totalRecordCount > 0 ? totalRecordCount : 1}회
              </span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-[12px] text-[#5a5f66] bg-[#f8f9fb] px-3 py-2 rounded-xl border border-[#eaecef]/60">
            <span className="truncate">체중·근육량·체지방률 수치 및 상세 해석은 기록 탭에서 확인하세요.</span>
            <button
              type="button"
              onClick={onNavigateToRecords}
              className="text-[#0c4cda] font-semibold shrink-0 hover:underline ml-2"
            >
              기록 확인
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-2xl p-4 shadow-xs border border-[#eae7e7]/70 text-center py-5 space-y-2">
          <p className="text-[14px] font-medium text-[#5a5f66]">
            아직 등록된 측정 기록이 없습니다.
          </p>
          <button
            type="button"
            onClick={onOpenScanModal}
            className="text-[13px] font-semibold text-[#0c4cda] bg-[#dce1ff] px-3.5 py-1.5 rounded-full hover:bg-[#b6c4ff] transition-colors"
          >
            첫 결과지 분석하기
          </button>
        </section>
      )}

      {/* 3. Hero Scan & Analyze Card */}
      <section className="w-full bg-[#f6f3f2] rounded-2xl p-5 shadow-sm flex flex-col relative overflow-hidden border border-[#eae7e7]/60">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#b6c4ff]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between mb-2 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#3867f4] shadow-sm">
            <Camera className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="inline-flex items-center gap-1 text-[#3867f4] text-[12px] font-semibold px-2.5 py-1 rounded-full bg-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#3867f4]" />
            스마트 스캔
          </span>
        </div>

        <div className="text-left relative z-10 mb-4 mt-2">
          <h2 className="text-[20px] font-bold text-[#1c1b1b] leading-snug">
            체성분 결과지를<br />간편하게 등록해보세요
          </h2>
          <p className="text-[13px] text-[#5a5f66] mt-1 leading-relaxed">
            촬영하거나 파일을 불러오면 주요 정보를 자동으로 정리할 수 있어요.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          id="btn-scan-trigger-home"
          type="button"
          onClick={onOpenScanModal}
          className="w-full h-[52px] bg-[#3867f4] hover:bg-[#0c4cda] active:scale-[0.98] text-white font-semibold text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(56,103,244,0.25)] transition-all duration-150 relative z-10"
        >
          <Camera className="w-5 h-5" />
          <span>결과지 분석하기</span>
        </button>

        {/* Support Formats Caption */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[#5a5f66] text-[12px] relative z-10">
          <ShieldCheck className="w-3.5 h-3.5 text-[#3867f4]" />
          <span>사진 촬영 · 이미지 · PDF 지원</span>
        </div>
      </section>

      {/* 4. Secondary Card: 내 기록 보기 */}
      <section className="w-full">
        <button
          id="btn-nav-to-records"
          type="button"
          onClick={onNavigateToRecords}
          className="w-full bg-white rounded-xl p-4 shadow-sm border border-[#eae7e7]/70 flex items-center justify-between text-left active:bg-[#f6f3f2] hover:border-[#3867f4]/40 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#f0eded] flex items-center justify-center text-[#5a5f66] group-hover:text-[#3867f4] group-hover:bg-[#dce1ff]/50 transition-colors">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-semibold text-[#1c1b1b]">
                  내 기록 보기
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#3867f4]" />
              </div>
              <span className="text-[12px] text-[#5a5f66] mt-0.5">
                저장된 체성분 기록과 변화 흐름을 확인할 수 있어요.
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#f0eded] flex items-center justify-center text-[#5a5f66] group-hover:text-[#3867f4] group-hover:translate-x-0.5 transition-all">
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </section>

      {/* 5. Measurement Guide Card */}
      <section className="w-full bg-[#f6f3f2] rounded-xl p-4 flex items-start gap-3 border border-[#eae7e7]/50">
        <div className="w-7 h-7 rounded-full bg-[#dfe2eb] flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-[#a4322a]" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[#1c1b1b] mb-0.5">
            측정 가이드
          </p>
          <p className="text-[12px] text-[#434655] leading-relaxed">
            가급적 공복 상태에서 일정한 시간에 측정한 결과지를 등록하면 더욱 일관된 변화 추이를 확인할 수 있어요.
          </p>
        </div>
      </section>

      {/* 6. Privacy Trust Assurance Badge */}
      <section className="w-full pt-1 pb-2 flex items-center justify-center gap-1.5 text-[#5a5f66]">
        <Lock className="w-3.5 h-3.5" />
        <span className="text-[11px]">
          개인 건강 정보는 안전하게 암호화되어 보관됩니다
        </span>
      </section>
    </div>
  );
};

import React from 'react';
import {
  User as UserIcon,
  Shield,
  Trash2,
  Download,
  Info,
  ChevronRight,
  LogOut,
  Mail,
} from 'lucide-react';
import { User, UserProfile, MeasurementRecord } from '../types';

interface MyViewProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  records: MeasurementRecord[];
  onEditProfile: () => void;
  onTogglePrivacy: () => void;
  onClearRecords: () => void;
  onExportData: () => void;
  onLogout: () => void;
}

export const MyView: React.FC<MyViewProps> = ({
  currentUser,
  userProfile,
  records,
  onEditProfile,
  onTogglePrivacy,
  onClearRecords,
  onExportData,
  onLogout,
}) => {
  const nickname = userProfile?.nickname || '';
  const email = currentUser?.email || '';

  return (
    <div id="my-screen" className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
      {/* 1. Page Header */}
      <div className="pt-2">
        <h1 className="text-[24px] font-bold text-[#1c1b1b] tracking-tight">
          마이페이지
        </h1>
        <p className="text-[13px] text-[#5a5f66] mt-0.5">
          개인 프로필 및 계정 환경설정
        </p>
      </div>

      {/* 2. User Profile Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#eae7e7]/70 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#0c4cda] flex items-center justify-center text-white shadow-sm">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold text-[#1c1b1b]">
                {nickname ? `${nickname} 님` : '사용자'}
              </span>
              <span className="text-[11px] font-semibold text-[#0c4cda] bg-[#dce1ff] px-2 py-0.5 rounded-full">
                정회원
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#5a5f66] mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{email || '-'}</span>
            </div>
          </div>
        </div>
        <button
          id="btn-edit-profile"
          type="button"
          onClick={onEditProfile}
          className="text-[13px] font-semibold text-[#0c4cda] hover:bg-[#f0eded] px-3 py-1.5 rounded-lg transition-colors"
        >
          수정
        </button>
      </div>

      {/* 3. Privacy Settings Section */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#eae7e7]/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f0eded] flex items-center justify-center text-[#0c4cda]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[14px] font-semibold text-[#1c1b1b]">
                프라이버시 보호 모드
              </span>
              <p className="text-[12px] text-[#5a5f66]">
                실명 비노출 및 체성분 수치 외 민감정보 마스킹
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onTogglePrivacy}
            className={`w-12 h-7 rounded-full transition-colors relative p-0.5 ${
              userProfile?.privacyMode ? 'bg-[#0c4cda]' : 'bg-[#e5e2e1]'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform ${
                userProfile?.privacyMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 4. Measurement Statistics Summary */}
      <div className="bg-[#f6f3f2] rounded-2xl p-4 border border-[#eae7e7]/60 space-y-3">
        <span className="text-[13px] font-bold text-[#1c1b1b]">
          체성분 관리 요약
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-3 rounded-xl shadow-xs">
            <span className="text-[11px] text-[#5a5f66]">누적 측정 횟수</span>
            <div className="text-[18px] font-bold text-[#1c1b1b] mt-0.5">
              {records.length} 회
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-xs">
            <span className="text-[11px] text-[#5a5f66]">최근 측정 체중</span>
            <div className="text-[18px] font-bold text-[#1c1b1b] mt-0.5">
              {records[0] ? `${records[0].weight.toFixed(1)} kg` : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Data Management & Logout */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-[#eae7e7]/70 divide-y divide-[#f0eded]">
        <button
          id="btn-export-data"
          type="button"
          onClick={onExportData}
          className="w-full p-3 flex items-center justify-between text-left hover:bg-[#f6f3f2] transition-colors rounded-xl"
        >
          <div className="flex items-center gap-3">
            <Download className="w-4 h-4 text-[#5a5f66]" />
            <span className="text-[14px] text-[#1c1b1b] font-medium">
              내 데이터 백업 (JSON 내보내기)
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#747686]" />
        </button>

        {records.length > 0 && (
          <button
            id="btn-clear-records"
            type="button"
            onClick={onClearRecords}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-[#f6f3f2] transition-colors rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-[#a4322a]" />
              <span className="text-[14px] text-[#a4322a] font-medium">
                내 측정 기록 초기화
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#747686]" />
          </button>
        )}

        <button
          id="btn-logout"
          type="button"
          onClick={onLogout}
          className="w-full p-3 flex items-center justify-between text-left hover:bg-[#f6f3f2] transition-colors rounded-xl"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 text-[#5a5f66]" />
            <span className="text-[14px] text-[#1c1b1b] font-medium">
              로그아웃
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#747686]" />
        </button>
      </div>

      {/* 6. System Info Card */}
      <div className="p-4 rounded-xl bg-white border border-[#eae7e7]/60 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#5a5f66] shrink-0 mt-0.5" />
        <div className="text-[12px] text-[#5a5f66] leading-relaxed">
          <p className="font-semibold text-[#1c1b1b] mb-0.5">BODY LOG 시스템 안내</p>
          본 서비스는 체성분 측정 결과를 기록·비교하여 사용자의 신체 조성 변화 추이를 객관적으로 시각화하는 디지털 헬스 보조 도구입니다.
        </div>
      </div>

      {/* Version Tag */}
      <div className="text-center pt-2 text-[11px] text-[#747686]">
        BODY LOG v1.0.0 · Precision Health Instrument
      </div>
    </div>
  );
};

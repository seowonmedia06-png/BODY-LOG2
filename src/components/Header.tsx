import React from 'react';
import { ChevronLeft, User, Bell } from 'lucide-react';
import { BRAND_LOGO_URL } from '../data/initialRecords';
import { ViewType, TabType } from '../types';

interface HeaderProps {
  view: ViewType;
  tab: TabType;
  onBack?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  view,
  tab,
  onBack,
  onOpenNotifications,
  onOpenProfile,
}) => {
  // 1. Measurement Detail View Header
  if (view === 'detail') {
    return (
      <header
        id="app-header-detail"
        className="fixed top-0 inset-x-0 z-50 bg-[#fcf9f8]/90 backdrop-blur-xl border-b border-[#eae7e7]/50 pt-safe"
      >
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              id="btn-detail-back"
              type="button"
              onClick={onBack}
              aria-label="뒤로 가기"
              className="w-10 h-10 -ml-1.5 flex items-center justify-center text-[#1c1b1b] rounded-full hover:bg-[#f0eded] transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-[#1c1b1b]" />
            </button>
            <h1 className="text-[17px] font-semibold tracking-tight text-[#1c1b1b]">
              측정 상세 리포트
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <img
              src={BRAND_LOGO_URL}
              alt="BODY LOG Logo"
              className="h-7 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <button
              id="btn-detail-profile"
              type="button"
              onClick={onOpenProfile}
              aria-label="프로필"
              className="w-8 h-8 rounded-full bg-[#0c4cda] flex items-center justify-center text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <User className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </header>
    );
  }

  // 2. Tab Screens (Home, Record, My)
  return (
    <header
      id="app-header-main"
      className="fixed top-0 inset-x-0 z-50 bg-[#fcf9f8]/90 backdrop-blur-xl border-b border-[#eae7e7]/50 pt-safe"
    >
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={BRAND_LOGO_URL}
            alt="BODY LOG Logo"
            className="h-7 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="text-[18px] font-bold tracking-tight text-[#1c1b1b]">
            BODY LOG
          </span>
          {tab === 'home' && (
            <span className="text-[11px] font-semibold text-[#5a5f66] uppercase tracking-wider pl-1">
              HOME
            </span>
          )}
          {tab === 'record' && (
            <span className="text-[11px] font-semibold text-[#5a5f66] uppercase tracking-wider pl-1">
              RECORD
            </span>
          )}
          {tab === 'my' && (
            <span className="text-[11px] font-semibold text-[#5a5f66] uppercase tracking-wider pl-1">
              MY
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-header-notifications"
            type="button"
            onClick={onOpenNotifications}
            aria-label="알림"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#5a5f66] hover:text-[#1c1b1b] hover:bg-[#f0eded] transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#3867f4]"></span>
          </button>
          <button
            id="btn-header-profile-main"
            type="button"
            onClick={onOpenProfile}
            aria-label="내 정보"
            className="w-8 h-8 rounded-full bg-[#0c4cda] flex items-center justify-center text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <User className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
};

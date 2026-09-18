import React from 'react';
import { Home, BarChart2, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav
      id="app-bottom-nav"
      className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#fcf9f8]/95 backdrop-blur-xl border-t border-[#eae7e7]/80 shadow-[0_-2px_12px_rgba(0,0,0,0.03)]"
    >
      <div className="flex justify-around items-center h-16 px-4 max-w-lg mx-auto">
        {/* Home Tab */}
        <button
          id="nav-tab-home"
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 gap-1 transition-colors ${
            currentTab === 'home'
              ? 'text-[#0c4cda] font-semibold'
              : 'text-[#5a5f66] hover:text-[#1c1b1b]'
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] tracking-tight">홈</span>
        </button>

        {/* Record Tab */}
        <button
          id="nav-tab-record"
          type="button"
          onClick={() => onSelectTab('record')}
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 gap-1 transition-colors ${
            currentTab === 'record'
              ? 'text-[#0c4cda] font-semibold'
              : 'text-[#5a5f66] hover:text-[#1c1b1b]'
          }`}
        >
          <BarChart2 className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] tracking-tight">기록</span>
        </button>

        {/* My Tab */}
        <button
          id="nav-tab-my"
          type="button"
          onClick={() => onSelectTab('my')}
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 gap-1 transition-colors ${
            currentTab === 'my'
              ? 'text-[#0c4cda] font-semibold'
              : 'text-[#5a5f66] hover:text-[#1c1b1b]'
          }`}
        >
          <User className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] tracking-tight">마이</span>
        </button>
      </div>
    </nav>
  );
};

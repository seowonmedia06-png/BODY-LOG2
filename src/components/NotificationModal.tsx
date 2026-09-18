import React from 'react';
import { Bell, X, Check, Calendar, Activity } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'n1',
      title: '새로운 분석 완료',
      message: '2026.09.01 체성분 결과지 분석이 완료되었습니다. 골격근량이 증가했습니다.',
      time: '방금 전',
      icon: Activity,
    },
    {
      id: 'n2',
      title: '일관된 측정 권장 알림',
      message: '체성분 비교의 정확도를 높이기 위해 항상 오전 공복에 측정을 권장합니다.',
      time: '어제',
      icon: Calendar,
    },
    {
      id: 'n3',
      title: '프라이버시 보호 적용 중',
      message: '개인 신원 정보는 로컬 기기 안전 저장소에 격리되어 보호됩니다.',
      time: '3일 전',
      icon: Check,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        id="notification-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-[#1c1b1b]/40 backdrop-blur-[2px]"
      />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl z-50 p-5 border border-[#eae7e7]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f0eded]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#3867f4]" />
            <h3 className="text-[16px] font-bold text-[#1c1b1b]">알림 센터</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-full bg-[#f6f3f2] flex items-center justify-center text-[#5a5f66]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div key={n.id} className="p-3 rounded-xl bg-[#f6f3f2] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-[13px] text-[#1c1b1b]">
                    <Icon className="w-3.5 h-3.5 text-[#3867f4]" />
                    <span>{n.title}</span>
                  </div>
                  <span className="text-[11px] text-[#747686]">{n.time}</span>
                </div>
                <p className="text-[12px] text-[#5a5f66] leading-relaxed">
                  {n.message}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Camera, Flame, MessageSquare, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationToastProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onClickNotification: (notification: NotificationItem) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  onClickNotification,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 inset-x-4 z-50 flex flex-col gap-2 max-w-sm mx-auto pointer-events-none select-none">
      {notifications.map((notif) => {
        const isScreenshot = notif.type === 'screenshot';
        const isStreak = notif.type === 'streak_risk';

        return (
          <div
            key={notif.id}
            onClick={() => onClickNotification(notif)}
            className={`pointer-events-auto p-3.5 rounded-3xl border shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-300 transform active:scale-95 animate-in slide-in-from-top ${
              isScreenshot
                ? 'bg-red-950/80 border-red-400/80 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                : isStreak
                ? 'bg-amber-950/80 border-amber-400/80 text-white shadow-[0_0_25px_rgba(245,158,11,0.35)]'
                : 'bg-[#16162a]/85 border-white/20 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {notif.avatar ? (
                <img
                  src={notif.avatar}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-yellow-400 flex-shrink-0 shadow-md"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md ${
                    isScreenshot ? 'bg-red-500 text-white' : 'bg-yellow-400 text-black'
                  }`}
                >
                  {isScreenshot ? <Camera className="w-5 h-5" /> : isStreak ? <Flame className="w-5 h-5" /> : '👻'}
                </div>
              )}

              <div className="flex flex-col">
                <h4 className="font-extrabold text-xs leading-tight">{notif.title}</h4>
                <p className="text-[11px] text-white/80 line-clamp-1">{notif.message}</p>
                <span className="text-[9px] text-white/50 mt-0.5">{notif.timestamp}</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notif.id);
              }}
              className="p-1 rounded-full text-white/50 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

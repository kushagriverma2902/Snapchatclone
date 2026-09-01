import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, RotateCcw, MessageSquare, AlertTriangle, ShieldAlert, Heart, Flame } from 'lucide-react';
import { ReceivedSnap } from '../../types';
import { playSound } from '../../utils/audioEffects';

interface SnapViewerProps {
  snap: ReceivedSnap;
  onClose: (snapId: string, wasReplayed?: boolean) => void;
  onScreenshotTaken: (snap: ReceivedSnap) => void;
  onReplyInChat: (friendId: string, replyText?: string) => void;
}

export const SnapViewer: React.FC<SnapViewerProps> = ({
  snap,
  onClose,
  onScreenshotTaken,
  onReplyInChat,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(snap.duration);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [screenshotAlert, setScreenshotAlert] = useState<boolean>(false);
  const [showReplyInput, setShowReplyInput] = useState<boolean>(false);
  const [replyMessage, setReplyMessage] = useState<string>('');

  const timerRef = useRef<any>(null);

  // Countdown timer logic
  useEffect(() => {
    if (snap.duration === 999) return; // Infinite mode

    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            playSound('delete');
            onClose(snap.id, false);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [snap, isPaused, onClose]);

  // Keyboard shortcut listener for PrintScreen / Cmd+Shift+3/4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4'))) {
        triggerScreenshotNotification();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [snap]);

  const triggerScreenshotNotification = () => {
    playSound('screenshot');
    setScreenshotAlert(true);
    onScreenshotTaken(snap);

    setTimeout(() => {
      setScreenshotAlert(false);
    }, 3500);
  };

  const handleSendReply = () => {
    if (!replyMessage.trim()) return;
    playSound('pop');
    onReplyInChat(snap.senderId, replyMessage);
    onClose(snap.id, false);
  };

  const progressPercent = snap.duration === 999 ? 100 : (timeLeft / snap.duration) * 100;

  return (
    <div
      className="relative w-full h-full bg-black flex flex-col justify-between overflow-hidden select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Background Media */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={snap.mediaUrl}
          alt="Snap Media"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />

        {/* Text Overlays */}
        {snap.overlays?.map((o) => (
          <div
            key={o.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${o.x}%`,
              top: `${o.y}%`,
              transform: `translate(-50%, -50%) rotate(${o.rotation}deg)`,
            }}
          >
            <div
              className={`px-4 py-2 text-center font-bold ${
                o.bgStyle === 'banner'
                  ? 'bg-black/70 backdrop-blur-xs w-screen max-w-full'
                  : o.bgStyle === 'pill'
                  ? 'bg-black/85 rounded-full px-5 py-2'
                  : o.bgStyle === 'neon'
                  ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-300 rounded-xl px-4 py-2'
                  : ''
              }`}
              style={{
                color: o.color,
                fontSize: `${o.fontSize}px`,
                fontFamily: o.fontFamily === 'syne' ? 'Syne, sans-serif' : 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {o.text}
            </div>
          </div>
        ))}

        {/* Stickers */}
        {snap.stickers?.map((s) => (
          <div
            key={s.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotation}deg)`,
            }}
          >
            <div className="text-5xl">{s.emojiOrUrl}</div>
          </div>
        ))}
      </div>

      {/* Screenshot Alert Banner */}
      {screenshotAlert && (
        <div className="absolute top-16 inset-x-4 z-50 bg-red-600/95 text-white backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <div className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center flex-shrink-0 font-bold">
            📸
          </div>
          <div>
            <h4 className="font-extrabold text-sm tracking-wide">Screenshot Alert Triggered!</h4>
            <p className="text-xs text-red-100">
              Sender <span className="font-bold">{snap.senderName}</span> was immediately notified with timestamp.
            </p>
          </div>
        </div>
      )}

      {/* Top Bar: Sender Info & Countdown Timer */}
      <div className="relative z-30 pt-4 px-4 flex items-center justify-between">
        {/* Sender details */}
        <div className="flex items-center gap-2.5 bg-[#16162a]/75 backdrop-blur-2xl px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
          <img
            src={snap.senderAvatar}
            alt={snap.senderName}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-yellow-400"
          />
          <div>
            <h4 className="font-bold text-white text-xs leading-none">{snap.senderName}</h4>
            <p className="text-[10px] text-white/70">{snap.sentAt}</p>
          </div>
        </div>

        {/* Action Controls: Screenshot Simulation, Close & Timer */}
        <div className="flex items-center gap-2">
          {/* Simulated Screenshot Button */}
          <button
            id="simulate-screenshot-btn"
            onClick={triggerScreenshotNotification}
            className="px-3 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-400/80 text-red-200 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.3)] backdrop-blur-xl active:scale-90 transition"
            title="Simulate Screenshot Capture"
          >
            <Camera className="w-4 h-4 text-red-300" />
            <span className="hidden sm:inline">Screenshot</span>
          </button>

          {/* Countdown Ring */}
          <div className="relative w-9 h-9 flex items-center justify-center bg-[#16162a]/80 backdrop-blur-2xl rounded-full border border-white/20 shadow-md">
            <svg className="w-9 h-9 -rotate-90">
              <circle cx="18" cy="18" r="14" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
              <circle
                cx="18"
                cy="18"
                r="14"
                stroke="#facc15"
                strokeWidth="3"
                fill="none"
                strokeDasharray="88"
                strokeDashoffset={88 - (88 * progressPercent) / 100}
                className="transition-all duration-1000 linear"
              />
            </svg>
            <span className="absolute text-xs font-black text-white">
              {snap.duration === 999 ? '∞' : timeLeft}
            </span>
          </div>

          {/* Close / Dismiss */}
          <button
            id="close-snap-viewer-btn"
            onClick={() => {
              playSound('delete');
              onClose(snap.id, false);
            }}
            className="w-9 h-9 rounded-full bg-[#16162a]/80 backdrop-blur-2xl flex items-center justify-center text-white/90 hover:text-white border border-white/20 active:scale-90 transition shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Reply Bar */}
      <div className="relative z-30 pb-4 px-4 flex flex-col gap-2">
        {showReplyInput ? (
          <div className="flex items-center gap-2 bg-[#16162a]/90 backdrop-blur-3xl p-2 rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom">
            <input
              type="text"
              autoFocus
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              placeholder={`Reply to ${snap.senderName}...`}
              className="flex-1 bg-transparent text-sm text-white px-3 py-1.5 outline-none placeholder-white/40"
            />
            <button
              onClick={handleSendReply}
              className="bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-1.5 rounded-xl font-bold text-xs shadow-[0_0_12px_rgba(250,204,21,0.4)] active:scale-95 transition"
            >
              Send
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <button
              id="snap-chat-reply-btn"
              onClick={() => setShowReplyInput(true)}
              className="flex-1 bg-[#16162a]/80 backdrop-blur-2xl border border-white/20 rounded-full px-4 py-2.5 flex items-center gap-2 text-white/80 hover:text-white text-xs font-semibold active:scale-98 transition shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
              <MessageSquare className="w-4 h-4 text-yellow-300" />
              <span>Tap to Chat Reply...</span>
            </button>

            {snap.canReplay && !snap.replayed && (
              <button
                onClick={() => {
                  playSound('pop');
                  setTimeLeft(snap.duration);
                  onClose(snap.id, true);
                }}
                className="px-3.5 py-2.5 rounded-full bg-[#16162a]/80 backdrop-blur-2xl border border-white/20 text-yellow-300 font-bold text-xs flex items-center gap-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] active:scale-95 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay (1 left)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

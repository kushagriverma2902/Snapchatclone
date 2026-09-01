import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, Trash2, Camera, Send, MessageSquare, ChevronDown } from 'lucide-react';
import { Story, StorySegment } from '../../types';
import { playSound } from '../../utils/audioEffects';

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onDeleteSegment?: (segmentId: string) => void;
  onReplyToStory?: (userId: string, text: string) => void;
  onScreenshotTaken?: (userName: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  story,
  onClose,
  onDeleteSegment,
  onReplyToStory,
  onScreenshotTaken,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showInsights, setShowInsights] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [screenshotAlert, setScreenshotAlert] = useState<boolean>(false);

  const segments = story.segments || [];
  const currentSegment: StorySegment | undefined = segments[currentIdx];
  const progressIntervalRef = useRef<any>(null);

  // Auto-progress through story segments
  useEffect(() => {
    if (!currentSegment) return;
    setProgress(0);

    const stepMs = 50;
    const durationMs = (currentSegment.duration || 5) * 1000;
    const increment = (stepMs / durationMs) * 100;

    progressIntervalRef.current = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNextSegment();
            return 0;
          }
          return prev + increment;
        });
      }
    }, stepMs);

    return () => clearInterval(progressIntervalRef.current);
  }, [currentIdx, currentSegment, isPaused]);

  const handleNextSegment = () => {
    if (currentIdx < segments.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setProgress(0);
      playSound('tap');
    } else {
      onClose();
    }
  };

  const handlePrevSegment = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
      setProgress(0);
      playSound('tap');
    } else {
      setProgress(0);
    }
  };

  const handleTapScreen = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e;
    const rect = currentTarget.getBoundingClientRect();
    const clickX = clientX - rect.left;

    if (clickX < rect.width * 0.35) {
      handlePrevSegment();
    } else {
      handleNextSegment();
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    playSound('pop');
    onReplyToStory?.(story.userId, replyText);
    setReplyText('');
    onClose();
  };

  const triggerScreenshotAlert = () => {
    playSound('screenshot');
    setScreenshotAlert(true);
    onScreenshotTaken?.(story.userName);
    setTimeout(() => setScreenshotAlert(false), 3500);
  };

  if (!currentSegment) return null;

  return (
    <div
      className="relative w-full h-full bg-black flex flex-col justify-between overflow-hidden select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Background Image / Video */}
      <div className="absolute inset-0 w-full h-full" onClick={handleTapScreen}>
        <img
          src={currentSegment.mediaUrl}
          alt="Story Media"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />

        {/* Overlays */}
        {currentSegment.overlays?.map((o) => (
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
      </div>

      {/* Screenshot Notification */}
      {screenshotAlert && (
        <div className="absolute top-16 inset-x-4 z-50 bg-red-600/95 text-white backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <div className="w-9 h-9 rounded-full bg-white text-red-600 flex items-center justify-center font-bold">
            📸
          </div>
          <div>
            <h4 className="font-extrabold text-sm">Screenshot Recorded</h4>
            <p className="text-xs text-red-100">{story.userName} was notified of your screenshot.</p>
          </div>
        </div>
      )}

      {/* Top Header & Multi-Segment Progress Bars */}
      <div className="relative z-30 pt-3 px-3 flex flex-col gap-2">
        {/* Progress Segments */}
        <div className="flex items-center gap-1.5 w-full">
          {segments.map((seg, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            return (
              <div key={seg.id} className="h-1.5 flex-1 bg-white/20 backdrop-blur-md rounded-full overflow-hidden shadow-sm">
                <div
                  className="h-full bg-white transition-all duration-75 shadow-sm"
                  style={{
                    width: isCompleted ? '100%' : isCurrent ? `${progress}%` : '0%',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* User Info Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/15 shadow-lg">
            <img
              src={story.userAvatar}
              alt={story.userName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-yellow-400"
            />
            <div>
              <h4 className="font-bold text-white text-xs leading-none">{story.userName}</h4>
              <p className="text-[10px] text-white/70 font-medium">{currentSegment.timeAgo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Screenshot simulation button */}
            <button
              onClick={triggerScreenshotAlert}
              className="p-2 rounded-full bg-black/40 backdrop-blur-xl text-red-300 hover:bg-black/60 border border-white/15 active:scale-90 transition shadow-md"
              title="Simulate Screenshot"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white/90 hover:text-white border border-white/15 active:scale-90 transition shadow-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Area: Creator Insights Drawer or Quick Reply */}
      <div className="relative z-30 pb-4 px-4">
        {story.isMyStory ? (
          <div>
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="w-full bg-[#16162a]/80 backdrop-blur-2xl border border-white/20 rounded-2xl py-2.5 px-4 flex items-center justify-between text-white font-bold text-xs shadow-[0_8px_32px_rgba(0,0,0,0.5)] active:scale-98 transition"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-yellow-300" />
                <span>{currentSegment.viewers?.length || 0} Story Views</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showInsights ? 'rotate-180' : ''}`} />
            </button>

            {/* Viewer list expanded drawer */}
            {showInsights && (
              <div className="mt-2 bg-[#16162a]/90 backdrop-blur-2xl rounded-2xl border border-white/20 p-3.5 max-h-48 overflow-y-auto flex flex-col gap-2 shadow-2xl animate-in slide-in-from-bottom">
                <div className="flex items-center justify-between pb-1 border-b border-white/15">
                  <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
                    Viewers ({currentSegment.viewers?.length || 0})
                  </span>
                  {onDeleteSegment && (
                    <button
                      onClick={() => onDeleteSegment(currentSegment.id)}
                      className="text-xs text-red-300 hover:text-red-200 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                {currentSegment.viewers?.map((v) => (
                  <div key={v.userId} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <img
                        src={v.userAvatar}
                        alt={v.userName}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
                      />
                      <div>
                        <h5 className="font-bold text-xs text-white">{v.userName}</h5>
                        <p className="text-[10px] text-white/50">{v.viewedAt}</p>
                      </div>
                    </div>
                    {v.tookScreenshot && (
                      <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-bold backdrop-blur-md">
                        📸 Screenshot
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-[#16162a]/80 backdrop-blur-2xl p-2 rounded-full border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              placeholder={`Send a chat to ${story.userName}...`}
              className="flex-1 bg-transparent px-3 text-xs text-white placeholder-white/50 outline-none"
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className="w-8 h-8 rounded-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black flex items-center justify-center font-bold active:scale-95 transition shadow-[0_0_12px_rgba(250,204,21,0.4)]"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

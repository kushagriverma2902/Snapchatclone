import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Zap, ZapOff, Clock, Sparkles, Volume2, VolumeX, Moon, Grid, ChevronUp } from 'lucide-react';
import { FilterLens, CreatedSnap } from '../../types';
import { renderAROverlay } from '../../utils/arRenderer';
import { playSound } from '../../utils/audioEffects';

interface CameraViewProps {
  filters: FilterLens[];
  selectedFilter: FilterLens;
  onSelectFilter: (filter: FilterLens) => void;
  onSnapCaptured: (snap: CreatedSnap) => void;
  onOpenProfile: () => void;
  userAvatar: string;
}

export const CameraView: React.FC<CameraViewProps> = ({
  filters,
  selectedFilter,
  onSelectFilter,
  onSnapCaptured,
  onOpenProfile,
  userAvatar,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flash, setFlash] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordIntervalRef = useRef<any>(null);
  const recordStartTimeRef = useRef<number>(0);
  const isHoldingRef = useRef<boolean>(false);

  // Initialize camera or graceful test stream
  useEffect(() => {
    let active = true;

    async function initCamera() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 1080 },
              height: { ideal: 1920 },
            },
            audio: false,
          });

          if (active && videoRef.current) {
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
            setCameraActive(true);
            setCameraError(null);
          }
        } else {
          setCameraError('Camera access not supported');
        }
      } catch (err: any) {
        if (active) {
          setCameraActive(false);
          setCameraError('Camera permission not granted. Running high-def simulation mode.');
        }
      }
    }

    initCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [facingMode]);

  // Real-time canvas processing loop for AR overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const renderLoop = () => {
      if (!isRunning) return;

      const width = canvas.width || 400;
      const height = canvas.height || 700;

      ctx.clearRect(0, 0, width, height);

      // Render active AR filter overlays
      if (selectedFilter.overlayType) {
        renderAROverlay(ctx, width, height, selectedFilter.overlayType, Date.now());
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [selectedFilter]);

  // Trigger Capture (Photo or End Video)
  const capturePhoto = () => {
    playSound('shutter');

    // Create snap image by merging video frame and canvas
    const tempCanvas = document.createElement('canvas');
    const width = 720;
    const height = 1280;
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tCtx = tempCanvas.getContext('2d')!;

    // Apply night mode or filter adjustments
    if (nightMode) {
      tCtx.filter = 'brightness(1.3) contrast(1.1)';
    }

    if (cameraActive && videoRef.current && videoRef.current.readyState >= 2) {
      if (selectedFilter.canvasFilter) {
        tCtx.filter = selectedFilter.canvasFilter;
      }
      // Flip if selfie mode
      if (facingMode === 'user') {
        tCtx.translate(width, 0);
        tCtx.scale(-1, 1);
      }
      tCtx.drawImage(videoRef.current, 0, 0, width, height);
      tCtx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      // High-quality aesthetic camera fallback portrait
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1080&auto=format&fit=crop&q=80';

      // Draw modern gradient backdrop
      const grad = tCtx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#312e81');
      grad.addColorStop(1, '#0f172a');
      tCtx.fillStyle = grad;
      tCtx.fillRect(0, 0, width, height);
    }

    // Overlay AR graphics
    if (selectedFilter.overlayType) {
      renderAROverlay(tCtx, width, height, selectedFilter.overlayType, Date.now());
    }

    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.92);

    const newSnap: CreatedSnap = {
      id: `snap_${Date.now()}`,
      mediaUrl: dataUrl,
      mediaType: 'photo',
      duration: 5,
      timestamp: 'Just now',
      overlays: [],
      drawings: [],
      stickers: [],
      filterId: selectedFilter.id,
      filterName: selectedFilter.name,
      hasAudio: true,
    };

    onSnapCaptured(newSnap);
  };

  const handleStartCapture = () => {
    if (timerDuration > 0) {
      setCountdown(timerDuration);
      let count = timerDuration;
      const interval = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdown(count);
          playSound('tap');
        } else {
          clearInterval(interval);
          setCountdown(null);
          capturePhoto();
        }
      }, 1000);
      return;
    }

    // Start hold timer for video recording
    isHoldingRef.current = true;
    const holdTimer = setTimeout(() => {
      if (isHoldingRef.current) {
        startVideoRecording();
      }
    }, 280);

    (window as any)._snapHoldTimeout = holdTimer;
  };

  const handleEndCapture = () => {
    if (timerDuration > 0) return;

    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      clearTimeout((window as any)._snapHoldTimeout);

      if (isRecording) {
        stopVideoRecording();
      } else {
        // Quick tap: capture photo!
        capturePhoto();
      }
    }
  };

  const startVideoRecording = () => {
    setIsRecording(true);
    playSound('record_start');
    recordStartTimeRef.current = Date.now();
    setRecordProgress(0);

    recordIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - recordStartTimeRef.current) / 1000;
      const maxSeconds = 60;
      const pct = (elapsed / maxSeconds) * 100;
      setRecordProgress(pct);

      if (pct >= 100) {
        stopVideoRecording();
      }
    }, 100);
  };

  const stopVideoRecording = () => {
    setIsRecording(false);
    clearInterval(recordIntervalRef.current);
    playSound('record_stop');

    // Generate snapshot video snap
    const tempCanvas = document.createElement('canvas');
    const width = 720;
    const height = 1280;
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tCtx = tempCanvas.getContext('2d')!;

    if (cameraActive && videoRef.current && videoRef.current.readyState >= 2) {
      if (facingMode === 'user') {
        tCtx.translate(width, 0);
        tCtx.scale(-1, 1);
      }
      tCtx.drawImage(videoRef.current, 0, 0, width, height);
      tCtx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
      const grad = tCtx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#312e81');
      grad.addColorStop(1, '#0f172a');
      tCtx.fillStyle = grad;
      tCtx.fillRect(0, 0, width, height);
    }

    if (selectedFilter.overlayType) {
      renderAROverlay(tCtx, width, height, selectedFilter.overlayType, Date.now());
    }

    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.92);

    const newSnap: CreatedSnap = {
      id: `snap_video_${Date.now()}`,
      mediaUrl: dataUrl,
      mediaType: 'video',
      duration: Math.max(3, Math.min(60, Math.round((Date.now() - recordStartTimeRef.current) / 1000))),
      timestamp: 'Just now',
      overlays: [],
      drawings: [],
      stickers: [],
      filterId: selectedFilter.id,
      filterName: selectedFilter.name,
      hasAudio: true,
    };

    onSnapCaptured(newSnap);
  };

  const toggleCameraFlip = () => {
    playSound('tap');
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-between select-none">
      {/* Background Live Video / Fallback Feed */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {cameraActive ? (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className={`w-full h-full object-cover transition-all duration-300 ${
              facingMode === 'user' ? '-scale-x-100' : ''
            } ${nightMode ? 'brightness-125 contrast-110' : ''}`}
            style={{
              filter: selectedFilter.canvasFilter || undefined,
            }}
          />
        ) : (
          <div className="w-full h-full relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1080&auto=format&fit=crop&q=80"
              alt="Camera Simulation"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-all duration-300 ${
                nightMode ? 'brightness-125 contrast-110' : ''
              }`}
              style={{
                filter: selectedFilter.canvasFilter || undefined,
              }}
            />
            {/* Live camera fallback hint banner */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-neutral-300 flex items-center gap-1.5 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Camera Ready
            </div>
          </div>
        )}

        {/* Real-time AR Overlay Canvas */}
        <canvas
          ref={canvasRef}
          width={720}
          height={1280}
          className="absolute inset-0 w-full h-full pointer-events-none object-cover"
        />

        {/* Rule of Thirds Grid */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
            <div className="border-r border-b border-white/20"></div>
            <div className="border-r border-b border-white/20"></div>
            <div className="border-b border-white/20"></div>
            <div className="border-r border-b border-white/20"></div>
            <div className="border-r border-b border-white/20"></div>
            <div className="border-b border-white/20"></div>
            <div className="border-r border-white/20"></div>
            <div className="border-r border-white/20"></div>
            <div></div>
          </div>
        )}

        {/* Flash Screen Flare Effect */}
        {flash && (
          <div className="absolute inset-0 bg-white/95 pointer-events-none z-30 animate-out fade-out duration-300" />
        )}

        {/* Countdown Timer Display */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs z-30">
            <span className="text-8xl font-black text-yellow-300 animate-ping font-['Syne']">
              {countdown}
            </span>
          </div>
        )}
      </div>

      {/* Top Header Bar */}
      <div className="relative z-20 pt-4 px-4 flex items-center justify-between">
        {/* Left: Profile & Search */}
        <div className="flex items-center gap-2">
          <button
            id="profile-avatar-btn"
            onClick={() => {
              playSound('tap');
              onOpenProfile();
            }}
            className="w-10 h-10 rounded-full ring-2 ring-yellow-400 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.5)] transform active:scale-95 transition bg-white/10 backdrop-blur-xl border border-white/20"
          >
            <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </button>
        </div>

        {/* Right: Camera Action Toolbar */}
        <div className="flex items-center gap-1.5 bg-white/[0.12] backdrop-blur-2xl px-2.5 py-1.5 rounded-full border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
          {/* Flip Camera */}
          <button
            id="camera-flip-btn"
            onClick={toggleCameraFlip}
            className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/20 active:scale-90 transition"
            title="Flip Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Flash Toggle */}
          <button
            id="camera-flash-btn"
            onClick={() => {
              playSound('tap');
              setFlash(!flash);
            }}
            className={`p-2 rounded-full transition active:scale-90 ${
              flash ? 'text-yellow-300 bg-yellow-400/30 ring-1 ring-yellow-400/50' : 'text-white/90 hover:text-white hover:bg-white/20'
            }`}
            title="Flash"
          >
            {flash ? <Zap className="w-5 h-5 fill-yellow-400" /> : <ZapOff className="w-5 h-5" />}
          </button>

          {/* Timer Toggle (Off, 3s, 10s) */}
          <button
            id="camera-timer-btn"
            onClick={() => {
              playSound('tap');
              setTimerDuration((prev) => (prev === 0 ? 3 : prev === 3 ? 10 : 0));
            }}
            className={`p-2 rounded-full transition active:scale-90 flex items-center gap-1 ${
              timerDuration > 0 ? 'text-yellow-300 bg-yellow-400/30 ring-1 ring-yellow-400/50' : 'text-white/90 hover:text-white hover:bg-white/20'
            }`}
            title="Timer"
          >
            <Clock className="w-5 h-5" />
            {timerDuration > 0 && <span className="text-xs font-bold">{timerDuration}s</span>}
          </button>

          {/* Night Mode */}
          <button
            id="camera-night-btn"
            onClick={() => {
              playSound('tap');
              setNightMode(!nightMode);
            }}
            className={`p-2 rounded-full transition active:scale-90 ${
              nightMode ? 'text-indigo-200 bg-indigo-500/30 ring-1 ring-indigo-400/50' : 'text-white/90 hover:text-white hover:bg-white/20'
            }`}
            title="Night Mode"
          >
            <Moon className="w-5 h-5" />
          </button>

          {/* Grid Toggle */}
          <button
            id="camera-grid-btn"
            onClick={() => {
              playSound('tap');
              setShowGrid(!showGrid);
            }}
            className={`p-2 rounded-full transition active:scale-90 ${
              showGrid ? 'text-yellow-300 bg-yellow-400/30 ring-1 ring-yellow-400/50' : 'text-white/90 hover:text-white hover:bg-white/20'
            }`}
            title="Grid"
          >
            <Grid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Filter Badge Notice */}
      {selectedFilter.id !== 'normal' && (
        <div className="relative z-20 self-center bg-white/[0.12] backdrop-blur-2xl px-4 py-1 rounded-full border border-white/20 text-xs font-medium text-white flex items-center gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <span>{selectedFilter.icon}</span>
          <span>{selectedFilter.name}</span>
        </div>
      )}

      {/* Bottom Controls: AR Filter Carousel & Shutter Button */}
      <div className="relative z-20 pb-4 flex flex-col items-center gap-4">
        {/* AR Filter Carousel */}
        <div className="w-full overflow-x-auto no-scrollbar px-6 flex items-center justify-center gap-3 py-1">
          {filters.map((f) => {
            const isSelected = selectedFilter.id === f.id;
            return (
              <button
                key={f.id}
                id={`filter-btn-${f.id}`}
                onClick={() => {
                  playSound('tap');
                  onSelectFilter(f);
                }}
                className={`flex-shrink-0 flex flex-col items-center transition-all duration-200 transform ${
                  isSelected ? 'scale-110 -translate-y-1' : 'opacity-75 hover:opacity-100 scale-95'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all ${
                    isSelected
                      ? 'ring-3 ring-yellow-400 bg-white/20 border-2 border-white'
                      : 'bg-white/10 border border-white/20 hover:bg-white/15'
                  }`}
                  style={{
                    backgroundColor: isSelected ? f.colorTone || 'rgba(255,255,255,0.2)' : undefined,
                  }}
                >
                  {f.icon}
                </div>
                <span
                  className={`text-[10px] mt-1 font-semibold tracking-wide truncate max-w-[64px] ${
                    isSelected ? 'text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)] font-bold' : 'text-neutral-300'
                  }`}
                >
                  {f.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Shutter Capture Button */}
        <div className="flex items-center justify-center relative w-full">
          <div className="relative flex items-center justify-center">
            {/* Circular Progress Ring for Video Recording */}
            {isRecording && (
              <svg className="absolute -inset-3 w-[100px] h-[100px] -rotate-90 pointer-events-none">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="#ef4444"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="276"
                  strokeDashoffset={276 - (276 * recordProgress) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-100"
                />
              </svg>
            )}

            {/* Shutter Button */}
            <button
              id="shutter-capture-button"
              onMouseDown={handleStartCapture}
              onMouseUp={handleEndCapture}
              onTouchStart={handleStartCapture}
              onTouchEnd={handleEndCapture}
              className={`relative rounded-full transition-all duration-150 transform active:scale-90 flex items-center justify-center shadow-2xl ${
                isRecording
                  ? 'w-20 h-20 bg-red-500 ring-4 ring-white/40 animate-pulse'
                  : 'w-20 h-20 bg-transparent ring-4 ring-white'
              }`}
            >
              <div
                className={`rounded-full transition-all duration-200 ${
                  isRecording ? 'w-8 h-8 rounded-md bg-white' : 'w-16 h-16 bg-white/90 hover:bg-white'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Helper Hint */}
        <p className="text-[11px] font-medium text-neutral-400 tracking-tight">
          {isRecording ? 'Recording video... release to finish' : 'Tap for photo • Hold for video'}
        </p>
      </div>
    </div>
  );
};

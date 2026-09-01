import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  Moon,
  Grid,
  ChevronUp,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Maximize2
} from 'lucide-react';
import { FilterLens, CreatedSnap } from '../../types';
import { renderAROverlay } from '../../utils/arRenderer';
import { playSound } from '../../utils/audioEffects';

// Sample high-definition simulation scenes when physical webcam is disabled or blocked
const SIMULATION_SCENES = [
  {
    id: 'selfie_vibe',
    name: 'Casual Selfie',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1080&auto=format&fit=crop&q=80',
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1080&auto=format&fit=crop&q=80',
  },
  {
    id: 'neon_city',
    name: 'Cyber City',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1080&auto=format&fit=crop&q=80',
  },
  {
    id: 'cafe_chill',
    name: 'Coffee Shop',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1080&auto=format&fit=crop&q=80',
  },
];

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
  const [cameraLoading, setCameraLoading] = useState<boolean>(true);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flash, setFlash] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState<boolean>(false);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [shutterFlashing, setShutterFlashing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fallbackImgRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordIntervalRef = useRef<any>(null);
  const recordStartTimeRef = useRef<number>(0);
  const isHoldingRef = useRef<boolean>(false);
  const holdTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to compute true aspect-ratio cover crop coordinates without distortion or squishing
  const getCaptureGeometry = (
    containerEl: HTMLElement | null,
    mediaEl: HTMLVideoElement | HTMLImageElement | null
  ) => {
    const cw = containerEl?.clientWidth || 390;
    const ch = containerEl?.clientHeight || 844;
    const targetRatio = cw / ch;

    // Crisp high-definition output target (e.g. 1080x1920 or native aspect)
    let outWidth = 1080;
    let outHeight = 1920;

    if (targetRatio <= 1) {
      outWidth = 1080;
      outHeight = Math.max(1080, Math.round(1080 / targetRatio));
    } else {
      outHeight = 1080;
      outWidth = Math.max(1080, Math.round(1080 * targetRatio));
    }

    const canvasRatio = outWidth / outHeight;

    let srcX = 0;
    let srcY = 0;
    let srcW = outWidth;
    let srcH = outHeight;

    if (mediaEl) {
      const mw = mediaEl instanceof HTMLVideoElement ? (mediaEl.videoWidth || 1280) : (mediaEl.naturalWidth || 1080);
      const mh = mediaEl instanceof HTMLVideoElement ? (mediaEl.videoHeight || 720) : (mediaEl.naturalHeight || 1920);

      if (mw > 0 && mh > 0) {
        const mediaRatio = mw / mh;
        if (mediaRatio > canvasRatio) {
          // Media is wider than container view -> crop left & right
          srcW = mh * canvasRatio;
          srcH = mh;
          srcX = (mw - srcW) / 2;
          srcY = 0;
        } else {
          // Media is taller/narrower -> crop top & bottom
          srcW = mw;
          srcH = mw / canvasRatio;
          srcX = 0;
          srcY = (mh - srcH) / 2;
        }
      }
    }

    return { outWidth, outHeight, srcX, srcY, srcW, srcH };
  };

  // Synchronize stream with video element
  useEffect(() => {
    const video = videoRef.current;
    if (video && activeStream) {
      video.srcObject = activeStream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;
      video.autoplay = true;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setCameraActive(true);
            setCameraLoading(false);
            setCameraError(null);
          })
          .catch((err) => {
            console.warn('Video auto-play warning:', err);
            // Some browsers require explicit user interaction to play
            setCameraActive(true);
            setCameraLoading(false);
          });
      }
    }
  }, [activeStream]);

  // Progressive camera initialization with robust fallback constraints
  const initCamera = useCallback(async () => {
    setCameraLoading(true);
    setCameraError(null);

    // Stop any existing tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setActiveStream(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraActive(false);
      setCameraLoading(false);
      setCameraError('Camera API is not supported in this browser environment.');
      return;
    }

    // Constraint configurations in order of preference
    const constraintSets: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: { ideal: facingMode },
        },
        audio: false,
      },
      {
        video: {
          facingMode: facingMode,
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let acquiredStream: MediaStream | null = null;
    let lastError: any = null;

    for (const constraints of constraintSets) {
      try {
        acquiredStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (acquiredStream) break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (acquiredStream) {
      streamRef.current = acquiredStream;
      setActiveStream(acquiredStream);
      setCameraActive(true);
      setCameraLoading(false);
      setCameraError(null);
    } else {
      setCameraActive(false);
      setCameraLoading(false);
      const isDenied = lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError';
      const errMsg = isDenied
        ? 'Camera permission was not granted. Tap "Allow Camera" or check browser site settings.'
        : lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError'
        ? 'No camera device found. Simulation mode is active.'
        : 'Could not connect to camera stream. Simulation mode is ready.';
      setCameraError(errMsg);
      if (isDenied) {
        setShowPermissionGuide(true);
      }
    }
  }, [facingMode]);

  useEffect(() => {
    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
    };
  }, [initCamera]);

  // Real-time canvas processing loop for AR overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const renderLoop = () => {
      if (!isRunning) return;

      const width = canvas.width || 720;
      const height = canvas.height || 1280;

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

  // Trigger Capture (Photo)
  const capturePhoto = () => {
    playSound('shutter');
    setShutterFlashing(true);
    setTimeout(() => setShutterFlashing(false), 200);

    const isVideoUsable = cameraActive && videoRef.current && videoRef.current.readyState >= 1;
    const mediaEl = isVideoUsable ? videoRef.current : (fallbackImgRef.current && fallbackImgRef.current.naturalWidth > 0 ? fallbackImgRef.current : null);

    // Compute precise uncompressed aspect-ratio geometry matching viewfinder
    const { outWidth, outHeight, srcX, srcY, srcW, srcH } = getCaptureGeometry(containerRef.current, mediaEl);

    // Create snap image canvas with crisp HD dimensions
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = outWidth;
    tempCanvas.height = outHeight;
    const tCtx = tempCanvas.getContext('2d')!;

    // Apply night mode or filter adjustments
    if (nightMode) {
      tCtx.filter = 'brightness(1.3) contrast(1.1)';
    }

    let dataUrl = '';
    try {
      if (isVideoUsable && videoRef.current) {
        if (selectedFilter.canvasFilter) {
          tCtx.filter = selectedFilter.canvasFilter;
        }
        // Flip horizontally if selfie front camera
        if (facingMode === 'user') {
          tCtx.translate(outWidth, 0);
          tCtx.scale(-1, 1);
        }
        // Draw exact center cover crop preserving 100% natural aspect ratio
        tCtx.drawImage(videoRef.current, srcX, srcY, srcW, srcH, 0, 0, outWidth, outHeight);
        tCtx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        // Fallback: draw preloaded simulation scene photo or procedural gradient
        let fallbackDrawn = false;
        if (fallbackImgRef.current && fallbackImgRef.current.complete && fallbackImgRef.current.naturalWidth > 0) {
          try {
            if (selectedFilter.canvasFilter) {
              tCtx.filter = selectedFilter.canvasFilter;
            }
            tCtx.drawImage(fallbackImgRef.current, srcX, srcY, srcW, srcH, 0, 0, outWidth, outHeight);
            tCtx.filter = 'none';
            fallbackDrawn = true;
          } catch (drawErr) {
            console.warn('Fallback img draw issue:', drawErr);
          }
        }

        if (!fallbackDrawn) {
          // Aesthetic vibrant cyber gradient fallback
          const grad = tCtx.createLinearGradient(0, 0, outWidth, outHeight);
          grad.addColorStop(0, '#3b0764');
          grad.addColorStop(0.5, '#4f46e5');
          grad.addColorStop(1, '#090d16');
          tCtx.fillStyle = grad;
          tCtx.fillRect(0, 0, outWidth, outHeight);
        }
      }

      // Overlay AR graphics at high resolution
      if (selectedFilter.overlayType) {
        renderAROverlay(tCtx, outWidth, outHeight, selectedFilter.overlayType, Date.now());
      }

      dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
    } catch (canvasErr) {
      console.warn('Canvas toDataURL security exception, generating procedural clean canvas:', canvasErr);
      // Fail-safe procedural fallback if canvas was tainted by cross-origin resource
      const safeCanvas = document.createElement('canvas');
      safeCanvas.width = outWidth;
      safeCanvas.height = outHeight;
      const sCtx = safeCanvas.getContext('2d')!;
      const sGrad = sCtx.createLinearGradient(0, 0, outWidth, outHeight);
      sGrad.addColorStop(0, '#1e1b4b');
      sGrad.addColorStop(0.5, '#4338ca');
      sGrad.addColorStop(1, '#0f172a');
      sCtx.fillStyle = sGrad;
      sCtx.fillRect(0, 0, outWidth, outHeight);
      if (selectedFilter.overlayType) {
        renderAROverlay(sCtx, outWidth, outHeight, selectedFilter.overlayType, Date.now());
      }
      dataUrl = safeCanvas.toDataURL('image/jpeg', 0.92);
    }

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
      frameMode: 'fill',
    };

    onSnapCaptured(newSnap);
  };

  // Keyboard shortcut to capture (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        capturePhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cameraActive, selectedFilter, facingMode, nightMode]);

  // Handle shutter start (click or hold)
  const handleStartCapture = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }

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
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

    holdTimeoutRef.current = setTimeout(() => {
      if (isHoldingRef.current) {
        startVideoRecording();
      }
    }, 350);
  };

  const handleEndCapture = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (timerDuration > 0) return;

    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

      if (isRecording) {
        stopVideoRecording();
      } else {
        // Quick tap: capture photo immediately
        capturePhoto();
      }
    }
  };

  const startVideoRecording = () => {
    setIsRecording(true);
    playSound('record_start');
    recordStartTimeRef.current = Date.now();
    setRecordProgress(0);

    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);

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
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    playSound('record_stop');

    const isVideoUsable = cameraActive && videoRef.current && videoRef.current.readyState >= 1;
    const mediaEl = isVideoUsable ? videoRef.current : (fallbackImgRef.current && fallbackImgRef.current.naturalWidth > 0 ? fallbackImgRef.current : null);

    const { outWidth, outHeight, srcX, srcY, srcW, srcH } = getCaptureGeometry(containerRef.current, mediaEl);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = outWidth;
    tempCanvas.height = outHeight;
    const tCtx = tempCanvas.getContext('2d')!;

    let dataUrl = '';
    try {
      if (isVideoUsable && videoRef.current) {
        if (facingMode === 'user') {
          tCtx.translate(outWidth, 0);
          tCtx.scale(-1, 1);
        }
        tCtx.drawImage(videoRef.current, srcX, srcY, srcW, srcH, 0, 0, outWidth, outHeight);
        tCtx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        let fallbackDrawn = false;
        if (fallbackImgRef.current && fallbackImgRef.current.complete && fallbackImgRef.current.naturalWidth > 0) {
          try {
            tCtx.drawImage(fallbackImgRef.current, srcX, srcY, srcW, srcH, 0, 0, outWidth, outHeight);
            fallbackDrawn = true;
          } catch (err) {
            console.warn('Video fallback draw err:', err);
          }
        }
        if (!fallbackDrawn) {
          const grad = tCtx.createLinearGradient(0, 0, outWidth, outHeight);
          grad.addColorStop(0, '#312e81');
          grad.addColorStop(1, '#0f172a');
          tCtx.fillStyle = grad;
          tCtx.fillRect(0, 0, outWidth, outHeight);
        }
      }

      if (selectedFilter.overlayType) {
        renderAROverlay(tCtx, outWidth, outHeight, selectedFilter.overlayType, Date.now());
      }

      dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
    } catch (err) {
      console.warn('Video stop toDataURL error:', err);
      const safeCanvas = document.createElement('canvas');
      safeCanvas.width = outWidth;
      safeCanvas.height = outHeight;
      const sCtx = safeCanvas.getContext('2d')!;
      const grad = sCtx.createLinearGradient(0, 0, outWidth, outHeight);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, outWidth, outHeight);
      if (selectedFilter.overlayType) {
        renderAROverlay(sCtx, outWidth, outHeight, selectedFilter.overlayType, Date.now());
      }
      dataUrl = safeCanvas.toDataURL('image/jpeg', 0.92);
    }

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
      frameMode: 'fill',
    };

    onSnapCaptured(newSnap);
  };

  // Flip Front / Back camera
  const toggleCameraFlip = () => {
    playSound('tap');
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Upload photo from device gallery / camera roll
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playSound('pop');
    const isVideo = file.type.startsWith('video');
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;

      // Render through canvas if image to apply filter
      if (!isVideo) {
        const img = new Image();
        img.onload = () => {
          const { outWidth, outHeight, srcX, srcY, srcW, srcH } = getCaptureGeometry(containerRef.current, img);
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = outWidth;
          tempCanvas.height = outHeight;
          const tCtx = tempCanvas.getContext('2d')!;

          if (selectedFilter.canvasFilter) {
            tCtx.filter = selectedFilter.canvasFilter;
          }

          tCtx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outWidth, outHeight);
          tCtx.filter = 'none';

          if (selectedFilter.overlayType) {
            renderAROverlay(tCtx, outWidth, outHeight, selectedFilter.overlayType, Date.now());
          }

          const processedUrl = tempCanvas.toDataURL('image/jpeg', 0.95);

          const snap: CreatedSnap = {
            id: `snap_upload_${Date.now()}`,
            mediaUrl: processedUrl,
            mediaType: 'photo',
            duration: 5,
            timestamp: 'Just now',
            overlays: [],
            drawings: [],
            stickers: [],
            filterId: selectedFilter.id,
            filterName: selectedFilter.name,
            hasAudio: true,
            frameMode: 'fill',
          };
          onSnapCaptured(snap);
        };
        img.src = dataUrl;
      } else {
        const snap: CreatedSnap = {
          id: `snap_upload_${Date.now()}`,
          mediaUrl: dataUrl,
          mediaType: 'video',
          duration: 10,
          timestamp: 'Just now',
          overlays: [],
          drawings: [],
          stickers: [],
          filterId: selectedFilter.id,
          filterName: selectedFilter.name,
          hasAudio: true,
          frameMode: 'fill',
        };
        onSnapCaptured(snap);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-between select-none">
      {/* Hidden File Input for Device Gallery / Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Hidden Preloaded Simulation Scene Image for instant capture rendering */}
      <img
        ref={fallbackImgRef}
        src={SIMULATION_SCENES[selectedSceneIndex].url}
        alt="Camera fallback feed"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        className="hidden"
      />

      {/* Background Live Video / Fallback Feed */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-neutral-950">
        {/* Physical Camera Video Element - Always Mounted for immediate stream attachment */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            facingMode === 'user' ? '-scale-x-100' : ''
          } ${nightMode ? 'brightness-125 contrast-110' : ''} ${
            cameraActive ? 'opacity-100 z-0' : 'opacity-0 -z-10 pointer-events-none'
          }`}
          style={{
            filter: selectedFilter.canvasFilter || undefined,
          }}
        />

        {/* Fallback Simulation Feed when live webcam is inactive or initializing */}
        {!cameraActive && (
          <div className="absolute inset-0 w-full h-full">
            <img
              src={SIMULATION_SCENES[selectedSceneIndex].url}
              alt="Camera Simulation"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-all duration-300 ${
                nightMode ? 'brightness-125 contrast-110' : ''
              }`}
              style={{
                filter: selectedFilter.canvasFilter || undefined,
              }}
            />
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
            <div className="border-r border-b border-white/20"></div>
            <div className="border-r border-b border-white/20"></div>
            <div></div>
          </div>
        )}

        {/* Shutter White Flash Flare Effect */}
        {(flash || shutterFlashing) && (
          <div className="absolute inset-0 bg-white pointer-events-none z-40 animate-out fade-out duration-200" />
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
        {/* Left: Profile Avatar */}
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

        {/* Right: Camera Controls Toolbar */}
        <div className="flex items-center gap-1.5 bg-[#16162a]/70 backdrop-blur-2xl px-2.5 py-1.5 rounded-full border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
          {/* Flip Camera */}
          <button
            id="camera-flip-btn"
            onClick={toggleCameraFlip}
            className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/20 active:scale-90 transition"
            title="Flip Front / Rear Camera"
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
            title="Self-Timer"
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
            title="Composition Grid"
          >
            <Grid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Floating Status & Permission Banner */}
      <div className="relative z-20 px-4 flex flex-col items-center gap-2">
        {cameraActive ? (
          <div className="bg-[#16162a]/80 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-emerald-400/30 text-xs text-white flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-[11px]">Live Camera Active</span>
            <button
              onClick={() => {
                playSound('tap');
                setCameraActive(false);
              }}
              className="text-[10px] text-white/60 hover:text-white underline pl-1"
            >
              Simulate
            </button>
          </div>
        ) : (
          <div className="bg-[#16162a]/90 backdrop-blur-2xl px-4 py-2.5 rounded-2xl border border-yellow-400/30 text-xs text-white flex flex-col sm:flex-row items-center gap-2.5 shadow-2xl max-w-md text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse flex-shrink-0"></span>
              <span className="text-[11px] text-white/90">
                {cameraError || 'Simulation camera mode is active.'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="camera-retry-btn"
                onClick={() => {
                  playSound('pop');
                  initCamera();
                }}
                className="bg-yellow-400 hover:bg-yellow-300 text-black text-[11px] font-extrabold px-3 py-1 rounded-full active:scale-95 transition shadow-sm"
              >
                Enable Camera
              </button>
              <button
                onClick={() => {
                  playSound('tap');
                  setSelectedSceneIndex((prev) => (prev + 1) % SIMULATION_SCENES.length);
                }}
                className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/15 active:scale-95 transition"
              >
                Scene: {SIMULATION_SCENES[selectedSceneIndex].name}
              </button>
            </div>
          </div>
        )}

        {/* Center Filter Badge Notice */}
        {selectedFilter.id !== 'normal' && (
          <div className="bg-white/[0.15] backdrop-blur-2xl px-4 py-1 rounded-full border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md animate-in fade-in">
            <span>{selectedFilter.icon}</span>
            <span>{selectedFilter.name}</span>
          </div>
        )}
      </div>

      {/* Bottom Controls: AR Filter Carousel & Shutter Button */}
      <div className="relative z-20 pb-4 flex flex-col items-center gap-3">
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

        {/* Shutter Capture Bar */}
        <div className="flex items-center justify-between w-full px-8 max-w-sm">
          {/* Gallery / Upload Button */}
          <button
            id="camera-upload-gallery-btn"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-2xl bg-[#16162a]/80 backdrop-blur-xl border border-white/20 flex flex-col items-center justify-center text-white/90 hover:text-white hover:bg-white/20 active:scale-95 transition shadow-lg"
            title="Upload from Device / Gallery"
          >
            <ImageIcon className="w-5 h-5 text-yellow-300" />
            <span className="text-[9px] font-bold text-white/70 leading-none mt-0.5">Roll</span>
          </button>

          {/* Shutter Button */}
          <div className="relative flex items-center justify-center">
            {/* Circular Progress Ring for Video Recording */}
            {isRecording && (
              <svg className="absolute -inset-3 w-[104px] h-[104px] -rotate-90 pointer-events-none">
                <circle
                  cx="52"
                  cy="52"
                  r="45"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="52"
                  cy="52"
                  r="45"
                  stroke="#ef4444"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * recordProgress) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-100"
                />
              </svg>
            )}

            {/* Main Shutter Button with Click & Long-Press Handlers */}
            <button
              id="shutter-capture-button"
              onMouseDown={handleStartCapture}
              onMouseUp={handleEndCapture}
              onTouchStart={handleStartCapture}
              onTouchEnd={handleEndCapture}
              onClick={(e) => {
                e.stopPropagation();
                // Fallback for devices or synthetic clicks where mouseUp didn't trigger hold
                if (!isRecording && !isHoldingRef.current) {
                  capturePhoto();
                }
              }}
              className={`relative rounded-full transition-all duration-150 transform active:scale-95 flex items-center justify-center shadow-[0_0_32px_rgba(0,0,0,0.5)] touch-manipulation cursor-pointer ${
                isRecording
                  ? 'w-20 h-20 bg-red-500 ring-4 ring-white/60 animate-pulse'
                  : 'w-20 h-20 bg-transparent ring-4 ring-white/90 hover:ring-white'
              }`}
              title="Tap to take photo, hold for video"
            >
              <div
                className={`rounded-full transition-all duration-200 ${
                  isRecording ? 'w-8 h-8 rounded-md bg-white shadow-md' : 'w-16 h-16 bg-white/95 hover:bg-white shadow-lg'
                }`}
              />
            </button>
          </div>

          {/* Scene / Camera Switch Button */}
          <button
            onClick={() => {
              playSound('tap');
              if (cameraActive) {
                toggleCameraFlip();
              } else {
                setSelectedSceneIndex((prev) => (prev + 1) % SIMULATION_SCENES.length);
              }
            }}
            className="w-12 h-12 rounded-2xl bg-[#16162a]/80 backdrop-blur-xl border border-white/20 flex flex-col items-center justify-center text-white/90 hover:text-white hover:bg-white/20 active:scale-95 transition shadow-lg"
            title={cameraActive ? "Flip Camera" : "Switch Scene"}
          >
            <RefreshCw className="w-5 h-5 text-yellow-300" />
            <span className="text-[9px] font-bold text-white/70 leading-none mt-0.5">
              {cameraActive ? 'Flip' : 'Scene'}
            </span>
          </button>
        </div>

        {/* Helper Hint */}
        <p className="text-[11px] font-medium text-white/70 tracking-tight">
          {isRecording ? 'Recording video... release to finish' : 'Tap for photo • Hold for video • Spacebar'}
        </p>
      </div>

      {/* Camera Permission Guide Modal */}
      {showPermissionGuide && !cameraActive && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#18182e] border border-yellow-400/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-300 mb-4 shadow-inner">
              <Camera className="w-7 h-7" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1 font-['Syne']">
              Allow Camera Access
            </h3>
            
            <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
              SnapClone uses your camera to capture live photos, videos, and interactive AR face filters.
            </p>

            <div className="w-full bg-white/5 rounded-2xl p-3.5 mb-5 text-left border border-white/10 text-[11px] space-y-2 text-neutral-300">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-yellow-400/20 text-yellow-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>
                <span>Tap <strong>"Allow Camera"</strong> below and choose <strong>"Allow"</strong> when prompted.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-yellow-400/20 text-yellow-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>
                <span>If blocked in browser: tap the 🔒 icon in the address bar &gt; set <strong>Camera: Allow</strong> &gt; Reload.</span>
              </div>
            </div>

            <div className="flex flex-col w-full gap-2.5">
              <button
                onClick={() => {
                  playSound('pop');
                  setShowPermissionGuide(false);
                  initCamera();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-sm transition active:scale-95 shadow-lg flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Allow Camera
              </button>

              <button
                onClick={() => {
                  playSound('tap');
                  setShowPermissionGuide(false);
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white/80 text-xs font-semibold transition active:scale-95 border border-white/10"
              >
                Use Simulation Mode Instead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


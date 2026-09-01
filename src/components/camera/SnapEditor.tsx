import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Type,
  PenTool,
  Smile,
  Clock,
  Volume2,
  VolumeX,
  Download,
  Send,
  RotateCcw,
  Sparkles,
  Check,
  Trash2,
  Flame,
  MapPin,
  Thermometer,
} from 'lucide-react';
import { CreatedSnap, OverlayText, DrawingPath, DrawingPoint, StickerItem } from '../../types';
import { playSound } from '../../utils/audioEffects';

interface SnapEditorProps {
  snap: CreatedSnap;
  onCancel: () => void;
  onSendSnap: (snap: CreatedSnap, recipients: string[], postToStory: boolean) => void;
}

const BRUSH_COLORS = [
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#000000',
];

const STICKER_LIBRARY: { emoji: string; label?: string; type: StickerItem['type'] }[] = [
  { emoji: '🔥', label: 'STREAK', type: 'streak_badge' },
  { emoji: '📍', label: 'Santa Monica, CA', type: 'geotag' },
  { emoji: '☀️', label: '78°F Sunny', type: 'temp' },
  { emoji: '⏰', label: '11:42 PM', type: 'time' },
  { emoji: '😍', type: 'emoji' },
  { emoji: '✨', type: 'emoji' },
  { emoji: '🚀', type: 'emoji' },
  { emoji: '🍕', type: 'emoji' },
  { emoji: '🥳', type: 'emoji' },
  { emoji: '💀', type: 'emoji' },
  { emoji: '💯', type: 'emoji' },
  { emoji: '💖', type: 'emoji' },
  { emoji: '🤙', type: 'emoji' },
  { emoji: '🌈', type: 'emoji' },
  { emoji: '👀', type: 'emoji' },
  { emoji: '🎧', type: 'emoji' },
];

export const SnapEditor: React.FC<SnapEditorProps> = ({ snap, onCancel, onSendSnap }) => {
  const [overlays, setOverlays] = useState<OverlayText[]>(snap.overlays || []);
  const [drawings, setDrawings] = useState<DrawingPath[]>(snap.drawings || []);
  const [stickers, setStickers] = useState<StickerItem[]>(snap.stickers || []);
  const [duration, setDuration] = useState<number>(snap.duration || 5);
  const [hasAudio, setHasAudio] = useState<boolean>(snap.hasAudio ?? true);

  // Tool Modes
  const [activeTool, setActiveTool] = useState<'none' | 'draw' | 'text' | 'stickers' | 'duration' | 'send'>('none');

  // Drawing state
  const [brushColor, setBrushColor] = useState<string>('#ef4444');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [isGlowBrush, setIsGlowBrush] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);

  // Text state
  const [inputText, setInputText] = useState<string>('');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [textStyle, setTextStyle] = useState<OverlayText['bgStyle']>('banner');
  const [textFont, setTextFont] = useState<OverlayText['fontFamily']>('sans');

  // Send Drawer state
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['chloe']);
  const [postToStory, setPostToStory] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Redraw canvas with background media + drawings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed paths
    drawings.forEach((path) => {
      if (path.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (path.isGlow) {
        ctx.shadowColor = path.color;
        ctx.shadowBlur = 12;
      }

      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });

    // Draw active drawing path
    if (currentPath.length >= 2) {
      ctx.save();
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (isGlowBrush) {
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [drawings, currentPath, brushColor, brushSize, isGlowBrush]);

  // Drawing event handlers
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const handleMoveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    setCurrentPath((prev) => [...prev, { x, y }]);
  };

  const handleEndDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      setDrawings((prev) => [
        ...prev,
        {
          id: `draw_${Date.now()}`,
          points: currentPath,
          color: brushColor,
          brushSize: brushSize,
          isGlow: isGlowBrush,
        },
      ]);
    }
    setCurrentPath([]);
  };

  const handleUndoDrawing = () => {
    playSound('tap');
    setDrawings((prev) => prev.slice(0, -1));
  };

  // Add Text Overlay
  const handleAddText = () => {
    if (!inputText.trim()) {
      setActiveTool('none');
      return;
    }
    playSound('pop');

    const newOverlay: OverlayText = {
      id: `text_${Date.now()}`,
      text: inputText,
      x: 50,
      y: 50,
      fontSize: 20,
      color: textColor,
      bgStyle: textStyle,
      fontFamily: textFont,
      rotation: 0,
    };

    setOverlays((prev) => [...prev, newOverlay]);
    setInputText('');
    setActiveTool('none');
  };

  // Add Sticker
  const handleAddSticker = (item: { emoji: string; label?: string; type: StickerItem['type'] }) => {
    playSound('pop');
    const newSticker: StickerItem = {
      id: `sticker_${Date.now()}`,
      emojiOrUrl: item.emoji,
      isEmoji: true,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      type: item.type,
      label: item.label,
    };

    setStickers((prev) => [...prev, newSticker]);
    setActiveTool('none');
  };

  // Download snap merged with drawing & stickers
  const handleSaveToDevice = () => {
    playSound('pop');
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d')!;

    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.src = snap.mediaUrl;
    baseImg.onload = () => {
      ctx.drawImage(baseImg, 0, 0, 720, 1280);

      // Draw all paths
      drawings.forEach((path) => {
        if (path.points.length < 2) return;
        ctx.save();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (path.isGlow) {
          ctx.shadowColor = path.color;
          ctx.shadowBlur = 12;
        }
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
      });

      // Draw overlays
      overlays.forEach((o) => {
        ctx.save();
        const px = (o.x / 100) * 720;
        const py = (o.y / 100) * 1280;
        ctx.translate(px, py);
        ctx.rotate((o.rotation * Math.PI) / 180);

        ctx.font = `bold ${o.fontSize * 1.5}px ${o.fontFamily === 'syne' ? 'Syne' : 'sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (o.bgStyle === 'banner') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(-300, -26, 600, 52);
        } else if (o.bgStyle === 'pill') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.beginPath();
          ctx.roundRect(-150, -22, 300, 44, 22);
          ctx.fill();
        }

        ctx.fillStyle = o.color;
        ctx.fillText(o.text, 0, 0);
        ctx.restore();
      });

      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/jpeg', 0.95);
      a.download = `SnapClone_${Date.now()}.jpg`;
      a.click();
    };
  };

  const handleFinalSend = () => {
    playSound('pop');
    const updatedSnap: CreatedSnap = {
      ...snap,
      overlays,
      drawings,
      stickers,
      duration,
      hasAudio,
    };

    onSendSnap(updatedSnap, selectedRecipients, postToStory);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-between select-none">
      {/* Background Captured Media */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src={snap.mediaUrl}
          alt="Captured Snap"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />

        {/* Freehand Drawing Overlay Canvas */}
        <canvas
          ref={canvasRef}
          width={720}
          height={1280}
          onMouseDown={handleStartDraw}
          onMouseMove={handleMoveDraw}
          onMouseUp={handleEndDraw}
          onTouchStart={handleStartDraw}
          onTouchMove={handleMoveDraw}
          onTouchEnd={handleEndDraw}
          className={`absolute inset-0 w-full h-full ${
            activeTool === 'draw' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
          }`}
        />

        {/* Rendered Text Overlays */}
        {overlays.map((o) => (
          <div
            key={o.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move pointer-events-auto"
            style={{
              left: `${o.x}%`,
              top: `${o.y}%`,
              transform: `translate(-50%, -50%) rotate(${o.rotation}deg)`,
            }}
          >
            <div
              className={`px-4 py-2 text-center transition-all ${
                o.bgStyle === 'banner'
                  ? 'bg-black/70 backdrop-blur-xs w-screen max-w-full font-bold shadow-lg'
                  : o.bgStyle === 'pill'
                  ? 'bg-black/85 backdrop-blur-md rounded-full shadow-2xl px-5 py-2 font-bold border border-white/20'
                  : o.bgStyle === 'neon'
                  ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-300 rounded-xl px-4 py-2 shadow-[0_0_15px_rgba(6,182,212,0.6)] font-bold'
                  : o.bgStyle === 'rainbow'
                  ? 'bg-gradient-to-r from-red-500 via-amber-500 to-indigo-500 rounded-full px-5 py-2 font-bold text-white shadow-xl'
                  : 'font-extrabold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
              }`}
              style={{
                color: o.color,
                fontSize: `${o.fontSize}px`,
                fontFamily: o.fontFamily === 'syne' ? 'Syne, sans-serif' : o.fontFamily === 'marker' ? 'Permanent Marker, cursive' : 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {o.text}
            </div>
          </div>
        ))}

        {/* Rendered Stickers */}
        {stickers.map((s) => (
          <div
            key={s.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move pointer-events-auto select-none"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotation}deg)`,
            }}
          >
            {s.label ? (
              <div className="bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-2 text-white font-bold text-sm shadow-xl">
                <span>{s.emojiOrUrl}</span>
                <span>{s.label}</span>
              </div>
            ) : (
              <div className="text-5xl filter drop-shadow-lg transform active:scale-110 transition">{s.emojiOrUrl}</div>
            )}
          </div>
        ))}
      </div>

      {/* Top Action Bar */}
      <div className="relative z-30 pt-4 px-4 flex items-center justify-between">
        {/* Close / Discard */}
        <button
          id="editor-cancel-btn"
          onClick={() => {
            playSound('tap');
            onCancel();
          }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white/90 hover:text-white border border-white/20 active:scale-90 transition shadow-lg"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Creative Toolbar (Text, Pen, Sticker, Duration, Audio) */}
        <div className="flex flex-col items-center gap-3 bg-[#16162a]/70 backdrop-blur-2xl p-1.5 rounded-full border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Text Overlay */}
          <button
            id="editor-text-tool-btn"
            onClick={() => {
              playSound('tap');
              setActiveTool(activeTool === 'text' ? 'none' : 'text');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
              activeTool === 'text' ? 'bg-yellow-400 text-black font-black shadow-[0_0_12px_rgba(250,204,21,0.5)]' : 'text-white/90 hover:bg-white/15'
            }`}
            title="Add Text"
          >
            <Type className="w-5 h-5" />
          </button>

          {/* Drawing Pen */}
          <button
            id="editor-draw-tool-btn"
            onClick={() => {
              playSound('tap');
              setActiveTool(activeTool === 'draw' ? 'none' : 'draw');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
              activeTool === 'draw' ? 'bg-yellow-400 text-black font-black shadow-[0_0_12px_rgba(250,204,21,0.5)]' : 'text-white/90 hover:bg-white/15'
            }`}
            title="Draw"
          >
            <PenTool className="w-5 h-5" />
          </button>

          {/* Stickers */}
          <button
            id="editor-sticker-tool-btn"
            onClick={() => {
              playSound('tap');
              setActiveTool(activeTool === 'stickers' ? 'none' : 'stickers');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
              activeTool === 'stickers' ? 'bg-yellow-400 text-black font-black shadow-[0_0_12px_rgba(250,204,21,0.5)]' : 'text-white/90 hover:bg-white/15'
            }`}
            title="Stickers"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Duration Selector */}
          <button
            id="editor-duration-btn"
            onClick={() => {
              playSound('tap');
              setActiveTool(activeTool === 'duration' ? 'none' : 'duration');
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
              activeTool === 'duration' ? 'bg-yellow-400 text-black font-bold shadow-[0_0_12px_rgba(250,204,21,0.5)]' : 'text-white/90 hover:bg-white/15'
            }`}
            title="View Duration"
          >
            <Clock className="w-5 h-5" />
          </button>

          {/* Audio Toggle */}
          <button
            id="editor-audio-btn"
            onClick={() => {
              playSound('tap');
              setHasAudio(!hasAudio);
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15 transition"
            title="Audio Toggle"
          >
            {hasAudio ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-400" />}
          </button>
        </div>
      </div>

      {/* Floating Modal: Drawing Controls */}
      {activeTool === 'draw' && (
        <div className="relative z-30 self-center bg-[#16162a]/85 backdrop-blur-2xl p-3.5 rounded-3xl border border-white/20 flex flex-col gap-3 shadow-[0_16px_48px_rgba(0,0,0,0.6)] max-w-xs animate-in fade-in">
          {/* Color Palette */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {BRUSH_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setBrushColor(c)}
                className={`w-7 h-7 rounded-full flex-shrink-0 transition-transform ${
                  brushColor === c ? 'scale-125 ring-2 ring-white shadow-lg' : 'opacity-80'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/15">
            {/* Glow Brush Toggle */}
            <button
              onClick={() => setIsGlowBrush(!isGlowBrush)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                isGlowBrush ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-white/10 text-white/60 border border-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Neon Glow
            </button>

            {/* Brush Size Slider */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[10px] text-white/60">Size</span>
              <input
                type="range"
                min="2"
                max="24"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-yellow-400 h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>

            {/* Undo */}
            <button
              onClick={handleUndoDrawing}
              disabled={drawings.length === 0}
              className="p-1.5 rounded-xl bg-white/10 text-white/90 hover:bg-white/20 disabled:opacity-30 active:scale-95 transition border border-white/10"
              title="Undo Stroke"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Modal: Text Overlay Editor */}
      {activeTool === 'text' && (
        <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-2xl flex flex-col justify-between p-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTool('none')}
              className="text-sm font-semibold text-white/70 hover:text-white"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2 bg-[#16162a]/80 backdrop-blur-xl px-3 py-1 rounded-full border border-white/20 shadow-md">
              <button
                onClick={() => setTextStyle('banner')}
                className={`text-xs px-2.5 py-1 rounded-full font-bold transition ${
                  textStyle === 'banner' ? 'bg-white text-black shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                Banner
              </button>
              <button
                onClick={() => setTextStyle('pill')}
                className={`text-xs px-2.5 py-1 rounded-full font-bold transition ${
                  textStyle === 'pill' ? 'bg-white text-black shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                Pill
              </button>
              <button
                onClick={() => setTextStyle('neon')}
                className={`text-xs px-2.5 py-1 rounded-full font-bold transition ${
                  textStyle === 'neon' ? 'bg-cyan-400 text-black shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                Neon
              </button>
              <button
                onClick={() => setTextStyle('rainbow')}
                className={`text-xs px-2.5 py-1 rounded-full font-bold transition ${
                  textStyle === 'rainbow' ? 'bg-gradient-to-r from-red-400 to-indigo-400 text-white shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                Rainbow
              </button>
            </div>
            <button
              onClick={handleAddText}
              className="bg-yellow-400 text-black font-extrabold text-xs px-4 py-1.5 rounded-full shadow-[0_0_12px_rgba(250,204,21,0.5)]"
            >
              Done
            </button>
          </div>

          <div className="w-full flex items-center justify-center">
            <input
              type="text"
              autoFocus
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
              placeholder="Add a caption..."
              className="w-full bg-[#16162a]/70 backdrop-blur-2xl text-center text-2xl font-black text-white placeholder-white/40 outline-none py-3 px-4 rounded-2xl border border-white/20 shadow-2xl"
            />
          </div>

          {/* Color Slider */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
            {BRUSH_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setTextColor(c)}
                className={`w-7 h-7 rounded-full ${textColor === c ? 'ring-2 ring-white scale-115 shadow-md' : 'opacity-80'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating Modal: Stickers Drawer */}
      {activeTool === 'stickers' && (
        <div className="absolute inset-x-0 bottom-0 z-40 bg-[#16162a]/90 backdrop-blur-3xl rounded-t-3xl border-t border-white/20 p-5 flex flex-col gap-4 max-h-[60%] overflow-y-auto shadow-[0_-16px_48px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between pb-2 border-b border-white/15">
            <h3 className="font-extrabold text-base text-white tracking-wide font-['Syne']">Stickers & Badges</h3>
            <button
              onClick={() => setActiveTool('none')}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 border border-white/15 backdrop-blur-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {STICKER_LIBRARY.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleAddSticker(item)}
                className="bg-white/[0.06] hover:bg-white/[0.12] p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition active:scale-95 border border-white/10 backdrop-blur-md shadow-sm"
              >
                <span className="text-3xl">{item.emoji}</span>
                {item.label && <span className="text-[10px] font-bold text-white/70 truncate w-full text-center">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Modal: Duration Picker */}
      {activeTool === 'duration' && (
        <div className="relative z-30 self-center bg-[#16162a]/85 backdrop-blur-2xl p-3 rounded-2xl border border-white/20 flex items-center gap-2 shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in fade-in">
          <span className="text-xs font-bold text-white/60 pl-1">Duration:</span>
          {[1, 2, 3, 5, 10, 999].map((sec) => (
            <button
              key={sec}
              onClick={() => {
                playSound('tap');
                setDuration(sec);
                setActiveTool('none');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black transition ${
                duration === sec ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)] scale-105' : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
              }`}
            >
              {sec === 999 ? '∞' : `${sec}s`}
            </button>
          ))}
        </div>
      )}

      {/* Send To Drawer Modal */}
      {activeTool === 'send' && (
        <div className="absolute inset-0 z-50 bg-[#16162a]/95 backdrop-blur-3xl p-6 flex flex-col justify-between animate-in slide-in-from-bottom">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <h2 className="text-xl font-black text-white font-['Syne']">Send To...</h2>
              <button
                onClick={() => setActiveTool('none')}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 border border-white/15 backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* My Story Toggle */}
            <div
              onClick={() => setPostToStory(!postToStory)}
              className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition backdrop-blur-xl ${
                postToStory
                  ? 'bg-indigo-500/25 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.35)]'
                  : 'bg-white/[0.06] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full ring-2 ring-indigo-400 flex items-center justify-center bg-indigo-600 text-white font-black text-lg shadow-md">
                  +
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">My Story (24h)</h4>
                  <p className="text-xs text-white/60">Share with all your friends for 24 hours</p>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                  postToStory ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/30'
                }`}
              >
                {postToStory && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* Friends Selection List */}
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mt-2">Best Friends & Streaks</h4>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {[
                { id: 'chloe', name: 'Casual Chloe', username: 'chloe_vibe', streak: 42, emoji: '💛' },
                { id: 'caleb', name: 'Creator Caleb', username: 'caleb_creates', streak: 18, emoji: '💖' },
                { id: 'priya', name: 'Private Priya', username: 'priya_p', streak: 7, emoji: '⚡' },
                { id: 'marcus', name: 'Marcus Miller', username: 'marcus_m', streak: 29, emoji: '⏳' },
                { id: 'maya', name: 'Maya Chen', username: 'maya_c', streak: 11 },
                { id: 'liam', name: 'Liam Walker', username: 'liam_w', streak: 3 },
              ].map((f) => {
                const isSelected = selectedRecipients.includes(f.id);
                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      playSound('tap');
                      if (isSelected) {
                        setSelectedRecipients(selectedRecipients.filter((id) => id !== f.id));
                      } else {
                        setSelectedRecipients([...selectedRecipients, f.id]);
                      }
                    }}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition backdrop-blur-xl ${
                      isSelected
                        ? 'bg-yellow-400/20 border-yellow-400/80 shadow-[0_0_15px_rgba(250,204,21,0.25)]'
                        : 'bg-white/[0.06] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 font-bold text-yellow-300 flex items-center justify-center border border-white/15">
                        {f.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-white text-sm">{f.name}</h4>
                          {f.emoji && <span className="text-xs">{f.emoji}</span>}
                          {f.streak > 0 && (
                            <span className="text-xs font-black text-orange-300 flex items-center gap-0.5">
                              <Flame className="w-3.5 h-3.5 fill-orange-500 inline" />
                              {f.streak}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50">@{f.username}</p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                        isSelected ? 'bg-yellow-400 border-yellow-400 text-black' : 'border-white/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Send Confirmation Button */}
          <button
            id="editor-confirm-send-btn"
            disabled={selectedRecipients.length === 0 && !postToStory}
            onClick={handleFinalSend}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-98 transition text-base tracking-wide font-['Syne']"
          >
            <span>Send Snap</span>
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Bottom Floating Bar (Save to Device, Story shortcut, Send To Button) */}
      <div className="relative z-30 pb-4 px-4 flex items-center justify-between">
        {/* Left: Save to Device */}
        <button
          id="editor-save-btn"
          onClick={handleSaveToDevice}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[#16162a]/70 backdrop-blur-2xl border border-white/20 text-white/90 hover:text-white font-semibold text-xs active:scale-95 transition shadow-lg"
        >
          <Download className="w-4 h-4" />
          <span>Save</span>
        </button>

        {/* Center: Duration indicator */}
        <div className="text-[11px] font-bold text-white/70 bg-[#16162a]/70 backdrop-blur-2xl px-3 py-1.5 rounded-full border border-white/15 shadow-md">
          Duration: {duration === 999 ? '∞' : `${duration}s`}
        </div>

        {/* Right: Send To Button */}
        <button
          id="editor-send-to-btn"
          onClick={() => {
            playSound('tap');
            setActiveTool('send');
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-sm shadow-[0_0_20px_rgba(250,204,21,0.5)] active:scale-95 transition font-['Syne']"
        >
          <span>Send To</span>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

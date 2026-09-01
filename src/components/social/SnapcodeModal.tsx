import React, { useState } from 'react';
import { X, QrCode, Download, Share2, Scan, Check, Sparkles } from 'lucide-react';
import { User } from '../../types';
import { playSound } from '../../utils/audioEffects';

interface SnapcodeModalProps {
  user: User;
  onClose: () => void;
  onScanFriendSnapcode: (username: string) => void;
}

export const SnapcodeModal: React.FC<SnapcodeModalProps> = ({
  user,
  onClose,
  onScanFriendSnapcode,
}) => {
  const [activeTab, setActiveTab] = useState<'my_code' | 'scan'>('my_code');
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  const handleSimulateScan = (friendUsername: string) => {
    playSound('pop');
    setScannedResult(friendUsername);
    setTimeout(() => {
      onScanFriendSnapcode(friendUsername);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-3xl flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="w-full max-w-sm bg-[#16162a]/85 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 flex flex-col items-center gap-5 shadow-[0_24px_64px_rgba(0,0,0,0.6)] relative">
        {/* Close */}
        <button
          onClick={() => {
            playSound('tap');
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white border border-white/15 transition backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/15 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('my_code')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === 'my_code' ? 'bg-yellow-400 text-black shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            My Snapcode
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeTab === 'scan' ? 'bg-yellow-400 text-black shadow' : 'text-white/60 hover:text-white'
            }`}
          >
            Scan Snapcode
          </button>
        </div>

        {activeTab === 'my_code' ? (
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Scannable Snapcode Card */}
            <div className="relative w-52 h-52 bg-yellow-400 rounded-3xl p-4 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.4)] border-4 border-black/90">
              {/* Snapcode Dot Matrix Pattern */}
              <div className="absolute inset-2 border-2 border-dashed border-black/30 rounded-2xl pointer-events-none" />

              {/* Center User Avatar */}
              <div className="relative z-10 w-24 h-24 rounded-full ring-4 ring-black overflow-hidden bg-black shadow-lg">
                <img
                  src={user.avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Ghost icon & Username */}
              <div className="relative z-10 mt-2 text-center">
                <h3 className="font-black text-black text-sm tracking-wide leading-none">{user.name}</h3>
                <p className="text-black/80 font-bold text-[11px]">@{user.username}</p>
              </div>
            </div>

            {/* User Details */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-yellow-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Snap Score: {user.snapScore.toLocaleString()}</span>
              </div>
              <p className="text-xs text-white/60 mt-1">Friends can scan your code to add you instantly</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => playSound('pop')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 border border-white/15 active:scale-95 transition backdrop-blur-md shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Save to Roll</span>
              </button>
              <button
                onClick={() => playSound('pop')}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(250,204,21,0.4)] active:scale-95 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Code</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Camera Viewfinder Simulator */}
            <div className="relative w-52 h-52 bg-black/60 rounded-3xl overflow-hidden border-2 border-yellow-400/80 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md">
              <div className="absolute inset-4 border border-dashed border-white/40 rounded-2xl flex items-center justify-center">
                <Scan className="w-12 h-12 text-yellow-300 animate-pulse" />
              </div>
              {scannedResult && (
                <div className="absolute inset-0 bg-yellow-400 text-black flex flex-col items-center justify-center font-black animate-in fade-in p-4 text-center">
                  <Check className="w-8 h-8 mb-1" />
                  <span>Found @{scannedResult}!</span>
                  <span className="text-xs font-normal">Adding friend...</span>
                </div>
              )}
            </div>

            <p className="text-xs text-white/60 text-center">
              Point camera at any friend’s Snapcode to scan
            </p>

            {/* Quick Demo Scan Buttons */}
            <div className="w-full flex flex-col gap-2">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider text-center">
                Try Sample Snapcodes:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSimulateScan('chloe_vibe')}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-2xl text-xs text-white font-bold flex items-center justify-center gap-1 border border-white/15 transition backdrop-blur-md shadow-sm"
                >
                  <span>@chloe_vibe</span>
                </button>
                <button
                  onClick={() => handleSimulateScan('caleb_creates')}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-2xl text-xs text-white font-bold flex items-center justify-center gap-1 border border-white/15 transition backdrop-blur-md shadow-sm"
                >
                  <span>@caleb_creates</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

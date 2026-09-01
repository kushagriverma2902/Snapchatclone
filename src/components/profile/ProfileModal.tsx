import React, { useState } from 'react';
import {
  X,
  Shield,
  Lock,
  Eye,
  Camera,
  Check,
  Smartphone,
  Maximize2,
  Calendar,
  Sparkles,
  QrCode,
  Bell,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { User, PrivacySettings } from '../../types';
import { playSound } from '../../utils/audioEffects';

interface ProfileModalProps {
  user: User;
  privacy: PrivacySettings;
  isMobileChassis: boolean;
  onToggleChassis: () => void;
  onUpdatePrivacy: (privacy: PrivacySettings) => void;
  onOpenSnapcode: () => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  privacy,
  isMobileChassis,
  onToggleChassis,
  onUpdatePrivacy,
  onOpenSnapcode,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'safety'>('profile');
  const [currentPrivacy, setCurrentPrivacy] = useState<PrivacySettings>(privacy);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleToggleSetting = (key: keyof PrivacySettings, value: any) => {
    playSound('tap');
    const updated = { ...currentPrivacy, [key]: value };
    setCurrentPrivacy(updated);
    onUpdatePrivacy(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-3xl flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="w-full max-w-md bg-[#16162a]/85 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 flex flex-col gap-5 shadow-[0_24px_64px_rgba(0,0,0,0.6)] relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          id="close-profile-modal-btn"
          onClick={() => {
            playSound('tap');
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white border border-white/15 transition backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Avatar & Header */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)]"
            />
            <button
              onClick={() => {
                playSound('tap');
                onOpenSnapcode();
              }}
              className="absolute -bottom-1 -right-1 bg-yellow-400 text-black p-1.5 rounded-full ring-2 ring-[#121222] shadow-md hover:scale-105 transition"
              title="View Snapcode"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-black text-white font-['Syne']">{user.name}</h2>
            <p className="text-xs text-white/60">@{user.username} • ♈ Gemini</p>
          </div>

          {/* Snap Score Pill */}
          <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/15 shadow backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-xs font-black text-white">Snap Score: {user.snapScore.toLocaleString()}</span>
            <span className="text-[10px] text-yellow-300 font-bold">🔥 42 Streaks</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-around border-b border-white/15 pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`text-xs font-extrabold pb-1 transition ${
              activeTab === 'profile'
                ? 'text-yellow-300 border-b-2 border-yellow-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`text-xs font-extrabold pb-1 transition ${
              activeTab === 'privacy'
                ? 'text-yellow-300 border-b-2 border-yellow-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Privacy Controls
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`text-xs font-extrabold pb-1 transition ${
              activeTab === 'safety'
                ? 'text-yellow-300 border-b-2 border-yellow-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Safety & Compliance
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'profile' && (
          <div className="flex flex-col gap-4">
            {/* Display Simulator Mode Toggle */}
            <div className="bg-white/[0.07] backdrop-blur-xl border border-white/15 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-yellow-300 border border-white/15">
                  {isMobileChassis ? <Smartphone className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Device Frame Simulator</h4>
                  <p className="text-[10px] text-white/50">
                    {isMobileChassis ? 'Showing mobile smartphone frame' : 'Showing fullscreen viewport'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playSound('tap');
                  onToggleChassis();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  isMobileChassis ? 'bg-yellow-400 text-black shadow' : 'bg-white/10 text-white/80 border border-white/15'
                }`}
              >
                {isMobileChassis ? 'Mobile' : 'Fullscreen'}
              </button>
            </div>

            {/* Birthday / Age Verification Badge */}
            <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">Birthday & Age Verification</h4>
                  <p className="text-[10px] text-white/50">June 15, 2004 • 13+ Verified</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold backdrop-blur-md">
                ✓ Verified
              </span>
            </div>

            {/* Quick Snapcode Action */}
            <button
              onClick={() => {
                playSound('tap');
                onOpenSnapcode();
              }}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-95 transition font-['Syne']"
            >
              <QrCode className="w-4 h-4" />
              <span>Show My Snapcode</span>
            </button>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="flex flex-col gap-3">
            {/* Who Can Send Me Snaps */}
            <div className="bg-white/[0.07] backdrop-blur-xl border border-white/15 p-3.5 rounded-2xl flex flex-col gap-2 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs">Who Can Send Me Snaps</h4>
                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => handleToggleSetting('whoCanSendSnaps', 'everyone')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      currentPrivacy.whoCanSendSnaps === 'everyone' ? 'bg-yellow-400 text-black shadow' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Everyone
                  </button>
                  <button
                    onClick={() => handleToggleSetting('whoCanSendSnaps', 'friends')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      currentPrivacy.whoCanSendSnaps === 'friends' ? 'bg-yellow-400 text-black shadow' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Friends Only
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-white/50">Controls who can send direct disappearing snaps and chats</p>
            </div>

            {/* Who Can View My Story */}
            <div className="bg-white/[0.07] backdrop-blur-xl border border-white/15 p-3.5 rounded-2xl flex flex-col gap-2 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs">Who Can View My Story</h4>
                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => handleToggleSetting('whoCanViewStory', 'everyone')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      currentPrivacy.whoCanViewStory === 'everyone' ? 'bg-yellow-400 text-black shadow' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Everyone
                  </button>
                  <button
                    onClick={() => handleToggleSetting('whoCanViewStory', 'friends')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      currentPrivacy.whoCanViewStory === 'friends' ? 'bg-yellow-400 text-black shadow' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Friends
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-white/50">Manage visibility for 24-hour story segments</p>
            </div>

            {/* Screenshot Notification Alert Toggle */}
            <div className="bg-white/[0.07] backdrop-blur-xl border border-white/15 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <h4 className="font-bold text-white text-xs">Screenshot & Record Alerts</h4>
                <p className="text-[10px] text-white/50">Instant notification when someone captures your snap</p>
              </div>
              <button
                onClick={() => handleToggleSetting('screenshotAlertsEnabled', !currentPrivacy.screenshotAlertsEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border border-white/20 ${
                  currentPrivacy.screenshotAlertsEnabled ? 'bg-yellow-400' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    currentPrivacy.screenshotAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="flex flex-col gap-3">
            <div className="bg-indigo-500/20 border border-indigo-400/30 p-4 rounded-2xl flex flex-col gap-2 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xs">
                <Shield className="w-4 h-4" />
                <span>SnapClone Safety & Ephemeral Integrity</span>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed">
                All Snaps are deleted from servers immediately after viewing or 24-hour expiration. Screenshots trigger
                sender alerts to safeguard spontaneous communication.
              </p>
            </div>

            <div className="bg-white/[0.06] p-3.5 rounded-2xl border border-white/10 flex flex-col gap-2 text-xs backdrop-blur-xl">
              <div className="flex items-center justify-between text-white/80">
                <span>COPPA / Youth Protection:</span>
                <span className="text-emerald-300 font-bold">Compliant (13+)</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Data Retention Period:</span>
                <span className="text-yellow-300 font-bold">≤ 24 Hours TTL</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Encrypted Transit:</span>
                <span className="text-emerald-300 font-bold">TLS 1.3 Active</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

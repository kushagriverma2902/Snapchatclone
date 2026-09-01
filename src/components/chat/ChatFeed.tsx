import React from 'react';
import { Camera, Flame, Search, MessageSquare, ChevronRight, Sparkles, Check, Clock } from 'lucide-react';
import { Friend, Conversation, ReceivedSnap } from '../../types';
import { playSound } from '../../utils/audioEffects';

interface ChatFeedProps {
  friends: Friend[];
  conversations: Record<string, Conversation>;
  onOpenConversation: (friendId: string) => void;
  onOpenSnap: (snap: ReceivedSnap) => void;
  onOpenQuickCamera: (friendId: string) => void;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  friends,
  conversations,
  onOpenConversation,
  onOpenSnap,
  onOpenQuickCamera,
}) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#16162a]/90 to-[#0e0e1a]/95 flex flex-col select-none overflow-hidden backdrop-blur-2xl">
      {/* Search & Header */}
      <div className="p-4 pb-2 border-b border-white/15 flex flex-col gap-3 bg-white/[0.06] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white font-['Syne'] tracking-tight">Chat</h2>
          <div className="text-xs bg-white/10 border border-white/20 text-neutral-300 px-3 py-1 rounded-full font-bold backdrop-blur-md">
            Ephemeral by Default
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-white/[0.08] px-3.5 py-2.5 rounded-2xl border border-white/15 text-neutral-300 backdrop-blur-lg focus-within:border-yellow-400/50 transition">
          <Search className="w-4 h-4 text-white/50" />
          <input
            type="text"
            placeholder="Search friends & groups..."
            className="bg-transparent text-xs text-white placeholder-white/40 outline-none w-full"
          />
        </div>
      </div>

      {/* Friends & Active Chats List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/10 pb-20">
        {friends.map((f) => {
          const conv = conversations[f.id];
          const hasUnopenedSnap = !!f.unreadSnap && !f.unreadSnap.isOpened;

          return (
            <div
              key={f.id}
              onClick={() => {
                if (hasUnopenedSnap && f.unreadSnap) {
                  playSound('pop');
                  onOpenSnap(f.unreadSnap);
                } else {
                  playSound('tap');
                  onOpenConversation(f.id);
                }
              }}
              className="p-3.5 hover:bg-white/[0.08] active:bg-white/[0.14] transition-all flex items-center justify-between cursor-pointer group backdrop-blur-xs"
            >
              <div className="flex items-center gap-3">
                {/* Avatar with Story / Unopened ring */}
                <div className="relative">
                  <img
                    src={f.avatar}
                    alt={f.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20 shadow-md"
                  />
                  {hasUnopenedSnap && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#121222] shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                  )}
                </div>

                {/* Name & Status */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-white text-sm">{f.name}</h3>
                    {f.bestFriendStatus === 'besties' && <span>💛</span>}
                    {f.bestFriendStatus === 'mutual_besties' && <span>💖</span>}
                    {f.streak > 0 && (
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 backdrop-blur-md ${
                          f.isStreakAtRisk
                            ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50 animate-bounce'
                            : 'bg-white/10 border border-white/15 text-orange-300'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5 fill-orange-500" />
                        {f.streak}
                        {f.isStreakAtRisk && ' ⏳'}
                      </span>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {hasUnopenedSnap ? (
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-400">
                        <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"></span>
                        <span>New Snap</span>
                        <span className="text-[10px] text-white/50 font-normal">• {f.unreadSnap?.sentAt}</span>
                      </div>
                    ) : f.chatStatus ? (
                      <div className="text-xs text-neutral-300 flex items-center gap-1">
                        {f.chatStatus.type === 'snap' ? (
                          <span className="text-white/60">Opened</span>
                        ) : (
                          <span className="truncate max-w-[170px] text-white/80">{f.chatStatus.lastMessage}</span>
                        )}
                        <span className="text-[10px] text-white/40">• {f.chatStatus.timestamp}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-white/50">{f.lastActive}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Action: Camera Quick Capture */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSound('tap');
                    onOpenQuickCamera(f.id);
                  }}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-yellow-300 border border-white/15 active:scale-90 transition backdrop-blur-md shadow-sm"
                  title="Send Quick Snap"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

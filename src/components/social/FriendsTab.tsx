import React, { useState } from 'react';
import {
  Flame,
  UserPlus,
  QrCode,
  Search,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Users,
  Shield,
  Heart,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Friend, User } from '../../types';
import { playSound } from '../../utils/audioEffects';

interface FriendsTabProps {
  friends: Friend[];
  user: User;
  onOpenSnapcode: () => void;
  onSendQuickSnapToFriend: (friendId: string) => void;
  onRestoreStreak: (friendId: string) => void;
  onAddFriend: (username: string) => void;
}

export const FriendsTab: React.FC<FriendsTabProps> = ({
  friends,
  user,
  onOpenSnapcode,
  onSendQuickSnapToFriend,
  onRestoreStreak,
  onAddFriend,
}) => {
  const [addUsernameInput, setAddUsernameInput] = useState<string>('');
  const [addedFriends, setAddedFriends] = useState<string[]>([]);
  const [contactSyncEnabled, setContactSyncEnabled] = useState<boolean>(true);

  const atRiskFriend = friends.find((f) => f.isStreakAtRisk);

  const handleAddUser = () => {
    if (!addUsernameInput.trim()) return;
    playSound('pop');
    onAddFriend(addUsernameInput.trim());
    setAddedFriends((prev) => [...prev, addUsernameInput.trim()]);
    setAddUsernameInput('');
  };

  const handleRestore = (friendId: string) => {
    playSound('streak');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onRestoreStreak(friendId);
  };

  // Quick Add suggestions
  const quickAddSuggestions = [
    { name: 'Sarah Jenkins', username: 'sarah_j', mutualCount: 6, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
    { name: 'David Kim', username: 'dkim_shots', mutualCount: 4, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
    { name: 'Elena Rostova', username: 'elena_r', mutualCount: 9, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#16162a]/95 via-[#121222]/90 to-[#0e0e1a]/95 flex flex-col select-none overflow-y-auto pb-24 backdrop-blur-2xl">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-white/15 flex items-center justify-between bg-white/[0.06] backdrop-blur-xl">
        <h2 className="text-2xl font-black text-white font-['Syne'] tracking-tight">Friends & Streaks</h2>
        <button
          id="open-snapcode-btn"
          onClick={() => {
            playSound('tap');
            onOpenSnapcode();
          }}
          className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black px-3.5 py-1.5 rounded-full font-bold text-xs shadow-[0_0_15px_rgba(250,204,21,0.5)] active:scale-95 transition"
        >
          <QrCode className="w-4 h-4" />
          <span>Snapcode</span>
        </button>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Streak-at-Risk Warning Banner (if any) */}
        {atRiskFriend && (
          <div className="bg-amber-500/20 backdrop-blur-xl border-2 border-amber-400/60 rounded-3xl p-4 flex flex-col gap-3 shadow-[0_8px_32px_rgba(245,158,11,0.3)] animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black shadow-md">
                  ⏳
                </div>
                <div>
                  <h4 className="font-extrabold text-amber-200 text-sm">Streak at Risk!</h4>
                  <p className="text-xs text-amber-100/80">
                    {atRiskFriend.name} • {atRiskFriend.streakHoursLeft || 2} hours left to keep 🔥 {atRiskFriend.streak}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playSound('tap');
                  onSendQuickSnapToFriend(atRiskFriend.id);
                }}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-black font-extrabold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
              >
                <Flame className="w-4 h-4 fill-orange-600 inline" />
                <span>Send Snap to Save Streak</span>
              </button>

              <button
                onClick={() => handleRestore(atRiskFriend.id)}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-amber-200 rounded-2xl text-xs font-bold border border-amber-400/40 flex items-center gap-1 active:scale-95 transition backdrop-blur-md"
                title="1-Click Streak Grace Restore"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>
            </div>
          </div>
        )}

        {/* Streaks Leaderboard Card */}
        <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/15 rounded-3xl p-4 flex flex-col gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-500" />
              <span>Active Daily Streaks</span>
            </h3>
            <span className="text-xs font-bold text-white/60">Total: {friends.filter((f) => f.streak > 0).length} active</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {friends
              .filter((f) => f.streak > 0)
              .sort((a, b) => b.streak - a.streak)
              .slice(0, 3)
              .map((f, i) => (
                <div
                  key={f.id}
                  onClick={() => onSendQuickSnapToFriend(f.id)}
                  className="bg-white/[0.07] hover:bg-white/[0.14] p-3 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition backdrop-blur-md shadow-sm"
                >
                  <div className="relative">
                    <img
                      src={f.avatar}
                      alt={f.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-400 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full border border-[#121222]">
                      #{i + 1}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white truncate max-w-full text-center">{f.name.split(' ')[0]}</span>
                  <div className="flex items-center gap-0.5 text-xs font-black text-orange-300">
                    <Flame className="w-3.5 h-3.5 fill-orange-500" />
                    <span>{f.streak}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Add Friends Input */}
        <div>
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Add New Friends</h3>
          <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-xl border border-white/15 p-2 rounded-2xl focus-within:border-yellow-400/50 transition">
            <Search className="w-4 h-4 text-white/50 ml-2" />
            <input
              type="text"
              value={addUsernameInput}
              onChange={(e) => setAddUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
              placeholder="Enter friend's username (e.g. jordan_99)..."
              className="flex-1 bg-transparent text-xs text-white placeholder-white/40 outline-none"
            />
            <button
              onClick={handleAddUser}
              disabled={!addUsernameInput.trim()}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Best Friends List */}
        <div>
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2.5">Best Friends & Close Circle</h3>
          <div className="flex flex-col gap-2">
            {friends.map((f) => (
              <div
                key={f.id}
                className="bg-white/[0.06] backdrop-blur-xl border border-white/10 hover:border-white/20 p-3 rounded-2xl flex items-center justify-between transition shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={f.avatar}
                    alt={f.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-white text-xs">{f.name}</h4>
                      {f.bestFriendStatus === 'besties' && <span title="Besties">💛</span>}
                      {f.bestFriendStatus === 'mutual_besties' && <span title="Mutual #1 Best Friend">💖</span>}
                    </div>
                    <p className="text-[10px] text-white/50">@{f.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {f.streak > 0 && (
                    <span className="text-xs font-black text-orange-300 flex items-center gap-0.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
                      <Flame className="w-3.5 h-3.5 fill-orange-500" />
                      {f.streak}
                    </span>
                  )}
                  <button
                    onClick={() => onSendQuickSnapToFriend(f.id)}
                    className="p-2 px-3 rounded-full bg-yellow-400 text-black font-bold hover:bg-yellow-300 active:scale-90 transition text-xs shadow-sm"
                    title="Send Snap"
                  >
                    Snap
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Add Suggestions */}
        <div>
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2.5">Quick Add Suggestions</h3>
          <div className="flex flex-col gap-2">
            {quickAddSuggestions.map((item) => {
              const isAdded = addedFriends.includes(item.username);
              return (
                <div
                  key={item.username}
                  className="bg-white/[0.06] backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex items-center justify-between transition shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20"
                    />
                    <div>
                      <h4 className="font-bold text-white text-xs">{item.name}</h4>
                      <p className="text-[10px] text-white/50">@{item.username} • {item.mutualCount} mutual friends</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      playSound('pop');
                      setAddedFriends((prev) => [...prev, item.username]);
                      onAddFriend(item.username);
                    }}
                    disabled={isAdded}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                      isAdded
                        ? 'bg-white/10 text-white/50 border border-white/10'
                        : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

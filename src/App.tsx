import React, { useState, useEffect } from 'react';
import {
  Camera,
  MessageSquare,
  Sparkles,
  Flame,
  User as UserIcon,
  Smartphone,
  Maximize2,
  Tv,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  User,
  Friend,
  FilterLens,
  CreatedSnap,
  ReceivedSnap,
  Story,
  Conversation,
  NotificationItem,
  PrivacySettings,
} from './types';
import {
  CURRENT_USER,
  INITIAL_FILTERS,
  INITIAL_FRIENDS,
  INITIAL_STORIES,
  INITIAL_CONVERSATIONS,
  INITIAL_PRIVACY_SETTINGS,
} from './data/initialData';
import { CameraView } from './components/camera/CameraView';
import { SnapEditor } from './components/camera/SnapEditor';
import { SnapViewer } from './components/snap/SnapViewer';
import { StoryViewer } from './components/stories/StoryViewer';
import { ChatFeed } from './components/chat/ChatFeed';
import { ChatConversation } from './components/chat/ChatConversation';
import { StoriesTab } from './components/stories/StoriesTab';
import { FriendsTab } from './components/social/FriendsTab';
import { SnapcodeModal } from './components/social/SnapcodeModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { NotificationToast } from './components/notifications/NotificationToast';
import { playSound } from './utils/audioEffects';

export default function App() {
  // Navigation tabs: 'camera' (default per PRD), 'chat', 'stories', 'friends'
  const [currentTab, setCurrentTab] = useState<'camera' | 'chat' | 'stories' | 'friends'>('camera');

  // Application State
  const [user, setUser] = useState<User>(CURRENT_USER);
  const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
  const [filters] = useState<FilterLens[]>(INITIAL_FILTERS);
  const [selectedFilter, setSelectedFilter] = useState<FilterLens>(INITIAL_FILTERS[0]);
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [conversations, setConversations] = useState<Record<string, Conversation>>(INITIAL_CONVERSATIONS);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(INITIAL_PRIVACY_SETTINGS);

  // Active Modals & Full-screen Overlays
  const [activeCreatedSnap, setActiveCreatedSnap] = useState<CreatedSnap | null>(null);
  const [activeViewingSnap, setActiveViewingSnap] = useState<ReceivedSnap | null>(null);
  const [activeViewingStory, setActiveViewingStory] = useState<Story | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showSnapcodeModal, setShowSnapcodeModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Chassis View Mode: Mobile frame (default) vs Fullscreen viewport
  const [isMobileChassis, setIsMobileChassis] = useState<boolean>(true);

  // Notifications Queue
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_welcome',
      type: 'snap',
      title: 'New Snap from Casual Chloe 🔥',
      message: 'Tap to view before it disappears!',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      timestamp: 'Just now',
      actionData: { type: 'snap', friendId: 'chloe' },
    },
  ]);

  // Push notification helper
  const triggerNotification = (notif: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}`,
      timestamp: 'Just now',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Auto-dismiss after 6s
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
    }, 6000);
  };

  // Handler: When a photo/video snap is taken in CameraView
  const handleSnapCaptured = (snap: CreatedSnap) => {
    setActiveCreatedSnap(snap);
  };

  // Handler: Send snap to recipients / post to Story
  const handleSendSnap = (snap: CreatedSnap, recipients: string[], postToStory: boolean) => {
    // 1. If posted to story, add a new segment
    if (postToStory) {
      setStories((prev) => {
        const myStoryIdx = prev.findIndex((s) => s.isMyStory);
        const newSegment = {
          id: `seg_me_${Date.now()}`,
          mediaUrl: snap.mediaUrl,
          mediaType: snap.mediaType,
          duration: snap.duration,
          timestamp: 'Just now',
          timeAgo: 'Just now',
          overlays: snap.overlays,
          drawings: snap.drawings,
          stickers: snap.stickers,
          filterName: snap.filterName,
          viewers: [],
        };

        if (myStoryIdx >= 0) {
          const updated = [...prev];
          updated[myStoryIdx] = {
            ...updated[myStoryIdx],
            lastUpdated: 'Just now',
            segments: [newSegment, ...updated[myStoryIdx].segments],
          };
          return updated;
        } else {
          return [
            {
              id: 'story_me',
              userId: 'me',
              userName: 'My Story',
              userAvatar: user.avatar,
              isMyStory: true,
              lastUpdated: 'Just now',
              hasUnseen: false,
              segments: [newSegment],
            },
            ...prev,
          ];
        }
      });
    }

    // 2. Increment user snapScore
    setUser((prev) => ({
      ...prev,
      snapScore: prev.snapScore + recipients.length * 10 + (postToStory ? 5 : 0),
    }));

    // 3. Update recipients' chat threads
    recipients.forEach((recipId) => {
      setConversations((prev) => {
        const existing = prev[recipId];
        if (!existing) return prev;

        const newMsg = {
          id: `msg_${Date.now()}_${recipId}`,
          senderId: 'me',
          mediaUrl: snap.mediaUrl,
          mediaType: snap.mediaType,
          timestamp: 'Just now',
          isSavedInChat: false,
          isRead: false,
        };

        return {
          ...prev,
          [recipId]: {
            ...existing,
            messages: [...existing.messages, newMsg],
            unreadCount: 0,
          },
        };
      });

      // Increment friend streak if sent
      setFriends((prev) =>
        prev.map((f) => {
          if (f.id === recipId) {
            return {
              ...f,
              streak: f.streak + 1,
              isStreakAtRisk: false,
              chatStatus: {
                lastMessage: 'Delivered',
                timestamp: 'Just now',
                type: 'snap',
                isUnread: false,
              },
            };
          }
          return f;
        })
      );
    });

    // Close editor and show success banner
    setActiveCreatedSnap(null);
    triggerNotification({
      type: 'snap',
      title: 'Snap Sent! 🚀',
      message: `Delivered to ${recipients.length} friend${recipients.length > 1 ? 's' : ''}${
        postToStory ? ' & added to My Story' : ''
      }`,
    });
  };

  // Handler: When a received snap finishes viewing or is dismissed
  const handleCloseViewingSnap = (snapId: string, wasReplayed: boolean = false) => {
    if (wasReplayed) {
      // Replay snap once
      setActiveViewingSnap((prev) => (prev ? { ...prev, replayed: true, canReplay: false } : null));
      return;
    }

    // Mark snap as opened / delete ephemeral content
    setFriends((prev) =>
      prev.map((f) => {
        if (f.unreadSnap && f.unreadSnap.id === snapId) {
          return {
            ...f,
            unreadSnap: {
              ...f.unreadSnap,
              isOpened: true,
            },
            chatStatus: {
              lastMessage: 'Opened • Just now',
              timestamp: 'Just now',
              type: 'snap',
              isUnread: false,
            },
          };
        }
        return f;
      })
    );

    setActiveViewingSnap(null);
  };

  // Handler: Screenshot detection on a snap
  const handleScreenshotTaken = (snap: ReceivedSnap) => {
    triggerNotification({
      type: 'screenshot',
      title: `📸 Screenshot Detected!`,
      message: `Sender ${snap.senderName} was notified that you screenshotted their snap.`,
    });
  };

  // Handler: Streak restore
  const handleRestoreStreak = (friendId: string) => {
    setFriends((prev) =>
      prev.map((f) => {
        if (f.id === friendId) {
          return {
            ...f,
            isStreakAtRisk: false,
            streak: f.streak + 1,
          };
        }
        return f;
      })
    );

    triggerNotification({
      type: 'streak_risk',
      title: 'Streak Restored! 🔥',
      message: 'Streak revived with 24-hour grace period.',
    });
  };

  // Handler: Send in-chat message
  const handleSendChatMessage = (
    text: string,
    mediaType?: 'photo' | 'voice',
    voiceDuration?: number
  ) => {
    if (!activeConversationId) return;

    const newMsg = {
      id: `m_${Date.now()}`,
      senderId: 'me',
      text: text,
      mediaType: mediaType,
      voiceDuration: voiceDuration,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSavedInChat: false,
      isRead: true,
    };

    setConversations((prev) => {
      const conv = prev[activeConversationId];
      if (!conv) return prev;
      return {
        ...prev,
        [activeConversationId]: {
          ...conv,
          messages: [...conv.messages, newMsg],
        },
      };
    });
  };

  // Handler: Toggle message "Save in Chat"
  const handleToggleSaveMessage = (messageId: string) => {
    if (!activeConversationId) return;

    setConversations((prev) => {
      const conv = prev[activeConversationId];
      if (!conv) return prev;

      return {
        ...prev,
        [activeConversationId]: {
          ...conv,
          messages: conv.messages.map((m) =>
            m.id === messageId ? { ...m, isSavedInChat: !m.isSavedInChat } : m
          ),
        },
      };
    });
  };

  // Count unread snaps
  const unreadSnapCount = friends.filter((f) => f.unreadSnap && !f.unreadSnap.isOpened).length;
  const atRiskStreakCount = friends.filter((f) => f.isStreakAtRisk).length;

  return (
    <div className="w-full h-full min-h-screen bg-[#0f0f1a] relative flex flex-col items-center justify-center text-neutral-100 font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden">
      {/* Frosted Glass Background Ambient Glowing Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-gradient-to-bl from-pink-500/15 via-purple-500/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-[30rem] h-[30rem] rounded-full bg-gradient-to-tr from-yellow-500/10 via-amber-500/10 to-indigo-500/15 blur-3xl" />
      </div>

      {/* Top Floating App Banner (Desktop View controls) */}
      <header className="hidden md:flex items-center justify-between w-full max-w-5xl px-6 py-3 border-b border-white/10 z-40 bg-white/[0.06] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] rounded-b-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black text-lg font-['Syne'] shadow-[0_0_20px_rgba(250,204,21,0.45)]">
            👻
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white font-['Syne'] flex items-center gap-2">
              SnapClone <span className="text-[10px] font-bold bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-400/30">Frosted Glass</span>
            </h1>
            <p className="text-[11px] text-neutral-400">Ephemeral Camera-First Visual Messaging</p>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white/[0.08] px-3 py-1.5 rounded-2xl border border-white/15 backdrop-blur-xl text-xs">
            <span className="text-neutral-400">Layout:</span>
            <button
              onClick={() => setIsMobileChassis(true)}
              className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition ${
                isMobileChassis ? 'bg-yellow-400 text-black shadow-md' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile Frame
            </button>
            <button
              onClick={() => setIsMobileChassis(false)}
              className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition ${
                !isMobileChassis ? 'bg-yellow-400 text-black shadow-md' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Fullscreen
            </button>
          </div>

          <button
            onClick={() => {
              playSound('tap');
              setShowProfileModal(true);
            }}
            className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 px-3 py-1.5 rounded-2xl text-xs font-bold active:scale-95 transition backdrop-blur-xl"
          >
            <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover ring-1 ring-yellow-400" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Main Container: Render in Mobile Frame or Fullscreen */}
      <main
        className={`relative z-10 flex flex-col overflow-hidden transition-all duration-300 ${
          isMobileChassis
            ? 'w-full max-w-[420px] h-[100dvh] md:h-[840px] md:rounded-[44px] md:border-[8px] md:border-white/20 md:shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_80px_rgba(99,102,241,0.2)] md:my-4 ring-1 ring-white/30 bg-[#121222]/90 backdrop-blur-2xl'
            : 'w-full h-[100dvh] bg-[#121222]'
        }`}
      >
        {/* Dynamic Notification Toasts */}
        <NotificationToast
          notifications={notifications}
          onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
          onClickNotification={(notif) => {
            if (notif.actionData?.friendId) {
              const f = friends.find((fr) => fr.id === notif.actionData.friendId);
              if (f?.unreadSnap && !f.unreadSnap.isOpened) {
                setActiveViewingSnap(f.unreadSnap);
              } else {
                setActiveConversationId(notif.actionData.friendId);
              }
            }
          }}
        />

        {/* Content View Switching */}
        <div className="flex-1 relative w-full h-full overflow-hidden">
          {/* Active Conversation Drawer (1:1 Chat) */}
          {activeConversationId ? (
            <ChatConversation
              friend={friends.find((f) => f.id === activeConversationId) || friends[0]}
              conversation={conversations[activeConversationId] || conversations.chloe}
              onBack={() => setActiveConversationId(null)}
              onSendMessage={handleSendChatMessage}
              onToggleSaveMessage={handleToggleSaveMessage}
              onOpenQuickCamera={(friendId) => {
                setActiveConversationId(null);
                setCurrentTab('camera');
              }}
              onScreenshotChat={() => {
                triggerNotification({
                  type: 'screenshot',
                  title: 'Screenshot Alert Sent!',
                  message: `Friend was notified that you screenshotted the chat.`,
                });
              }}
            />
          ) : activeViewingSnap ? (
            /* Active Fullscreen Received Snap Viewer */
            <SnapViewer
              snap={activeViewingSnap}
              onClose={handleCloseViewingSnap}
              onScreenshotTaken={handleScreenshotTaken}
              onReplyInChat={(friendId, text) => {
                setActiveConversationId(friendId);
                if (text) handleSendChatMessage(text);
              }}
            />
          ) : activeViewingStory ? (
            /* Active 24-Hour Story Viewer */
            <StoryViewer
              story={activeViewingStory}
              onClose={() => setActiveViewingStory(null)}
              onDeleteSegment={(segId) => {
                setStories((prev) =>
                  prev.map((s) => (s.isMyStory ? { ...s, segments: s.segments.filter((seg) => seg.id !== segId) } : s))
                );
                setActiveViewingStory(null);
              }}
              onReplyToStory={(userId, text) => {
                setActiveViewingStory(null);
                setActiveConversationId(userId);
                handleSendChatMessage(text);
              }}
              onScreenshotTaken={(userName) => {
                triggerNotification({
                  type: 'screenshot',
                  title: 'Story Screenshot Recorded',
                  message: `Creator ${userName} was notified of screenshot.`,
                });
              }}
            />
          ) : activeCreatedSnap ? (
            /* Post-Capture Snap Editor with AR/Drawing/Stickers */
            <SnapEditor
              snap={activeCreatedSnap}
              onCancel={() => setActiveCreatedSnap(null)}
              onSendSnap={handleSendSnap}
            />
          ) : currentTab === 'camera' ? (
            /* Core Live Camera-First Viewfinder */
            <CameraView
              filters={filters}
              selectedFilter={selectedFilter}
              onSelectFilter={setSelectedFilter}
              onSnapCaptured={handleSnapCaptured}
              onOpenProfile={() => setShowProfileModal(true)}
              userAvatar={user.avatar}
            />
          ) : currentTab === 'chat' ? (
            /* Chat Feed */
            <ChatFeed
              friends={friends}
              conversations={conversations}
              onOpenConversation={(friendId) => setActiveConversationId(friendId)}
              onOpenSnap={(snap) => setActiveViewingSnap(snap)}
              onOpenQuickCamera={(friendId) => setCurrentTab('camera')}
            />
          ) : currentTab === 'stories' ? (
            /* 24-Hour Stories & Discover */
            <StoriesTab
              stories={stories}
              user={user}
              onOpenStory={(story) => setActiveViewingStory(story)}
              onAddNewStorySnap={() => setCurrentTab('camera')}
            />
          ) : (
            /* Friends & Streaks Leaderboard */
            <FriendsTab
              friends={friends}
              user={user}
              onOpenSnapcode={() => setShowSnapcodeModal(true)}
              onSendQuickSnapToFriend={(friendId) => setCurrentTab('camera')}
              onRestoreStreak={handleRestoreStreak}
              onAddFriend={(username) => {
                triggerNotification({
                  type: 'friend_req',
                  title: 'Friend Request Sent!',
                  message: `Added @${username} to your friend list`,
                });
              }}
            />
          )}
        </div>

        {/* Global Bottom Navigation Bar (Visible when not viewing full-screen snap/story/editor) */}
        {!activeCreatedSnap && !activeViewingSnap && !activeViewingStory && !activeConversationId && (
          <nav aria-label="Main Navigation" className="relative z-30 bg-white/[0.08] backdrop-blur-2xl border-t border-white/15 px-4 py-2 flex items-center justify-around shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
            {/* Chat Tab */}
            <button
              id="nav-chat-btn"
              onClick={() => {
                playSound('tap');
                setCurrentTab('chat');
              }}
              className={`flex flex-col items-center gap-1 transition-all duration-200 relative ${
                currentTab === 'chat' ? 'text-yellow-300 scale-105 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <MessageSquare className="w-6 h-6" />
                {unreadSnapCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-neutral-900 animate-pulse shadow-md">
                    {unreadSnapCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold">Chat</span>
            </button>

            {/* Camera Tab (Center Primary Shutter Icon) */}
            <button
              id="nav-camera-btn"
              onClick={() => {
                playSound('tap');
                setCurrentTab('camera');
              }}
              className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                currentTab === 'camera' ? 'text-yellow-300 scale-110' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <div
                className={`p-2.5 rounded-full transition-all ${
                  currentTab === 'camera'
                    ? 'bg-yellow-400 text-black shadow-[0_0_25px_rgba(250,204,21,0.6)] ring-2 ring-white/60'
                    : 'bg-white/10 text-neutral-300 backdrop-blur-md border border-white/15 hover:bg-white/20'
                }`}
              >
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold">Camera</span>
            </button>

            {/* Stories Tab */}
            <button
              id="nav-stories-btn"
              onClick={() => {
                playSound('tap');
                setCurrentTab('stories');
              }}
              className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                currentTab === 'stories' ? 'text-yellow-300 scale-105 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Sparkles className="w-6 h-6" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
              </div>
              <span className="text-[10px] font-bold">Stories</span>
            </button>

            {/* Friends & Streaks Tab */}
            <button
              id="nav-friends-btn"
              onClick={() => {
                playSound('tap');
                setCurrentTab('friends');
              }}
              className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                currentTab === 'friends' ? 'text-yellow-300 scale-105 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Flame className={`w-6 h-6 ${currentTab === 'friends' ? 'fill-orange-500 text-orange-400' : ''}`} />
                {atRiskStreakCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center animate-bounce shadow">
                    ⏳
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold">Streaks</span>
            </button>
          </nav>
        )}
      </main>

      {/* Snapcode QR Modal */}
      {showSnapcodeModal && (
        <SnapcodeModal
          user={user}
          onClose={() => setShowSnapcodeModal(false)}
          onScanFriendSnapcode={(username) => {
            triggerNotification({
              type: 'friend_req',
              title: 'Snapcode Scanned! 🎉',
              message: `Connected with @${username}`,
            });
          }}
        />
      )}

      {/* Profile & Privacy Settings Modal */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          privacy={privacySettings}
          isMobileChassis={isMobileChassis}
          onToggleChassis={() => setIsMobileChassis(!isMobileChassis)}
          onUpdatePrivacy={setPrivacySettings}
          onOpenSnapcode={() => {
            setShowProfileModal(false);
            setShowSnapcodeModal(true);
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}

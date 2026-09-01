export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  snapScore: number;
  birthday: string;
  snapcodeColor: string;
  streakCount: number;
  bestFriendEmoji: string;
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  streak: number;
  streakHoursLeft?: number;
  isStreakAtRisk: boolean;
  bestFriendStatus?: 'besties' | 'mutual_besties' | 'close_friend';
  interactionScore: number;
  lastActive: string;
  story?: Story;
  unreadSnap?: ReceivedSnap;
  chatStatus?: {
    lastMessage: string;
    timestamp: string;
    type: 'snap' | 'video_snap' | 'chat' | 'screenshot' | 'replay';
    isUnread: boolean;
  };
}

export interface OverlayText {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  bgStyle: 'none' | 'pill' | 'banner' | 'neon' | 'rainbow';
  fontFamily: 'sans' | 'syne' | 'marker' | 'mono';
  rotation: number;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  id: string;
  points: DrawingPoint[];
  color: string;
  brushSize: number;
  isGlow?: boolean;
  isRainbow?: boolean;
}

export interface StickerItem {
  id: string;
  emojiOrUrl: string;
  isEmoji: boolean;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  type?: 'emoji' | 'geotag' | 'time' | 'temp' | 'streak_badge' | 'bitmoji';
  label?: string;
}

export interface FilterLens {
  id: string;
  name: string;
  icon: string;
  category: 'beauty' | 'funny' | 'vibe' | 'art' | 'world';
  description: string;
  colorTone?: string;
  canvasFilter?: string;
  overlayType?: 'dog' | 'glasses' | 'vhs' | 'sparkles' | 'fire' | 'hearts' | 'neon' | 'anime' | 'fisheye' | 'noir' | 'rainbow_prism' | 'alien';
}

export interface CreatedSnap {
  id: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  duration: number;
  timestamp: string;
  overlays: OverlayText[];
  drawings: DrawingPath[];
  stickers: StickerItem[];
  filterId?: string;
  filterName?: string;
  hasAudio?: boolean;
  recordedVideoBlob?: Blob;
}

export interface ReceivedSnap {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  duration: number;
  sentAt: string;
  isOpened: boolean;
  openedAt?: string;
  replayed: boolean;
  canReplay: boolean;
  overlays?: OverlayText[];
  drawings?: DrawingPath[];
  stickers?: StickerItem[];
  filterName?: string;
}

export interface StorySegment {
  id: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  duration: number;
  timestamp: string;
  timeAgo: string;
  overlays?: OverlayText[];
  drawings?: DrawingPath[];
  stickers?: StickerItem[];
  filterName?: string;
  viewers: {
    userId: string;
    userName: string;
    userAvatar: string;
    viewedAt: string;
    tookScreenshot?: boolean;
  }[];
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  isMyStory?: boolean;
  segments: StorySegment[];
  lastUpdated: string;
  hasUnseen: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'voice' | 'sticker';
  voiceDuration?: number;
  timestamp: string;
  isSavedInChat: boolean;
  isRead: boolean;
  readAt?: string;
  isScreenshotAlert?: boolean;
}

export interface Conversation {
  id: string;
  friendId: string;
  friendName: string;
  friendUsername: string;
  friendAvatar: string;
  isGroup?: boolean;
  groupMembers?: Friend[];
  messages: ChatMessage[];
  unreadCount: number;
  streak: number;
  isTyping?: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'snap' | 'screenshot' | 'streak_risk' | 'friend_req' | 'story_reply';
  title: string;
  message: string;
  avatar?: string;
  timestamp: string;
  actionData?: any;
}

export interface PrivacySettings {
  whoCanSendSnaps: 'everyone' | 'friends';
  whoCanViewStory: 'everyone' | 'friends' | 'custom';
  whoCanSeeInQuickAdd: boolean;
  screenshotAlertsEnabled: boolean;
  contactSync: boolean;
  birthDate: string;
  isAgeVerified: boolean;
}

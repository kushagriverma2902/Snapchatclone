import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Camera,
  Send,
  Mic,
  MicOff,
  Smile,
  Flame,
  Bookmark,
  BookmarkCheck,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Conversation, ChatMessage, Friend } from '../../types';
import { playSound } from '../../utils/audioEffects';

interface ChatConversationProps {
  friend: Friend;
  conversation: Conversation;
  onBack: () => void;
  onSendMessage: (text: string, mediaType?: 'photo' | 'voice', voiceDuration?: number) => void;
  onToggleSaveMessage: (messageId: string) => void;
  onOpenQuickCamera: (friendId: string) => void;
  onScreenshotChat: () => void;
}

export const ChatConversation: React.FC<ChatConversationProps> = ({
  friend,
  conversation,
  onBack,
  onSendMessage,
  onToggleSaveMessage,
  onOpenQuickCamera,
  onScreenshotChat,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [voiceSeconds, setVoiceSeconds] = useState<number>(0);
  const [showScreenshotAlert, setShowScreenshotAlert] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const voiceTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages, isTyping]);

  // Simulate friend typing when you send a message
  const handleSend = () => {
    if (!inputText.trim()) return;
    playSound('pop');
    onSendMessage(inputText);
    setInputText('');

    // Simulate friend response / typing after 1.5s
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const autoResponses = [
          'Haha loved that snap! 😂🔥',
          'Let’s keep this streak going! 💯',
          'Omg yes exactly!!',
          'See you in a bit 👋',
        ];
        const randomReply = autoResponses[Math.floor(Math.random() * autoResponses.length)];
        onSendMessage(randomReply);
      }, 2000);
    }, 1200);
  };

  const handleStartVoiceRecord = () => {
    playSound('record_start');
    setIsRecordingVoice(true);
    setVoiceSeconds(0);
    voiceTimerRef.current = setInterval(() => {
      setVoiceSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleStopVoiceRecord = () => {
    playSound('record_stop');
    setIsRecordingVoice(false);
    clearInterval(voiceTimerRef.current);
    if (voiceSeconds >= 1) {
      onSendMessage(`🎤 Voice Note (${voiceSeconds}s)`, 'voice', voiceSeconds);
    }
  };

  const triggerChatScreenshot = () => {
    playSound('screenshot');
    setShowScreenshotAlert(true);
    onScreenshotChat();
    setTimeout(() => setShowScreenshotAlert(false), 3500);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#16162a]/95 to-[#0f0f1b] flex flex-col justify-between select-none backdrop-blur-2xl">
      {/* Header Bar */}
      <div className="p-3.5 border-b border-white/15 bg-white/[0.08] backdrop-blur-2xl flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playSound('tap');
              onBack();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 active:scale-90 transition backdrop-blur-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src={friend.avatar}
                alt={friend.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-yellow-400/80 shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#121222] shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-white text-sm leading-none">{friend.name}</h3>
                {friend.streak > 0 && (
                  <span className="text-xs font-black text-orange-400 flex items-center gap-0.5">
                    <Flame className="w-3.5 h-3.5 fill-orange-500" />
                    {friend.streak}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/60 mt-0.5">@{friend.username}</p>
            </div>
          </div>
        </div>

        {/* Action Controls: Screenshot & Camera */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerChatScreenshot}
            className="p-2 rounded-full bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-400/40 active:scale-90 transition backdrop-blur-md shadow-sm"
            title="Simulate Screenshot in Chat"
          >
            <ShieldAlert className="w-4 h-4 text-red-300" />
          </button>

          <button
            onClick={() => {
              playSound('tap');
              onOpenQuickCamera(friend.id);
            }}
            className="p-2 rounded-full bg-yellow-400 text-black hover:bg-yellow-300 active:scale-90 transition font-bold shadow-[0_0_15px_rgba(250,204,21,0.5)]"
            title="Open Camera"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ephemeral Notice Banner */}
      <div className="bg-white/[0.04] border-b border-white/10 py-1.5 px-4 text-center backdrop-blur-md">
        <p className="text-[11px] text-white/70 flex items-center justify-center gap-1">
          <Info className="w-3 h-3 text-yellow-400" />
          <span>Messages disappear after viewing. Tap any message to </span>
          <span className="text-yellow-300 font-bold">Save in Chat</span>
        </p>
      </div>

      {/* Screenshot Alert */}
      {showScreenshotAlert && (
        <div className="m-3 p-3 bg-red-600/80 backdrop-blur-xl text-white rounded-2xl border border-white/30 shadow-[0_10px_30px_rgba(239,68,68,0.4)] flex items-center gap-2.5 animate-in slide-in-from-top">
          <span className="text-lg">📸</span>
          <p className="text-xs font-bold">
            Screenshot notification sent to <span className="underline">{friend.name}</span>
          </p>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {conversation.messages.map((msg) => {
          const isMe = msg.senderId === 'me';
          return (
            <div
              key={msg.id}
              onClick={() => {
                playSound('tap');
                onToggleSaveMessage(msg.id);
              }}
              className={`flex flex-col cursor-pointer transition-all ${
                isMe ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 relative group transition backdrop-blur-xl ${
                  msg.isSavedInChat
                    ? isMe
                      ? 'bg-indigo-600/70 border border-indigo-400/40 border-l-4 border-l-yellow-400 text-white shadow-[0_8px_24px_rgba(79,70,229,0.3)]'
                      : 'bg-white/[0.14] border border-white/20 border-l-4 border-l-yellow-400 text-white shadow-[0_8px_24px_rgba(0,0,0,0.3)]'
                    : isMe
                    ? 'bg-indigo-600/80 border border-indigo-400/30 text-white shadow-[0_4px_16px_rgba(79,70,229,0.25)]'
                    : 'bg-white/[0.09] border border-white/15 text-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.2)]'
                }`}
              >
                {/* Media Image if present */}
                {msg.mediaUrl && (
                  <img
                    src={msg.mediaUrl}
                    alt="Chat Media"
                    referrerPolicy="no-referrer"
                    className="w-48 h-48 object-cover rounded-xl mb-2 border border-white/20 shadow-md"
                  />
                )}

                {/* Voice Note Player */}
                {msg.mediaType === 'voice' && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                      <Mic className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 flex items-center gap-1">
                      {[40, 70, 30, 90, 50, 80, 60, 100, 45, 65].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-white/80 rounded-full"
                          style={{ height: `${h * 0.2}px` }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] opacity-80">{msg.voiceDuration || 3}s</span>
                  </div>
                )}

                {/* Text Content */}
                {msg.text && <p className="text-xs font-medium leading-relaxed">{msg.text}</p>}

                {/* Saved Badge & Timestamp */}
                <div className="flex items-center justify-between gap-3 mt-1.5 opacity-70 text-[10px]">
                  <span>{msg.timestamp}</span>
                  {msg.isSavedInChat && (
                    <span className="text-yellow-300 font-bold flex items-center gap-0.5 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]">
                      <BookmarkCheck className="w-3 h-3" /> Saved
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-white/70 text-xs italic bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full self-start">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" />
            <span>{friend.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Toolbar */}
      <div className="p-3 border-t border-white/15 bg-white/[0.08] backdrop-blur-2xl flex items-center gap-2 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        {/* Quick Camera */}
        <button
          onClick={() => {
            playSound('tap');
            onOpenQuickCamera(friend.id);
          }}
          className="p-2.5 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 border border-white/15 active:scale-90 transition backdrop-blur-md"
        >
          <Camera className="w-5 h-5 text-yellow-300" />
        </button>

        {/* Text Input */}
        <div className="flex-1 bg-white/[0.08] backdrop-blur-xl rounded-full px-4 py-2 flex items-center gap-2 border border-white/15 focus-within:border-yellow-400/50 transition">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Send chat to ${friend.name}...`}
            className="flex-1 bg-transparent text-xs text-white placeholder-white/40 outline-none"
          />
        </div>

        {/* Voice Note Button */}
        <button
          onMouseDown={handleStartVoiceRecord}
          onMouseUp={handleStopVoiceRecord}
          onTouchStart={handleStartVoiceRecord}
          onTouchEnd={handleStopVoiceRecord}
          className={`p-2.5 rounded-full transition active:scale-90 backdrop-blur-md border border-white/15 ${
            isRecordingVoice
              ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]'
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
          title="Hold to Record Voice Note"
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Send Button */}
        {inputText.trim() && (
          <button
            onClick={handleSend}
            className="p-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black active:scale-90 transition font-bold shadow-[0_0_15px_rgba(250,204,21,0.5)]"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

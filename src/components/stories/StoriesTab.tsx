import React from 'react';
import { Plus, Eye, Sparkles, Flame, Clock } from 'lucide-react';
import { Story, User } from '../../types';
import { playSound } from '../../utils/audioEffects';

interface StoriesTabProps {
  stories: Story[];
  user: User;
  onOpenStory: (story: Story) => void;
  onAddNewStorySnap: () => void;
}

export const StoriesTab: React.FC<StoriesTabProps> = ({
  stories,
  user,
  onOpenStory,
  onAddNewStorySnap,
}) => {
  const myStory = stories.find((s) => s.isMyStory);
  const friendStories = stories.filter((s) => !s.isMyStory);

  return (
    <div className="w-full h-full bg-gradient-to-b from-[#16162a]/95 via-[#121222]/90 to-[#0e0e1a]/95 flex flex-col select-none overflow-y-auto pb-24 backdrop-blur-2xl">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-white/15 flex items-center justify-between bg-white/[0.06] backdrop-blur-xl">
        <h2 className="text-2xl font-black text-white font-['Syne'] tracking-tight">Stories</h2>
        <div className="text-xs bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 px-3 py-1 rounded-full font-bold backdrop-blur-md shadow-sm">
          24h Ephemeral
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* "My Story" Section */}
        <div>
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2.5">My Story</h3>
          <div className="flex items-center gap-3 bg-white/[0.08] backdrop-blur-xl border border-white/15 p-3.5 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            {myStory && myStory.segments.length > 0 ? (
              <div
                onClick={() => {
                  playSound('tap');
                  onOpenStory(myStory);
                }}
                className="relative cursor-pointer group"
              >
                <img
                  src={myStory.segments[0].mediaUrl}
                  alt="My Story Preview"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover ring-3 ring-indigo-400 shadow-md group-hover:scale-105 transition"
                />
                <span className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-0.5 ring-2 ring-[#121222]">
                  <Eye className="w-3 h-3" />
                </span>
              </div>
            ) : (
              <div
                onClick={() => {
                  playSound('tap');
                  onAddNewStorySnap();
                }}
                className="w-14 h-14 rounded-full bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center cursor-pointer hover:border-yellow-400 hover:bg-white/15 transition backdrop-blur-md"
              >
                <Plus className="w-6 h-6 text-yellow-300" />
              </div>
            )}

            <div className="flex-1">
              <h4 className="font-bold text-white text-sm">
                {myStory && myStory.segments.length > 0 ? 'My Story Active' : 'Add to My Story'}
              </h4>
              <p className="text-xs text-white/60 mt-0.5">
                {myStory && myStory.segments.length > 0
                  ? `${myStory.segments.length} Snaps • ${myStory.segments[0].viewers?.length || 0} views`
                  : 'Share moments with friends for 24 hours'}
              </p>
            </div>

            <button
              onClick={() => {
                playSound('tap');
                onAddNewStorySnap();
              }}
              className="p-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black font-black active:scale-90 transition shadow-[0_0_15px_rgba(250,204,21,0.5)]"
              title="Add Snap to Story"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Friends Stories Section */}
        <div>
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Friends Updates</h3>
          <div className="grid grid-cols-2 gap-3">
            {friendStories.map((story) => {
              const previewImg = story.segments[0]?.mediaUrl || story.userAvatar;
              return (
                <div
                  key={story.id}
                  onClick={() => {
                    playSound('tap');
                    onOpenStory(story);
                  }}
                  className="relative h-52 rounded-3xl overflow-hidden cursor-pointer group shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-white/20 hover:border-white/40 transition-all backdrop-blur-md"
                >
                  <img
                    src={previewImg}
                    alt={story.userName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Unseen Story Gradient Ring Avatar */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <div
                      className={`p-0.5 rounded-full backdrop-blur-md ${
                        story.hasUnseen
                          ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-indigo-500 shadow-md'
                          : 'bg-white/30'
                      }`}
                    >
                      <img
                        src={story.userAvatar}
                        alt={story.userName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-black"
                      />
                    </div>
                  </div>

                  {/* Bottom User Name */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="font-extrabold text-white text-sm truncate">{story.userName}</h4>
                    <p className="text-[11px] text-white/70 flex items-center gap-1">
                      <Clock className="w-3 h-3 inline text-white/60" />
                      <span>{story.lastUpdated}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Discover & Curated Creators Spotlight */}
        <div>
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Discover & Creators</h3>
          <div className="flex flex-col gap-2.5">
            {[
              {
                title: 'Behind the Scenes: AR Lens Lab',
                author: 'Snap Design Studio',
                img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
                badge: 'Verified Creator',
              },
              {
                title: 'Golden Hour Photo Hacks',
                author: 'Creator Caleb',
                img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
                badge: 'Top Story',
              },
            ].map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/[0.06] backdrop-blur-xl p-2.5 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/[0.09] cursor-pointer transition shadow-sm"
              >
                <img
                  src={d.img}
                  alt={d.title}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-xl object-cover border border-white/10"
                />
                <div className="flex-1">
                  <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">
                    {d.badge}
                  </span>
                  <h4 className="font-bold text-white text-xs mt-1">{d.title}</h4>
                  <p className="text-[10px] text-white/50">{d.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

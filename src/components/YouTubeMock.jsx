import React from 'react';
import { Menu, Search, Bell, Mic, MoreVertical, ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Play, Pause, Maximize, Volume2, Settings } from 'lucide-react';

const YouTubeMock = ({ children, isPlaying, onTogglePlay, currentTime = 0, duration = 0 }) => {
  const formatTime = (seconds) => {
      if (!seconds) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] text-white overflow-y-auto">
      {/* YouTube Header */}
      <header className="flex items-center justify-between px-4 h-14 sticky top-0 bg-[#0f0f0f] z-30">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 rounded-full">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1 cursor-pointer">
            <div className="w-8 h-5 bg-red-600 rounded-lg relative flex items-center justify-center">
                <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[6px] border-l-white border-b-[3px] border-b-transparent ml-0.5"></div>
            </div>
            <span className="font-bold text-lg tracking-tighter">YouTube</span>
            <span className="text-[10px] text-gray-400 mb-auto ml-0.5">Mock</span>
          </div>
        </div>
        
        <div className="flex flex-1 max-w-[720px] mx-4 items-center gap-4">
            <div className="flex flex-1 items-center">
                <div className="flex flex-1 items-center bg-[#121212] border border-[#303030] rounded-l-full px-4 h-10 ml-8 focus-within:border-blue-500">
                    <input 
                        type="text" 
                        placeholder="Search" 
                        className="bg-transparent w-full outline-none text-white placeholder-gray-500"
                    />
                </div>
                <button className="h-10 px-5 bg-[#222] border border-l-0 border-[#303030] rounded-r-full hover:bg-[#303030]">
                    <Search size={20} className="text-white" />
                </button>
            </div>
            <button className="p-2.5 bg-[#181818] hover:bg-[#303030] rounded-full">
                <Mic size={20} />
            </button>
        </div>

        <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/10 rounded-full">
                <Bell size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
                V
            </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 p-6 gap-6 max-w-[1750px] mx-auto w-full">
        {/* Primary Column (Video + Info) */}
        <div className="flex-1 min-w-0">
            {/* The Video Player Container */}
            <div 
                className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg mb-4 relative group cursor-pointer"
                onClick={onTogglePlay}
            >
                {children}

                 {/* Playback Controls Overlay - Show on hover or when paused */}
                 <div className={`absolute inset-0 bg-transparent transition-opacity duration-200 flex flex-col justify-end ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                    
                     {/* Centered Play Button (only when paused) */}
                     {!isPlaying && (
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                                 <Play size={32} fill="white" className="ml-1" />
                             </div>
                         </div>
                     )}

                    {/* Bottom Controls Bar */}
                    <div className="bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 pb-1" onClick={(e) => e.stopPropagation()}>
                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer relative group/progress">
                             <div 
                                className="h-full bg-red-600 relative" 
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                             >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full scale-0 group-hover/progress:scale-100 transition-transform" />
                             </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={onTogglePlay} className="hover:text-gray-200">
                                    {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                                </button>
                                <button className="hover:text-gray-200">
                                    <Volume2 size={24} />
                                </button>
                                <span className="text-xs font-medium">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                <button className="hover:text-gray-200">
                                    <Settings size={20} />
                                </button>
                                <button className="hover:text-gray-200">
                                    <Maximize size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Title */}
            <h1 className="text-xl font-bold line-clamp-2 mb-2">My Awesome Screen Recording Project</h1>

            {/* Channel & Actions Row */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">V</div>
                    <div>
                        <div className="font-bold text-base">Vikram Tiwari</div>
                        <div className="text-xs text-gray-400">1.2M subscribers</div>
                    </div>
                    <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium ml-4 hover:bg-gray-200">
                        Subscribe
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#222] rounded-full overflow-hidden">
                        <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#303030] border-r border-[#303030]">
                            <ThumbsUp size={18} />
                            <span className="text-sm font-medium">12K</span>
                        </button>
                        <button className="px-4 py-2 hover:bg-[#303030]">
                            <ThumbsDown size={18} />
                        </button>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#222] rounded-full hover:bg-[#303030]">
                        <Share2 size={18} />
                        <span className="text-sm font-medium">Share</span>
                    </button>
                    <button className="p-2 bg-[#222] rounded-full hover:bg-[#303030]">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* Description Box */}
            <div className="mt-4 bg-[#222] rounded-xl p-3 cursor-pointer hover:bg-[#303030] transition-colors">
                <div className="flex gap-2 text-sm font-medium mb-1">
                    <span>150K views</span>
                    <span>2 hours ago</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">
                    This is a mock description for the screen recording. In this video, we enable users to preview their content exactly as it would appear on YouTube.{"\n\n"}
                    #screenrecording #editor #devtools
                </p>
            </div>
            
            {/* Comments Section Mock */}
            <div className="mt-6">
                <div className="flex items-center gap-8 mb-6">
                    <h3 className="text-xl font-bold">142 Comments</h3>
                    <div className="flex items-center gap-2 cursor-pointer">
                        <MoreHorizontal size={20} className="rotate-90" />
                        <span className="text-sm font-medium">Sort by</span>
                    </div>
                </div>
                
                {/* Add Comment */}
                <div className="flex gap-4 mb-8">
                     <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-bold">V</div>
                     <div className="flex-1">
                         <div className="border-b border-[#303030] pb-2 text-gray-400 text-sm">Add a comment...</div>
                     </div>
                </div>

                {/* Comment 1 */}
                <div className="flex gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex-shrink-0 flex items-center justify-center font-bold">J</div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold">@janedoe</span>
                            <span className="text-xs text-gray-400">1 hour ago</span>
                        </div>
                        <p className="text-sm">This is exactly what I needed! The new editor features are amazing.</p>
                        <div className="flex items-center gap-4 mt-2">
                            <ThumbsUp size={14} className="text-white" />
                            <span className="text-xs text-gray-400">24</span>
                            <ThumbsDown size={14} className="text-white" />
                            <span className="text-xs font-medium cursor-pointer hover:bg-[#303030] px-2 py-1 rounded-full">Reply</span>
                        </div>
                    </div>
                </div>

                {/* Comment 2 */}
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center font-bold">M</div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold">@mike_dev</span>
                            <span className="text-xs text-gray-400">35 minutes ago</span>
                        </div>
                        <p className="text-sm">Can you explain how you did the zoom transition? Looks super smooth.</p>
                         <div className="flex items-center gap-4 mt-2">
                            <ThumbsUp size={14} className="text-white" />
                            <span className="text-xs text-gray-400">5</span>
                            <ThumbsDown size={14} className="text-white" />
                            <span className="text-xs font-medium cursor-pointer hover:bg-[#303030] px-2 py-1 rounded-full">Reply</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Sidebar (Recommendations) */}
        <div className="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex gap-2 cursor-pointer">
                    <div className="w-[168px] h-[94px] bg-neutral-800 rounded-lg flex-shrink-0 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-neutral-700/50 group-hover:bg-neutral-600/50 transition-colors" />
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded font-medium">10:24</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm line-clamp-2 mb-1">Recommended Video Title That Is Quite Long and Descriptive {i}</h4>
                        <div className="text-xs text-gray-400">Channel Name</div>
                        <div className="text-xs text-gray-400">54K views • 2 days ago</div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default YouTubeMock;

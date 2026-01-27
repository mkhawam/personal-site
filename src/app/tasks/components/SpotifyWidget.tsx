'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface SpotifyData {
    isConnected: boolean;
    isPlaying: boolean;
    title?: string;
    artist?: string;
    album?: string;
    albumArt?: string;
    progress?: number;
    duration?: number;
    uri?: string;
    nextTracks?: {
        title: string;
        artist: string;
        albumArt?: string;
        uri: string;
    }[];
}

export default function SpotifyWidget() {
    const [data, setData] = useState<SpotifyData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/spotify/data');
            const json = await res.json();
            setData(json);
            setLoading(false);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (action: 'play' | 'pause' | 'next' | 'previous') => {
        // Optimistic update
        if (data && (action === 'play' || action === 'pause')) {
             const newData = { ...data };
             if (action === 'pause') newData.isPlaying = false;
             if (action === 'play') newData.isPlaying = true;
             setData(newData);
        }

        const res = await fetch('/api/spotify/action', {
            method: 'POST',
            body: JSON.stringify({ action }),
        });

        if (!res.ok) {
            toast.error('Command failed', { description: 'Premium required for controls?' });
            fetchData(); // Revert
        } else {
             setTimeout(fetchData, 500); // Sync
        }
    };
    
    const handlePlayTrack = async (uri: string) => {
        const res = await fetch('/api/spotify/action', {
            method: 'POST',
            body: JSON.stringify({ action: 'play_track', uri }),
        });
        
        if (res.ok) {
            toast.success('Playing track');
            setTimeout(fetchData, 500);
        } else {
            toast.error('Failed to play track');
        }
    };

    if (loading) return <div className="text-zinc-500 text-xs text-center p-4">Loading Spotify...</div>;

    if (!data?.isConnected) {
        return (
            <div className="flex flex-col items-center gap-2 p-2">
                <p className="text-xs text-zinc-400">Connect Spotify to control playback</p>
                <a 
                    href="/api/spotify/login" 
                    className="px-4 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full text-xs transition-colors"
                >
                    Connect Spotify
                </a>
            </div>
        );
    }

    if (!data.isPlaying && !data.title) {
         return (
            <div className="flex flex-col items-center gap-2 p-2">
                <p className="text-xs text-zinc-400">Spotify connected but idle.</p>
                <button 
                  onClick={() => handleAction('play')}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full text-xs transition-colors"
                >
                    Resume Playback
                </button>
            </div>
        );
    }

    return (
        <div className="bg-zinc-800/50 rounded-lg p-3 space-y-3">
             <div className="flex items-center gap-3">
                 {data.albumArt ? (
                     <img src={data.albumArt} alt="Album Art" className="w-12 h-12 rounded-md shadow-md" />
                 ) : (
                     <div className="w-12 h-12 bg-zinc-700 rounded-md animate-pulse" />
                 )}
                 <div className="flex-1 min-w-0">
                     <h4 className="text-sm font-bold text-white truncate">{data.title}</h4>
                     <p className="text-xs text-zinc-400 truncate">{data.artist}</p>
                 </div>
                 <a href={data.uri || '#'} target="_blank" className="text-zinc-500 hover:text-[#1DB954]">
                     <ExternalLink size={14} />
                 </a>
             </div>
             
             {/* Progress Bar */}
             {data.duration && data.progress && (
                 <div className="w-full bg-zinc-700 h-1 rounded-full overflow-hidden">
                     <div 
                        className="bg-[#1DB954] h-full transition-all duration-1000 ease-linear" 
                        style={{ width: `${(data.progress / data.duration) * 100}%` }}
                     />
                 </div>
             )}

             <div className="flex justify-center items-center gap-4">
                 <button onClick={() => handleAction('previous')} className="text-zinc-400 hover:text-white">
                     <SkipBack size={20} fill="currentColor" />
                 </button>
                 <button 
                    onClick={() => handleAction(data.isPlaying ? 'pause' : 'play')}
                    className="p-3 bg-white text-black rounded-full hover:scale-105 transition-transform"
                >
                    {data.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                 </button>
                 <button onClick={() => handleAction('next')} className="text-zinc-400 hover:text-white">
                     <SkipForward size={20} fill="currentColor" />
                 </button>
             </div>

             {/* Up Next Section */}
             {data.nextTracks && data.nextTracks.length > 0 && (
                 <div className="pt-2 mt-2 border-t border-white/5 space-y-2">
                     <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Up Next</span>
                     {data.nextTracks.map((track, i) => (
                         <div 
                            key={i} 
                            onClick={() => handlePlayTrack(track.uri)}
                            className="flex items-center gap-2 min-w-0 group cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                         >
                             {track.albumArt && (
                                 <div className="relative w-6 h-6">
                                     <img src={track.albumArt} className="w-6 h-6 rounded shadow group-hover:opacity-50 transition-opacity" alt="Next" />
                                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                         <Play size={10} fill="white" className="text-white" />
                                     </div>
                                 </div>
                             )}
                             <div className="min-w-0 flex-1">
                                 <p className="text-xs text-zinc-300 truncate font-medium group-hover:text-white">{track.title}</p>
                                 <p className="text-[10px] text-zinc-500 truncate">{track.artist}</p>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
        </div>
    );
}

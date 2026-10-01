"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Headphones, Pause, Play, Video, Volume2, VolumeX, X } from "lucide-react";
import { FaYoutube } from "react-icons/fa";
import { RADIO_STATIONS } from "../constants";
import SpotifyWidget from "./SpotifyWidget";

type MusicMode = "radio" | "spotify" | "video";
type StreamType = "youtube" | "twitch";

const YT_DEFAULT = "jfKfPfyJRdk";
const TWITCH_DEFAULT = "lofiradio";

/**
 * Focus-music toggle + dropdown (radio / Spotify / video) and the floating
 * video player. Entirely self-contained: nothing else in the app reads music
 * state. The player is portaled to <body> so a transformed header can't trap
 * its fixed positioning.
 */
export default function MusicPanel() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<MusicMode>("spotify");
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [station, setStation] = useState(0);
    const [showPlayer, setShowPlayer] = useState(false);
    const [streamId, setStreamId] = useState("");
    const [streamType, setStreamType] = useState<StreamType>("youtube");
    const [mounted, setMounted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => setMounted(true), []);

    const stopRadio = () => {
        if (playing && audioRef.current) {
            audioRef.current.pause();
            setPlaying(false);
        }
    };

    const toggleRadio = () => {
        const el = audioRef.current;
        if (!el) return;
        if (playing) el.pause();
        else el.play().catch((e) => console.log("Music play failed", e));
        setPlaying(!playing);
    };

    const pickStation = (i: number) => {
        setStation(i);
        const el = audioRef.current;
        if (!el) return;
        el.src = RADIO_STATIONS[i].url;
        el.volume = volume;
        el.play().catch((e) => console.log("Music play failed", e));
        setPlaying(true);
    };

    const modeButton = (m: MusicMode, label: string, activeClass: string) => (
        <button
            onClick={() => {
                setMode(m);
                if (m !== "radio") stopRadio();
            }}
            className={clsx("flex-1 text-xs py-1.5 font-medium rounded-md transition-all", mode === m ? activeClass : "text-base-content/50 hover:text-base-content/80")}
        >
            {label}
        </button>
    );

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={clsx("btn btn-circle btn-ghost hover:bg-base-content/10", playing ? "text-success" : "text-base-content/50 hover:text-base-content")}
                title={playing ? "Music playing" : "Focus music"}
                aria-expanded={open}
            >
                <Headphones size={24} />
            </button>

            <audio ref={audioRef} src={RADIO_STATIONS[station]?.url || RADIO_STATIONS[0].url} loop />

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full right-0 mt-2 p-4 bg-base-200 border border-base-content/10 rounded-xl shadow-2xl z-50 w-96"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-base-content/80">Focus Music</span>
                            {mode === "radio" && (
                                <button
                                    onClick={toggleRadio}
                                    className={clsx("btn btn-sm btn-circle", playing ? "bg-success text-success-content" : "bg-base-300 text-base-content/80")}
                                    aria-label={playing ? "Pause radio" : "Play radio"}
                                >
                                    {playing ?
                                        <Pause size={14} />
                                    :   <Play size={14} />}
                                </button>
                            )}
                        </div>

                        <div className="flex bg-base-300/40 p-1 rounded-lg mb-4">
                            {modeButton("radio", "Radio", "bg-base-300 text-base-content shadow-sm")}
                            {modeButton("spotify", "Spotify", "bg-[#1DB954] text-black shadow-sm")}
                            {modeButton("video", "Video", "bg-error text-white shadow-sm")}
                        </div>

                        {mode === "radio" ?
                            <>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {RADIO_STATIONS.map((s, i) => (
                                        <button
                                            key={s.name}
                                            onClick={() => pickStation(i)}
                                            className={clsx(
                                                "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left truncate",
                                                station === i ? `${s.color} text-white` : "bg-base-content/5 text-base-content/70 hover:bg-base-content/10",
                                            )}
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    <VolumeX size={16} className="text-base-content/50" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={volume}
                                        onChange={(e) => {
                                            const vol = parseFloat(e.target.value);
                                            setVolume(vol);
                                            if (audioRef.current) audioRef.current.volume = vol;
                                        }}
                                        className="flex-1 accent-success h-1 bg-base-300 rounded-lg appearance-none cursor-pointer"
                                        aria-label="Volume"
                                    />
                                    <Volume2 size={16} className="text-base-content/50" />
                                </div>
                            </>
                        : mode === "spotify" ?
                            <SpotifyWidget />
                        :   <div className="space-y-3">
                                <p className="text-xs text-base-content/50 font-medium">Video Stream</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setStreamType("youtube")}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1",
                                            streamType === "youtube" ? "bg-error text-white" : "bg-base-content/5 text-base-content/70",
                                        )}
                                    >
                                        <FaYoutube size={14} /> YouTube
                                    </button>
                                    <button
                                        onClick={() => setStreamType("twitch")}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1",
                                            streamType === "twitch" ? "bg-secondary text-white" : "bg-base-content/5 text-base-content/70",
                                        )}
                                    >
                                        <Video size={14} /> Twitch
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder={streamType === "youtube" ? "Video ID (e.g., jfKfPfyJRdk)" : "Channel name (e.g., lolostream)"}
                                    value={streamId}
                                    onChange={(e) => setStreamId(e.target.value)}
                                    className="w-full bg-base-300/40 text-base-content/80 text-xs px-3 py-2 rounded-lg border border-base-content/10 focus:border-base-content/40 outline-none"
                                />
                                <div className="flex gap-2">
                                    {[
                                        { label: "Lofi Girl", id: "jfKfPfyJRdk" },
                                        { label: "Chillhop", id: "rUxyKA_-grg" },
                                    ].map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                setStreamType("youtube");
                                                setStreamId(p.id);
                                            }}
                                            className="flex-1 px-2 py-1 bg-base-content/5 hover:bg-base-content/10 rounded text-xs text-base-content/70"
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        setShowPlayer(!showPlayer);
                                        stopRadio();
                                    }}
                                    className={clsx(
                                        "w-full px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                        showPlayer ? "bg-error text-white" : "bg-primary text-primary-content hover:bg-primary/90",
                                    )}
                                >
                                    {showPlayer ? "Close Player" : "Open Player"}
                                </button>
                            </div>
                        }
                    </motion.div>
                )}
            </AnimatePresence>

            {mounted &&
                createPortal(
                    <AnimatePresence>
                        {showPlayer && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                className="fixed bottom-8 right-8 z-50 bg-base-200 rounded-2xl shadow-2xl border border-base-content/10 overflow-hidden"
                            >
                                <div className="flex items-center justify-between px-4 py-2 bg-base-300/50">
                                    <span className="text-sm font-bold text-base-content/80">{streamType === "youtube" ? "YouTube" : "Twitch"}</span>
                                    <button onClick={() => setShowPlayer(false)} className="text-base-content/50 hover:text-base-content" aria-label="Close player">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="w-[320px] h-[180px] bg-black">
                                    {streamType === "youtube" ?
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${streamId || YT_DEFAULT}?autoplay=1`}
                                            title="LoFi Player"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="border-none"
                                        />
                                    :   <iframe
                                            src={`https://player.twitch.tv/?channel=${streamId || TWITCH_DEFAULT}&parent=${window.location.hostname}`}
                                            height="100%"
                                            width="100%"
                                            allowFullScreen
                                            className="border-none"
                                        />
                                    }
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </div>
    );
}

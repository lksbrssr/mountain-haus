"use client";

import { useEffect, useRef, useState } from "react";

// Plays the "Yodeling – Sound Effect" YouTube clip on click, via a hidden
// YouTube IFrame player (the legit way to play a YouTube sound — we don't
// download or re-host it). Click is the user gesture that lets it play audio.
const VIDEO_ID = "siQO8gJJJ_c";
const CONTAINER_ID = "yodel-yt-player";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function YodelButton() {
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    function createPlayer() {
      const YT = (window as any).YT;
      if (cancelled || !YT?.Player || playerRef.current) return;
      playerRef.current = new YT.Player(CONTAINER_ID, {
        host: "https://www.youtube-nocookie.com",
        videoId: VIDEO_ID,
        width: "1",
        height: "1",
        playerVars: { playsinline: 1, controls: 0, disablekb: 1, rel: 0, fs: 0 },
        events: {
          onReady: () => !cancelled && setReady(true),
          onStateChange: (e: any) => {
            const s = (window as any).YT?.PlayerState;
            if (e.data === s?.PLAYING) setPlaying(true);
            if (e.data === s?.PAUSED || e.data === s?.ENDED) setPlaying(false);
          },
        },
      });
    }

    if ((window as any).YT?.Player) {
      createPlayer();
    } else {
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
      if (!document.getElementById("yt-iframe-api")) {
        const s = document.createElement("script");
        s.id = "yt-iframe-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, []);

  function toggle() {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pauseVideo?.();
    } else {
      try {
        p.unMute?.();
        p.setVolume?.(100);
      } catch {
        /* ignore */
      }
      p.seekTo?.(0, true);
      p.playVideo?.();
    }
  }

  return (
    <>
      {/* hidden player, kept in the DOM but off-screen */}
      <div aria-hidden className="pointer-events-none fixed bottom-0 left-[-9999px] h-px w-px overflow-hidden opacity-0">
        <div id={CONTAINER_ID} />
      </div>
      <button
        onClick={toggle}
        disabled={!ready}
        aria-label="Play a yodel"
        className="rounded-full border border-clay/40 px-4 py-2 text-sm text-pine transition hover:bg-sand/60 disabled:opacity-60"
      >
        {playing ? "⏸ Stop yodeling" : "🏔️ Yodel!"}
      </button>
    </>
  );
}

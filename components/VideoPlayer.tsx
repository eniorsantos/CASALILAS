"use client";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export function VideoPlayer({ lessonId }: { lessonId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/playback-url`)
      .then((res) => res.json())
      .then((data) => setPlaybackUrl(data.url));
  }, [lessonId]);

  useEffect(() => {
    if (!playbackUrl || !videoRef.current) return;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(playbackUrl);
      hls.attachMedia(videoRef.current);
      return () => hls.destroy();
    } else {
      videoRef.current.src = playbackUrl;
    }
  }, [playbackUrl]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current) {
        fetch(`/api/lessons/${lessonId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ watchedSeconds: Math.floor(videoRef.current.currentTime) }),
        });
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [lessonId]);

  return (
    <video
      ref={videoRef}
      controls
      controlsList="nodownload"
      onContextMenu={(e) => e.preventDefault()}
      className="w-full aspect-video rounded-lg bg-black"
    />
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

const AUDIO_SRC = "/audio/clair-de-lune.ogg";

export function FocusedAudioPlayer({ visible }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [phase, setPhase] = useState("hidden");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const syncPlaying = () => setIsPlaying(!audio.paused);
    const syncEnded = () => setIsPlaying(false);
    const syncError = () => setHasError(true);

    audio.addEventListener("play", syncPlaying);
    audio.addEventListener("pause", syncPlaying);
    audio.addEventListener("ended", syncEnded);
    audio.addEventListener("error", syncError);

    return () => {
      audio.removeEventListener("play", syncPlaying);
      audio.removeEventListener("pause", syncPlaying);
      audio.removeEventListener("ended", syncEnded);
      audio.removeEventListener("error", syncError);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!visible) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setPhase("hidden");
      return;
    }

    setHasError(false);
    setPhase("notice");

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      setIsPlaying(false);
    });

    const timer = window.setTimeout(() => {
      setPhase("player");
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`focused-audio-player is-${phase}`}>
      <audio ref={audioRef} src={AUDIO_SRC} preload="metadata" />
      <p className={`focused-audio-note ${phase === "notice" ? "is-visible" : "is-hidden"}`}>
        Music helps improve focus - enjoy
      </p>
      <div className={`focused-audio-controls ${phase === "player" ? "is-visible" : "is-hidden"}`}>
        <p className="focused-audio-title">Claude Debussy: Clair de lune</p>
        <div className="focused-audio-actions">
          <button
            type="button"
            onClick={() => {
              const audio = audioRef.current;
              if (!audio) return;

              if (audio.paused) {
                audio.play().then(() => {
                  setIsPlaying(true);
                }).catch(() => {
                  setIsPlaying(false);
                });
              } else {
                audio.pause();
                setIsPlaying(false);
              }
            }}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              const audio = audioRef.current;
              if (!audio) return;

              const nextMuted = !audio.muted;
              audio.muted = nextMuted;
              setIsMuted(nextMuted);
            }}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
        </div>
        <p className="focused-audio-credit">
          {hasError
            ? "Audio file unavailable."
            : "Recording by Laurens Goedhart via Wikimedia Commons, CC BY 3.0."}
        </p>
      </div>
    </div>
  );
}

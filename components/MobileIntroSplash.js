"use client";

import { useEffect, useState } from "react";

const lines = [
  "A modern-day drifter,",
  "chasing photons like they owe rent.",
  "Whether it's celluloid or silicon,",
  "the chase stays the same.",
];

export function MobileIntroSplash() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    if (!mediaQuery.matches || sessionStorage.getItem("mobileIntroSeen") === "true") {
      return undefined;
    }

    setIsVisible(true);
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("mobileIntroSeen", "true");
      setIsVisible(false);
    }, 6400);

    return () => window.clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="mobile-intro-splash" aria-hidden="true">
      <div className="mobile-intro-lines">
        {lines.map((line, index) => (
          <span key={line} style={{ "--line-index": index }}>
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}

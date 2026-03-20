"use client";

import { useEffect, useState } from "react";

export function Carousel({ slides }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setCurrentIndex((current) => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return <div className="carousel-track" />;

  return (
    <div className="carousel" aria-label="Featured work">
      <div className="carousel-track">
        {slides.map((slide, index) => (
          <figure key={`${slide.src}-${index}`} className={`carousel-slide ${index === currentIndex ? "is-current" : ""}`}>
            <div className="carousel-media">
              <img src={slide.src} alt={slide.alt} />
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}

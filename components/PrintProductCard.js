"use client";

import { useEffect, useState } from "react";

function formatPrice(price) {
  return new Intl.NumberFormat("en-DK", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

function useImageRatio(src) {
  const [ratio, setRatio] = useState(1);

  useEffect(() => {
    let isCancelled = false;
    const image = new Image();

    image.onload = () => {
      if (isCancelled) return;
      const nextRatio = image.naturalWidth / Math.max(image.naturalHeight, 1);
      setRatio(nextRatio || 1);
    };

    image.src = src;

    return () => {
      isCancelled = true;
    };
  }, [src]);

  return ratio;
}

function MockupSlide({ src, alt }) {
  const ratio = useImageRatio(src);
  const orientationClass =
    ratio < 0.92 ? "is-portrait" : ratio > 1.08 ? "is-landscape" : "is-square";

  return (
    <div className={`print-mockup ${orientationClass}`}>
      <div className="print-mockup-room" />
      <div className="print-mockup-frame">
        <div className="print-mockup-mat">
          <div className="print-mockup-art" style={{ "--print-ratio": ratio }}>
            <img src={src} alt={alt} loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrintProductCard({ product }) {
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = [
    {
      key: `${product.id}-artwork`,
      type: "image",
    },
    {
      key: `${product.id}-mockup`,
      type: "mockup",
    },
  ];

  const currentSlide = slides[slideIndex];

  return (
    <article className="print-card">
      <div className="print-card-media">
        {currentSlide.type === "image" ? (
          <img src={product.src} alt={product.alt} loading="lazy" />
        ) : (
          <MockupSlide src={product.src} alt={product.alt} />
        )}
      </div>

      <div className="print-card-gallery-nav">
        <div className="print-card-gallery-nav-group">
          <button
            type="button"
            className="print-gallery-arrow"
            onClick={() => setSlideIndex((current) => (current - 1 + slides.length) % slides.length)}
            aria-label="Show previous print preview"
          >
            ←
          </button>
          <p>
            {slideIndex + 1} / {slides.length}
          </p>
          <button
            type="button"
            className="print-gallery-arrow"
            onClick={() => setSlideIndex((current) => (current + 1) % slides.length)}
            aria-label="Show next print preview"
          >
            →
          </button>
        </div>
      </div>

      <div className="print-card-copy">
        <h2>{product.title}</h2>
        {product.description ? <p className="print-card-description">{product.description}</p> : null}
        {product.technical ? (
          <div className="print-card-technical">
            <p>
              <strong>Technical</strong> {product.technical}
            </p>
          </div>
        ) : null}
        <div className="print-card-cta">
          {product.paper ? <p className="print-card-paper">{product.paper}</p> : null}
          {product.sizeOptions.length ? (
            <ul className="print-card-options">
              {product.sizeOptions.map((option) => (
                <li key={`${product.id}-${option.label}`}>
                  <span>{option.label}</span>
                  <span>{formatPrice(option.price)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="print-card-placeholder">Print details are being prepared.</p>
          )}
          <p className="print-card-note">Soon available for order.</p>
        </div>
      </div>
    </article>
  );
}

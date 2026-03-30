"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function ProjectMedia({ item, eager = false }) {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  if (item.mediaType === "video") {
    return (
      <video
        ref={videoRef}
        src={item.src}
        aria-label={item.alt}
        playsInline
        muted
        loop
        autoPlay
        controls={isHovered}
        preload="metadata"
        onMouseEnter={() => {
          setIsHovered(true);
          videoRef.current?.play().catch(() => {});
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          if (videoRef.current) {
            videoRef.current.muted = true;
          }
        }}
      />
    );
  }

  return <img src={item.src} alt={item.alt} loading={eager ? "eager" : "lazy"} />;
}

function ProjectFocusedMedia({ item }) {
  if (item.mediaType === "video") {
    return (
      <video
        src={item.src}
        aria-label={item.alt}
        controls
        playsInline
        muted
        autoPlay
        loop
        preload="metadata"
      />
    );
  }

  return <img src={item.src} alt={item.alt} loading="eager" />;
}

function measureItem(item) {
  return new Promise((resolve) => {
    if (item.mediaType === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () =>
        resolve({
          width: video.videoWidth || 1,
          height: video.videoHeight || 1,
        });
      video.onerror = () => resolve({ width: 1, height: 1.35 });
      video.src = item.src;
      return;
    }

    const image = new Image();
    image.onload = () =>
      resolve({
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
      });
    image.onerror = () => resolve({ width: 1, height: 1.35 });
    image.src = item.src;
  });
}

function buildBalancedColumns(items, columnCount, ratios = new Map()) {
  const columns = Array.from({ length: columnCount }, () => []);
  const heights = Array.from({ length: columnCount }, () => 0);

  items.forEach((item) => {
    let shortestColumnIndex = 0;

    for (let index = 1; index < columnCount; index += 1) {
      if (heights[index] < heights[shortestColumnIndex]) {
        shortestColumnIndex = index;
      }
    }

    columns[shortestColumnIndex].push(item);
    heights[shortestColumnIndex] += ratios.get(item.id) || 1.35;
  });

  return columns;
}

function useResponsiveColumnCount() {
  const [columnCount, setColumnCount] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth <= 640) {
        setColumnCount(1);
        return;
      }

      if (window.innerWidth <= 900) {
        setColumnCount(2);
        return;
      }

      setColumnCount(3);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return columnCount;
}

export function ProjectMediaGrid({ items }) {
  const columnCount = useResponsiveColumnCount();
  const [ratios, setRatios] = useState(() => new Map());
  const [focusedIndex, setFocusedIndex] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    Promise.all(
      items.map(async (item, index) => {
        const dimensions = await measureItem(item);
        return [item.id || `project-media-${index + 1}`, dimensions.height / Math.max(dimensions.width, 1)];
      })
    ).then((entries) => {
      if (isCancelled) return;
      setRatios(new Map(entries));
    });

    return () => {
      isCancelled = true;
    };
  }, [items]);

  useEffect(() => {
    if (focusedIndex === null) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setFocusedIndex(null);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setFocusedIndex((current) => {
          const safeCurrent = current ?? 0;
          return (safeCurrent + 1) % items.length;
        });
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setFocusedIndex((current) => {
          const safeCurrent = current ?? 0;
          return (safeCurrent - 1 + items.length) % items.length;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, items.length]);

  const normalizedItems = useMemo(
    () =>
      items.map((item, index) => ({
        ...item,
        id: item.id || `project-media-${index + 1}`,
      })),
    [items]
  );

  const columns = buildBalancedColumns(normalizedItems, columnCount, ratios);
  const focusedItem = focusedIndex === null ? null : normalizedItems[focusedIndex] || null;

  return (
    <>
      {focusedItem ? <div className="project-lightbox-overlay" aria-hidden="true" /> : null}

      <section className="project-media-grid" aria-label="Project gallery">
        <div className="portfolio-columns">
          {columns.map((columnItems, columnIndex) => (
            <div key={`project-column-${columnIndex + 1}`} className="portfolio-column">
              {columnItems.map((item) => {
                const index = normalizedItems.findIndex((entry) => entry.id === item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    className="portfolio-card project-media-card"
                    onClick={() => setFocusedIndex(index)}
                  >
                    <div className="media-frame">
                      <ProjectMedia item={item} />
                    </div>
                    <span className="project-media-hover" aria-hidden="true">
                      <span className="project-media-hover-icon">+</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {focusedItem ? (
        <section className="project-lightbox" aria-label="Expanded project media view">
          <div className="project-lightbox-stage">
            <button
              className="focused-gallery-arrow is-prev"
              type="button"
              onClick={() =>
                setFocusedIndex((current) => {
                  const safeCurrent = current ?? 0;
                  return (safeCurrent - 1 + normalizedItems.length) % normalizedItems.length;
                })
              }
            >
              ←
            </button>
            <div className="focused-gallery-media project-lightbox-media">
              <ProjectFocusedMedia item={focusedItem} />
            </div>
            <button
              className="focused-gallery-arrow is-next"
              type="button"
              onClick={() =>
                setFocusedIndex((current) => {
                  const safeCurrent = current ?? 0;
                  return (safeCurrent + 1) % normalizedItems.length;
                })
              }
            >
              →
            </button>
          </div>

          <div className="project-lightbox-meta">
            <p>
              {focusedIndex + 1} / {normalizedItems.length}
            </p>
            <button type="button" className="project-lightbox-close" onClick={() => setFocusedIndex(null)}>
              Back to project
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}

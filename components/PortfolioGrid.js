"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

function PortfolioMedia({ item }) {
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

  return <img src={item.src} alt={item.alt} loading="lazy" />;
}

function useResponsiveColumnCount(enabled) {
  const [columnCount, setColumnCount] = useState(3);

  useEffect(() => {
    if (!enabled) return undefined;

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
  }, [enabled]);

  return columnCount;
}

function renderPortfolioCard(item) {
  const overviewItem = {
    ...item,
    span: "single",
  };
  const hasProjectLink = Boolean(item.projectSlug);
  const hasJournalLink = !item.projectSlug && Boolean(item.journalSlug);
  const href = hasProjectLink ? `/work/${item.projectSlug}` : hasJournalLink ? `/journal/${item.journalSlug}` : null;
  const ctaLabel = hasProjectLink ? "See more images" : hasJournalLink ? "Read the journal" : "";
  const cardClassName = [
    "portfolio-card",
    href ? "portfolio-link" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return href ? (
    <Link
      key={item.id}
      href={href}
      className={cardClassName}
      data-focus={overviewItem.focus}
      data-title={overviewItem.title}
      data-year={overviewItem.year}
      data-cta={ctaLabel}
    >
      <div className="media-frame">
        <PortfolioMedia item={overviewItem} />
      </div>
    </Link>
  ) : (
    <article
      key={item.id}
      className={cardClassName}
      data-focus={overviewItem.focus}
      data-title={overviewItem.title}
      data-year={overviewItem.year}
    >
      <div className="media-frame">
        <PortfolioMedia item={overviewItem} />
      </div>
    </article>
  );
}

export function PortfolioGrid({ items, className = "", preview = false, layout = "precise" }) {
  const gridClassName = useMemo(() => `portfolio ${className}`.trim(), [className]);
  const columnCount = useResponsiveColumnCount(layout === "manual-columns");

  if (layout === "manual-columns") {
    const columns = Array.from({ length: columnCount }, (_, columnIndex) =>
      items.filter((_, itemIndex) => itemIndex % columnCount === columnIndex)
    );

    return (
      <section
        className={gridClassName}
        data-layout={layout}
        aria-label={preview ? "Admin preview" : "Portfolio"}
      >
        <div className="portfolio-columns">
          {columns.map((columnItems, columnIndex) => (
            <div key={`column-${columnIndex + 1}`} className="portfolio-column">
              {columnItems.map((item) => renderPortfolioCard(item))}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className={gridClassName}
      data-layout={layout}
      aria-label={preview ? "Admin preview" : "Portfolio"}
    >
      {items.map((item) => renderPortfolioCard(item))}
    </section>
  );
}

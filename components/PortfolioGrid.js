"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function PortfolioMedia({ item }) {
  const videoSource = item.videoPreview?.src || item.previewSrc || item.src;

  if (item.mediaType === "video") {
    return (
      <>
        <video
          src={videoSource}
          aria-label={item.alt}
          playsInline
          muted
          loop
          autoPlay
          preload="metadata"
        />
        <div className="portfolio-video-overlay" aria-hidden="true">
          <span className="portfolio-video-frame" />
          <span className="portfolio-video-marker">+</span>
        </div>
      </>
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

function measureItem(item) {
  return new Promise((resolve) => {
    if (item.mediaType === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth || 1,
          height: video.videoHeight || 1,
        });
      };
      video.onerror = () => resolve({ width: 1, height: 1.35 });
      video.src = item.videoPreview?.src || item.previewSrc || item.src;
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

function renderPortfolioCard(item, index, onPreviewItem) {
  const overviewItem = {
    ...item,
    span: "single",
  };
  const hasProjectLink = Boolean(item.projectSlug);
  const hasJournalLink = !item.projectSlug && Boolean(item.journalSlug);
  const hasExternalVideoLink = !hasProjectLink && !hasJournalLink && Boolean(item.videoPreview?.youtubeUrl);
  const href = hasProjectLink
    ? `/work/${item.projectSlug}`
    : hasJournalLink
      ? `/journal/${item.journalSlug}`
      : hasExternalVideoLink
        ? item.videoPreview.youtubeUrl
        : null;
  const ctaLabel = hasProjectLink
    ? "See more images"
    : hasJournalLink
      ? "Read the journal"
      : hasExternalVideoLink
        ? "Watch full video"
        : "";
  const hasPrintAction = !href && Boolean(item.print?.enabled);
  const hasPreviewAction = !href && !hasPrintAction && typeof onPreviewItem === "function";
  const cardClassName = [
    "portfolio-card",
    item.mediaType === "video" ? "portfolio-video-card" : "",
    href ? "portfolio-link-card" : "",
    hasPrintAction ? "portfolio-print-card" : "",
    hasPreviewAction ? "portfolio-preview-card" : "",
    href && item.print?.enabled ? "portfolio-print-enabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const cardProps = {
    key: item.id,
    className: cardClassName,
    "data-focus": overviewItem.focus,
    "data-title": overviewItem.title,
    "data-year": overviewItem.year,
    "data-print-cta": item.print?.enabled ? "Buy limited print" : "",
  };

  return (
    <article {...cardProps}>
      {href ? (
        hasExternalVideoLink ? (
          <a href={href} className="portfolio-link" data-cta={ctaLabel} target="_blank" rel="noreferrer">
            <div className="media-frame">
              <PortfolioMedia item={overviewItem} />
            </div>
          </a>
        ) : (
          <Link href={href} className="portfolio-link" data-cta={ctaLabel}>
            <div className="media-frame">
              <PortfolioMedia item={overviewItem} />
            </div>
          </Link>
        )
      ) : hasPrintAction ? (
        <>
          <div className="media-frame">
            <PortfolioMedia item={overviewItem} />
          </div>
          <Link href="/prints" className="portfolio-print-center-link">
            Buy limited print
          </Link>
        </>
      ) : hasPreviewAction ? (
        <button type="button" className="portfolio-preview-action" onClick={() => onPreviewItem(index)}>
          <div className="media-frame">
            <PortfolioMedia item={overviewItem} />
          </div>
          {item.mediaType === "video" ? null : (
            <span className="portfolio-preview-icon" aria-hidden="true">
              +
            </span>
          )}
        </button>
      ) : (
        <div className="media-frame">
          <PortfolioMedia item={overviewItem} />
        </div>
      )}
      {href && item.print?.enabled ? (
        <Link href="/prints" className="portfolio-print-badge">
          Buy limited print
        </Link>
      ) : null}
    </article>
  );
}

export function PortfolioGrid({
  items,
  className = "",
  preview = false,
  layout = "precise",
  onPreviewItem,
}) {
  const gridClassName = useMemo(() => `portfolio ${className}`.trim(), [className]);
  const columnCount = useResponsiveColumnCount(layout === "manual-columns");
  const [ratios, setRatios] = useState(() => new Map());

  useEffect(() => {
    if (layout !== "manual-columns") return undefined;

    let isCancelled = false;

    Promise.all(
      items.map(async (item) => {
        const dimensions = await measureItem(item);
        return [item.id, dimensions.height / Math.max(dimensions.width, 1)];
      })
    ).then((entries) => {
      if (isCancelled) return;
      setRatios(new Map(entries));
    });

    return () => {
      isCancelled = true;
    };
  }, [items, layout]);

  if (layout === "manual-columns") {
    const columns = buildBalancedColumns(items, columnCount, ratios);

    return (
      <section
        className={gridClassName}
        data-layout={layout}
        aria-label={preview ? "Admin preview" : "Portfolio"}
      >
        <div className="portfolio-columns">
            {columns.map((columnItems, columnIndex) => (
              <div key={`column-${columnIndex + 1}`} className="portfolio-column">
              {columnItems.map((item) => {
                const index = items.findIndex((entry) => entry.id === item.id);
                return renderPortfolioCard(item, index, onPreviewItem);
              })}
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
      {items.map((item, index) => renderPortfolioCard(item, index, onPreviewItem))}
    </section>
  );
}

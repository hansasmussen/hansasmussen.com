"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { FocusedAudioPlayer } from "@/components/FocusedAudioPlayer";
import { PortfolioGrid } from "@/components/PortfolioGrid";

function FocusedMedia({ item }) {
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

export function WorkExperience({ items, manifesto }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isFocused = searchParams.get("view") === "focused";
  const focusedIndex = Math.max(0, Math.min(Number(searchParams.get("item") || 0), items.length - 1));
  const focusedItem = items[focusedIndex] || null;

  const focusedHref = useMemo(() => {
    if (!focusedItem) return null;
    if (focusedItem.projectSlug) return `/work/${focusedItem.projectSlug}`;
    if (focusedItem.journalSlug) return `/journal/${focusedItem.journalSlug}`;
    return null;
  }, [focusedItem]);

  const focusedCta = focusedItem?.projectSlug
    ? "See more images"
    : focusedItem?.journalSlug
      ? "Read the journal"
      : null;

  const setFocusedMode = (nextFocused, nextIndex = 0) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextFocused) {
      params.set("view", "focused");
      params.set("item", String(nextIndex));
    } else {
      params.delete("view");
      params.delete("item");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const step = (direction) => {
    if (!items.length) return;
    const nextIndex = (focusedIndex + direction + items.length) % items.length;
    setFocusedMode(true, nextIndex);
  };

  useEffect(() => {
    if (!isFocused) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setFocusedMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, focusedIndex, items.length]);

  return (
    <>
      {isFocused ? <div className="focused-page-overlay" aria-hidden="true" /> : null}
      <section className="intro work-intro">
        <p className="work-manifesto">{manifesto}</p>
        <div className="work-view-actions">
          <button className="work-view-link" type="button" onClick={() => setFocusedMode(!isFocused, focusedIndex)}>
            {isFocused ? "Back to grid" : "Focused view"}
          </button>
        </div>
      </section>

      {isFocused && focusedItem ? (
        <section className="focused-gallery" aria-label="Focused portfolio view">
          <div className="focused-gallery-stage">
            <button className="focused-gallery-arrow is-prev" type="button" onClick={() => step(-1)}>
              ←
            </button>
            <div className="focused-gallery-media">
              <FocusedMedia item={focusedItem} />
            </div>
            <button className="focused-gallery-arrow is-next" type="button" onClick={() => step(1)}>
              →
            </button>
          </div>

          <div className="focused-gallery-meta">
            <p>
              {focusedIndex + 1} / {items.length}
            </p>
          </div>
          {focusedHref ? (
            <Link className="focused-gallery-project-link" href={focusedHref}>
              See more from project
            </Link>
          ) : null}
          <FocusedAudioPlayer visible={isFocused} />
        </section>
      ) : (
        <section className="work-gallery work-gallery-embedded">
          <div className="work-gallery-inner">
            <PortfolioGrid items={items} layout="manual-columns" />
          </div>
        </section>
      )}
    </>
  );
}

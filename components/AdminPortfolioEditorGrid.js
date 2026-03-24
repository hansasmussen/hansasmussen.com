"use client";

import { useEffect, useState } from "react";

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
      if (window.innerWidth <= 700) {
        setColumnCount(1);
        return;
      }

      if (window.innerWidth <= 1100) {
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

function AdminDragHint() {
  return (
    <span className="admin-portfolio-drag-hint" aria-hidden="true">
      Drag
    </span>
  );
}

function AdminPortfolioMedia({ item }) {
  if (item.mediaType === "video") {
    return <video src={item.src} muted playsInline loop autoPlay preload="metadata" />;
  }

  return <img src={item.src} alt={item.alt} loading="lazy" />;
}

export function AdminPortfolioEditorGrid({
  items,
  draggedId,
  setDraggedId,
  reorderItems,
  updateItem,
  removeItem,
}) {
  const columnCount = useResponsiveColumnCount();
  const [ratios, setRatios] = useState(() => new Map());
  const [dropTargetId, setDropTargetId] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);

  useEffect(() => {
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
  }, [items]);

  const columns = buildBalancedColumns(items, columnCount, ratios);

  return (
    <section className="admin-portfolio-grid" aria-label="Portfolio items">
      <div className="admin-portfolio-columns">
        {columns.map((columnItems, columnIndex) => (
          <div key={`admin-column-${columnIndex + 1}`} className="admin-portfolio-column">
            {columnItems.map((item) => (
              <article
                key={item.id}
                className={`admin-portfolio-card ${draggedId === item.id ? "is-dragging" : ""} ${dropTargetId === item.id && draggedId !== item.id ? "is-drop-target" : ""}`}
                draggable
                onDragStart={() => setDraggedId(item.id)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDropTargetId(null);
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  if (draggedId && draggedId !== item.id) setDropTargetId(item.id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (draggedId && draggedId !== item.id) setDropTargetId(item.id);
                }}
                onDragLeave={() => {
                  if (dropTargetId === item.id) setDropTargetId(null);
                }}
                onDrop={() => {
                  if (draggedId) reorderItems(draggedId, item.id);
                  setDraggedId(null);
                  setDropTargetId(null);
                }}
              >
                {dropTargetId === item.id && draggedId !== item.id ? (
                  <div className="admin-drop-indicator">Drop here</div>
                ) : null}
                <div className={`admin-portfolio-card-panel ${expandedCardId === item.id ? "is-open" : ""}`}>
                  <button
                    className="admin-portfolio-card-head"
                    type="button"
                    onClick={() =>
                      setExpandedCardId((current) => (current === item.id ? null : item.id))
                    }
                  >
                    <div className="admin-portfolio-card-copy">
                      <strong>{item.title}</strong>
                      <span>
                        {item.mediaType === "video" ? "Video" : "Image"}
                        {item.featured ? " / Carousel" : ""}
                      </span>
                    </div>
                    <div className="admin-portfolio-card-head-side">
                      <AdminDragHint />
                      <span className="admin-portfolio-card-toggle" aria-hidden="true">
                        {expandedCardId === item.id ? "−" : "+"}
                      </span>
                    </div>
                  </button>

                  {expandedCardId === item.id ? (
                    <form
                      className="admin-link-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        updateItem(item.id, (current) => ({
                          ...current,
                          projectSlug: String(formData.get("projectSlug") || "") || null,
                          journalSlug: String(formData.get("journalSlug") || "") || null,
                        }));
                      }}
                    >
                      <label>
                        Project slug
                        <input name="projectSlug" defaultValue={item.projectSlug || ""} />
                      </label>
                      <label>
                        Journal slug
                        <input name="journalSlug" defaultValue={item.journalSlug || ""} />
                      </label>
                      <div className="admin-portfolio-card-actions">
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, (current) => ({ ...current, featured: !current.featured }))}
                        >
                          {item.featured ? "In carousel" : "Carousel"}
                        </button>
                        <button type="submit">Save</button>
                        <button type="button" onClick={() => removeItem(item.id)}>
                          Remove
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>

                <div className="admin-portfolio-card-media">
                  <AdminPortfolioMedia item={item} />
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

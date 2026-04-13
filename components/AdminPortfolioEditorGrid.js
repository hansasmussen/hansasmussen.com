"use client";

import { useEffect, useState } from "react";

function sanitizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function measureItem(item) {
  return new Promise((resolve) => {
    if (item.mediaType === "video") {
      const videoSource = item.videoPreview?.src || item.previewSrc || item.src;
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () =>
        resolve({
          width: video.videoWidth || 1,
          height: video.videoHeight || 1,
        });
      video.onerror = () => resolve({ width: 1, height: 1.35 });
      video.src = videoSource;
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
    return <video src={item.videoPreview?.src || item.previewSrc || item.src} muted playsInline loop autoPlay preload="metadata" />;
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
  generateAltText,
  altingItemId,
  uploadVideoPreview,
  editorMode = "portfolio",
  disablePrint,
  printPaperOptions = [],
  printSizeOptions = [],
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

  const isPrintMode = editorMode === "prints";

  return (
    <section className="admin-portfolio-grid" aria-label="Portfolio items">
      <div className="admin-portfolio-columns">
        {columns.map((columnItems, columnIndex) => (
          <div key={`admin-column-${columnIndex + 1}`} className="admin-portfolio-column">
            {columnItems.map((item) => (
              <article
                key={item.id}
                className={`admin-portfolio-card ${draggedId === item.id ? "is-dragging" : ""} ${dropTargetId === item.id && draggedId !== item.id ? "is-drop-target" : ""} ${expandedCardId === item.id ? "is-panel-open" : ""}`}
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
                        {item.mediaType === "video" && item.videoPreview?.src ? " / Short" : ""}
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
                          ...(isPrintMode
                            ? {
                                print: {
                                  enabled: formData.get("printEnabled") === "on",
                                  title: String(formData.get("printTitle") || "").trim() || current.title,
                                  slug:
                                    String(formData.get("printSlug") || "").trim() ||
                                    sanitizeSlug(String(formData.get("printTitle") || "") || current.title),
                                  description: String(formData.get("printDescription") || "").trim(),
                                  technical: String(formData.get("printTechnical") || "").trim(),
                                  paperId: String(formData.get("printPaperId") || "").trim(),
                                  paper:
                                    printPaperOptions.find(
                                      (option) => option.id === String(formData.get("printPaperId") || "").trim()
                                    )?.description || "",
                                  sizeOneId: String(formData.get("printSizeOneId") || "").trim(),
                                  sizeOneLabel:
                                    printSizeOptions.find(
                                      (option) => option.id === String(formData.get("printSizeOneId") || "").trim()
                                    )?.label || "",
                                  sizeOnePrice:
                                    printSizeOptions.find(
                                      (option) => option.id === String(formData.get("printSizeOneId") || "").trim()
                                    )?.price || null,
                                  sizeTwoId: String(formData.get("printSizeTwoId") || "").trim(),
                                  sizeTwoLabel:
                                    printSizeOptions.find(
                                      (option) => option.id === String(formData.get("printSizeTwoId") || "").trim()
                                    )?.label || "",
                                  sizeTwoPrice:
                                    printSizeOptions.find(
                                      (option) => option.id === String(formData.get("printSizeTwoId") || "").trim()
                                    )?.price || null,
                                },
                              }
                            : {
                                projectSlug: String(formData.get("projectSlug") || "") || null,
                                alt: String(formData.get("alt") || "").trim(),
                                journalSlug: String(formData.get("journalSlug") || "") || null,
                              }),
                        }));
                      }}
                    >
                      {isPrintMode ? (
                        <>
                          <label className="admin-inline-toggle">
                            <input
                              type="checkbox"
                              name="printEnabled"
                              defaultChecked={Boolean(item.print?.enabled)}
                            />
                            Sell as print
                          </label>
                          <label>
                            Print title
                            <input name="printTitle" defaultValue={item.print?.title || item.title || ""} />
                          </label>
                          <label>
                            Print slug
                            <input
                              name="printSlug"
                              defaultValue={item.print?.slug || sanitizeSlug(item.print?.title || item.title || "")}
                            />
                          </label>
                          <label>
                            Print description
                            <textarea
                              name="printDescription"
                              rows="3"
                              defaultValue={item.print?.description || ""}
                              placeholder="Short story or description for the print page"
                            />
                          </label>
                          <label>
                            Technical
                            <input
                              name="printTechnical"
                              defaultValue={item.print?.technical || ""}
                              placeholder="Archival pigment print on Hahnemuhle Photo Rag 308 gsm"
                            />
                          </label>
                          <label>
                            Paper preset
                            <select name="printPaperId" defaultValue={item.print?.paperId || ""}>
                              <option value="">Choose paper</option>
                              {printPaperOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label || "Untitled paper"}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="admin-print-grid">
                            <label>
                              Size 1
                              <select name="printSizeOneId" defaultValue={item.print?.sizeOneId || ""}>
                                <option value="">Choose size</option>
                                {printSizeOptions.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.label || "Untitled size"}
                                    {option.price ? ` - ${option.price}` : ""}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Size 2
                              <select name="printSizeTwoId" defaultValue={item.print?.sizeTwoId || ""}>
                                <option value="">Choose size</option>
                                {printSizeOptions.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.label || "Untitled size"}
                                    {option.price ? ` - ${option.price}` : ""}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </>
                      ) : (
                        <>
                          <label>
                            Project slug
                            <input name="projectSlug" defaultValue={item.projectSlug || ""} />
                          </label>
                          <label>
                            Alt text
                            <input name="alt" defaultValue={item.alt || ""} />
                          </label>
                          <label>
                            Journal slug
                            <input name="journalSlug" defaultValue={item.journalSlug || ""} />
                          </label>
                          {item.mediaType === "video" ? (
                            <>
                              <label className="admin-upload admin-inline-upload">
                                <strong>{item.videoPreview?.src ? "Replace short" : "Upload short"}</strong>
                                <span>Use a shorter looping cut in /work while keeping the full video behind it</span>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(event) => {
                                    void uploadVideoPreview?.(item.id, event.target.files);
                                    event.target.value = "";
                                  }}
                                />
                              </label>
                            </>
                          ) : null}
                        </>
                      )}
                      <div className="admin-portfolio-card-actions">
                        {!isPrintMode && item.mediaType !== "video" ? (
                          <button
                            type="button"
                            onClick={() => generateAltText(item.id)}
                            disabled={altingItemId === item.id}
                          >
                            {altingItemId === item.id ? "Alting..." : "Auto alt"}
                          </button>
                        ) : null}
                        {!isPrintMode ? (
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, (current) => ({ ...current, featured: !current.featured }))}
                          >
                            {item.featured ? "In carousel" : "Carousel"}
                          </button>
                        ) : null}
                        {!isPrintMode && item.mediaType === "video" && item.videoPreview?.src ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(item.id, (current) => ({
                                ...current,
                                videoPreview: {
                                  src: null,
                                  storagePath: null,
                                },
                              }))
                            }
                          >
                            Remove short
                          </button>
                        ) : null}
                        <button type="submit">Save</button>
                        {isPrintMode ? (
                          <button type="button" onClick={() => disablePrint?.(item.id)}>
                            Remove from prints
                          </button>
                        ) : (
                          <button type="button" onClick={() => removeItem(item.id)}>
                            Remove
                          </button>
                        )}
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

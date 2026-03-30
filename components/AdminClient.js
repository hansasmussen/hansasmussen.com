"use client";

import { useMemo, useState } from "react";
import { AdminPortfolioEditorGrid } from "@/components/AdminPortfolioEditorGrid";
import { defaultSiteData } from "@/lib/default-site-data";
import { normalizeSiteData } from "@/lib/site-data";

function buildQueueItems(files) {
  return files.map((file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    preview: URL.createObjectURL(file),
    status: "Waiting",
    mediaType: file.type.startsWith("video/") ? "video" : "image",
  }));
}

function measureImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = src;
  });
}

function measureVideo(src) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight });
    video.onerror = reject;
    video.src = src;
  });
}

async function uploadFile(file, options = {}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("context", options.context || "portfolio");
  if (options.projectSlug) {
    formData.append("projectSlug", options.projectSlug);
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.error || "Upload failed.");
  }

  return response.json();
}

function blobExtension(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

async function optimizeImageForUpload(file) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = reject;
      nextImage.src = objectUrl;
    });

    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const maxDimension = 2800;
    const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
    const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
    const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));

    if (scale === 1 && file.size <= 3.5 * 1024 * 1024) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

    const blob = await new Promise((resolve) => {
      canvas.toBlob(
        (nextBlob) => resolve(nextBlob),
        outputType,
        outputType === "image/png" ? undefined : 0.88
      );
    });

    if (!(blob instanceof Blob)) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "upload";
    return new File([blob], `${baseName}.${blobExtension(outputType)}`, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function rewriteProjectText(payload) {
  const response = await fetch("/api/project-text-rewrite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.error || "Rewrite failed.");
  }

  return response.json();
}

async function requestAltText(payload) {
  const response = await fetch("/api/image-alt-text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.error || "Alt generation failed.");
  }

  return response.json();
}

function buildNextUploadTitle(existingItems, mediaType = "image", context = "portfolio") {
  const baseLabel =
    context === "project"
      ? mediaType === "video"
        ? "Project Video"
        : "Project Image"
      : mediaType === "video"
        ? "Portfolio Video"
        : "Portfolio Image";

  let counter = 1;
  const existingTitles = new Set((existingItems || []).map((item) => item.title));

  while (existingTitles.has(`${baseLabel} ${counter}`)) {
    counter += 1;
  }

  return `${baseLabel} ${counter}`;
}

async function enrichItemWithAutoAlt(item) {
  if (item.mediaType === "video") {
    return item;
  }

  try {
    const generated = await requestAltText({
      src: item.src,
      title: item.title,
      projectSlug: item.projectSlug,
    });

    return {
      ...item,
      alt: String(generated.alt || item.alt || "").trim() || item.alt,
    };
  } catch {
    return item;
  }
}

async function fileToPortfolioItem(file, uploadedAsset, options = {}) {
  const title =
    options.title ||
    buildNextUploadTitle(options.existingItems || [], file.type.startsWith("video/") ? "video" : "image", options.context);
  const localPreviewUrl = URL.createObjectURL(file);
  const dimensions = file.type.startsWith("video/")
    ? await measureVideo(localPreviewUrl)
    : await measureImage(localPreviewUrl);
  URL.revokeObjectURL(localPreviewUrl);

  return {
    id: crypto.randomUUID(),
    title,
    year: String(new Date().getFullYear()),
    src: uploadedAsset.src,
    storagePath: uploadedAsset.path || null,
    alt: "",
    mediaType: file.type.startsWith("video/") ? "video" : "image",
    span: dimensions.width > dimensions.height ? "wide" : "single",
    focus: "center",
    analog: false,
    featured: false,
  };
}

export function AdminClient({ initialSiteData }) {
  const [siteData, setSiteData] = useState(() => normalizeSiteData(initialSiteData));
  const [activeTab, setActiveTab] = useState("home");
  const [status, setStatus] = useState("No uploads in progress.");
  const [queueItems, setQueueItems] = useState([]);
  const [projectQueueItems, setProjectQueueItems] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [rewritingProjectSlug, setRewritingProjectSlug] = useState(null);
  const [altingItemId, setAltingItemId] = useState(null);

  const content = siteData.content || {};

  const persist = async (nextSiteData, message) => {
    const previousSiteData = siteData;
    const normalized = normalizeSiteData(nextSiteData);
    setSiteData(normalized);
    setIsSaving(true);

    try {
      const response = await fetch("/api/site-data", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalized),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error || "Failed to save site data.");
      }

      const savedSiteData = normalizeSiteData(await response.json());
      setSiteData(savedSiteData);
      if (message) setStatus(message);
    } catch (error) {
      setSiteData(previousSiteData);
      setStatus(
        error instanceof Error
          ? `Save failed: ${error.message}`
          : "Save failed. Your last change was not stored."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const projects = siteData.projects || [];
  const journalPosts = siteData.journalPosts || [];
  const [expandedProjectSlug, setExpandedProjectSlug] = useState(
    () => (normalizeSiteData(initialSiteData).projects || [])[0]?.slug || null
  );

  const forms = useMemo(
    () => ({
      home: { homeManifesto: content.homeManifesto || "" },
      work: { workManifesto: content.workManifesto || "" },
      contact: {
        contactHeader: content.contactHeader || "",
        contactBody: content.contactBody || "",
      },
    }),
    [content]
  );

  const handleFiles = async (fileList) => {
    const files = [...fileList].filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );
    if (!files.length) {
      setStatus("No image or video files selected.");
      return;
    }

    const nextQueueItems = buildQueueItems(files);
    setQueueItems(nextQueueItems);
      setStatus(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`);

    try {
      const uploads = [];

      for (let index = 0; index < files.length; index += 1) {
        nextQueueItems[index].status = "Preparing";
        setQueueItems([...nextQueueItems]);
        const optimizedFile = await optimizeImageForUpload(files[index]);
        nextQueueItems[index].status = "Uploading";
        setQueueItems([...nextQueueItems]);
        const uploadedAsset = await uploadFile(optimizedFile, { context: "portfolio" });
        const uploadedItem = await fileToPortfolioItem(optimizedFile, uploadedAsset, {
          existingItems: [...siteData.portfolioItems, ...uploads],
          context: "portfolio",
        });
        const uploadedItemWithAlt = await enrichItemWithAutoAlt(uploadedItem);
        uploads.push(uploadedItem);
        uploads[uploads.length - 1] = uploadedItemWithAlt;
        nextQueueItems[index].status = "Added";
        setQueueItems([...nextQueueItems]);
      }

      await persist(
        {
          ...siteData,
          portfolioItems: [...uploads, ...siteData.portfolioItems],
        },
        `Added ${uploads.length} item${uploads.length > 1 ? "s" : ""} to the layout.`
      );
    } catch (error) {
      nextQueueItems.forEach((item) => {
        if (item.status !== "Added") item.status = "Failed";
      });
      setQueueItems([...nextQueueItems]);
      setStatus(
        error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed. Try again with another image."
      );
    }
  };

  const handleProjectFiles = async (projectSlug, fileList) => {
    const files = [...fileList].filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );
    if (!files.length) {
      setStatus("No image or video files selected for the project.");
      return;
    }

    const nextQueueItems = buildQueueItems(files);
    setProjectQueueItems(nextQueueItems);
    setStatus(`Uploading ${files.length} project file${files.length > 1 ? "s" : ""}...`);

    try {
      const uploads = [];
      const currentProject = projects.find((project) => project.slug === projectSlug);

      for (let index = 0; index < files.length; index += 1) {
        nextQueueItems[index].status = "Preparing";
        setProjectQueueItems([...nextQueueItems]);
        const optimizedFile = await optimizeImageForUpload(files[index]);
        nextQueueItems[index].status = "Uploading";
        setProjectQueueItems([...nextQueueItems]);
        const uploadedAsset = await uploadFile(optimizedFile, {
          context: "project",
          projectSlug,
        });
        const uploadedItem = await fileToPortfolioItem(optimizedFile, uploadedAsset, {
          existingItems: currentProject?.media || [],
          context: "project",
        });
        const uploadedItemWithAlt = await enrichItemWithAutoAlt({
          ...uploadedItem,
          projectSlug,
        });
        uploads.push({
          src: uploadedItemWithAlt.src,
          alt: uploadedItemWithAlt.alt,
          mediaType: uploadedItemWithAlt.mediaType,
          span: uploadedItemWithAlt.span,
        });
        nextQueueItems[index].status = "Added";
        setProjectQueueItems([...nextQueueItems]);
      }

      const nextProjects = projects.map((project) =>
        project.slug === projectSlug
          ? {
              ...project,
              media: [...(project.media || []), ...uploads],
            }
          : project
      );

      await persist(
        {
          ...siteData,
          projects: nextProjects,
        },
        `Added ${uploads.length} media item${uploads.length > 1 ? "s" : ""} to the project.`
      );
    } catch (error) {
      nextQueueItems.forEach((item) => {
        if (item.status !== "Added") item.status = "Failed";
      });
      setProjectQueueItems([...nextQueueItems]);
      setStatus(
        error instanceof Error ? `Project upload failed: ${error.message}` : "Project upload failed."
      );
    }
  };

  const updateItem = (itemId, updater) => {
    const nextSiteData = {
      ...siteData,
      portfolioItems: siteData.portfolioItems.map((item) =>
        item.id === itemId ? updater(item) : item
      ),
    };
    void persist(nextSiteData);
  };

  const removeItem = (itemId) => {
    void persist(
      {
        ...siteData,
        portfolioItems: siteData.portfolioItems.filter((item) => item.id !== itemId),
      }
    );
  };

  const reorderItems = (fromId, toId) => {
    const items = [...siteData.portfolioItems];
    const fromIndex = items.findIndex((item) => item.id === fromId);
    const toIndex = items.findIndex((item) => item.id === toId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);
    void persist({ ...siteData, portfolioItems: items });
  };

  const generateAltText = async (itemId) => {
    const item = siteData.portfolioItems.find((entry) => entry.id === itemId);
    if (!item) return;

    setAltingItemId(itemId);
    setStatus(`Generating alt text for ${item.title}...`);

    try {
      const generated = await requestAltText({
        src: item.src,
        title: item.title,
        projectSlug: item.projectSlug,
      });

      await persist(
        {
          ...siteData,
          portfolioItems: siteData.portfolioItems.map((entry) =>
            entry.id === itemId ? { ...entry, alt: String(generated.alt || "") } : entry
          ),
        },
        `Alt text updated for ${item.title}.`
      );
    } catch (error) {
      setStatus(error instanceof Error ? `Alt generation failed: ${error.message}` : "Alt generation failed.");
    } finally {
      setAltingItemId(null);
    }
  };

  const addProject = () => {
    const nextIndex = projects.length + 1;
    const slugBase = `new-project-${nextIndex}`;
    const existingSlugs = new Set(projects.map((project) => project.slug));
    let slug = slugBase;
    let counter = 2;

    while (existingSlugs.has(slug)) {
      slug = `${slugBase}-${counter}`;
      counter += 1;
    }

    const newProject = {
      slug,
      title: `New Project ${nextIndex}`,
      summary: "",
      technicalDetails: "",
      body: "",
      media: [],
      journalSlug: null,
    };

    setExpandedProjectSlug(slug);
    void persist(
      {
        ...siteData,
        projects: [...projects, newProject],
      },
      `Added project: ${newProject.title}`
    );
  };

  const removeProject = (projectSlug, projectTitle) => {
    const nextProjects = projects.filter((project) => project.slug !== projectSlug);

    setExpandedProjectSlug((current) => {
      if (current !== projectSlug) return current;
      return nextProjects[0]?.slug || null;
    });

    void persist(
      {
        ...siteData,
        projects: nextProjects,
      },
      `Removed project: ${projectTitle}`
    );
  };

  return (
    <>
      <main className="admin-page">
        <section className="admin-panel">
          <div className="intro">
            <p className="eyebrow">Admin</p>
            <h1>Upload, reorder og preview layoutet live.</h1>
            <p className="lede">
              Det her er en lokal prototype. Billeder gemmes i browseren pa din maskine, sa den er bedst
              til kuratering og workflow-test.
            </p>
          </div>

          <p className="admin-status" aria-live="polite">
            {isSaving ? "Saving to Supabase..." : status}
          </p>

          <div className="admin-tabs" role="tablist" aria-label="Admin sections">
            {["home", "portfolio", "projects", "journal", "contact"].map((tab) => (
              <button
                key={tab}
                className={`admin-tab ${activeTab === tab ? "is-active" : ""}`}
                type="button"
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "home" ? (
            <section className="admin-content-editor">
              <div className="admin-section-heading">
                <p className="eyebrow">Home</p>
                <h2>Edit the front page intro and choose carousel images in the portfolio tab.</h2>
              </div>
              <form
                className="admin-copy-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  void persist(
                    {
                      ...siteData,
                      content: {
                        ...content,
                        homeManifesto: String(formData.get("homeManifesto") || ""),
                      },
                    },
                    "Home text saved."
                  );
                }}
              >
                <label>
                  Home text
                  <textarea name="homeManifesto" rows="6" defaultValue={forms.home.homeManifesto} />
                </label>
                <div className="admin-copy-actions">
                  <button className="admin-save" type="submit">Save home text</button>
                </div>
              </form>
            </section>
          ) : null}

          {activeTab === "portfolio" ? (
            <section className="admin-panel-section is-active">
              <section className="admin-content-editor">
                <div className="admin-section-heading">
                  <p className="eyebrow">Portfolio</p>
                  <h2>Edit the portfolio intro, upload images and choose what appears in the carousel.</h2>
                </div>
                <form
                  className="admin-copy-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    void persist(
                      {
                        ...siteData,
                        content: {
                          ...content,
                          workManifesto: String(formData.get("workManifesto") || ""),
                        },
                      },
                      "Portfolio text saved."
                    );
                  }}
                >
                  <label>
                    Portfolio text
                    <textarea name="workManifesto" rows="5" defaultValue={forms.work.workManifesto} />
                  </label>
                  <div className="admin-copy-actions">
                    <button className="admin-save" type="submit">Save portfolio text</button>
                  </div>
                </form>
              </section>

              <div className="admin-toolbar">
                <label
                  className="admin-upload"
                  onDragOver={(event) => {
                    event.preventDefault();
                    setStatus("Drop images to add them to the portfolio.");
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleFiles(event.dataTransfer.files);
                  }}
                >
                  <strong>Upload media</strong>
                  <span>Click to choose images or videos, or drag them here</span>
                  <input type="file" accept="image/*,video/*" multiple onChange={(event) => handleFiles(event.target.files)} />
                </label>
                <button
                  className="admin-reset"
                  type="button"
                  onClick={() => {
                    void persist(structuredClone(defaultSiteData), "Reset to default.");
                    setSiteData(normalizeSiteData(structuredClone(defaultSiteData)));
                    setQueueItems([]);
                  }}
                >
                  Reset to default
                </button>
              </div>

              <section className="upload-queue" aria-label="Upload queue">
                {queueItems.map((item) => (
                  <article key={item.id} className={`upload-queue-item upload-status-${item.status.toLowerCase()}`}>
                    {item.mediaType === "video" ? (
                      <video src={item.preview} muted playsInline />
                    ) : (
                      <img src={item.preview} alt={item.name} />
                    )}
                    <div className="upload-queue-copy">
                      <strong>{item.name}</strong>
                      <span>{item.status}</span>
                    </div>
                  </article>
                ))}
              </section>

              <AdminPortfolioEditorGrid
                items={siteData.portfolioItems}
                draggedId={draggedId}
                setDraggedId={setDraggedId}
                reorderItems={reorderItems}
                updateItem={updateItem}
                removeItem={removeItem}
                generateAltText={generateAltText}
                altingItemId={altingItemId}
              />
            </section>
          ) : null}

          {activeTab === "contact" ? (
            <section className="admin-content-editor">
              <div className="admin-section-heading">
                <p className="eyebrow">Contact</p>
                <h2>Edit the contact header and body.</h2>
              </div>
              <form
                className="admin-copy-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  void persist(
                    {
                      ...siteData,
                      content: {
                        ...content,
                        contactHeader: String(formData.get("contactHeader") || ""),
                        contactBody: String(formData.get("contactBody") || ""),
                      },
                    },
                    "Contact text saved."
                  );
                }}
              >
                <label>
                  Contact header
                  <textarea name="contactHeader" rows="3" defaultValue={forms.contact.contactHeader} />
                </label>
                <label>
                  Contact body
                  <textarea name="contactBody" rows="9" defaultValue={forms.contact.contactBody} />
                </label>
                <div className="admin-copy-actions">
                  <button className="admin-save" type="submit">Save contact text</button>
                </div>
              </form>
            </section>
          ) : null}

          {activeTab === "projects" ? (
            <section className="admin-content-stack">
              <div className="admin-copy-actions">
                <button className="admin-save" type="button" onClick={addProject}>
                  Add project
                </button>
              </div>
              {projects.map((project, index) => (
                <section
                  key={project.slug}
                  className={`admin-content-editor admin-accordion ${expandedProjectSlug === project.slug ? "is-open" : ""}`}
                >
                  <button
                    className="admin-accordion-trigger"
                    type="button"
                    onClick={() =>
                      setExpandedProjectSlug((current) => (current === project.slug ? null : project.slug))
                    }
                  >
                    <div className="admin-section-heading">
                      <p className="eyebrow">Project</p>
                      <h2>{project.slug}</h2>
                    </div>
                    <span className="admin-accordion-icon" aria-hidden="true">
                      {expandedProjectSlug === project.slug ? "−" : "+"}
                    </span>
                  </button>

                  {expandedProjectSlug === project.slug ? (
                    <form
                      className="admin-copy-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        const nextProjects = projects.map((currentProject) =>
                          currentProject.slug === project.slug
                            ? {
                                ...currentProject,
                                title: String(formData.get("title") || ""),
                                slug: String(formData.get("slug") || ""),
                                summary: String(formData.get("summary") || ""),
                                technicalDetails: String(formData.get("technicalDetails") || ""),
                                body: String(formData.get("body") || ""),
                                journalSlug: String(formData.get("journalSlug") || "") || null,
                              }
                            : currentProject
                        );

                        void persist(
                          {
                            ...siteData,
                            projects: nextProjects,
                          },
                          `Saved project: ${project.title}`
                        );
                      }}
                    >
                      <label>
                        Project title
                        <input name="title" defaultValue={project.title} />
                      </label>
                      <label>
                        Slug
                        <input name="slug" defaultValue={project.slug} />
                      </label>
                      <label>
                        Short summary
                        <textarea name="summary" rows="3" maxLength={100} defaultValue={project.summary} />
                      </label>
                      <label>
                        Technical details
                        <textarea name="technicalDetails" rows="5" defaultValue={project.technicalDetails} />
                      </label>
                      <label>
                        Project intro/body
                        <textarea name="body" rows="6" defaultValue={project.body} />
                      </label>
                      <div className="admin-copy-actions">
                        <button
                          className="admin-save admin-rewrite"
                          type="button"
                          disabled={rewritingProjectSlug === project.slug}
                          onClick={async (event) => {
                            const form = event.currentTarget.form;
                            if (!form) return;

                            const summaryField = form.elements.namedItem("summary");
                            const bodyField = form.elements.namedItem("body");
                            const titleField = form.elements.namedItem("title");

                            if (
                              !(summaryField instanceof HTMLTextAreaElement) ||
                              !(bodyField instanceof HTMLTextAreaElement) ||
                              !(titleField instanceof HTMLInputElement)
                            ) {
                              setStatus("Could not find the project fields to rewrite.");
                              return;
                            }

                            const body = bodyField.value.trim();
                            if (!body) {
                              setStatus("Write a project intro/body first, then ask for a rewrite.");
                              return;
                            }

                            setRewritingProjectSlug(project.slug);
                            setStatus(`Rewriting ${project.title} with a gonzo edge...`);

                            try {
                              const rewritten = await rewriteProjectText({
                                title: titleField.value,
                                summary: summaryField.value,
                                body,
                              });

                              summaryField.value = rewritten.summary || "";
                              bodyField.value = rewritten.body || body;
                              setStatus(`Rewrite ready for ${project.title}. Review it, then save if you want to keep it.`);
                            } catch (error) {
                              setStatus(
                                error instanceof Error
                                  ? `Rewrite failed: ${error.message}`
                                  : "Rewrite failed."
                              );
                            } finally {
                              setRewritingProjectSlug(null);
                            }
                          }}
                        >
                          {rewritingProjectSlug === project.slug ? "Rewriting..." : "Rewrite with gonzo flair"}
                        </button>
                      </div>
                      <label>
                        Journal slug
                        <input name="journalSlug" defaultValue={project.journalSlug || ""} />
                      </label>
                      <div className="admin-project-media">
                        <div className="admin-project-media-header">
                          <p className="eyebrow">Project media</p>
                          <label className="admin-upload admin-project-upload">
                            <strong>Add media to series</strong>
                            <span>Upload images or video for this landing page</span>
                            <input
                              type="file"
                              accept="image/*,video/*"
                              multiple
                              onChange={(event) => handleProjectFiles(project.slug, event.target.files)}
                            />
                          </label>
                        </div>

                        {projectQueueItems.length ? (
                          <section className="upload-queue" aria-label="Project upload queue">
                            {projectQueueItems.map((item) => (
                              <article key={item.id} className={`upload-queue-item upload-status-${item.status.toLowerCase()}`}>
                                {item.mediaType === "video" ? (
                                  <video src={item.preview} muted playsInline />
                                ) : (
                                  <img src={item.preview} alt={item.name} />
                                )}
                                <div className="upload-queue-copy">
                                  <strong>{item.name}</strong>
                                  <span>{item.status}</span>
                                </div>
                              </article>
                            ))}
                          </section>
                        ) : null}

                        <div className="admin-project-media-list">
                          {(project.media || []).map((mediaItem, mediaIndex) => (
                            <article key={`${project.slug}-media-${mediaIndex + 1}`} className="admin-project-media-item">
                              {mediaItem.mediaType === "video" ? (
                                <video src={mediaItem.src} muted playsInline />
                              ) : (
                                <img src={mediaItem.src} alt={mediaItem.alt} />
                              )}
                              <div className="admin-project-media-copy">
                                <strong>{mediaItem.alt || `Media ${mediaIndex + 1}`}</strong>
                                <span>{mediaItem.mediaType === "video" ? "Video" : "Image"}</span>
                              </div>
                              <div className="admin-item-actions">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextProjects = projects.map((currentProject) =>
                                      currentProject.slug === project.slug
                                        ? {
                                            ...currentProject,
                                            media: (currentProject.media || []).filter((_, currentIndex) => currentIndex !== mediaIndex),
                                          }
                                        : currentProject
                                    );

                                    void persist(
                                      {
                                        ...siteData,
                                        projects: nextProjects,
                                      },
                                      `Removed media from ${project.title}`
                                    );
                                  }}
                                >
                                  Remove media
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                      <div className="admin-copy-actions">
                        <button className="admin-save" type="submit">Save project</button>
                        <button
                          className="admin-save"
                          type="button"
                          onClick={() => removeProject(project.slug, project.title)}
                        >
                          Delete project
                        </button>
                      </div>
                    </form>
                  ) : null}
                </section>
              ))}
            </section>
          ) : null}

          {activeTab === "journal" ? (
            <section className="admin-content-stack">
              {journalPosts.map((post, index) => (
                <section key={post.slug} className="admin-content-editor">
                  <div className="admin-section-heading">
                    <p className="eyebrow">Journal {index + 1}</p>
                    <h2>{post.title}</h2>
                  </div>
                  <form
                    className="admin-copy-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      const nextPosts = journalPosts.map((currentPost) =>
                        currentPost.slug === post.slug
                          ? {
                              ...currentPost,
                              title: String(formData.get("title") || ""),
                              slug: String(formData.get("slug") || ""),
                              excerpt: String(formData.get("excerpt") || ""),
                              body: String(formData.get("body") || ""),
                              relatedProjectSlug: String(formData.get("relatedProjectSlug") || "") || null,
                            }
                          : currentPost
                      );

                      void persist(
                        {
                          ...siteData,
                          journalPosts: nextPosts,
                        },
                        `Saved journal post: ${post.title}`
                      );
                    }}
                  >
                    <label>
                      Journal title
                      <input name="title" defaultValue={post.title} />
                    </label>
                    <label>
                      Slug
                      <input name="slug" defaultValue={post.slug} />
                    </label>
                    <label>
                      Excerpt
                      <textarea name="excerpt" rows="3" defaultValue={post.excerpt} />
                    </label>
                    <label>
                      Story/body
                      <textarea name="body" rows="8" defaultValue={post.body} />
                    </label>
                    <label>
                      Related project slug
                      <input name="relatedProjectSlug" defaultValue={post.relatedProjectSlug || ""} />
                    </label>
                    <div className="admin-copy-actions">
                      <button className="admin-save" type="submit">Save journal post</button>
                    </div>
                  </form>
                </section>
              ))}
            </section>
          ) : null}
        </section>
      </main>

    </>
  );
}

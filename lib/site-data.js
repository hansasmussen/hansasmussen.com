import { defaultSiteData } from "@/lib/default-site-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unstable_noStore as noStore } from "next/cache";

function throwIfError(error, context) {
  if (!error) return;

  const message =
    typeof error === "object" && error !== null
      ? [context, error.message, error.details, error.hint].filter(Boolean).join(" | ")
      : `${context} | ${String(error)}`;

  throw new Error(message);
}

function normalizeTypographyString(value) {
  return String(value || "").replace(/[—–]/g, "-");
}

function normalizeTypographyTree(value) {
  if (typeof value === "string") {
    return normalizeTypographyString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeTypographyTree(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, normalizeTypographyTree(entryValue)])
    );
  }

  return value;
}

function inferMediaType(item) {
  if (item.mediaType) return item.mediaType;
  if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(item.src || item.image_url || "")) return "video";
  return "image";
}

function sanitizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function buildPresetId(value, fallback) {
  return sanitizeSlug(value) || fallback;
}

function parseSiteCatalogData(rawValue) {
  if (!rawValue) {
    return {
      catalog: {},
      videoPreviews: {},
    };
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (parsed && typeof parsed === "object") {
      return {
        catalog: parsed.catalog && typeof parsed.catalog === "object" ? parsed.catalog : {},
        videoPreviews:
          parsed.videoPreviews && typeof parsed.videoPreviews === "object" ? parsed.videoPreviews : {},
      };
    }
  } catch {
    return {
      catalog: {},
      videoPreviews: {},
    };
  }

  return {
    catalog: {},
    videoPreviews: {},
  };
}

function parsePrintContent(rawValue) {
  if (!rawValue) return {};

  try {
    const parsed = JSON.parse(rawValue);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    return {};
  }

  return {};
}

function normalizePrice(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function normalizePrintPaperOptions(value) {
  return (Array.isArray(value) ? value : [])
    .map((item, index) => ({
      id: String(item?.id || buildPresetId(item?.label || item?.description || `paper-${index + 1}`, `paper-${index + 1}`)),
      label: String(item?.label || "").trim(),
      description: String(item?.description || "").trim(),
    }))
    .filter((item) => item.id);
}

function normalizePrintSizeOptions(value) {
  return (Array.isArray(value) ? value : [])
    .map((item, index) => ({
      id: String(item?.id || buildPresetId(item?.label || `size-${index + 1}`, `size-${index + 1}`)),
      label: String(item?.label || "").trim(),
      price: normalizePrice(item?.price),
    }))
    .filter((item) => item.id);
}

function buildPrintConfig(item, rawPrintCatalog) {
  const config = item.print || rawPrintCatalog?.[item.id] || rawPrintCatalog?.[item.src] || null;

  return {
    enabled: Boolean(config?.enabled),
    title: String(config?.title || item.title || "").trim(),
    slug: String(config?.slug || sanitizeSlug(config?.title || item.title || "")),
    description: String(config?.description || "").trim(),
    technical: String(config?.technical || "").trim(),
    paperId: String(config?.paperId || "").trim(),
    paper: String(config?.paper || "").trim(),
    sizeOneId: String(config?.sizeOneId || "").trim(),
    sizeOneLabel: String(config?.sizeOneLabel || "").trim(),
    sizeOnePrice: normalizePrice(config?.sizeOnePrice),
    sizeTwoId: String(config?.sizeTwoId || "").trim(),
    sizeTwoLabel: String(config?.sizeTwoLabel || "").trim(),
    sizeTwoPrice: normalizePrice(config?.sizeTwoPrice),
  };
}

function buildVideoPreviewConfig(item, rawVideoPreviewCatalog) {
  const config = item.videoPreview || rawVideoPreviewCatalog?.[item.id] || rawVideoPreviewCatalog?.[item.src] || null;

  return {
    src: String(config?.src || item.previewSrc || "").trim() || null,
    storagePath: String(config?.storagePath || item.previewStoragePath || "").trim() || null,
  };
}

function buildPrintCatalog(items) {
  return items.reduce((catalog, item) => {
    if (!item.print?.enabled) return catalog;

    catalog[item.id] = {
      enabled: true,
      title: String(item.print.title || item.title || "").trim(),
      slug: String(item.print.slug || sanitizeSlug(item.print.title || item.title || "")),
      description: String(item.print.description || "").trim(),
      technical: String(item.print.technical || "").trim(),
      paperId: String(item.print.paperId || "").trim(),
      paper: String(item.print.paper || "").trim(),
      sizeOneId: String(item.print.sizeOneId || "").trim(),
      sizeOneLabel: String(item.print.sizeOneLabel || "").trim(),
      sizeOnePrice: normalizePrice(item.print.sizeOnePrice),
      sizeTwoId: String(item.print.sizeTwoId || "").trim(),
      sizeTwoLabel: String(item.print.sizeTwoLabel || "").trim(),
      sizeTwoPrice: normalizePrice(item.print.sizeTwoPrice),
    };

    return catalog;
  }, {});
}

function buildVideoPreviewCatalog(items) {
  return items.reduce((catalog, item) => {
    if (item.mediaType !== "video" || !item.videoPreview?.src) return catalog;

    catalog[item.id] = {
      src: String(item.videoPreview.src || "").trim(),
      storagePath: String(item.videoPreview.storagePath || "").trim(),
    };

    return catalog;
  }, {});
}

function getDefaultPortfolioItemLookup() {
  return new Map((defaultSiteData.portfolioItems || []).map((item) => [item.title, item]));
}

function createUniquePortfolioId() {
  return crypto.randomUUID();
}

function normalizePortfolioItems(
  items,
  featuredTitles,
  defaultPortfolioItemLookup,
  rawPrintCatalog,
  rawVideoPreviewCatalog
) {
  const seenIds = new Set();

  return (items || []).map((item, index) => {
    const mergedItem = {
      ...(defaultPortfolioItemLookup.get(item.title) || {}),
      ...item,
    };

    const requestedId = String(mergedItem.id || `portfolio-item-${index + 1}`);
    const normalizedId = seenIds.has(requestedId) ? createUniquePortfolioId() : requestedId;
    seenIds.add(normalizedId);

    return {
      ...mergedItem,
      id: normalizedId,
      span: mergedItem.span || "single",
      focus: mergedItem.focus || "center",
      mediaType: inferMediaType(mergedItem),
      projectSlug: mergedItem.projectSlug || null,
      journalSlug: mergedItem.journalSlug || null,
      print: buildPrintConfig(mergedItem, rawPrintCatalog),
      videoPreview: buildVideoPreviewConfig(mergedItem, rawVideoPreviewCatalog),
      analog: Boolean(mergedItem.analog),
      featured:
        typeof mergedItem.featured === "boolean"
          ? mergedItem.featured
          : featuredTitles.has(mergedItem.title),
    };
  });
}

export function normalizeSiteData(rawSiteData) {
  const featuredTitles = new Set((rawSiteData.featuredSlides || []).map((item) => item.title));
  const defaultPortfolioItemLookup = getDefaultPortfolioItemLookup();
  const rawPrintCatalog = rawSiteData.printCatalog || {};
  const rawVideoPreviewCatalog = rawSiteData.videoPreviews || {};

  return normalizeTypographyTree({
    ...rawSiteData,
    content: {
      ...(defaultSiteData.content || {}),
      ...(rawSiteData.content || {}),
      printPaperOptions: normalizePrintPaperOptions(rawSiteData.content?.printPaperOptions || []),
      printSizeOptions: normalizePrintSizeOptions(rawSiteData.content?.printSizeOptions || []),
    },
    projects: rawSiteData.projects || defaultSiteData.projects || [],
    journalPosts: rawSiteData.journalPosts || defaultSiteData.journalPosts || [],
    portfolioItems: normalizePortfolioItems(
      rawSiteData.portfolioItems || [],
      featuredTitles,
      defaultPortfolioItemLookup,
      rawPrintCatalog,
      rawVideoPreviewCatalog
    ),
  });
}

function mapDbContentToContent(row) {
  if (!row) return { ...defaultSiteData.content };

  const printContent = parsePrintContent(row.contact_paragraph_four);

  return {
    homeManifesto: row.home_manifesto || defaultSiteData.content.homeManifesto,
    workManifesto: row.work_manifesto || defaultSiteData.content.workManifesto,
    contactHeader: row.contact_paragraph_one || defaultSiteData.content.contactHeader,
    contactBody: row.contact_paragraph_two || defaultSiteData.content.contactBody,
    printsHeader: printContent.printsHeader || "Selected works available as prints.",
    printsBody:
      printContent.printsBody ||
      "A curated selection of images available in small editions and printed on carefully chosen paper. Sizes and stock vary from work to work.",
    printPaperOptions: normalizePrintPaperOptions(printContent.printPaperOptions || []),
    printSizeOptions: normalizePrintSizeOptions(printContent.printSizeOptions || []),
  };
}

function mapDbPortfolioToPortfolioItems(rows) {
  return (rows || []).map((row) => ({
    id: row.id,
    title: row.title,
    year: row.year,
    src: row.image_url,
    storagePath: row.storage_path || null,
    alt: row.alt,
    mediaType: row.media_type || inferMediaType(row),
    projectSlug: row.project_slug || null,
    journalSlug: row.journal_slug || null,
    videoPreview: {
      src: null,
      storagePath: null,
    },
    span: row.span,
    focus: row.focus,
    analog: Boolean(row.is_analog),
    featured: Boolean(row.is_featured),
  }));
}

function mapSiteDataToDbContent(content) {
  return {
    home_manifesto: normalizeTypographyString(content.homeManifesto || ""),
    work_manifesto: normalizeTypographyString(content.workManifesto || ""),
    contact_paragraph_one: normalizeTypographyString(content.contactHeader || ""),
    contact_paragraph_two: normalizeTypographyString(content.contactBody || ""),
    contact_paragraph_three: "",
    contact_paragraph_four: JSON.stringify({
      printsHeader: normalizeTypographyString(content.printsHeader || "Selected works available as prints."),
      printsBody: normalizeTypographyString(
        content.printsBody ||
        "A curated selection of images available in small editions and printed on carefully chosen paper. Sizes and stock vary from work to work.",
      ),
      printPaperOptions: normalizePrintPaperOptions(content.printPaperOptions || []),
      printSizeOptions: normalizePrintSizeOptions(content.printSizeOptions || []),
    }),
  };
}

function mapProject(project) {
  return {
    ...project,
    media: (project.media || []).map((item, index) => ({
      ...item,
      id: item.id || `${project.slug}-media-${index + 1}`,
      span: item.span || "single",
      mediaType: inferMediaType(item),
    })),
  };
}

function mapDbProjectsToProjects(rows) {
  return (rows || []).map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary || "",
    technicalDetails: row.technical_details || "",
    body: row.body || "",
    journalSlug: row.journal_slug || null,
    media: (row.media_items || []).map((item, index) => ({
      ...item,
      id: item.id || `${row.slug}-media-${index + 1}`,
      span: item.span || "single",
      mediaType: inferMediaType(item),
    })),
  }));
}

function mapDbJournalPostsToJournalPosts(rows) {
  return (rows || []).map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt || "",
    body: row.body || "",
    relatedProjectSlug: row.related_project_slug || null,
  }));
}

function mapSiteDataToDbProjects(projects) {
  return (projects || []).map((project) => ({
    slug: project.slug,
    title: project.title,
    summary: project.summary || "",
    technical_details: project.technicalDetails || "",
    body: project.body || "",
    journal_slug: project.journalSlug || null,
    media_items: (project.media || []).map(({ id, ...item }) => item),
  }));
}

function mapSiteDataToDbJournalPosts(posts) {
  return (posts || []).map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || "",
    body: post.body || "",
    related_project_slug: post.relatedProjectSlug || null,
  }));
}

function mapSiteDataToDbPortfolioItems(items) {
  return items.map((item, index) => ({
    id: item.id,
    title: item.title,
    year: item.year || "",
    image_url: item.src,
    storage_path: item.storagePath || null,
    alt: item.alt || "",
    media_type: item.mediaType || inferMediaType(item),
    project_slug: item.projectSlug || null,
    journal_slug: item.journalSlug || null,
    sort_order: index,
    span: item.span || "single",
    focus: item.focus || "center",
    is_analog: Boolean(item.analog),
    is_featured: Boolean(item.featured),
  }));
}

export async function getSiteData() {
  noStore();

  try {
    const supabase = createSupabaseAdminClient();

    const [
      { data: contentRow, error: contentError },
      { data: portfolioRows, error: portfolioError },
      { data: projectRows, error: projectError },
      { data: journalRows, error: journalError },
    ] =
      await Promise.all([
        supabase.from("site_content").select("*").limit(1).maybeSingle(),
        supabase.from("portfolio_items").select("*").order("sort_order", { ascending: true }),
        supabase.from("project_pages").select("*").order("slug", { ascending: true }),
        supabase.from("journal_posts").select("*").order("slug", { ascending: true }),
      ]);

    throwIfError(contentError, "Loading site_content failed");
    throwIfError(portfolioError, "Loading portfolio_items failed");
    throwIfError(projectError, "Loading project_pages failed");
    throwIfError(journalError, "Loading journal_posts failed");

    return normalizeSiteData({
      ...defaultSiteData,
      content: mapDbContentToContent(contentRow),
      printCatalog: parseSiteCatalogData(contentRow?.contact_paragraph_three).catalog,
      videoPreviews: parseSiteCatalogData(contentRow?.contact_paragraph_three).videoPreviews,
      projects: (projectRows || []).length ? mapDbProjectsToProjects(projectRows) : defaultSiteData.projects,
      journalPosts: (journalRows || []).length ? mapDbJournalPostsToJournalPosts(journalRows) : defaultSiteData.journalPosts,
      portfolioItems: (portfolioRows || []).length ? mapDbPortfolioToPortfolioItems(portfolioRows) : defaultSiteData.portfolioItems,
    });
  } catch {
    return normalizeSiteData(structuredClone(defaultSiteData));
  }
}

export async function saveSiteData(siteData) {
  const normalized = normalizeSiteData(siteData);
  const supabase = createSupabaseAdminClient();

  const { data: existingPortfolioRows, error: existingPortfolioError } = await supabase
    .from("portfolio_items")
    .select("id, storage_path")
    .order("sort_order", { ascending: true });

  throwIfError(existingPortfolioError, "Loading existing portfolio rows failed");

  const { data: existingContent, error: existingContentError } = await supabase
    .from("site_content")
    .select("id, contact_paragraph_three")
    .limit(1)
    .maybeSingle();

  throwIfError(existingContentError, "Loading existing site content failed");

  const contentPayload = {
    ...mapSiteDataToDbContent(normalized.content),
    contact_paragraph_three: JSON.stringify({
      catalog: buildPrintCatalog(normalized.portfolioItems),
      videoPreviews: buildVideoPreviewCatalog(normalized.portfolioItems),
    }),
  };

  if (existingContent?.id) {
    const { error } = await supabase
      .from("site_content")
      .update(contentPayload)
      .eq("id", existingContent.id);

    throwIfError(error, "Updating site_content failed");
  } else {
    const { error } = await supabase.from("site_content").insert(contentPayload);
    throwIfError(error, "Inserting site_content failed");
  }

  const { error: deleteError } = await supabase
    .from("portfolio_items")
    .delete()
    .not("id", "is", null);
  throwIfError(deleteError, "Deleting portfolio_items failed");

  const portfolioPayload = mapSiteDataToDbPortfolioItems(normalized.portfolioItems);
  const projectPayload = mapSiteDataToDbProjects(normalized.projects);
  const journalPayload = mapSiteDataToDbJournalPosts(normalized.journalPosts);

  if (portfolioPayload.length) {
    const { error: insertError } = await supabase.from("portfolio_items").insert(portfolioPayload);
    throwIfError(insertError, "Inserting portfolio_items failed");
  }

  const { error: deleteProjectError } = await supabase
    .from("project_pages")
    .delete()
    .not("slug", "is", null);
  throwIfError(deleteProjectError, "Deleting project_pages failed");

  if (projectPayload.length) {
    const { error: insertProjectError } = await supabase.from("project_pages").insert(projectPayload);
    throwIfError(insertProjectError, "Inserting project_pages failed");
  }

  const { error: deleteJournalError } = await supabase
    .from("journal_posts")
    .delete()
    .not("slug", "is", null);
  throwIfError(deleteJournalError, "Deleting journal_posts failed");

  if (journalPayload.length) {
    const { error: insertJournalError } = await supabase.from("journal_posts").insert(journalPayload);
    throwIfError(insertJournalError, "Inserting journal_posts failed");
  }

  const nextIds = new Set(normalized.portfolioItems.map((item) => item.id));
  const removedStoragePaths = (existingPortfolioRows || [])
    .filter((row) => row.storage_path && !nextIds.has(row.id))
    .map((row) => row.storage_path);
  const previousVideoPreviewCatalog = parseSiteCatalogData(existingContent?.contact_paragraph_three).videoPreviews;
  const nextVideoPreviewStoragePaths = new Set(
    normalized.portfolioItems.map((item) => item.videoPreview?.storagePath).filter(Boolean)
  );
  const removedVideoPreviewPaths = Object.values(previousVideoPreviewCatalog)
    .map((item) => item?.storagePath)
    .filter((storagePath) => storagePath && !nextVideoPreviewStoragePaths.has(storagePath));
  const storagePathsToDelete = [...removedStoragePaths, ...removedVideoPreviewPaths];

  if (storagePathsToDelete.length) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "portfolio-images";
    const { error: storageDeleteError } = await supabase.storage.from(bucket).remove(storagePathsToDelete);
    throwIfError(storageDeleteError, "Deleting removed storage objects failed");
  }

  return normalized;
}

export function getFeaturedSlides(siteData) {
  const featuredItems = siteData.portfolioItems.filter((item) => item.featured);
  return featuredItems.map((item) => ({
    src: item.mediaType === "video" ? item.videoPreview?.src || item.src : item.src,
    alt: item.alt,
    title: item.title,
  }));
}

export function getPrintProducts(siteData) {
  const paperLookup = new Map((siteData.content?.printPaperOptions || []).map((item) => [item.id, item]));
  const sizeLookup = new Map((siteData.content?.printSizeOptions || []).map((item) => [item.id, item]));

  return (siteData.portfolioItems || [])
    .filter((item) => item.mediaType === "image" && item.print?.enabled)
    .map((item) => ({
      id: item.id,
      src: item.src,
      alt: item.alt,
      title: item.print.title || item.title,
      slug: item.print.slug || sanitizeSlug(item.print.title || item.title),
      description: item.print.description || "",
      technical: item.print.technical || "",
      paper:
        paperLookup.get(item.print.paperId)?.description ||
        paperLookup.get(item.print.paperId)?.label ||
        item.print.paper ||
        "",
      sizeOptions: [
        sizeLookup.get(item.print.sizeOneId)
          ? {
              label: sizeLookup.get(item.print.sizeOneId).label,
              price: sizeLookup.get(item.print.sizeOneId).price,
            }
          : item.print.sizeOneLabel && item.print.sizeOnePrice
            ? { label: item.print.sizeOneLabel, price: item.print.sizeOnePrice }
            : null,
        sizeLookup.get(item.print.sizeTwoId)
          ? {
              label: sizeLookup.get(item.print.sizeTwoId).label,
              price: sizeLookup.get(item.print.sizeTwoId).price,
            }
          : item.print.sizeTwoLabel && item.print.sizeTwoPrice
            ? { label: item.print.sizeTwoLabel, price: item.print.sizeTwoPrice }
            : null,
      ].filter(Boolean),
    }));
}

export function getProjectBySlug(siteData, slug) {
  return (siteData.projects || []).map(mapProject).find((project) => project.slug === slug) || null;
}

export function getJournalPostBySlug(siteData, slug) {
  return (siteData.journalPosts || []).find((post) => post.slug === slug) || null;
}

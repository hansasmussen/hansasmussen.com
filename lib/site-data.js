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

function parsePrintCatalog(rawValue) {
  if (!rawValue) return {};

  try {
    const parsed = JSON.parse(rawValue);
    if (parsed && typeof parsed === "object" && parsed.catalog && typeof parsed.catalog === "object") {
      return parsed.catalog;
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

function buildPrintConfig(item, rawPrintCatalog) {
  const config = item.print || rawPrintCatalog?.[item.id] || rawPrintCatalog?.[item.src] || null;

  return {
    enabled: Boolean(config?.enabled),
    title: String(config?.title || item.title || "").trim(),
    slug: String(config?.slug || sanitizeSlug(config?.title || item.title || "")),
    paper: String(config?.paper || "").trim(),
    sizeOneLabel: String(config?.sizeOneLabel || "").trim(),
    sizeOnePrice: normalizePrice(config?.sizeOnePrice),
    sizeTwoLabel: String(config?.sizeTwoLabel || "").trim(),
    sizeTwoPrice: normalizePrice(config?.sizeTwoPrice),
  };
}

function buildPrintCatalog(items) {
  return items.reduce((catalog, item) => {
    if (!item.print?.enabled) return catalog;

    catalog[item.id] = {
      enabled: true,
      title: String(item.print.title || item.title || "").trim(),
      slug: String(item.print.slug || sanitizeSlug(item.print.title || item.title || "")),
      paper: String(item.print.paper || "").trim(),
      sizeOneLabel: String(item.print.sizeOneLabel || "").trim(),
      sizeOnePrice: normalizePrice(item.print.sizeOnePrice),
      sizeTwoLabel: String(item.print.sizeTwoLabel || "").trim(),
      sizeTwoPrice: normalizePrice(item.print.sizeTwoPrice),
    };

    return catalog;
  }, {});
}

function getDefaultPortfolioItemLookup() {
  return new Map((defaultSiteData.portfolioItems || []).map((item) => [item.title, item]));
}

export function normalizeSiteData(rawSiteData) {
  const featuredTitles = new Set((rawSiteData.featuredSlides || []).map((item) => item.title));
  const defaultPortfolioItemLookup = getDefaultPortfolioItemLookup();
  const rawPrintCatalog = rawSiteData.printCatalog || {};

  return {
    ...rawSiteData,
    content: {
      ...(defaultSiteData.content || {}),
      ...(rawSiteData.content || {}),
    },
    projects: rawSiteData.projects || defaultSiteData.projects || [],
    journalPosts: rawSiteData.journalPosts || defaultSiteData.journalPosts || [],
    portfolioItems: (rawSiteData.portfolioItems || []).map((item, index) => ({
      ...(defaultPortfolioItemLookup.get(item.title) || {}),
      ...item,
      id: item.id || `portfolio-item-${index + 1}`,
      span: item.span || "single",
      focus: item.focus || "center",
      mediaType: inferMediaType(item),
      projectSlug: item.projectSlug || null,
      journalSlug: item.journalSlug || null,
      print: buildPrintConfig(item, rawPrintCatalog),
      analog: Boolean(item.analog),
      featured:
        typeof item.featured === "boolean" ? item.featured : featuredTitles.has(item.title),
    })),
  };
}

function mapDbContentToContent(row) {
  if (!row) return { ...defaultSiteData.content };

  return {
    homeManifesto: row.home_manifesto || defaultSiteData.content.homeManifesto,
    workManifesto: row.work_manifesto || defaultSiteData.content.workManifesto,
    contactHeader: row.contact_paragraph_one || defaultSiteData.content.contactHeader,
    contactBody: row.contact_paragraph_two || defaultSiteData.content.contactBody,
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
    span: row.span,
    focus: row.focus,
    analog: Boolean(row.is_analog),
    featured: Boolean(row.is_featured),
  }));
}

function mapSiteDataToDbContent(content) {
  return {
    home_manifesto: content.homeManifesto || "",
    work_manifesto: content.workManifesto || "",
    contact_paragraph_one: content.contactHeader || "",
    contact_paragraph_two: content.contactBody || "",
    contact_paragraph_three: "",
    contact_paragraph_four: "",
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
      printCatalog: parsePrintCatalog(contentRow?.contact_paragraph_three),
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
    .select("id")
    .limit(1)
    .maybeSingle();

  throwIfError(existingContentError, "Loading existing site content failed");

  const contentPayload = {
    ...mapSiteDataToDbContent(normalized.content),
    contact_paragraph_three: JSON.stringify({
      catalog: buildPrintCatalog(normalized.portfolioItems),
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

  if (removedStoragePaths.length) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "portfolio-images";
    const { error: storageDeleteError } = await supabase.storage.from(bucket).remove(removedStoragePaths);
    throwIfError(storageDeleteError, "Deleting removed storage objects failed");
  }

  return normalized;
}

export function getFeaturedSlides(siteData) {
  const featuredItems = siteData.portfolioItems.filter((item) => item.featured);
  return featuredItems.map((item) => ({
    src: item.src,
    alt: item.alt,
    title: item.title,
  }));
}

export function getPrintProducts(siteData) {
  return (siteData.portfolioItems || [])
    .filter((item) => item.mediaType === "image" && item.print?.enabled)
    .map((item) => ({
      id: item.id,
      src: item.src,
      alt: item.alt,
      title: item.print.title || item.title,
      slug: item.print.slug || sanitizeSlug(item.print.title || item.title),
      paper: item.print.paper || "",
      sizeOptions: [
        item.print.sizeOneLabel && item.print.sizeOnePrice
          ? { label: item.print.sizeOneLabel, price: item.print.sizeOnePrice }
          : null,
        item.print.sizeTwoLabel && item.print.sizeTwoPrice
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

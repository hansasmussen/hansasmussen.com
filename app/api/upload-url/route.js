import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_CONTEXTS = new Set(["portfolio", "project"]);
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);
const IMAGE_MAX_BYTES = 20 * 1024 * 1024;
const VIDEO_MAX_BYTES = 120 * 1024 * 1024;

function sanitizeSegment(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function getExtension(fileName, contentType) {
  const fileExtension = fileName?.includes(".") ? fileName.split(".").pop()?.toLowerCase() : "";
  if (fileExtension) return fileExtension;

  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  if (contentType === "image/avif") return "avif";
  if (contentType === "video/mp4") return "mp4";
  if (contentType === "video/quicktime") return "mov";
  if (contentType === "video/webm") return "webm";

  return "jpg";
}

function buildStoragePath({ fileName, contentType, context, projectSlug }) {
  const extension = getExtension(fileName, contentType);
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const shortId = crypto.randomUUID().slice(0, 8);
  const safeProjectSlug = sanitizeSegment(projectSlug);

  if (context === "project" && safeProjectSlug) {
    return `projects/${safeProjectSlug}/${safeProjectSlug}-${dateStamp}-${shortId}.${extension}`;
  }

  return `portfolio/portfolio-item-${dateStamp}-${shortId}.${extension}`;
}

function validateUploadMeta({ context, contentType, fileSize }) {
  if (!ALLOWED_CONTEXTS.has(context)) {
    throw new Error("Invalid upload context.");
  }

  const isImage = ALLOWED_IMAGE_TYPES.has(contentType);
  const isVideo = ALLOWED_VIDEO_TYPES.has(contentType);

  if (!isImage && !isVideo) {
    throw new Error("Only JPG, PNG, WebP, GIF, AVIF, MP4, MOV and WebM files are allowed.");
  }

  const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (fileSize > maxBytes) {
    throw new Error(
      isVideo
        ? "Video files must be 120 MB or smaller."
        : "Image files must be 20 MB or smaller."
    );
  }
}

export async function POST(request) {
  try {
    await assertAdminRequest();

    const body = await request.json();
    const fileName = String(body.fileName || "");
    const contentType = String(body.contentType || "");
    const context = String(body.context || "portfolio");
    const projectSlug = String(body.projectSlug || "");
    const fileSize = Number(body.fileSize || 0);

    validateUploadMeta({ context, contentType, fileSize });

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "portfolio-images";
    const filePath = buildStoragePath({ fileName, contentType, context, projectSlug });

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(filePath);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      bucket,
      path: filePath,
      token: data.token,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to prepare upload.",
      },
      { status: 500 }
    );
  }
}

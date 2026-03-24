import fs from "node:fs";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  const env = {};
  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function getMimeType(src) {
  const normalized = String(src || "").toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function buildPrompt({ title, projectSlug }) {
  return `
You are writing SEO-friendly alt text for a photography portfolio.

Rules:
- Return JSON only: { "alt": "..." }
- Write one concise alt text, ideally 8-16 words.
- Describe only what is visibly present in the image: subject, clothing, pose, mood, setting, light, framing, and composition when clear.
- Do not keyword-stuff.
- Do not start with "image of", "photo of", or "picture of".
- Do not mention client names, brands, project names, collection names, product lines, file names, or slugs unless that exact text is visibly present in the image itself.
- Do not use the provided portfolio title or slug as wording for the alt text.
- Prefer a plain visual description over editorial phrasing.
- Keep it natural, elegant, and useful for accessibility first, SEO second.

Context:
- Portfolio title for internal reference only: ${title || ""}
- Project slug hint for internal reference only: ${projectSlug || ""}
  `.trim();
}

function cleanAltText(alt) {
  return String(alt || "")
    .replace(/\b(?:from|for)\s+[A-Z0-9][^,.;:()]{0,60}$/i, "")
    .replace(/\b(?:series|campaign|lookbook|collection)\b[^,.;:()]{0,60}$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractAltText(responsePayload) {
  const text = responsePayload.candidates
    ?.flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("\n");

  const match = text?.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI response did not contain valid JSON.");
  }

  const parsed = JSON.parse(match[0]);
  return cleanAltText(parsed.alt || "");
}

async function loadImageAsBase64(src) {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Could not fetch image: ${src}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  }

  if (src.startsWith("/")) {
    const filePath = path.join(process.cwd(), "public", src.replace(/^\/+/, ""));
    const fileBuffer = await readFile(filePath);
    return fileBuffer.toString("base64");
  }

  throw new Error(`Unsupported image source: ${src}`);
}

async function generateAltText({ src, title, projectSlug, apiKey, model }) {
  const imageData = await loadImageAsBase64(src);
  const mimeType = getMimeType(src);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageData,
                },
              },
              {
                text: buildPrompt({ title, projectSlug }),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`Gemini error: ${errorPayload}`);
  }

  const payload = await response.json();
  const alt = extractAltText(payload);

  if (!alt) {
    throw new Error("No alt text returned.");
  }

  return alt;
}

async function regeneratePortfolioItems({ supabase, apiKey, model }) {
  const { data: rows, error } = await supabase
    .from("portfolio_items")
    .select("id, title, image_url, media_type, project_slug, alt")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  let updated = 0;

  for (const row of rows || []) {
    if ((row.media_type || "image") !== "image") continue;

    const alt = await generateAltText({
      src: row.image_url,
      title: row.title,
      projectSlug: row.project_slug,
      apiKey,
      model,
    });

    const { error: updateError } = await supabase
      .from("portfolio_items")
      .update({ alt })
      .eq("id", row.id);

    if (updateError) throw updateError;

    updated += 1;
    console.log(`Portfolio: "${row.title}" -> "${alt}"`);
  }

  return updated;
}

async function regenerateProjectMedia({ supabase, apiKey, model }) {
  const { data: rows, error } = await supabase
    .from("project_pages")
    .select("slug, title, media_items")
    .order("slug", { ascending: true });

  if (error) throw error;

  let updated = 0;

  for (const row of rows || []) {
    const mediaItems = Array.isArray(row.media_items) ? row.media_items : [];
    let didChange = false;
    const nextMediaItems = [];

    for (const item of mediaItems) {
      if ((item.mediaType || "image") !== "image") {
        nextMediaItems.push(item);
        continue;
      }

      const alt = await generateAltText({
        src: item.src,
        title: item.alt || row.title,
        projectSlug: row.slug,
        apiKey,
        model,
      });

      nextMediaItems.push({
        ...item,
        alt,
      });

      didChange = true;
      updated += 1;
      console.log(`Project ${row.slug}: "${item.src}" -> "${alt}"`);
    }

    if (!didChange) continue;

    const { error: updateError } = await supabase
      .from("project_pages")
      .update({ media_items: nextMediaItems })
      .eq("slug", row.slug);

    if (updateError) throw updateError;
  }

  return updated;
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = loadEnvFile(envPath);

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials in .env.local");
  }

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env.local");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const portfolioUpdated = await regeneratePortfolioItems({ supabase, apiKey, model });
  const projectMediaUpdated = await regenerateProjectMedia({ supabase, apiKey, model });

  console.log(
    `Done. Updated ${portfolioUpdated} portfolio image alt text(s) and ${projectMediaUpdated} project media alt text(s).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

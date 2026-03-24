import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { assertAdminRequest } from "@/lib/auth";

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

async function loadImageAsBase64(src) {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error("Could not fetch image for alt generation.");
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  }

  if (src.startsWith("/")) {
    const filePath = path.join(process.cwd(), "public", src.replace(/^\/+/, ""));
    const fileBuffer = await readFile(filePath);
    return fileBuffer.toString("base64");
  }

  throw new Error("Unsupported image source for alt generation.");
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
  return String(parsed.alt || "").trim();
}

export async function POST(request) {
  try {
    await assertAdminRequest();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY mangler i miljovariablerne." }, { status: 500 });
    }

    const body = await request.json();
    const src = String(body.src || "");
    const title = String(body.title || "");
    const projectSlug = String(body.projectSlug || "");

    if (!src) {
      return NextResponse.json({ error: "Missing image source." }, { status: 400 });
    }

    if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(src)) {
      return NextResponse.json({ error: "Auto alt is currently available for images only." }, { status: 400 });
    }

    const imageData = await loadImageAsBase64(src);
    const mimeType = getMimeType(src);
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
      throw new Error(`Gemini-fejl: ${errorPayload}`);
    }

    const responsePayload = await response.json();
    const alt = cleanAltText(extractAltText(responsePayload));

    if (!alt) {
      throw new Error("No alt text returned.");
    }

    return NextResponse.json({ alt });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate alt text.",
      },
      { status: 500 }
    );
  }
}

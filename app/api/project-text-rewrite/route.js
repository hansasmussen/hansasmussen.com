import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/auth";

function extractJsonObject(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI response did not contain valid JSON.");
  }

  return JSON.parse(match[0]);
}

function normalizeTypography(value) {
  return String(value || "").replace(/[—–]/g, "-");
}

function buildRewritePrompt({ title, summary, body }) {
  return `
You are rewriting portfolio project copy for a photography website.

Task:
- Rewrite the text with a light touch of Hunter S. Thompson: energetic, witty, slightly wild, but still grounded.
- Keep it elegant enough for an art and fashion photography portfolio.
- Preserve the real meaning, core facts, mood, and technical truth of the original text.
- Do not invent gear, locations, people, or events that are not already implied.
- Keep the writing vivid, cinematic, sharp, and readable.
- Favor a brighter, more playful, more light-struck feeling over anything bleak, menacing, or self-destructive.
- Lean toward wonder, charge, motion, mischief, and beauty rather than dread, decay, or collapse.
- Make it feel alive, stylish, and slightly wild, not dark, aggressive, or overly abstract.
- Keep the text closer to the source than before. Prefer refinement over total reinvention.

Return JSON only in this exact shape:
{
  "summary": "optional rewritten summary, max 100 characters, empty string allowed",
  "body": "rewritten project intro/body"
}

Rules:
- If the original summary is empty, return an empty string for "summary".
- Keep summary under 100 characters.
- Keep body to roughly the same length as the original unless the original is very sparse.
- Do not use quotation marks around the whole text.
- Do not add commentary or explanation outside the JSON.
- Avoid references to doom, madness, violence, ruin, paranoia, or chemical excess unless the source text already clearly requires it.
- Prefer visual surprise, sensual detail, and playful momentum.
- Never use an em dash. Always use a normal hyphen instead.
- Avoid metaphors that make the copy feel detached from the actual image.

Input title:
${title || ""}

Input summary:
${summary || ""}

Input body:
${body || ""}
  `.trim();
}

export async function POST(request) {
  try {
    await assertAdminRequest();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY mangler i miljovariablerne.",
        },
        { status: 500 }
      );
    }

    const payload = await request.json();
    const prompt = buildRewritePrompt(payload);

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
                  text: prompt,
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
    const text = responsePayload.candidates
      ?.flatMap((candidate) => candidate.content?.parts || [])
      .map((part) => part.text || "")
      .join("\n");

    const rewritten = extractJsonObject(text || "");

    return NextResponse.json({
      summary: normalizeTypography(rewritten.summary || ""),
      body: normalizeTypography(rewritten.body || ""),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to rewrite project text.",
      },
      { status: 500 }
    );
  }
}

import fs from "node:fs";
import path from "node:path";
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

function buildTitle(index, mediaType) {
  const prefix = mediaType === "video" ? "Portfolio Video" : "Portfolio Image";
  return `${prefix} ${index}`;
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = loadEnvFile(envPath);

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials in .env.local");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: rows, error } = await supabase
    .from("portfolio_items")
    .select("id, title, media_type, storage_path, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  const uploadedRows = (rows || []).filter((row) => row.storage_path);
  let imageCounter = 0;
  let videoCounter = 0;
  let updatedCount = 0;

  for (const row of uploadedRows) {
    const mediaType = row.media_type === "video" ? "video" : "image";
    if (mediaType === "video") {
      videoCounter += 1;
    } else {
      imageCounter += 1;
    }

    const nextTitle = buildTitle(mediaType === "video" ? videoCounter : imageCounter, mediaType);
    if (row.title === nextTitle) continue;

    const { error: updateError } = await supabase
      .from("portfolio_items")
      .update({ title: nextTitle })
      .eq("id", row.id);

    if (updateError) {
      throw updateError;
    }

    updatedCount += 1;
    console.log(`Renamed "${row.title}" -> "${nextTitle}"`);
  }

  console.log(`Done. Updated ${updatedCount} uploaded portfolio item title(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

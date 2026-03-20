import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function sanitizeFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function POST(request) {
  try {
    await assertAdminRequest();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "portfolio-images";
    const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "jpg";
    const baseName = sanitizeFileName(file.name) || "upload";
    const filePath = `portfolio/${Date.now()}-${crypto.randomUUID()}-${baseName}.${extension}`;

    const supabase = createSupabaseAdminClient();
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      src: publicUrlData.publicUrl,
      path: filePath,
      bucket,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed.",
      },
      { status: 500 }
    );
  }
}

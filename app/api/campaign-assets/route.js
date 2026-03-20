import { NextResponse } from "next/server";
import { uploadCampaignAsset } from "@/lib/campaign-delivery";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const campaignId = String(formData.get("campaignId") || "").trim();

    if (!campaignId) {
      return NextResponse.json({ error: "Kampagne-id mangler." }, { status: 400 });
    }

    const asset = await uploadCampaignAsset({
      campaignId,
      file: formData.get("file"),
      kind: String(formData.get("kind") || "").trim(),
      title: String(formData.get("title") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
    });

    return NextResponse.json({ asset }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload fejlede.",
      },
      { status: 500 }
    );
  }
}

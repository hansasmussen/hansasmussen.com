import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/auth";
import { getSiteData, saveSiteData } from "@/lib/site-data";

export async function GET() {
  await assertAdminRequest();
  const siteData = await getSiteData();
  return NextResponse.json(siteData);
}

export async function PUT(request) {
  try {
    await assertAdminRequest();
    const body = await request.json();
    const savedSiteData = await saveSiteData(body);
    return NextResponse.json(savedSiteData);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save site data.",
      },
      { status: 500 }
    );
  }
}

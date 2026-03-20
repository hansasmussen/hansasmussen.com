import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

    revalidatePath("/");
    revalidatePath("/work");
    revalidatePath("/contact");

    for (const project of savedSiteData.projects || []) {
      if (project.slug) revalidatePath(`/work/${project.slug}`);
    }

    for (const post of savedSiteData.journalPosts || []) {
      if (post.slug) revalidatePath(`/journal/${post.slug}`);
    }

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

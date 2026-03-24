import { getSiteData } from "@/lib/site-data";
import { siteUrl } from "@/lib/seo";

export default async function sitemap() {
  const siteData = await getSiteData();
  const now = new Date();

  const staticRoutes = ["", "/work", "/contact"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
  }));

  const projectRoutes = (siteData.projects || []).map((project) => ({
    url: `${siteUrl}/work/${project.slug}`,
    lastModified: now,
  }));

  const journalRoutes = (siteData.journalPosts || []).map((post) => ({
    url: `${siteUrl}/journal/${post.slug}`,
    lastModified: now,
  }));

  return [...staticRoutes, ...projectRoutes, ...journalRoutes];
}

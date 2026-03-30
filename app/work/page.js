import { PublicLayout } from "@/components/PublicLayout";
import { WorkExperience } from "@/components/WorkExperience";
import { getPrintProducts, getSiteData } from "@/lib/site-data";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  title: "Work",
  description:
    "Selected photography work by Hans Asmussen across fashion, lifestyle, portrait and editorial projects.",
  path: "/work",
});

export default async function WorkPage() {
  const siteData = await getSiteData();
  const showPrints = getPrintProducts(siteData).length > 0;

  return (
    <PublicLayout mainClassName="work-main" showPrints={showPrints}>
      <WorkExperience items={siteData.portfolioItems} manifesto={siteData.content.workManifesto} />
    </PublicLayout>
  );
}

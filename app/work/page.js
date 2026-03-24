import { PublicLayout } from "@/components/PublicLayout";
import { WorkExperience } from "@/components/WorkExperience";
import { getSiteData } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function WorkPage() {
  const siteData = await getSiteData();

  return (
    <PublicLayout mainClassName="work-main">
      <WorkExperience items={siteData.portfolioItems} manifesto={siteData.content.workManifesto} />
    </PublicLayout>
  );
}

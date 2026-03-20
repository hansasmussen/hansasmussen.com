import { PortfolioGrid } from "@/components/PortfolioGrid";
import { PublicLayout } from "@/components/PublicLayout";
import { getSiteData } from "@/lib/site-data";

export default async function WorkPage() {
  const siteData = await getSiteData();

  return (
    <PublicLayout mainClassName="work-main">
      <section className="intro work-intro">
        <p className="work-manifesto">{siteData.content.workManifesto}</p>
      </section>
      <section className="work-gallery work-gallery-embedded">
        <div className="work-gallery-inner">
          <PortfolioGrid items={siteData.portfolioItems} />
        </div>
      </section>
    </PublicLayout>
  );
}

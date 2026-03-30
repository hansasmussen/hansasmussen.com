import { Carousel } from "@/components/Carousel";
import { PublicLayout } from "@/components/PublicLayout";
import { getFeaturedSlides, getPrintProducts, getSiteData } from "@/lib/site-data";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  description:
    "Photography portfolio by Hans Asmussen featuring fashion, lifestyle, portrait and editorial work.",
  path: "/",
});

export default async function HomePage() {
  const siteData = await getSiteData();
  const slides = getFeaturedSlides(siteData);
  const showPrints = getPrintProducts(siteData).length > 0;

  return (
    <PublicLayout showPrints={showPrints}>
      <div className="home-main-content">
        <section className="hero">
          <div className="hero-copy hero-copy-centered">
            <p className="home-manifesto">{siteData.content.homeManifesto}</p>
          </div>
          <Carousel slides={slides} />
        </section>
      </div>
    </PublicLayout>
  );
}

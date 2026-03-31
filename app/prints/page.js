import { notFound } from "next/navigation";
import { PrintProductCard } from "@/components/PrintProductCard";
import { PublicLayout } from "@/components/PublicLayout";
import { getPrintProducts, getSiteData } from "@/lib/site-data";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  title: "Prints",
  description: "Selected photography prints by Hans Asmussen, available in curated sizes on archival paper.",
  path: "/prints",
});

export default async function PrintsPage() {
  const siteData = await getSiteData();
  const printProducts = getPrintProducts(siteData);

  if (!printProducts.length) {
    notFound();
  }

  return (
    <PublicLayout mainClassName="prints-page" showPrints>
      <section className="prints-intro">
        <p className="eyebrow">Buy Prints</p>
        <h1>Selected works available as prints.</h1>
        <p className="prints-lede">
          A curated selection of images available in small editions and printed on carefully chosen paper.
          Sizes and stock vary from work to work.
        </p>
      </section>

      <section className="prints-grid" aria-label="Print products">
        {printProducts.map((product) => (
          <PrintProductCard key={product.id} product={product} />
        ))}
      </section>
    </PublicLayout>
  );
}

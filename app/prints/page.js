import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/PublicLayout";
import { getPrintProducts, getSiteData } from "@/lib/site-data";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  title: "Prints",
  description: "Selected photography prints by Hans Asmussen, available in curated sizes on archival paper.",
  path: "/prints",
});

function formatPrice(price) {
  return new Intl.NumberFormat("en-DK", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

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
          <article key={product.id} className="print-card">
            <div className="print-card-media">
              <img src={product.src} alt={product.alt} loading="lazy" />
            </div>
            <div className="print-card-copy">
              <h2>{product.title}</h2>
              {product.paper ? <p className="print-card-paper">{product.paper}</p> : null}
              {product.sizeOptions.length ? (
                <ul className="print-card-options">
                  {product.sizeOptions.map((option) => (
                    <li key={`${product.id}-${option.label}`}>
                      <span>{option.label}</span>
                      <span>{formatPrice(option.price)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="print-card-placeholder">Print details are being prepared.</p>
              )}
              <p className="print-card-note">Checkout and delivery flow comes next. This first pass is the curated shop overview.</p>
            </div>
          </article>
        ))}
      </section>
    </PublicLayout>
  );
}

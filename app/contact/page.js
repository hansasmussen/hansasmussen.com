import { ContactForm } from "@/components/ContactForm";
import { PublicLayout } from "@/components/PublicLayout";
import { getPrintProducts, getSiteData } from "@/lib/site-data";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Contact Hans Asmussen for fashion, lifestyle, portrait and editorial photography projects across Europe.",
  path: "/contact",
});

export default async function ContactPage() {
  const siteData = await getSiteData();
  const showPrints = getPrintProducts(siteData).length > 0;

  return (
    <PublicLayout showPrints={showPrints}>
      <div className="contact-shell">
        <section className="contact-layout">
          <div className="contact-copy">
            <h1 className="contact-copy-heading">{siteData.content.contactHeader}</h1>
            <p className="contact-copy-body">{siteData.content.contactBody}</p>
          </div>
          <ContactForm />
        </section>
      </div>
    </PublicLayout>
  );
}

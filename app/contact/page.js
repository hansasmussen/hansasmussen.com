import { ContactForm } from "@/components/ContactForm";
import { PublicLayout } from "@/components/PublicLayout";
import { getSiteData } from "@/lib/site-data";

export default async function ContactPage() {
  const siteData = await getSiteData();

  return (
    <PublicLayout>
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

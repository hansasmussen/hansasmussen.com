import Link from "next/link";
import { createCampaignAction, createCustomerAction } from "@/app/campaign-delivery/actions";
import { getCampaignDashboardData } from "@/lib/campaign-delivery";

export const metadata = {
  title: "Campaign Delivery",
  description: "Internal campaign delivery dashboard",
};

export const dynamic = "force-dynamic";

export default async function CampaignDeliveryPage() {
  try {
    const { customers, campaigns, stats } = await getCampaignDashboardData();

    return (
      <main className="campaign-shell">
        <section className="campaign-hero">
          <div>
            <p className="campaign-kicker">Campaign Delivery</p>
            <h1>Byg komplette kampagneleverancer fra brief til download.</h1>
            <p className="campaign-lede">
              Første version samler kunder, brandprofiler, kampagner, assets og AI-copy i samme flow.
            </p>
          </div>
          <div className="campaign-stats">
            <article>
              <strong>{stats.customerCount}</strong>
              <span>Kunder</span>
            </article>
            <article>
              <strong>{stats.campaignCount}</strong>
              <span>Kampagner</span>
            </article>
            <article>
              <strong>{stats.activeCampaignCount}</strong>
              <span>Aktive</span>
            </article>
          </div>
        </section>

        <section className="campaign-grid">
          <div className="campaign-card">
            <h2>Opret kunde</h2>
            <form action={createCustomerAction} className="campaign-form">
              <label>
                Kundenavn
                <input name="name" placeholder="Nord Studio" required />
              </label>
              <label>
                Brandnavn
                <input name="brandName" placeholder="Nord Studio" />
              </label>
              <label>
                Website
                <input name="website" placeholder="https://brand.dk" />
              </label>
              <label>
                Kontaktperson
                <input name="contactName" placeholder="Navn" />
              </label>
              <label>
                E-mail
                <input name="contactEmail" type="email" placeholder="mail@brand.dk" />
              </label>
              <label>
                Primært sprog
                <select name="primaryLanguage" defaultValue="da">
                  <option value="da">Dansk</option>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="sv">Svenska</option>
                </select>
              </label>
              <button type="submit">Opret kunde</button>
            </form>
          </div>

          <div className="campaign-card">
            <h2>Opret kampagne</h2>
            <form action={createCampaignAction} className="campaign-form">
              <label>
                Kunde
                <select name="customerId" required defaultValue="">
                  <option value="" disabled>
                    Vælg kunde
                  </option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.brandName || customer.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Kampagnenavn
                <input name="name" placeholder="Spring Drop 2026" required />
              </label>
              <label>
                Budskab
                <input name="heroMessage" placeholder="Drop der forener farve, bevægelse og materialer" />
              </label>
              <label>
                Beskrivelse
                <textarea name="description" rows="4" placeholder="Kort brief om kampagnen" />
              </label>
              <button type="submit" disabled={!customers.length}>
                Opret kampagne
              </button>
            </form>
          </div>
        </section>

        <section className="campaign-list-block">
          <div className="campaign-list-header">
            <h2>Kunder</h2>
            <p>
              {customers.length
                ? "Klik ind og udfyld tone of voice samt brandprofil."
                : "Opret første kunde for at komme i gang."}
            </p>
          </div>
          <div className="campaign-list">
            {customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/campaign-delivery/customers/${customer.id}`}
                className="campaign-list-card"
              >
                <div>
                  <p className="campaign-card-eyebrow">{customer.primaryLanguage.toUpperCase()}</p>
                  <h3>{customer.brandName || customer.name}</h3>
                </div>
                <p>{customer.contactName || "Ingen kontaktperson endnu"}</p>
                <div className="campaign-chip-row">
                  <span>{customer.campaignCount} kampagner</span>
                  <span>{customer.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="campaign-list-block">
          <div className="campaign-list-header">
            <h2>Seneste kampagner</h2>
            <p>Herfra kan du gå videre til assets og AI-copy.</p>
          </div>
          <div className="campaign-list">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaign-delivery/campaigns/${campaign.id}`}
                className="campaign-list-card"
              >
              <div>
                <p className="campaign-card-eyebrow">{campaign.status}</p>
                <h3>{campaign.name}</h3>
              </div>
              <p>{campaign.description || "Ingen brief endnu"}</p>
            </Link>
          ))}
        </div>
      </section>
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : "Ukendt fejl";

    return (
      <main className="campaign-shell">
        <section className="campaign-card">
          <p className="campaign-kicker">Campaign Delivery</p>
          <h1>Opsætningen mangler et trin</h1>
          <p className="campaign-lede">
            Siden kunne ikke hente data fra Supabase. Det skyldes typisk, at schemaet til campaign delivery
            endnu ikke er kørt i SQL editoren.
          </p>
          <div className="campaign-error-box">
            <strong>Fejl fra serveren</strong>
            <pre>{message}</pre>
          </div>
          <div className="campaign-stack">
            <p>Kør filen `supabase/campaign-delivery-schema.sql` i dit Supabase-projekt og genindlæs siden.</p>
          </div>
        </section>
      </main>
    );
  }
}

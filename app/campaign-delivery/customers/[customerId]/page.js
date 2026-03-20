import Link from "next/link";
import {
  createCampaignAction,
  deleteCampaignAction,
  updateBrandProfileAction,
} from "@/app/campaign-delivery/actions";
import { PantonePaletteSelector } from "@/components/PantonePaletteSelector";
import { PANTONE_OPTIONS } from "@/lib/campaign-options";
import { getCustomerDetail } from "@/lib/campaign-delivery";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params, searchParams }) {
  const { customerId } = await params;
  const data = await getCustomerDetail(customerId);

  if (!data) {
    return (
      <main className="campaign-shell">
        <p>Kunden blev ikke fundet.</p>
      </main>
    );
  }

  const { customer, brandProfile, campaigns } = data;
  const resolvedSearchParams = await searchParams;
  const deletedState = resolvedSearchParams?.deleted || "";

  return (
    <main className="campaign-shell">
      <Link href="/campaign-delivery" className="campaign-backlink">
        Tilbage til oversigt
      </Link>

      <section className="campaign-hero campaign-hero-tight">
        <div>
          <p className="campaign-kicker">Kundeprofil</p>
          <h1>{customer.brandName || customer.name}</h1>
          <p className="campaign-lede">
            Udfyld brandprofilen grundigt. Det er den, der farver captions, hashtags og kampagnetekster senere.
          </p>
        </div>
        <div className="campaign-meta">
          <span>{customer.contactEmail || "Ingen mail endnu"}</span>
          <span>{customer.website || "Intet website endnu"}</span>
        </div>
      </section>

      <section className="campaign-grid">
        <div className="campaign-card">
          <h2>Brandprofil</h2>
          <form action={updateBrandProfileAction} className="campaign-form">
            <input type="hidden" name="customerId" value={customer.id} />
            <label>
              Brandbeskrivelse
              <textarea name="brandDescription" rows="4" defaultValue={brandProfile.brandDescription} />
            </label>
            <label>
              Målgruppe
              <textarea name="targetAudience" rows="3" defaultValue={brandProfile.targetAudience} />
            </label>
            <label>
              Tone of voice
              <textarea name="toneOfVoice" rows="3" defaultValue={brandProfile.toneOfVoice} />
            </label>
            <label>
              Foretrukne ord
              <input name="preferredWords" defaultValue={brandProfile.preferredWords} placeholder="sofistikeret, taktil, nordisk" />
            </label>
            <label>
              No-go ord
              <input name="forbiddenWords" defaultValue={brandProfile.forbiddenWords} placeholder="billig, outlet, basic" />
            </label>
            <label>
              CTA-stil
              <input name="ctaStyle" defaultValue={brandProfile.ctaStyle} placeholder="Diskret og redaktionel" />
            </label>
            <label>
              Hashtag-stil
              <input name="hashtagStyle" defaultValue={brandProfile.hashtagStyle} placeholder="Bland brand-tags med sæson og produktkategori" />
            </label>
            <label>
              Gode copy-eksempler
              <textarea name="writingExamples" rows="5" defaultValue={brandProfile.writingExamples} />
            </label>
            <label>
              Dårlige copy-eksempler
              <textarea name="antiExamples" rows="4" defaultValue={brandProfile.antiExamples} />
            </label>
            <button type="submit">Gem brandprofil</button>
          </form>
        </div>

        <div className="campaign-card">
          <h2>Ny kampagne</h2>
          <form action={createCampaignAction} className="campaign-form">
            <input type="hidden" name="customerId" value={customer.id} />
            <label>
              Kampagnenavn
              <input name="name" placeholder="Summer Occasion Edit" required />
            </label>
            <label>
              Beskrivelse
              <textarea name="description" rows="4" placeholder="Kort kampagnebrief" />
            </label>
            <div className="campaign-field-group">
              <span className="campaign-field-group-label">Moodboards</span>
              <input name="moodboards" type="file" accept="image/*,application/pdf,.pdf" multiple />
            </div>
            <div className="campaign-field-group">
              <span className="campaign-field-group-label">Farvepalette</span>
              <PantonePaletteSelector options={PANTONE_OPTIONS} selected={[]} />
            </div>
            <button type="submit">Opret kampagne</button>
          </form>
        </div>
      </section>

      <section className="campaign-list-block">
        <div className="campaign-list-header">
          <h2>Kampagner</h2>
          <p>{campaigns.length ? "Fortsæt på kampagnesiden for uploads og copy." : "Ingen kampagner endnu."}</p>
        </div>
        {deletedState === "campaign" ? (
          <div className="campaign-inline-message campaign-inline-message-success">
            Kampagnen er slettet.
          </div>
        ) : null}
        <div className="campaign-list">
          {campaigns.map((campaign) => (
            <article key={campaign.id} className="campaign-list-card">
              <Link href={`/campaign-delivery/campaigns/${campaign.id}`}>
                <div>
                  <p className="campaign-card-eyebrow">{campaign.status}</p>
                  <h3>{campaign.name}</h3>
                </div>
                <p>{campaign.heroMessage || campaign.description || "Ingen brief endnu"}</p>
              </Link>
              <form action={deleteCampaignAction} className="campaign-inline-form">
                <input type="hidden" name="campaignId" value={campaign.id} />
                <input type="hidden" name="customerId" value={customer.id} />
                <button type="submit" className="campaign-button-danger">
                  Slet kampagne
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import {
  deleteCampaignAction,
  exportCampaignPackagesAction,
  generateCampaignCopyAction,
  updateCampaignAssetDetailsAction,
  updateCampaignAction,
  updateCampaignPostPlanAction,
  updateCampaignFormatsAction,
} from "@/app/campaign-delivery/actions";
import { CampaignAssetUploadForm } from "@/components/CampaignAssetUploadForm";
import { CampaignDeliveryPackagesEditor } from "@/components/CampaignDeliveryPackagesEditor";
import { CampaignPostPlanEditor } from "@/components/CampaignPostPlanEditor";
import {
  ASPECT_RATIO_OPTIONS,
  DELIVERY_FORMAT_OPTIONS,
  EUROPEAN_CHANNEL_OPTIONS,
  getPantoneSwatch,
} from "@/lib/campaign-options";
import { getCampaignDetail } from "@/lib/campaign-delivery";

export const dynamic = "force-dynamic";

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "Ikke sat endnu";
  if (startDate && endDate) return `${startDate} til ${endDate}`;
  return startDate || endDate;
}

export default async function CampaignDetailPage({ params, searchParams }) {
  const { campaignId } = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getCampaignDetail(campaignId);

  if (!data) {
    return (
      <main className="campaign-shell">
        <p>Kampagnen blev ikke fundet.</p>
      </main>
    );
  }

  const { campaign, customer, assets, copyVariants } = data;
  const savedState = resolvedSearchParams?.saved || "";
  const message = resolvedSearchParams?.message || "";
  const moodboards = assets.filter((asset) => asset.kind === "moodboard");
  const campaignAssets = assets.filter((asset) => asset.kind !== "moodboard");
  const hasAssets = campaignAssets.length > 0;
  const hasPostPlan = campaign.postPlan.length > 0;

  return (
    <main className="campaign-shell">
      <Link href={`/campaign-delivery/customers/${customer?.id || ""}`} className="campaign-backlink">
        Tilbage til kunde
      </Link>

      <section className="campaign-hero campaign-hero-tight">
        <div>
          <p className="campaign-kicker">Kampagne</p>
          <h1>{campaign.name}</h1>
          <p className="campaign-lede">
            Kampagnen er bygget som et progressivt flow, hvor briefet ligger fast, og næste step kun åbner,
            når det er relevant.
          </p>
        </div>
        <div className="campaign-meta">
          <span>{customer?.brandName || customer?.name}</span>
          <span>{campaign.status}</span>
          <span>{formatDateRange(campaign.startDate, campaign.endDate)}</span>
          <form action={deleteCampaignAction} className="campaign-inline-form">
            <input type="hidden" name="campaignId" value={campaign.id} />
            <input type="hidden" name="customerId" value={customer?.id || ""} />
            <button type="submit" className="campaign-button-danger">
              Slet kampagne
            </button>
          </form>
          <span>Denne handling kan ikke fortrydes.</span>
        </div>
      </section>

      <div className="campaign-detail-layout">
        <div className="campaign-detail-main">
          <section className="campaign-step-card">
            <div className="campaign-step-head">
              <div>
                <p className="campaign-step-number">Step 1</p>
                <h2>Upload assets</h2>
              </div>
              <p className="campaign-step-copy">
                Upload kun billeder og video til kampagnen. Når assets er på plads, åbner postplanen og
                derefter copy-genereringen automatisk op.
              </p>
            </div>

            <div className="campaign-grid campaign-grid-steps">
              <div className="campaign-card">
                <CampaignAssetUploadForm campaignId={campaign.id} />
              </div>
              <div className="campaign-card">
                <h3>Uploadede assets</h3>
                {savedState === "asset-links" ? (
                  <div className="campaign-inline-message campaign-inline-message-success">
                    Asset-data er gemt.
                  </div>
                ) : null}
                <div className="campaign-stack">
                  {campaignAssets.length ? (
                    campaignAssets.map((asset) => (
                      <article key={asset.id} className="campaign-asset-card">
                        <div className="campaign-stack">
                          {asset.mimeType.startsWith("image/") ? (
                            <img
                              src={asset.fileUrl}
                              alt={asset.title || "Asset preview"}
                              className="campaign-asset-thumb"
                            />
                          ) : asset.mimeType.startsWith("video/") ? (
                            <video
                              src={asset.fileUrl}
                              className="campaign-asset-thumb"
                              controls
                              preload="metadata"
                            />
                          ) : null}
                          <div>
                            <p className="campaign-card-eyebrow">{asset.kind}</p>
                            <h3>{asset.title || "Uden titel"}</h3>
                            <p>{asset.notes || "Ingen noter"}</p>
                          </div>
                          <a href={asset.fileUrl} target="_blank" rel="noreferrer">
                            Åbn fil
                          </a>
                          <form action={updateCampaignAssetDetailsAction} className="campaign-form">
                            <input type="hidden" name="campaignId" value={campaign.id} />
                            <input type="hidden" name="assetId" value={asset.id} />
                            <label>
                              Produkter på asset
                              <input
                                name="productNames"
                                defaultValue={asset.productNames.join(", ")}
                                placeholder="SKU123, støvle sort, taske cognac"
                              />
                            </label>
                            <p>Gem produktdata, så de kan bruges i postplanen og copyen.</p>
                            <button type="submit">Gem asset-data</button>
                          </form>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p>Ingen assets uploadet endnu.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={`campaign-step-card ${hasAssets ? "is-active" : "is-muted"}`}>
            <div className="campaign-step-head">
              <div>
                <p className="campaign-step-number">Step 2</p>
                <h2>Postplan</h2>
              </div>
              <p className="campaign-step-copy">
                Vælg hvilke assets der skal høre til de enkelte posts, og giv dem en arbejdsoverskrift.
                Det er denne plan Gemini bruger, når teksten genereres.
              </p>
            </div>

            {!hasAssets ? (
              <div className="campaign-step-placeholder">
                Upload mindst ét asset i Step 1 for at åbne postplanen.
              </div>
            ) : (
              <div className="campaign-card">
                {savedState === "post-plan" ? (
                  <div className="campaign-inline-message campaign-inline-message-success">
                    Postplan gemt.
                  </div>
                ) : null}
                <CampaignPostPlanEditor
                  action={updateCampaignPostPlanAction}
                  campaignId={campaign.id}
                  channelOptions={campaign.channels.length ? campaign.channels : EUROPEAN_CHANNEL_OPTIONS}
                  assets={campaignAssets}
                  initialRows={campaign.postPlan || []}
                />
              </div>
            )}
          </section>

          <section className={`campaign-step-card ${hasAssets && hasPostPlan ? "is-active" : "is-muted"}`}>
            <div className="campaign-step-head">
              <div>
                <p className="campaign-step-number">Step 3</p>
                <h2>Generér copy</h2>
              </div>
              <p className="campaign-step-copy">
                Ét klik genererer hele pakken ud fra postplanen. Hvert post får tekst baseret på kanal,
                arbejdsoverskrift og de assets, du har koblet til.
              </p>
            </div>

            {!hasAssets ? (
              <div className="campaign-step-placeholder">
                Step 3 bliver aktivt, når der er uploadet assets og oprettet en postplan.
              </div>
            ) : !hasPostPlan ? (
              <div className="campaign-step-placeholder">
                Gem mindst ét post i Step 2, før copyen kan genereres.
              </div>
            ) : (
              <>
                {savedState === "copy" ? (
                  <div className="campaign-inline-message campaign-inline-message-success">
                    Hele copy-pakken er genereret.
                  </div>
                ) : null}
                {savedState === "copy-error" ? (
                  <div className="campaign-inline-message campaign-inline-message-error">
                    {message || "Generering fejlede."}
                  </div>
                ) : null}

                <div className="campaign-card">
                  <form action={generateCampaignCopyAction} className="campaign-form">
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <label>
                      Sprog
                      <input name="language" defaultValue={customer?.primaryLanguage || "da"} />
                    </label>
                    <button type="submit">Generér hele copy-pakken</button>
                  </form>
                </div>

                <div className="campaign-stack campaign-results-block">
                  {copyVariants.length ? (
                    copyVariants.map((variant) => (
                      <article key={variant.id} className="campaign-copy-card">
                        <div className="campaign-chip-row">
                          <span>{variant.channel}</span>
                          <span>{variant.variantType}</span>
                          <span>{variant.language}</span>
                        </div>
                        <h3>{variant.headline || "Uden headline"}</h3>
                        <p>{variant.body || "Ingen body genereret endnu"}</p>
                        <p className="campaign-copy-cta">{variant.cta || "Ingen CTA"}</p>
                        {variant.assetIds.length ? (
                          <div className="campaign-chip-row">
                            {variant.assetIds.map((assetId) => {
                              const asset = campaignAssets.find((item) => item.id === assetId);
                              return <span key={assetId}>{asset?.title || "Valgt asset"}</span>;
                            })}
                          </div>
                        ) : null}
                        <div className="campaign-chip-row">
                          {variant.hashtags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </article>
                    ))
                  ) : (
                    <p>Ingen copy-varianter endnu.</p>
                  )}
                </div>
              </>
            )}
          </section>

          <section className="campaign-step-card">
            <div className="campaign-step-head">
              <div>
                <p className="campaign-step-number">Step 4</p>
                <h2>Billedformater</h2>
              </div>
              <p className="campaign-step-copy">
                Angiv de formater kampagnen skal leveres i. Det kan senere kobles til automatiske crops og
                exports.
              </p>
            </div>

            {savedState === "formats" ? (
              <div className="campaign-inline-message campaign-inline-message-success">
                Pakker gemt.
              </div>
            ) : null}
            {savedState === "formats-error" ? (
              <div className="campaign-inline-message campaign-inline-message-error">
                {message || "Eksport kræver mindst én pakke."}
              </div>
            ) : null}

            <div className="campaign-grid campaign-grid-steps">
              <div className="campaign-card">
                <CampaignDeliveryPackagesEditor
                  action={updateCampaignFormatsAction}
                  campaignId={campaign.id}
                  assets={campaignAssets}
                  formatOptions={DELIVERY_FORMAT_OPTIONS}
                  aspectRatioOptions={ASPECT_RATIO_OPTIONS}
                  initialRows={campaign.deliveryPackages || []}
                />
              </div>
              <div className="campaign-card">
                <div className="campaign-stack">
                  <div>
                    <h3>Aktuelle pakker</h3>
                    <p>Vælg assets, format og forhold for hver pakke. Når alt er på plads, kan hele setup’et eksporteres.</p>
                  </div>
                  {campaign.deliveryPackages.length ? (
                    campaign.deliveryPackages.map((item) => (
                      <article key={item.id} className="campaign-asset-card">
                        <div className="campaign-stack">
                          <div>
                            <p className="campaign-card-eyebrow">Pakke</p>
                            <h3>{item.name}</h3>
                          </div>
                          <div className="campaign-chip-row">
                            <span>{item.format}</span>
                            <span>{item.aspectRatio}</span>
                            <span>{item.selectionMode === "all" ? "Alle assets" : `${(item.assetIds || []).length} valgte assets`}</span>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p>Ingen pakker oprettet endnu.</p>
                  )}
                  <form action={exportCampaignPackagesAction} className="campaign-form">
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <button type="submit">Eksportér pakker</button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="campaign-detail-sidebar">
          <section className="campaign-card campaign-brief-sidebar">
            <p className="campaign-step-number">Brief</p>
            {savedState === "brief" ? (
              <div className="campaign-inline-message campaign-inline-message-success">
                Brief opdateret.
              </div>
            ) : null}
            <div className="campaign-stack">
              <div>
                <p className="campaign-card-eyebrow">Kampagnenavn</p>
                <h3>{campaign.name}</h3>
              </div>
              <div>
                <p className="campaign-card-eyebrow">Beskrivelse</p>
                <p>{campaign.description || "Ingen brief skrevet endnu."}</p>
              </div>
              {moodboards.length ? (
                <div>
                  <p className="campaign-card-eyebrow">Moodboards</p>
                  <div className="campaign-stack">
                    {moodboards.map((asset) => (
                      <a key={asset.id} href={asset.fileUrl} target="_blank" rel="noreferrer">
                        {asset.title || "Moodboard"}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
              {campaign.colorPalette.length ? (
                <div>
                  <p className="campaign-card-eyebrow">Farvepalette</p>
                  <div className="campaign-chip-row">
                    {campaign.colorPalette.map((color) => (
                      <span key={color} className="campaign-color-chip">
                        <span
                          className="campaign-color-swatch"
                          aria-hidden="true"
                          style={{ backgroundColor: getPantoneSwatch(color) }}
                        />
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div>
                <p className="campaign-card-eyebrow">Kampagneperiode</p>
                <p>{formatDateRange(campaign.startDate, campaign.endDate)}</p>
              </div>
            </div>
            <div className="campaign-step-summary">
              <div>
                <span>Posts planlagt</span>
                <strong>{campaign.postPlan.length}</strong>
              </div>
              <div>
                <span>Assets</span>
                <strong>{campaignAssets.length}</strong>
              </div>
            </div>
            <details className="campaign-brief-editor">
              <summary>Redigér brief</summary>
              <form action={updateCampaignAction} className="campaign-form campaign-brief-form">
                <input type="hidden" name="campaignId" value={campaign.id} />
                <input type="hidden" name="status" value={campaign.status} />
                <label>
                  Kampagnenavn
                  <input name="name" defaultValue={campaign.name} required />
                </label>
                <label>
                  Beskrivelse / brief
                  <textarea name="description" rows="4" defaultValue={campaign.description} />
                </label>
                <label>
                  Kampagneperiode start
                  <input name="startDate" type="date" defaultValue={campaign.startDate} />
                </label>
                <label>
                  Kampagneperiode slut
                  <input name="endDate" type="date" defaultValue={campaign.endDate} />
                </label>
                <button type="submit">Gem brief</button>
              </form>
            </details>
          </section>
        </aside>
      </div>
    </main>
  );
}

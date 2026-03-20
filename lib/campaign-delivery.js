import { createCampaignSupabaseAdminClient } from "@/lib/supabase/admin";

const DEFAULT_BUCKET = process.env.SUPABASE_CAMPAIGN_BUCKET || "campaign-delivery";

function mapCustomer(row, campaigns = []) {
  const customerCampaigns = campaigns.filter((campaign) => campaign.customer_id === row.id);

  return {
    id: row.id,
    name: row.name,
    brandName: row.brand_name || "",
    primaryLanguage: row.primary_language || "da",
    website: row.website || "",
    contactName: row.contact_name || "",
    contactEmail: row.contact_email || "",
    status: row.status || "active",
    createdAt: row.created_at,
    campaignCount: customerCampaigns.length,
    activeCampaignCount: customerCampaigns.filter((campaign) => campaign.status !== "delivered").length,
  };
}

function mapBrandProfile(row) {
  return {
    customerId: row.customer_id,
    brandDescription: row.brand_description || "",
    targetAudience: row.target_audience || "",
    toneOfVoice: row.tone_of_voice || "",
    preferredWords: (row.preferred_words || []).join(", "),
    forbiddenWords: (row.forbidden_words || []).join(", "),
    ctaStyle: row.cta_style || "",
    hashtagStyle: row.hashtag_style || "",
    channels: (row.channels || []).join(", "),
    writingExamples: row.writing_examples || "",
    antiExamples: row.anti_examples || "",
  };
}

function mapCampaign(row) {
  const socialPostPlan = Array.isArray(row.social_post_plan) ? row.social_post_plan : [];
  const postPlan = Array.isArray(row.post_plan) ? row.post_plan : [];
  const newsletterPlan = Array.isArray(row.newsletter_plan)
    ? row.newsletter_plan.map((item) => ({
        type: item.type || "Newsletter",
        count: Number.isFinite(item.count) && item.count > 0 ? item.count : 1,
        subjects: Array.isArray(item.subjects)
          ? item.subjects
          : item.subject
            ? [item.subject]
            : [],
      }))
    : [];
  const assetFormats = Array.isArray(row.asset_formats) ? row.asset_formats : [];
  const colorPalette = Array.isArray(row.color_palette) ? row.color_palette : [];
  const deliveryPackages = Array.isArray(row.delivery_packages) ? row.delivery_packages : [];

  return {
    id: row.id,
    customerId: row.customer_id,
    name: row.name,
    description: row.description || "",
    objective: row.objective || "",
    audience: row.audience || "",
    channels: row.channels || [],
    deliverables: row.deliverables || [],
    status: row.status || "draft",
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    heroMessage: row.hero_message || "",
    socialPostPlan,
    postPlan,
    newsletterPlan,
    assetFormats,
    colorPalette,
    deliveryPackages,
    socialPlanText: socialPostPlan.map((item) => `${item.channel} | ${item.posts}`).join("\n"),
    newsletterPlanText: newsletterPlan
      .map((item) => `${item.type} | ${item.count} | ${(item.subjects || []).join(" ;; ")}`)
      .join("\n"),
    assetFormatsText: assetFormats.join(", "),
    createdAt: row.created_at,
  };
}

function mapAsset(row) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    kind: row.kind,
    title: row.title || "",
    notes: row.notes || "",
    productNames: row.product_names || [],
    fileUrl: row.file_url,
    storagePath: row.storage_path || "",
    mimeType: row.mime_type || "",
    createdAt: row.created_at,
  };
}

function mapCopyVariant(row) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    channel: row.channel,
    variantType: row.variant_type,
    language: row.language,
    headline: row.headline || "",
    body: row.body || "",
    cta: row.cta || "",
    hashtags: row.hashtags || [],
    createdAt: row.created_at,
  };
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitLines(value) {
  return String(value || "")
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseSocialPlan(value) {
  return splitLines(value)
    .map((line) => {
      const [channelRaw, postsRaw] = line.split("|").map((entry) => entry.trim());
      if (!channelRaw) return null;

      const posts = Number.parseInt(postsRaw || "1", 10);
      return {
        channel: channelRaw,
        posts: Number.isFinite(posts) && posts > 0 ? posts : 1,
      };
    })
    .filter(Boolean);
}

function parseNewsletterPlan(value) {
  return splitLines(value)
    .map((line) => {
      const [typeRaw, countRaw, subjectsRaw] = line.split("|").map((entry) => entry.trim());
      if (!typeRaw) return null;

      const count = Number.parseInt(countRaw || "1", 10);
      const subjects = String(subjectsRaw || "")
        .split(";;")
        .map((entry) => entry.trim())
        .filter(Boolean);

      return {
        type: typeRaw,
        count: Number.isFinite(count) && count > 0 ? count : 1,
        subjects,
      };
    })
    .filter(Boolean);
}

function sanitizeFileName(fileName) {
  return String(fileName || "upload")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function buildCopyPrompt({ customer, brandProfile, campaign, language }) {
  const moodboardDescription =
    campaign.moodboards?.length
      ? campaign.moodboards
          .map((asset) => `${asset.title || "Moodboard"}${asset.notes ? ` (noter: ${asset.notes})` : ""}`)
          .join("; ")
      : "ingen moodboards";
  const colorPaletteDescription =
    campaign.colorPalette?.length ? campaign.colorPalette.join(", ") : "ingen farver angivet";
  const socialPlanDescription =
    campaign.postPlan?.length
      ? campaign.postPlan
          .map((item) => {
            const assetDescription =
              item.assets?.length
                ? item.assets
                    .map(
                      (asset) =>
                        `${asset.title || "Untitled"} (produkter: ${(asset.productNames || []).join(", ") || "ingen"}, noter: ${asset.notes || "ingen"})`
                    )
                    .join("; ")
                : "ingen assets";

            return `- plan_id: ${item.id}, kanal: ${item.channel}, arbejdsoverskrift: ${item.workingTitle || "ingen"}, fokus: ${item.assets?.length ? "asset-fokuseret post" : "brief-baseret kampagnetekst"}, assets: ${assetDescription}`;
          })
          .join("\n")
      : "- Ingen planlagte posts";
  const formatDescription =
    campaign.assetFormats?.length ? campaign.assetFormats.map((item) => `- ${item}`).join("\n") : "- Ingen formater angivet";

  return `
Du er en erfaren creative strategist og social media copywriter for e-commerce brands.

Skriv på ${language || customer.primaryLanguage || "da"}.

Brand:
- Navn: ${customer.brandName || customer.name}
- Beskrivelse: ${brandProfile.brandDescription || "Ikke udfyldt"}
- Målgruppe: ${brandProfile.targetAudience || "Ikke udfyldt"}
- Tone of voice: ${brandProfile.toneOfVoice || "Ikke udfyldt"}
- Foretrukne ord: ${brandProfile.preferredWords || "Ingen angivet"}
- Ord der skal undgås: ${brandProfile.forbiddenWords || "Ingen angivet"}
- CTA-stil: ${brandProfile.ctaStyle || "Ikke udfyldt"}
- Hashtag-stil: ${brandProfile.hashtagStyle || "Ikke udfyldt"}

Kampagne:
- Navn: ${campaign.name}
- Beskrivelse: ${campaign.description || "Ikke udfyldt"}
- Mål: ${campaign.objective || "Ikke udfyldt"}
- Primært budskab: ${campaign.heroMessage || "Ikke udfyldt"}
- Periode: ${campaign.startDate || "ukendt"} til ${campaign.endDate || "ukendt"}
- Moodboards: ${moodboardDescription}
- Farvepalette: ${colorPaletteDescription}

Social plan:
${socialPlanDescription}

Asset-formater:
${formatDescription}

Skriv et JSON-objekt med præcis denne struktur:
{
  "items": [
    {
      "channel": "Instagram Feed",
      "variant_type": "social_post",
      "source_plan_id": "plan-1",
      "headline": "kort headline",
      "body": "caption eller annoncecopy",
      "cta": "kort call to action",
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
    }
  ]
}

Regler:
- Ingen forklaringer udenfor JSON
- Der skal laves præcis et item pr. postplan
- For sociale posts skal source_plan_id matche plan_id fra postplanen
- Hvis et post ikke har assets, skal teksten bygge på brief, moodboard og farvepalette frem for specifikke produkter
- Hvis et post har assets, skal teksten tydeligt prioritere de assets og deres produktdata over generelle kampagnegreb
- Headline skal være kort og brugbar
- Body skal være klar til publicering
- Hashtags uden mellemrumstegn og højst 5 stk.
  `.trim();
}

function extractJsonObject(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("AI-svaret indeholdt ikke et JSON-objekt.");
  }

  return JSON.parse(match[0]);
}

export async function getCampaignDashboardData() {
  const supabase = createCampaignSupabaseAdminClient();

  const [{ data: customerRows, error: customerError }, { data: campaignRows, error: campaignError }] =
    await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
    ]);

  if (customerError) throw customerError;
  if (campaignError) throw campaignError;

  const customers = (customerRows || []).map((row) => mapCustomer(row, campaignRows || []));
  const campaigns = (campaignRows || []).map(mapCampaign);

  return {
    customers,
    campaigns,
    stats: {
      customerCount: customers.length,
      campaignCount: campaigns.length,
      activeCampaignCount: campaigns.filter((campaign) => campaign.status !== "delivered").length,
    },
  };
}

export async function getCustomerDetail(customerId) {
  const supabase = createCampaignSupabaseAdminClient();

  const [
    { data: customerRow, error: customerError },
    { data: brandProfileRow, error: brandProfileError },
    { data: campaignRows, error: campaignError },
  ] = await Promise.all([
    supabase.from("customers").select("*").eq("id", customerId).maybeSingle(),
    supabase.from("brand_profiles").select("*").eq("customer_id", customerId).maybeSingle(),
    supabase.from("campaigns").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }),
  ]);

  if (customerError) throw customerError;
  if (brandProfileError) throw brandProfileError;
  if (campaignError) throw campaignError;
  if (!customerRow) return null;

  return {
    customer: mapCustomer(customerRow, campaignRows || []),
    brandProfile: brandProfileRow
      ? mapBrandProfile(brandProfileRow)
      : mapBrandProfile({ customer_id: customerId }),
    campaigns: (campaignRows || []).map(mapCampaign),
  };
}

export async function getCampaignDetail(campaignId) {
  const supabase = createCampaignSupabaseAdminClient();

  const { data: campaignRow, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) throw campaignError;
  if (!campaignRow) return null;

  const customerId = campaignRow.customer_id;

  const [
    { data: customerRow, error: customerError },
    { data: brandProfileRow, error: brandProfileError },
    { data: assetRows, error: assetError },
    { data: copyRows, error: copyError },
  ] = await Promise.all([
    supabase.from("customers").select("*").eq("id", customerId).maybeSingle(),
    supabase.from("brand_profiles").select("*").eq("customer_id", customerId).maybeSingle(),
    supabase.from("campaign_assets").select("*").eq("campaign_id", campaignId).order("created_at", { ascending: false }),
    supabase.from("copy_variants").select("*").eq("campaign_id", campaignId).order("created_at", { ascending: false }),
  ]);

  if (customerError) throw customerError;
  if (brandProfileError) throw brandProfileError;
  if (assetError) throw assetError;
  if (copyError) throw copyError;

  const assetIds = (assetRows || []).map((row) => row.id);
  let linkRows = [];

  if (assetIds.length) {
    const { data, error } = await supabase
      .from("copy_variant_assets")
      .select("*")
      .in("asset_id", assetIds);

    if (error) throw error;
    linkRows = data || [];
  }

  const assetLinkLookup = new Map();
  for (const row of linkRows || []) {
    const existing = assetLinkLookup.get(row.asset_id) || [];
    existing.push(row.copy_variant_id);
    assetLinkLookup.set(row.asset_id, existing);
  }

  return {
    campaign: {
      ...mapCampaign(campaignRow),
      moodboards: (assetRows || []).filter((asset) => asset.kind === "moodboard").map(mapAsset),
      postPlan: (mapCampaign(campaignRow).postPlan || []).map((item) => ({
        ...item,
        assets: (assetRows || [])
          .filter((asset) => (item.assetIds || []).includes(asset.id))
          .map(mapAsset),
      })),
    },
    customer: customerRow ? mapCustomer(customerRow, [campaignRow]) : null,
    brandProfile: brandProfileRow ? mapBrandProfile(brandProfileRow) : mapBrandProfile({ customer_id: customerId }),
    assets: (assetRows || []).map((row) => ({
      ...mapAsset(row),
      linkedCopyVariantIds: assetLinkLookup.get(row.id) || [],
    })),
    copyVariants: (copyRows || []).map((row) => ({
      ...mapCopyVariant(row),
      assetIds: (linkRows || [])
        .filter((linkRow) => linkRow.copy_variant_id === row.id)
        .map((linkRow) => linkRow.asset_id),
    })),
  };
}

export async function createCustomer(payload) {
  const supabase = createCampaignSupabaseAdminClient();
  const normalizedPayload = {
    name: payload.name,
    brand_name: payload.brandName || payload.name,
    website: payload.website || null,
    contact_name: payload.contactName || null,
    contact_email: payload.contactEmail || null,
    primary_language: payload.primaryLanguage || "da",
    status: payload.status || "active",
  };

  const { data, error } = await supabase.from("customers").insert(normalizedPayload).select("*").single();
  if (error) throw error;

  const { error: brandProfileError } = await supabase.from("brand_profiles").insert({
    customer_id: data.id,
  });

  if (brandProfileError) throw brandProfileError;

  return data;
}

export async function updateBrandProfile(customerId, payload) {
  const supabase = createCampaignSupabaseAdminClient();
  const normalizedPayload = {
    customer_id: customerId,
    brand_description: payload.brandDescription || "",
    target_audience: payload.targetAudience || "",
    tone_of_voice: payload.toneOfVoice || "",
    preferred_words: splitList(payload.preferredWords),
    forbidden_words: splitList(payload.forbiddenWords),
    cta_style: payload.ctaStyle || "",
    hashtag_style: payload.hashtagStyle || "",
    channels: splitList(payload.channels),
    writing_examples: payload.writingExamples || "",
    anti_examples: payload.antiExamples || "",
  };

  const { error } = await supabase.from("brand_profiles").upsert(normalizedPayload, {
    onConflict: "customer_id",
  });

  if (error) throw error;
}

export async function createCampaign(payload) {
  const supabase = createCampaignSupabaseAdminClient();
  const normalizedPayload = {
    customer_id: payload.customerId,
    name: payload.name,
    description: payload.description || "",
    objective: payload.objective || "",
    audience: payload.audience || "",
    channels: splitList(payload.channels),
    deliverables: splitList(payload.deliverables),
    status: payload.status || "draft",
    start_date: payload.startDate || null,
    end_date: payload.endDate || null,
    hero_message: payload.heroMessage || "",
    social_post_plan: parseSocialPlan(payload.socialPlanText),
    post_plan: payload.postPlan || [],
    newsletter_plan: parseNewsletterPlan(payload.newsletterPlanText),
    asset_formats: splitList(payload.assetFormatsText),
    color_palette: payload.colorPalette || [],
    delivery_packages: payload.deliveryPackages || [],
  };

  const { data, error } = await supabase.from("campaigns").insert(normalizedPayload).select("*").single();
  if (error) throw error;

  return data;
}

export async function updateCampaign(campaignId, payload) {
  const supabase = createCampaignSupabaseAdminClient();
  const { data: existingCampaign, error: existingCampaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (existingCampaignError) throw existingCampaignError;
  if (!existingCampaign) throw new Error("Kampagnen blev ikke fundet.");

  const normalizedPayload = {
    name: payload.name ?? existingCampaign.name,
    description: payload.description ?? existingCampaign.description ?? "",
    objective: payload.objective ?? existingCampaign.objective ?? "",
    audience: payload.audience ?? existingCampaign.audience ?? "",
    channels:
      payload.channels !== undefined ? splitList(payload.channels) : existingCampaign.channels || [],
    deliverables:
      payload.deliverables !== undefined
        ? splitList(payload.deliverables)
        : existingCampaign.deliverables || [],
    status: payload.status ?? existingCampaign.status ?? "draft",
    start_date:
      payload.startDate !== undefined ? payload.startDate || null : existingCampaign.start_date || null,
    end_date: payload.endDate !== undefined ? payload.endDate || null : existingCampaign.end_date || null,
    hero_message: payload.heroMessage ?? existingCampaign.hero_message ?? "",
    social_post_plan:
      payload.socialPlanText !== undefined
        ? parseSocialPlan(payload.socialPlanText)
        : existingCampaign.social_post_plan || [],
    post_plan: payload.postPlan !== undefined ? payload.postPlan : existingCampaign.post_plan || [],
    newsletter_plan:
      payload.newsletterPlanText !== undefined
        ? parseNewsletterPlan(payload.newsletterPlanText)
        : existingCampaign.newsletter_plan || [],
    asset_formats:
      payload.assetFormatsText !== undefined
        ? splitList(payload.assetFormatsText)
        : existingCampaign.asset_formats || [],
    color_palette: payload.colorPalette !== undefined ? payload.colorPalette : existingCampaign.color_palette || [],
    delivery_packages:
      payload.deliveryPackages !== undefined ? payload.deliveryPackages : existingCampaign.delivery_packages || [],
  };

  const { data, error } = await supabase
    .from("campaigns")
    .update(normalizedPayload)
    .eq("id", campaignId)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function deleteCampaign(campaignId) {
  const supabase = createCampaignSupabaseAdminClient();

  const [
    { data: campaignRow, error: campaignError },
    { data: assetRows, error: assetError },
  ] = await Promise.all([
    supabase.from("campaigns").select("id, customer_id").eq("id", campaignId).maybeSingle(),
    supabase.from("campaign_assets").select("storage_path").eq("campaign_id", campaignId),
  ]);

  if (campaignError) throw campaignError;
  if (assetError) throw assetError;
  if (!campaignRow) {
    throw new Error("Kampagnen blev ikke fundet.");
  }

  const storagePaths = (assetRows || [])
    .map((asset) => asset.storage_path)
    .filter(Boolean);

  if (storagePaths.length) {
    const { error: storageError } = await supabase.storage.from(DEFAULT_BUCKET).remove(storagePaths);
    if (storageError) throw storageError;
  }

  const { error: deleteError } = await supabase.from("campaigns").delete().eq("id", campaignId);
  if (deleteError) throw deleteError;

  return {
    id: campaignRow.id,
    customerId: campaignRow.customer_id,
  };
}

export async function uploadCampaignAsset({ campaignId, file, kind, title, notes }) {
  if (!(file instanceof File) || !file.size) {
    throw new Error("Vælg en fil, før du uploader.");
  }
  const isMoodboard = kind === "moodboard";
  const isSupportedAsset = file.type.startsWith("image/") || file.type.startsWith("video/");
  const isSupportedMoodboard = file.type.startsWith("image/") || file.type === "application/pdf";

  if (isMoodboard ? !isSupportedMoodboard : !isSupportedAsset) {
    throw new Error(
      isMoodboard
        ? "Moodboards understøtter kun billede og PDF i denne version."
        : "Kun billede- og videofiler understøttes i denne version."
    );
  }

  const supabase = createCampaignSupabaseAdminClient();
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "bin";
  const baseName = sanitizeFileName(file.name) || "asset";
  const filePath = `campaigns/${campaignId}/${Date.now()}-${crypto.randomUUID()}-${baseName}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(DEFAULT_BUCKET)
    .upload(filePath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(filePath);

  const { data, error } = await supabase
    .from("campaign_assets")
    .insert({
      campaign_id: campaignId,
      kind: kind || "asset",
      title: title || file.name.replace(/\.[^.]+$/, ""),
      notes: notes || "",
      product_names: [],
      file_url: publicUrlData.publicUrl,
      storage_path: filePath,
      mime_type: file.type || "application/octet-stream",
    })
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function updateCampaignAssetDetails(assetId, payload) {
  const supabase = createCampaignSupabaseAdminClient();
  const productNames = splitList(payload.productNames);

  const { data: assetRow, error: assetError } = await supabase
    .from("campaign_assets")
    .update({
      product_names: productNames,
    })
    .eq("id", assetId)
    .select("*")
    .single();

  if (assetError) throw assetError;

  return assetRow;
}

export async function updateCampaignPostPlan(campaignId, postPlan) {
  const supabase = createCampaignSupabaseAdminClient();
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      post_plan: postPlan,
    })
    .eq("id", campaignId)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function updateCampaignDeliveryPackages(campaignId, deliveryPackages) {
  const supabase = createCampaignSupabaseAdminClient();
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      delivery_packages: deliveryPackages,
    })
    .eq("id", campaignId)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function generateCampaignCopy({ campaignId, language }) {
  const campaignDetail = await getCampaignDetail(campaignId);
  if (!campaignDetail) {
    throw new Error("Kampagnen blev ikke fundet.");
  }
  if (!campaignDetail.campaign.postPlan?.length) {
    throw new Error("Tilføj mindst ét post i postplanen, før du genererer copy.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY mangler i miljøvariablerne.");
  }

  const prompt = buildCopyPrompt({
    customer: campaignDetail.customer,
    brandProfile: campaignDetail.brandProfile,
    campaign: campaignDetail.campaign,
    language: language || campaignDetail.customer?.primaryLanguage || "da",
  });

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`Gemini-fejl: ${errorPayload}`);
  }

  const payload = await response.json();
  const text =
    payload.candidates
      ?.flatMap((candidate) => candidate.content?.parts || [])
      .map((part) => part.text || "")
      .join("\n") || "";

  const parsed = extractJsonObject(text);
  const items = Array.isArray(parsed.items) ? parsed.items : [];

  if (!items.length) {
    throw new Error("Gemini returnerede ingen copy-items.");
  }

  const supabase = createCampaignSupabaseAdminClient();
  const { error: deleteError } = await supabase.from("copy_variants").delete().eq("campaign_id", campaignId);
  if (deleteError) throw deleteError;

  const existingAssetIds = (campaignDetail.assets || []).map((asset) => asset.id);
  if (existingAssetIds.length) {
    const { error: deleteLinkError } = await supabase
      .from("copy_variant_assets")
      .delete()
      .in("asset_id", existingAssetIds);
    if (deleteLinkError) throw deleteLinkError;
  }

  const { data, error } = await supabase
    .from("copy_variants")
    .insert(
      items.map((item) => ({
        campaign_id: campaignId,
        channel: item.channel || "Unknown",
        variant_type: item.variant_type || "social_post",
        source_plan_id: item.source_plan_id || null,
        language: language || campaignDetail.customer?.primaryLanguage || "da",
        headline: item.headline || "",
        body: item.body || "",
        cta: item.cta || "",
        hashtags: Array.isArray(item.hashtags) ? item.hashtags : [],
      }))
    )
    .select("*");

  if (error) throw error;

  const copyVariantByPlanId = new Map(
    (data || [])
      .map((row) => [row.source_plan_id, row])
      .filter(([planId]) => planId)
  );

  const linkPayload = [];
  for (const planItem of campaignDetail.campaign.postPlan || []) {
    const copyVariant = copyVariantByPlanId.get(planItem.id);
    if (!copyVariant) continue;

    for (const [index, assetId] of (planItem.assetIds || []).entries()) {
      linkPayload.push({
        copy_variant_id: copyVariant.id,
        asset_id: assetId,
        sort_order: index,
      });
    }
  }

  if (linkPayload.length) {
    const { error: linkInsertError } = await supabase.from("copy_variant_assets").insert(linkPayload);
    if (linkInsertError) throw linkInsertError;
  }

  return data;
}

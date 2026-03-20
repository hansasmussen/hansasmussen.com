"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCampaign,
  createCustomer,
  deleteCampaign,
  generateCampaignCopy,
  getCampaignDetail,
  updateCampaignAssetDetails,
  updateCampaignDeliveryPackages,
  updateCampaignPostPlan,
  updateBrandProfile,
  updateCampaign,
  uploadCampaignAsset,
} from "@/lib/campaign-delivery";

function requiredValue(formData, key, label) {
  const value = String(formData.get(key) || "").trim();
  if (!value) {
    throw new Error(`${label} er påkrævet.`);
  }

  return value;
}

function buildCheckboxList(formData, key) {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean)
    .join(", ");
}

function buildPostPlan(formData) {
  const rowIds = formData.getAll("postPlanRowId").map((value) => String(value).trim());

  return rowIds
    .map((rowId) => {
      const channel = String(formData.get(`postPlanChannel__${rowId}`) || "").trim();
      const workingTitle = String(formData.get(`postPlanTitle__${rowId}`) || "").trim();
      const assetIds = formData
        .getAll(`postPlanAssetIds__${rowId}`)
        .map((value) => String(value).trim())
        .filter(Boolean);

      if (!channel) return null;

      return {
        id: rowId,
        channel,
        workingTitle,
        assetIds,
      };
    })
    .filter(Boolean);
}

function buildDeliveryPackages(formData) {
  const rowIds = formData.getAll("deliveryPackageRowId").map((value) => String(value).trim());

  return rowIds
    .map((rowId) => {
      const name = String(formData.get(`deliveryPackageName__${rowId}`) || "").trim();
      const format = String(formData.get(`deliveryPackageFormat__${rowId}`) || "").trim();
      const aspectRatio = String(formData.get(`deliveryPackageAspectRatio__${rowId}`) || "").trim();
      const selectionMode = String(formData.get(`deliveryPackageSelectionMode__${rowId}`) || "selected").trim();
      const assetIds = formData
        .getAll(`deliveryPackageAssetIds__${rowId}`)
        .map((value) => String(value).trim())
        .filter(Boolean);

      if (!name || !format || !aspectRatio) return null;

      return {
        id: rowId,
        name,
        format,
        aspectRatio,
        selectionMode,
        assetIds: selectionMode === "all" ? [] : assetIds,
      };
    })
    .filter(Boolean);
}

export async function createCustomerAction(formData) {
  const customer = await createCustomer({
    name: requiredValue(formData, "name", "Kundenavn"),
    brandName: String(formData.get("brandName") || "").trim(),
    website: String(formData.get("website") || "").trim(),
    contactName: String(formData.get("contactName") || "").trim(),
    contactEmail: String(formData.get("contactEmail") || "").trim(),
    primaryLanguage: String(formData.get("primaryLanguage") || "da").trim(),
    status: String(formData.get("status") || "active").trim(),
  });

  revalidatePath("/campaign-delivery");
  redirect(`/campaign-delivery/customers/${customer.id}`);
}

export async function updateBrandProfileAction(formData) {
  const customerId = requiredValue(formData, "customerId", "Kunde-id");

  await updateBrandProfile(customerId, {
    brandDescription: String(formData.get("brandDescription") || "").trim(),
    targetAudience: String(formData.get("targetAudience") || "").trim(),
    toneOfVoice: String(formData.get("toneOfVoice") || "").trim(),
    preferredWords: String(formData.get("preferredWords") || "").trim(),
    forbiddenWords: String(formData.get("forbiddenWords") || "").trim(),
    ctaStyle: String(formData.get("ctaStyle") || "").trim(),
    hashtagStyle: String(formData.get("hashtagStyle") || "").trim(),
    channels: String(formData.get("channels") || "").trim(),
    writingExamples: String(formData.get("writingExamples") || "").trim(),
    antiExamples: String(formData.get("antiExamples") || "").trim(),
  });

  revalidatePath(`/campaign-delivery/customers/${customerId}`);
}

export async function createCampaignAction(formData) {
  const campaign = await createCampaign({
    customerId: requiredValue(formData, "customerId", "Kunde"),
    name: requiredValue(formData, "name", "Kampagnenavn"),
    description: String(formData.get("description") || "").trim(),
    audience: String(formData.get("audience") || "").trim(),
    channels: buildCheckboxList(formData, "channels"),
    deliverables: buildCheckboxList(formData, "deliverables"),
    status: String(formData.get("status") || "draft").trim(),
    startDate: String(formData.get("startDate") || "").trim(),
    endDate: String(formData.get("endDate") || "").trim(),
    heroMessage: "",
    socialPlanText: "",
    newsletterPlanText: "",
    postPlan: [],
    assetFormatsText: buildCheckboxList(formData, "deliverables"),
    colorPalette: formData.getAll("colorPalette").map((value) => String(value).trim()).filter(Boolean),
  });

  const moodboards = formData.getAll("moodboards");
  for (const file of moodboards) {
    if (file instanceof File && file.size) {
      await uploadCampaignAsset({
        campaignId: campaign.id,
        file,
        kind: "moodboard",
        title: file.name.replace(/\.[^.]+$/, ""),
        notes: "Uploadet ved kampagneoprettelse",
      });
    }
  }

  revalidatePath("/campaign-delivery");
  revalidatePath(`/campaign-delivery/customers/${campaign.customer_id}`);
  redirect(`/campaign-delivery/campaigns/${campaign.id}`);
}

export async function updateCampaignAction(formData) {
  const campaignId = requiredValue(formData, "campaignId", "Kampagne-id");

  await updateCampaign(campaignId, {
    name: requiredValue(formData, "name", "Kampagnenavn"),
    description: String(formData.get("description") || "").trim(),
    status: String(formData.get("status") || "draft").trim(),
    startDate: String(formData.get("startDate") || "").trim(),
    endDate: String(formData.get("endDate") || "").trim(),
    assetFormatsText: String(formData.get("assetFormatsText") || "").trim(),
  });

  revalidatePath(`/campaign-delivery/campaigns/${campaignId}`);
  redirect(`/campaign-delivery/campaigns/${campaignId}?saved=brief`);
}

export async function updateCampaignFormatsAction(formData) {
  const campaignId = requiredValue(formData, "campaignId", "Kampagne-id");

  await updateCampaignDeliveryPackages(campaignId, buildDeliveryPackages(formData));

  revalidatePath(`/campaign-delivery/campaigns/${campaignId}`);
  redirect(`/campaign-delivery/campaigns/${campaignId}?saved=formats`);
}

export async function exportCampaignPackagesAction(formData) {
  const campaignId = requiredValue(formData, "campaignId", "Kampagne-id");
  const campaignDetail = await getCampaignDetail(campaignId);

  if (!campaignDetail) {
    throw new Error("Kampagnen blev ikke fundet.");
  }

  if (!campaignDetail.campaign.deliveryPackages?.length) {
    redirect(`/campaign-delivery/campaigns/${campaignId}?saved=formats-error&message=${encodeURIComponent("Opret mindst én pakke før eksport.")}`);
  }

  redirect(`/api/campaign-delivery/export/${campaignId}`);
}

export async function updateCampaignAssetDetailsAction(formData) {
  const campaignId = requiredValue(formData, "campaignId", "Kampagne-id");
  const assetId = requiredValue(formData, "assetId", "Asset-id");

  await updateCampaignAssetDetails(assetId, {
    productNames: String(formData.get("productNames") || "").trim(),
  });

  revalidatePath(`/campaign-delivery/campaigns/${campaignId}`);
  redirect(`/campaign-delivery/campaigns/${campaignId}?saved=asset-links`);
}

export async function updateCampaignPostPlanAction(formData) {
  const campaignId = requiredValue(formData, "campaignId", "Kampagne-id");

  await updateCampaignPostPlan(campaignId, buildPostPlan(formData));

  revalidatePath(`/campaign-delivery/campaigns/${campaignId}`);
  redirect(`/campaign-delivery/campaigns/${campaignId}?saved=post-plan`);
}

export async function generateCampaignCopyAction(formData) {
  const campaignId = requiredValue(formData, "campaignId", "Kampagne-id");

  try {
    await generateCampaignCopy({
      campaignId,
      language: String(formData.get("language") || "").trim(),
    });

    revalidatePath(`/campaign-delivery/campaigns/${campaignId}`);
    redirect(`/campaign-delivery/campaigns/${campaignId}?saved=copy`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generering fejlede af en ukendt grund.";
    redirect(
      `/campaign-delivery/campaigns/${campaignId}?saved=copy-error&message=${encodeURIComponent(message)}`
    );
  }
}

export async function deleteCampaignAction(formData) {
  const campaignId = requiredValue(formData, "campaignId", "Kampagne-id");
  const customerId = String(formData.get("customerId") || "").trim();

  const deletedCampaign = await deleteCampaign(campaignId);
  const redirectPath = customerId || deletedCampaign.customerId
    ? `/campaign-delivery/customers/${customerId || deletedCampaign.customerId}`
    : "/campaign-delivery";

  revalidatePath("/campaign-delivery");
  revalidatePath(redirectPath);
  redirect(`${redirectPath}?deleted=campaign`);
}

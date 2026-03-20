import archiver from "archiver";
import sharp from "sharp";
import { PassThrough } from "node:stream";
import { getCampaignDetail } from "@/lib/campaign-delivery";

const ASPECT_RATIO_DIMENSIONS = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
  "3:4": { width: 1200, height: 1600 },
  "1200x600": { width: 1200, height: 600 },
  "1200x628": { width: 1200, height: 628 },
  "970x250": { width: 970, height: 250 },
  "728x90": { width: 728, height: 90 },
  "300x250": { width: 300, height: 250 },
};

function sanitizeSegment(value) {
  return String(value || "item")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

function getTargetDimensions(aspectRatio) {
  const known = ASPECT_RATIO_DIMENSIONS[aspectRatio];
  if (known) return known;

  const pixelMatch = String(aspectRatio).match(/^(\d+)\s*x\s*(\d+)$/i);
  if (pixelMatch) {
    return {
      width: Number.parseInt(pixelMatch[1], 10),
      height: Number.parseInt(pixelMatch[2], 10),
    };
  }

  const ratioMatch = String(aspectRatio).match(/^(\d+)\s*:\s*(\d+)$/);
  if (ratioMatch) {
    const ratioWidth = Number.parseInt(ratioMatch[1], 10);
    const ratioHeight = Number.parseInt(ratioMatch[2], 10);
    const width = 1200;
    return {
      width,
      height: Math.round((width * ratioHeight) / ratioWidth),
    };
  }

  return { width: 1080, height: 1080 };
}

function getFileExtension(asset) {
  if (asset.mimeType === "image/png") return "png";
  if (asset.mimeType === "image/webp") return "webp";
  if (asset.mimeType === "video/mp4") return "mp4";

  const fromUrl = asset.fileUrl.split("?")[0].split(".").pop();
  return fromUrl || "bin";
}

async function fetchAssetBuffer(asset) {
  const response = await fetch(asset.fileUrl);
  if (!response.ok) {
    throw new Error(`Kunne ikke hente asset: ${asset.title || asset.id}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function appendAssetToArchive(archive, packageItem, asset, index) {
  const safePackage = sanitizeSegment(packageItem.name);
  const safeAsset = sanitizeSegment(asset.title || `asset-${index + 1}`);
  const extension = getFileExtension(asset);

  if (asset.mimeType.startsWith("image/")) {
    const { width, height } = getTargetDimensions(packageItem.aspectRatio);
    const buffer = await fetchAssetBuffer(asset);
    const outputFormat = extension === "png" ? "png" : "jpeg";
    const transformed = await sharp(buffer)
      .resize({
        width,
        height,
        fit: "cover",
        position: sharp.strategy.attention,
      })
      .toFormat(outputFormat, { quality: 90 })
      .toBuffer();

    archive.append(transformed, {
      name: `${safePackage}/${String(index + 1).padStart(2, "0")}-${safeAsset}-${width}x${height}.${outputFormat === "jpeg" ? "jpg" : outputFormat}`,
    });

    return;
  }

  const originalBuffer = await fetchAssetBuffer(asset);
  archive.append(originalBuffer, {
    name: `${safePackage}/${String(index + 1).padStart(2, "0")}-${safeAsset}-original.${extension}`,
  });
}

export async function GET(_request, { params }) {
  const { campaignId } = await params;
  const data = await getCampaignDetail(campaignId);

  if (!data) {
    return new Response(JSON.stringify({ error: "Kampagnen blev ikke fundet." }), {
      status: 404,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const campaignAssets = data.assets.filter((asset) => asset.kind !== "moodboard");
  const packages = (data.campaign.deliveryPackages || []).map((item) => ({
    ...item,
    assets:
      item.selectionMode === "all"
        ? campaignAssets
        : campaignAssets.filter((asset) => (item.assetIds || []).includes(asset.id)),
  }));

  if (!packages.length) {
    return new Response(JSON.stringify({ error: "Der er ingen pakker at eksportere." }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const stream = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.on("error", (error) => {
    stream.destroy(error);
  });

  archive.pipe(stream);

  const manifest = {
    campaign: {
      id: data.campaign.id,
      name: data.campaign.name,
      description: data.campaign.description,
      startDate: data.campaign.startDate,
      endDate: data.campaign.endDate,
    },
    packages: packages.map((item) => ({
      name: item.name,
      format: item.format,
      aspectRatio: item.aspectRatio,
      selectionMode: item.selectionMode,
      assetCount: item.assets.length,
    })),
  };

  archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });

  for (const packageItem of packages) {
    for (const [index, asset] of packageItem.assets.entries()) {
      await appendAssetToArchive(archive, packageItem, asset, index);
    }
  }

  await archive.finalize();

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${sanitizeSegment(data.campaign.name)}-delivery-packages.zip"`,
    },
  });
}

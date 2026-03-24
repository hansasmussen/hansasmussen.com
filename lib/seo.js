export const siteUrl = "https://www.hansasmussen.com";
export const siteName = "Hans Asmussen";
export const defaultDescription =
  "Fashion, lifestyle and portrait photography by Hans Asmussen. Editorial projects, moving image and visual stories based in Denmark and working across Europe.";
export const defaultOgImage = "/assets/test-set/aw2613082.jpg";

export function buildMetadata({
  title,
  description = defaultDescription,
  path = "/",
  image = defaultOgImage,
}) {
  const fullTitle = title ? `${title} | ${siteName}` : siteName;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName,
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

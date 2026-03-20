export const EUROPEAN_CHANNEL_OPTIONS = [
  "Instagram Feed",
  "Instagram Story",
  "Instagram Reel",
  "Facebook Feed",
  "TikTok",
  "YouTube Shorts",
  "Pinterest",
  "Snapchat",
  "LinkedIn",
];

export const SOCIAL_CHANNEL_OPTIONS = [
  "Instagram Feed",
  "Instagram Story",
  "Instagram Reel",
  "Facebook Feed",
  "TikTok",
  "LinkedIn",
];

export const EMAIL_TYPE_OPTIONS = [
  "Launch email",
  "Campaign email",
  "Reminder email",
  "Last chance email",
];

export const DELIVERABLE_OPTIONS = [
  "Image 1:1 social",
  "Image 4:5 social",
  "Story/Reel 9:16",
  "Video 16:9",
  "Banner 1200x628",
  "Banner 970x250",
  "Banner 728x90",
  "Banner 300x250",
  "Marketplace image 1:1",
  "Marketplace image 4:5",
  "Newsletter hero 1200x600",
  "Newsletter mobile 1:1",
];

export const DELIVERY_FORMAT_OPTIONS = [
  "Instagram Feed",
  "Instagram Story",
  "Instagram Reel",
  "Facebook Ad",
  "TikTok",
  "Marketplace",
  "Newsletter",
  "Display Banner",
  "Webshop Banner",
];

export const ASPECT_RATIO_OPTIONS = [
  "1:1",
  "4:5",
  "9:16",
  "16:9",
  "3:4",
  "1200x600",
  "1200x628",
  "970x250",
  "728x90",
  "300x250",
];

export const PANTONE_OPTIONS = [
  { label: "Pantone 11-0601 Bright White", swatch: "#F4F5F0" },
  { label: "Pantone 11-4300 Marshmallow", swatch: "#F0EEE4" },
  { label: "Pantone 13-1023 Peach Fuzz", swatch: "#FFBE98" },
  { label: "Pantone 13-0647 Illuminating", swatch: "#F5DF4D" },
  { label: "Pantone 14-0852 Spicy Mustard", swatch: "#D8AE47" },
  { label: "Pantone 15-0343 Greenery", swatch: "#88B04B" },
  { label: "Pantone 16-1546 Living Coral", swatch: "#FF6F61" },
  { label: "Pantone 17-3938 Very Peri", swatch: "#6667AB" },
  { label: "Pantone 17-5104 Ultimate Gray", swatch: "#939597" },
  { label: "Pantone 18-1750 Viva Magenta", swatch: "#BB2649" },
  { label: "Pantone 18-3838 Ultra Violet", swatch: "#5F4B8B" },
  { label: "Pantone 18-3943 Periwinkle", swatch: "#7C83BC" },
  { label: "Pantone 19-0303 Jet Black", swatch: "#343434" },
  { label: "Pantone 19-4052 Classic Blue", swatch: "#0F4C81" },
  { label: "Pantone 19-4524 Blue Teal", swatch: "#184F60" },
  { label: "Pantone 19-4914 Ocean Depths", swatch: "#006175" },
  { label: "Pantone 19-5513 Biscay Green", swatch: "#4C7A72" },
  { label: "Pantone 19-6050 Pepper Stem", swatch: "#8D9440" },
  { label: "Pantone 19-1664 Flame Scarlet", swatch: "#CD212A" },
  { label: "Pantone 19-2434 Red Violet", swatch: "#9E1030" },
  { label: "Pantone 19-3952 Twilight Blue", swatch: "#273C76" },
  { label: "Pantone 19-4125 Mood Indigo", swatch: "#1F2A44" },
  { label: "Pantone 19-4150 Blue Nights", swatch: "#363B48" },
  { label: "Pantone 19-5217 Balsam Green", swatch: "#576664" },
];

export function getPantoneSwatch(label) {
  return PANTONE_OPTIONS.find((option) => option.label === label)?.swatch || "#D8D3CC";
}

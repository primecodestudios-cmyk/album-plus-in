import psdWedding1 from "@/assets/psd-wedding-1.jpg";
import psdWedding2 from "@/assets/psd-wedding-2.jpg";
import psdEngagement1 from "@/assets/psd-engagement-1.jpg";
import psdBirthday1 from "@/assets/psd-birthday-1.jpg";
import psdBaby1 from "@/assets/psd-baby-1.jpg";
import psdTraditional1 from "@/assets/psd-traditional-1.jpg";

export type PsdCategory = "All" | "Wedding" | "Engagement" | "Birthday" | "Baby Shoot" | "Traditional";

export interface PsdTemplate {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  isFree: boolean;
  fileSize: string;
  photoshopVersion: string;
  pages: number;
  downloads: number;
  description?: string;
}

export const categories: PsdCategory[] = [
  "All",
  "Wedding",
  "Engagement",
  "Birthday",
  "Baby Shoot",
  "Traditional",
];

// Fallback images for templates without a preview_url
export const categoryFallbackImages: Record<string, string> = {
  Wedding: psdWedding1,
  Engagement: psdEngagement1,
  Birthday: psdBirthday1,
  "Baby Shoot": psdBaby1,
  Traditional: psdTraditional1,
};

export const defaultFallbackImage = psdWedding1;

// Legacy hardcoded templates (used as fallback if DB is empty)
export const templates: PsdTemplate[] = [
  { id: "w1", name: "Royal Wedding Gold Frame", category: "Wedding", image: psdWedding1, price: 0, isFree: true, fileSize: "85 MB", photoshopVersion: "CS6 — CC 2024", pages: 12, downloads: 4520 },
  { id: "w2", name: "Purple Elegance Spread", category: "Wedding", image: psdWedding2, price: 199, isFree: false, fileSize: "120 MB", photoshopVersion: "CS5 — CC 2024", pages: 18, downloads: 3210 },
  { id: "e1", name: "Pink Rose Engagement", category: "Engagement", image: psdEngagement1, price: 149, isFree: false, fileSize: "65 MB", photoshopVersion: "CS6 — CC 2024", pages: 8, downloads: 2870 },
  { id: "b1", name: "Birthday Bash Colorful", category: "Birthday", image: psdBirthday1, price: 0, isFree: true, fileSize: "55 MB", photoshopVersion: "CS3 — CC 2024", pages: 6, downloads: 5100 },
  { id: "bs1", name: "Cute Baby Stars", category: "Baby Shoot", image: psdBaby1, price: 99, isFree: false, fileSize: "48 MB", photoshopVersion: "CS6 — CC 2024", pages: 10, downloads: 1980 },
  { id: "t1", name: "Traditional Mandala Gold", category: "Traditional", image: psdTraditional1, price: 249, isFree: false, fileSize: "110 MB", photoshopVersion: "CS5 — CC 2024", pages: 16, downloads: 3450 },
];

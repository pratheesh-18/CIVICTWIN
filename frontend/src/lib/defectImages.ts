/**
 * CivicTwin Defect Image Resolution & Category Fallbacks
 * Guarantees every municipal complaint displays a realistic defect image.
 */

export const CATEGORY_DEFECT_IMAGES: Record<string, string> = {
  water: "/uploads/water_leak_before.jpg",
  leak: "/uploads/water_leak_before.jpg",
  pipeline: "/uploads/water_leak_before.jpg",
  pothole: "/uploads/pothole_before.jpg",
  road: "/uploads/pothole_before.jpg",
  light: "/uploads/streetlight_broken.jpg",
  lamp: "/uploads/streetlight_broken.jpg",
  electric: "/uploads/streetlight_broken.jpg",
  garbage: "/uploads/genuine_closure_tar.jpg",
  sanitation: "/uploads/genuine_closure_tar.jpg",
  waste: "/uploads/genuine_closure_tar.jpg",
  default: "/uploads/water_leak_before.jpg",
};

export function getDefectFallbackImage(category?: string | null): string {
  if (!category) return CATEGORY_DEFECT_IMAGES.default;
  const cat = category.toLowerCase().trim();

  for (const [key, imagePath] of Object.entries(CATEGORY_DEFECT_IMAGES)) {
    if (key !== "default" && cat.includes(key)) {
      return imagePath;
    }
  }

  return CATEGORY_DEFECT_IMAGES.default;
}

export function normalizeDefectImageUrl(
  imageUrl?: string | null,
  category?: string | null
): string {
  if (!imageUrl || imageUrl.trim() === "") {
    return getDefectFallbackImage(category);
  }

  const trimmed = imageUrl.trim();

  // If it's already an absolute HTTP/HTTPS URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Ensure leading slash for relative uploads
  if (!trimmed.startsWith("/")) {
    return `/${trimmed}`;
  }

  return trimmed;
}

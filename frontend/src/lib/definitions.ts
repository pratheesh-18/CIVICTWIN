export interface DepartmentMetadata {
  slug: string;
  name_en: string;
  name_ta: string;
  incharge_username: string;
  category: string;
}

export const DEPARTMENTS: Record<string, DepartmentMetadata> = {
  roads: {
    slug: "roads",
    name_en: "Roads & Infrastructure Maintenance Wing",
    name_ta: "சாலைகள் & உள்கட்டமைப்பு துறை",
    incharge_username: "roads_officer",
    category: "Pothole",
  },
  water: {
    slug: "water",
    name_en: "TWAD / Metro Water Supply Board",
    name_ta: "குடிநீர் வடிகால் வாரியம்",
    incharge_username: "water_officer",
    category: "Water Leakage",
  },
  electrical: {
    slug: "electrical",
    name_en: "Municipal Electrical & Lighting Dept",
    name_ta: "மின்சாரம் & தெருவிளக்கு துறை",
    incharge_username: "electrical_officer",
    category: "Streetlight",
  },
  sanitation: {
    slug: "sanitation",
    name_en: "Solid Waste Management Division",
    name_ta: "திடக்கழிவு மேலாண்மை பிரிவு",
    incharge_username: "sanitation_officer",
    category: "Garbage",
  },
};

export function getTierBadge(priorityScore: number) {
  if (priorityScore >= 0.75) {
    return {
      tier: "Tier 1 Critical",
      tier_number: 1,
      badgeClass: "bg-red-50 text-red-900 border border-red-300",
      markerColor: "#dc2626", // Red
    };
  } else if (priorityScore >= 0.45) {
    return {
      tier: "Tier 2 Urgent",
      tier_number: 2,
      badgeClass: "bg-amber-50 text-amber-900 border border-amber-300",
      markerColor: "#d97706", // Amber
    };
  } else {
    return {
      tier: "Tier 3 Routine",
      tier_number: 3,
      badgeClass: "bg-blue-50 text-blue-900 border border-blue-300",
      markerColor: "#2563eb", // Blue
    };
  }
}

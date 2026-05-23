import { PackageCard } from "../types";

export function matchesPackageQuery(item: PackageCard, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [item.place, item.highlights, item.category, item.destination, item.region, item.subPlaces]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.toLowerCase().includes(normalized));
}

import { PackageCard } from "../types";

export function matchesPackageQuery(item: PackageCard, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [item.place, item.highlights, item.category].some((value) =>
    value.toLowerCase().includes(normalized)
  );
}

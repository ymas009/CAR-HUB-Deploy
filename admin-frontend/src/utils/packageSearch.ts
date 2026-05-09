import { PackageCard } from "../types";

export function matchesPackageQuery(item: PackageCard, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [item.title, item.destination, item.category, item.accent].some((value) =>
    value.toLowerCase().includes(normalized)
  );
}

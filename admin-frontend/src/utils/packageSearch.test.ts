import { describe, expect, it } from "vitest";
import { PackageCard } from "../types";
import { matchesPackageQuery } from "./packageSearch";

const packageCard: PackageCard = {
  id: "pkg-1",
  title: "Family Beach Escape",
  destination: "Goa",
  category: "Holiday",
  duration: "4 days",
  price: "From INR 24,000",
  image: "/goa.jpg",
  trust: "Company reviewed request flow",
  accent: "Coastal stay with verified local execution"
};

describe("matchesPackageQuery", () => {
  it("matches by destination, category, title, and accent copy", () => {
    expect(matchesPackageQuery(packageCard, "goa")).toBe(true);
    expect(matchesPackageQuery(packageCard, "holiday")).toBe(true);
    expect(matchesPackageQuery(packageCard, "beach")).toBe(true);
    expect(matchesPackageQuery(packageCard, "verified")).toBe(true);
  });

  it("returns every package for an empty query", () => {
    expect(matchesPackageQuery(packageCard, "  ")).toBe(true);
  });

  it("rejects unrelated queries", () => {
    expect(matchesPackageQuery(packageCard, "himalaya")).toBe(false);
  });
});

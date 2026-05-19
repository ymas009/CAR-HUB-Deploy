import { describe, expect, it } from "vitest";
import { PackageCard } from "../types";
import { matchesPackageQuery } from "./packageSearch";

const packageCard: PackageCard = {
  id: "pkg-1",
  title: "Alibaug Coastal Escape",
  destination: "Alibaug",
  category: "Beach",
  duration: "4 days",
  price: "From INR 24,000",
  image: "/alibaug.jpg",
  trust: "Direct booking with verified providers",
  accent: "Coastal stay with verified local execution"
};

describe("matchesPackageQuery", () => {
  it("matches by destination, category, title, and accent copy", () => {
    expect(matchesPackageQuery(packageCard, "alibaug")).toBe(true);
    expect(matchesPackageQuery(packageCard, "beach")).toBe(true);
    expect(matchesPackageQuery(packageCard, "beach")).toBe(true);
    expect(matchesPackageQuery(packageCard, "verified")).toBe(true);
  });

  it("returns every package for an empty query", () => {
    expect(matchesPackageQuery(packageCard, "  ")).toBe(true);
  });

  it("rejects unrelated queries", () => {
    expect(matchesPackageQuery(packageCard, "kerala")).toBe(false);
  });
});

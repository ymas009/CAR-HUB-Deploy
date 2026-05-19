import { describe, expect, it } from "vitest";
import { PackageCard } from "../types";
import { matchesPackageQuery } from "./packageSearch";

const packageCard: PackageCard = {
  id: "pkg-1",
  place: "Lonavala",
  category: "Hill Station",
  distance_from_pune: "65 km",
  travel_time: "1.5 hrs",
  highlights: "Bhushi Dam, Tiger's Leap",
  image: "/lonavala.jpg"
};

describe("matchesPackageQuery", () => {
  it("matches by place, category, and highlights", () => {
    expect(matchesPackageQuery(packageCard, "lonavala")).toBe(true);
    expect(matchesPackageQuery(packageCard, "hill station")).toBe(true);
    expect(matchesPackageQuery(packageCard, "tiger")).toBe(true);
  });

  it("returns every package for an empty query", () => {
    expect(matchesPackageQuery(packageCard, "  ")).toBe(true);
  });

  it("rejects unrelated queries", () => {
    expect(matchesPackageQuery(packageCard, "himalaya")).toBe(false);
  });
});

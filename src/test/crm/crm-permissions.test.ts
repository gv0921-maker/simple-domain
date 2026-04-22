import { describe, it, expect } from "vitest";
import { maskEmail, maskPhone, maskRevenue, canViewSensitive } from "@/lib/crm/fieldMask";

describe("CRM Field Masking", () => {
  it("masks email correctly", () => {
    expect(maskEmail("john.doe@example.com")).toBe("jo••••••@example.com");
  });

  it("masks phone correctly", () => {
    const masked = maskPhone("+91-9876543210");
    expect(masked).toContain("3210");
    expect(masked).toContain("•");
  });

  it("masks revenue to order of magnitude", () => {
    expect(maskRevenue(0)).toBe("₹0");
    expect(maskRevenue(500)).toBe("< ₹1k");
    expect(maskRevenue(75000)).toBe("~ ₹75k");
    expect(maskRevenue(500000)).toBe("~ ₹5.0 L");
    expect(maskRevenue(20000000)).toBe("~ ₹2.0 Cr");
  });

  it("handles empty/undefined inputs", () => {
    expect(maskEmail("")).toBe("");
    expect(maskEmail(undefined)).toBe("");
    expect(maskPhone("")).toBe("");
    expect(maskPhone(undefined)).toBe("");
    expect(maskRevenue(undefined)).toBe("—");
  });

  it("denies sensitive access for unknown user", () => {
    expect(canViewSensitive(undefined, "crm", "email")).toBe(false);
  });
});

describe("CRM Lead Scoring", () => {
  it("calculates score based on rules", async () => {
    const { calculateScore } = await import("@/lib/crm/leadScoring");
    const lead = {
      id: "t1", title: "Test", contactName: "C", email: "e@t.com",
      source: "referral" as const, status: "new" as const, priority: "high" as const,
      score: 0, expectedRevenue: 150000, probability: 50,
      tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      phone: "+91-1234567890", companyName: "TestCo",
    };
    const { score, breakdown } = calculateScore(lead);
    // referral(20) + high(15) + revenue>=100k(20) + revenue>=50k(10) + hasPhone(5) + hasCompany(5) = 75
    expect(score).toBe(75);
    expect(breakdown.length).toBeGreaterThan(0);
    expect(breakdown.filter(b => b.matched).length).toBeGreaterThan(3);
  });

  it("caps score at 100", async () => {
    const { calculateScore } = await import("@/lib/crm/leadScoring");
    const lead = {
      id: "t2", title: "Max", contactName: "C", email: "e@t.com",
      source: "referral" as const, status: "new" as const, priority: "urgent" as const,
      score: 0, expectedRevenue: 200000, probability: 50,
      tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      phone: "+91-1234567890", companyName: "BigCo",
    };
    const { score } = calculateScore(lead);
    expect(score).toBeLessThanOrEqual(100);
  });
});
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
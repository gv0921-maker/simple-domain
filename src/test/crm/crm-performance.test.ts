import { describe, it, expect, beforeEach } from "vitest";

function clearCRM() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("erp_"));
  keys.forEach(k => localStorage.removeItem(k));
}

describe("CRM Performance — 10k+ Contacts", () => {
  beforeEach(() => clearCRM());

  it("handles 10,000 contacts within acceptable time", async () => {
    const { getItem, setItem } = await import("@/lib/storage");
    const crm = await import("@/lib/data/crm");

    // Generate 10k contacts directly in localStorage
    const contacts = Array.from({ length: 10000 }, (_, i) => ({
      id: `perf-${i}`,
      type: "individual" as const,
      firstName: `First${i}`,
      lastName: `Last${i}`,
      email: `user${i}@perf.com`,
      phone: `+91-${String(i).padStart(10, "0")}`,
      addresses: [],
      tags: i % 5 === 0 ? ["VIP"] : [],
      status: "active" as const,
      score: i % 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setItem("crm_contacts", contacts);

    // Measure getContacts
    const t0 = performance.now();
    const result = crm.getContacts();
    const t1 = performance.now();
    expect(result.length).toBe(10000);
    expect(t1 - t0).toBeLessThan(500); // < 500ms

    // Measure findDuplicateContacts
    const t2 = performance.now();
    crm.findDuplicateContacts("user5000@perf.com");
    const t3 = performance.now();
    expect(t3 - t2).toBeLessThan(500);
  });

  it("imports 1,000 contacts within acceptable time", async () => {
    const crm = await import("@/lib/data/crm");

    const importData = Array.from({ length: 1000 }, (_, i) => ({
      firstName: `Imp${i}`,
      lastName: `Port${i}`,
      email: `import${i}@perf.com`,
    }));

    const t0 = performance.now();
    const result = crm.importContacts(importData);
    const t1 = performance.now();
    expect(result.success).toBe(1000);
    expect(t1 - t0).toBeLessThan(5000); // < 5s for 1k imports
  });
});

describe("CRM Performance — 50k+ Activities", () => {
  beforeEach(() => clearCRM());

  it("handles 50,000 activities", async () => {
    const { setItem } = await import("@/lib/storage");
    const crm = await import("@/lib/data/crm");

    const activities = Array.from({ length: 50000 }, (_, i) => ({
      id: `act-${i}`,
      type: "call" as const,
      subject: `Activity ${i}`,
      relatedTo: "contact",
      relatedId: `contact-${i % 100}`,
      userId: "1",
      userName: "Admin",
      completed: i % 3 === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setItem("crm_activities", activities);

    // Measure getActivities (all)
    const t0 = performance.now();
    const all = crm.getActivities();
    const t1 = performance.now();
    expect(all.length).toBe(50000);
    expect(t1 - t0).toBeLessThan(1000); // < 1s

    // Measure filtered getActivities
    const t2 = performance.now();
    const filtered = crm.getActivities("contact", "contact-50");
    const t3 = performance.now();
    expect(filtered.length).toBe(500); // 50000/100
    expect(t3 - t2).toBeLessThan(1000);
  });
});

describe("CRM Performance — Analytics at Scale", () => {
  beforeEach(() => clearCRM());

  it("computes stats with 5k opportunities", async () => {
    const { setItem } = await import("@/lib/storage");
    const crm = await import("@/lib/data/crm");

    const opportunities = Array.from({ length: 5000 }, (_, i) => ({
      id: `opp-${i}`,
      name: `Deal ${i}`,
      contactName: `Contact ${i}`,
      pipelineId: "default",
      stageId: ["new", "qualified", "proposition", "won"][i % 4],
      stage: ["new", "qualified", "proposition", "won"][i % 4],
      expectedRevenue: (i + 1) * 1000,
      probability: [10, 30, 60, 100][i % 4],
      priority: 0,
      expectedCloseDate: "2025-12-31",
      products: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setItem("crm_opportunities", opportunities);

    const t0 = performance.now();
    const stats = crm.getCRMStats();
    const t1 = performance.now();
    expect(stats.totalOpportunities).toBe(5000);
    expect(t1 - t0).toBeLessThan(1000);

    const t2 = performance.now();
    crm.getOpportunitiesByStage();
    const t3 = performance.now();
    expect(t3 - t2).toBeLessThan(500);
  });
});
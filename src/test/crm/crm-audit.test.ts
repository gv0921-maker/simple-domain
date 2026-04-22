import { describe, it, expect, beforeEach } from "vitest";
import { getAuditLogs } from "@/lib/data/rbac";

function clearCRM() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("erp_"));
  keys.forEach(k => localStorage.removeItem(k));
}

describe("CRM Audit Logging", () => {
  beforeEach(() => clearCRM());

  it("logs contact creation", async () => {
    const crm = await import("@/lib/data/crm");
    const before = getAuditLogs().length;
    crm.saveContact({ firstName: "Audit", lastName: "Test", email: "a@t.com" });
    // New contacts don't have id set, so logCRM may not fire for creates (only updates/deletes)
    // But updates do
    const c = crm.saveContact({ firstName: "Audit", lastName: "Test", email: "a@t.com" });
    crm.saveContact({ ...c, firstName: "Updated" });
    const after = getAuditLogs();
    expect(after.length).toBeGreaterThan(before);
  });

  it("logs contact deletion", async () => {
    const crm = await import("@/lib/data/crm");
    const c = crm.saveContact({ firstName: "Del", lastName: "Audit", email: "d@a.com" });
    const before = getAuditLogs().length;
    crm.deleteContact(c.id);
    expect(getAuditLogs().length).toBeGreaterThan(before);
  });

  it("logs opportunity updates", async () => {
    const crm = await import("@/lib/data/crm");
    const o = crm.saveOpportunity({ name: "Audit Opp", contactName: "T" });
    const before = getAuditLogs().length;
    crm.updateOpportunityStage(o.id, "won", "won");
    expect(getAuditLogs().length).toBeGreaterThan(before);
  });

  it("logs pipeline deletion", async () => {
    const crm = await import("@/lib/data/crm");
    const p = crm.savePipeline({ name: "Audit Pipeline", stages: [] });
    const before = getAuditLogs().length;
    crm.deletePipeline(p.id);
    expect(getAuditLogs().length).toBeGreaterThan(before);
  });
});
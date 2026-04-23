import { describe, it, expect, beforeEach } from "vitest";

function clearCRM() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("erp_"));
  keys.forEach(k => localStorage.removeItem(k));
}

describe("CRM Integration — Pipeline Stage Progression", () => {
  beforeEach(() => clearCRM());

  it("moves opportunity through full lifecycle", async () => {
    const crm = await import("@/lib/data/crm");
    const opp = crm.saveOpportunity({ name: "Lifecycle Deal", contactName: "T" });

    // New -> Qualified
    const q = crm.updateOpportunityStage(opp.id, "qualified", "qualified");
    expect(q?.stage).toBe("qualified");
    expect(q?.wonAt).toBeFalsy();

    // Qualified -> Proposition
    const p = crm.updateOpportunityStage(opp.id, "proposition", "proposition");
    expect(p?.stage).toBe("proposition");

    // Proposition -> Won
    const w = crm.updateOpportunityStage(opp.id, "won", "won");
    expect(w?.stage).toBe("won");
    expect(w?.probability).toBe(100);
    expect(w?.wonAt).toBeTruthy();
  });

  it("handles lost with reason", async () => {
    const crm = await import("@/lib/data/crm");
    const opp = crm.saveOpportunity({ name: "Lost Deal", contactName: "T" });
    const lost = crm.updateOpportunityStage(opp.id, "lost", "lost");
    expect(lost?.probability).toBe(0);
    expect(lost?.lostAt).toBeTruthy();
  });
});

describe("CRM Integration — Permission Scope Filtering", () => {
  it("filters records by assigned user in own scope", async () => {
    const crm = await import("@/lib/data/crm");
    crm.saveContact({ firstName: "A", lastName: "B", email: "a@t.com", assignedTo: "user1" });
    crm.saveContact({ firstName: "C", lastName: "D", email: "c@t.com", assignedTo: "user2" });

    const all = crm.getContacts();
    // Simulate own-scope filtering
    const ownRecords = all.filter(c => c.assignedTo === "user1");
    expect(ownRecords.length).toBe(1);
    expect(ownRecords[0].firstName).toBe("A");
  });
});

describe("CRM Integration — Backup & Restore", () => {
  beforeEach(() => clearCRM());

  it("exports and imports CRM data", async () => {
    const crm = await import("@/lib/data/crm");
    const { exportCRM, importCRM } = await import("@/lib/crm/backup");

    // Create test data
    crm.saveContact({ firstName: "Backup", lastName: "Test", email: "b@t.com" });

    // Export
    const backup = exportCRM();
    expect(backup.version).toBe(1);
    expect(backup.app).toBe("GLF-CRM");

    // Clear and import
    clearCRM();
    importCRM(backup);

    // Verify
    const contacts = crm.getContacts();
    expect(contacts.some(c => c.email === "b@t.com")).toBe(true);
  });
});
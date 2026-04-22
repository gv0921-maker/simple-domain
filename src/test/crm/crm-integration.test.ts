import { describe, it, expect, beforeEach } from "vitest";

function clearCRM() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("erp_"));
  keys.forEach(k => localStorage.removeItem(k));
}

describe("CRM Integration — Lead to Opportunity Conversion", () => {
  beforeEach(() => clearCRM());

  it("converts a lead and creates an opportunity", async () => {
    const crm = await import("@/lib/data/crm");
    const lead = crm.saveLead({
      title: "Big Deal Lead",
      contactName: "John Doe",
      email: "john@deal.com",
      phone: "+91-9999999999",
      companyName: "DealCo",
      source: "referral",
      priority: "high",
      expectedRevenue: 500000,
      probability: 60,
    });

    const opp = crm.convertLeadToOpportunity(lead.id);
    expect(opp).toBeTruthy();
    expect(opp!.name).toBe("Big Deal Lead");
    expect(opp!.contactName).toBe("John Doe");
    expect(opp!.expectedRevenue).toBe(500000);
    expect(opp!.stage).toBe("new");

    // Lead should be marked as converted
    const updatedLead = crm.getLead(lead.id);
    expect(updatedLead?.status).toBe("converted");
    expect(updatedLead?.convertedToOpportunityId).toBe(opp!.id);
  });

  it("returns undefined for non-existent lead", async () => {
    const crm = await import("@/lib/data/crm");
    expect(crm.convertLeadToOpportunity("nonexistent")).toBeUndefined();
  });
});

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

describe("CRM Integration — Contact-Lead Linking", () => {
  beforeEach(() => clearCRM());

  it("auto-creates contact when lead is created with new email", async () => {
    const crm = await import("@/lib/data/crm");
    const lead = crm.saveLead({
      title: "Auto Contact Lead",
      contactName: "Jane Smith",
      email: "jane@auto.com",
      phone: "+91-1111111111",
    });

    // Contact should be auto-created
    const contacts = crm.getContacts();
    const autoContact = contacts.find(c => c.email === "jane@auto.com");
    expect(autoContact).toBeTruthy();
    expect(autoContact!.firstName).toBe("Jane");
    expect(autoContact!.lastName).toBe("Smith");

    // Lead should be linked to contact
    const updatedLead = crm.getLead(lead.id);
    expect(updatedLead?.contactId).toBe(autoContact!.id);
  });

  it("does not create duplicate contact for existing email", async () => {
    const crm = await import("@/lib/data/crm");
    crm.saveContact({ firstName: "Existing", lastName: "Person", email: "existing@t.com" });
    crm.saveLead({ title: "Dup Lead", contactName: "Other", email: "existing@t.com" });
    const contacts = crm.getContacts().filter(c => c.email === "existing@t.com");
    expect(contacts.length).toBe(1);
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
    crm.saveLead({ title: "Backup Lead", contactName: "T", email: "bl@t.com" });

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
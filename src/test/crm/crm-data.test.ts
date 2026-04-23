import { describe, it, expect, beforeEach } from "vitest";

// Reset localStorage before each test
function clearCRM() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("erp_crm_"));
  keys.forEach(k => localStorage.removeItem(k));
  localStorage.removeItem("erp_crm_data_version");
}

// Lazy import to avoid module-level localStorage access issues
async function loadCRM() {
  return await import("@/lib/data/crm");
}

describe("CRM Data — Contacts", () => {
  beforeEach(() => clearCRM());

  it("creates and retrieves a contact", async () => {
    const crm = await loadCRM();
    const c = crm.saveContact({ firstName: "John", lastName: "Doe", email: "john@test.com" });
    expect(c.id).toBeTruthy();
    expect(c.firstName).toBe("John");
    const fetched = crm.getContact(c.id);
    expect(fetched?.email).toBe("john@test.com");
  });

  it("updates a contact", async () => {
    const crm = await loadCRM();
    const c = crm.saveContact({ firstName: "A", lastName: "B", email: "a@b.com" });
    const updated = crm.saveContact({ ...c, firstName: "Updated" });
    expect(updated.firstName).toBe("Updated");
    expect(updated.id).toBe(c.id);
  });

  it("deletes a contact", async () => {
    const crm = await loadCRM();
    const c = crm.saveContact({ firstName: "Del", lastName: "Me", email: "d@m.com" });
    crm.deleteContact(c.id);
    expect(crm.getContact(c.id)).toBeUndefined();
  });

  it("detects duplicate contacts by email", async () => {
    const crm = await loadCRM();
    crm.saveContact({ firstName: "A", lastName: "B", email: "dup@test.com" });
    const dups = crm.findDuplicateContacts("dup@test.com");
    expect(dups.length).toBe(1);
  });

  it("detects duplicate contacts by phone", async () => {
    const crm = await loadCRM();
    crm.saveContact({ firstName: "A", lastName: "B", email: "x@t.com", phone: "+91-9876543210" });
    // Must match full normalized phone including country code
    const dups = crm.findDuplicateContacts("", "+91-9876543210");
    expect(dups.length).toBeGreaterThanOrEqual(1);
  });

  it("excludes self from duplicate detection", async () => {
    const crm = await loadCRM();
    const c = crm.saveContact({ firstName: "A", lastName: "B", email: "self@t.com" });
    const dups = crm.findDuplicateContacts("self@t.com", undefined, c.id);
    expect(dups.length).toBe(0);
  });
});

describe("CRM Data — Opportunities", () => {
  beforeEach(() => clearCRM());

  it("creates an opportunity with defaults", async () => {
    const crm = await loadCRM();
    const o = crm.saveOpportunity({ name: "Deal 1", contactName: "Test" });
    expect(o.stage).toBe("new");
    expect(o.probability).toBe(10);
    expect(o.products).toEqual([]);
  });

  it("updates opportunity stage to won", async () => {
    const crm = await loadCRM();
    const o = crm.saveOpportunity({ name: "Win Deal", contactName: "T" });
    const won = crm.updateOpportunityStage(o.id, "won", "won");
    expect(won?.probability).toBe(100);
    expect(won?.wonAt).toBeTruthy();
  });

  it("updates opportunity stage to lost", async () => {
    const crm = await loadCRM();
    const o = crm.saveOpportunity({ name: "Lose Deal", contactName: "T" });
    const lost = crm.updateOpportunityStage(o.id, "lost", "lost");
    expect(lost?.probability).toBe(0);
    expect(lost?.lostAt).toBeTruthy();
  });

  it("deletes an opportunity", async () => {
    const crm = await loadCRM();
    const o = crm.saveOpportunity({ name: "Del", contactName: "T" });
    crm.deleteOpportunity(o.id);
    expect(crm.getOpportunity(o.id)).toBeUndefined();
  });
});

describe("CRM Data — Pipelines", () => {
  beforeEach(() => clearCRM());

  it("has a default pipeline", async () => {
    const crm = await loadCRM();
    const p = crm.getDefaultPipeline();
    expect(p).toBeTruthy();
    expect(p.isDefault).toBe(true);
    expect(p.stages.length).toBeGreaterThan(0);
  });

  it("prevents deleting default pipeline", async () => {
    const crm = await loadCRM();
    const p = crm.getDefaultPipeline();
    const result = crm.deletePipeline(p.id);
    expect(result.success).toBe(false);
    expect(result.reason).toContain("default");
  });

  it("prevents deleting pipeline with opportunities", async () => {
    const crm = await loadCRM();
    const pipeline = crm.savePipeline({ name: "Test Pipeline", stages: [] });
    crm.saveOpportunity({ name: "Opp", contactName: "T", pipelineId: pipeline.id });
    const result = crm.deletePipeline(pipeline.id);
    expect(result.success).toBe(false);
  });
});

describe("CRM Data — Activities", () => {
  beforeEach(() => clearCRM());

  it("creates and completes an activity", async () => {
    const crm = await loadCRM();
    const a = crm.saveActivity({ subject: "Call client", type: "call", relatedTo: "contact", relatedId: "abc", userId: "1", userName: "Admin" });
    expect(a.completed).toBe(false);
    const completed = crm.completeActivity(a.id);
    expect(completed?.completed).toBe(true);
    expect(completed?.completedAt).toBeTruthy();
  });

  it("filters activities by related entity", async () => {
    const crm = await loadCRM();
    crm.saveActivity({ subject: "A1", type: "call", relatedTo: "contact", relatedId: "c1", userId: "1", userName: "U" });
    crm.saveActivity({ subject: "A2", type: "email", relatedTo: "opportunity", relatedId: "l1", userId: "1", userName: "U" });
    const filtered = crm.getActivities("contact", "c1");
    expect(filtered.length).toBe(1);
    expect(filtered[0].subject).toBe("A1");
  });
});

describe("CRM Data — Notes", () => {
  beforeEach(() => clearCRM());

  it("creates note with visibility", async () => {
    const crm = await loadCRM();
    const n = crm.saveNote({ content: "Test note", relatedTo: "contact", relatedId: "c1", userId: "1", userName: "U", visibility: "private" });
    expect(n.visibility).toBe("private");
  });

  it("filters notes by related entity", async () => {
    const crm = await loadCRM();
    crm.saveNote({ content: "N1", relatedTo: "contact", relatedId: "c1", userId: "1", userName: "U" });
    crm.saveNote({ content: "N2", relatedTo: "opportunity", relatedId: "l1", userId: "1", userName: "U" });
    const contactNotes = crm.getNotes("contact", "c1");
    const oppNotes = crm.getNotes("opportunity", "l1");
    expect(contactNotes.length).toBeGreaterThanOrEqual(1);
    expect(oppNotes.length).toBeGreaterThanOrEqual(1);
  });
});

describe("CRM Data — Tags", () => {
  beforeEach(() => clearCRM());

  it("creates and retrieves tags", async () => {
    const crm = await loadCRM();
    const t = crm.saveTag({ name: "VIP", color: "red" });
    expect(t.id).toBeTruthy();
    expect(crm.getTags().some(tag => tag.name === "VIP")).toBe(true);
  });
});

describe("CRM Data — Analytics", () => {
  beforeEach(() => clearCRM());

  it("returns stats structure", async () => {
    const crm = await loadCRM();
    const stats = crm.getCRMStats();
    expect(stats).toHaveProperty("totalContacts");
    expect(stats).toHaveProperty("totalOpportunities");
    expect(stats).toHaveProperty("winRate");
    expect(stats).toHaveProperty("pipelineValue");
    expect(typeof stats.totalContacts).toBe("number");
  });

  it("calculates win rate correctly", async () => {
    const crm = await loadCRM();
    const o1 = crm.saveOpportunity({ name: "Won", contactName: "T" });
    crm.updateOpportunityStage(o1.id, "won", "won");
    const o2 = crm.saveOpportunity({ name: "Lost", contactName: "T" });
    crm.updateOpportunityStage(o2.id, "lost", "lost");
    const stats = crm.getCRMStats();
    expect(stats.winRate).toBe(50);
  });

  it("groups opportunities by stage", async () => {
    const crm = await loadCRM();
    crm.saveOpportunity({ name: "O1", contactName: "T" });
    const stages = crm.getOpportunitiesByStage();
    expect(stages.length).toBeGreaterThan(0);
  });

});

describe("CRM Data — Import", () => {
  beforeEach(() => clearCRM());

  it("imports contacts", async () => {
    const crm = await loadCRM();
    const result = crm.importContacts([
      { firstName: "Imp1", lastName: "A", email: "imp1@t.com" },
      { firstName: "Imp2", lastName: "B", email: "imp2@t.com" },
    ]);
    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
  });

  it("detects duplicates during import", async () => {
    const crm = await loadCRM();
    crm.saveContact({ firstName: "Existing", lastName: "C", email: "exist@t.com" });
    const result = crm.importContacts([
      { firstName: "Dup", lastName: "D", email: "exist@t.com" },
    ]);
    expect(result.duplicates).toBe(1);
  });
});
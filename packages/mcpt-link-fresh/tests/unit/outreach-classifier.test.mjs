import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyDrifts,
  diffClaims,
  diffEvidence,
  diffPositioning,
  isMaterialChange,
} from "../../src/analyzers/outreach-classifier.mjs";

const DRIFT_STUB = {
  surface: "metadata", field: "description", action: "DIRECT_UPDATE",
  current: "old", canonical: "new", slug: "test-tool",
};

const BASE_PRESSKIT = {
  slug: "test-tool",
  tagline: "A test tool",
  positioning: { oneLiner: "A test tool for testing", valueProps: ["Fast", "Local"] },
  claims: [
    { id: "c1", status: "proven", statement: "Sub-100ms latency", evidenceRefs: ["ev1"] },
    { id: "c2", status: "aspirational", statement: "Under one second builds" },
  ],
};

describe("classifyDrifts", () => {
  it("returns empty array on first run (no previous presskit)", () => {
    const triggers = classifyDrifts([DRIFT_STUB], BASE_PRESSKIT, null, {});
    assert.equal(triggers.length, 0);
  });

  it("returns empty array when nothing changed", () => {
    const triggers = classifyDrifts([DRIFT_STUB], BASE_PRESSKIT, BASE_PRESSKIT, {});
    assert.equal(triggers.length, 0);
  });

  it("detects added proven claim", () => {
    const current = {
      ...BASE_PRESSKIT,
      claims: [
        ...BASE_PRESSKIT.claims,
        { id: "c3", status: "proven", statement: "New proven claim", evidenceRefs: ["ev3"] },
      ],
    };
    const triggers = classifyDrifts([DRIFT_STUB], current, BASE_PRESSKIT, {});
    const claimTrigger = triggers.find((t) => t.triggerCategory === "claim-change");
    assert.ok(claimTrigger, "should detect claim-change trigger");
    assert.equal(claimTrigger.priority, "high");
    assert.deepEqual(claimTrigger.claimIds, ["c3"]);
  });

  it("detects promoted claim (aspirational → proven)", () => {
    const current = {
      ...BASE_PRESSKIT,
      claims: [
        BASE_PRESSKIT.claims[0],
        { ...BASE_PRESSKIT.claims[1], status: "proven", evidenceRefs: ["ev2"] },
      ],
    };
    const triggers = classifyDrifts([DRIFT_STUB], current, BASE_PRESSKIT, {});
    const claimTrigger = triggers.find((t) => t.triggerCategory === "claim-change");
    assert.ok(claimTrigger, "should detect promoted claim");
  });

  it("detects changed proven claim statement", () => {
    const current = {
      ...BASE_PRESSKIT,
      claims: [
        { ...BASE_PRESSKIT.claims[0], statement: "Completely new statement" },
        BASE_PRESSKIT.claims[1],
      ],
    };
    const triggers = classifyDrifts([DRIFT_STUB], current, BASE_PRESSKIT, {});
    const claimTrigger = triggers.find((t) => t.triggerCategory === "claim-change");
    assert.ok(claimTrigger, "should detect statement change");
  });

  it("ignores whitespace-only claim changes", () => {
    const current = {
      ...BASE_PRESSKIT,
      claims: [
        { ...BASE_PRESSKIT.claims[0], statement: "  Sub-100ms   latency  " },
        BASE_PRESSKIT.claims[1],
      ],
    };
    const triggers = classifyDrifts([DRIFT_STUB], current, BASE_PRESSKIT, {});
    const claimTrigger = triggers.find((t) => t.triggerCategory === "claim-change");
    assert.equal(claimTrigger, undefined, "whitespace-only change should not trigger");
  });

  it("does not trigger on aspirational claims", () => {
    const current = {
      ...BASE_PRESSKIT,
      claims: [
        BASE_PRESSKIT.claims[0],
        { ...BASE_PRESSKIT.claims[1], statement: "Changed aspirational claim" },
      ],
    };
    const triggers = classifyDrifts([DRIFT_STUB], current, BASE_PRESSKIT, {});
    const claimTrigger = triggers.find((t) => t.triggerCategory === "claim-change");
    assert.equal(claimTrigger, undefined, "aspirational claims should not trigger");
  });

  it("detects material positioning change", () => {
    const current = {
      ...BASE_PRESSKIT,
      tagline: "Completely different tagline",
    };
    const triggers = classifyDrifts([DRIFT_STUB], current, BASE_PRESSKIT, {});
    const posTrigger = triggers.find((t) => t.triggerCategory === "presskit-material");
    assert.ok(posTrigger, "should detect material tagline change");
  });
});

describe("diffClaims", () => {
  it("detects new proven claim", () => {
    const current = [{ id: "c1", status: "proven", statement: "Claim one" }];
    const previous = [];
    const changes = diffClaims(current, previous);
    assert.equal(changes.length, 1);
    assert.equal(changes[0].type, "added");
  });

  it("detects promoted claim", () => {
    const current = [{ id: "c1", status: "proven", statement: "Claim", evidenceRefs: ["e1"] }];
    const previous = [{ id: "c1", status: "aspirational", statement: "Claim" }];
    const changes = diffClaims(current, previous);
    assert.equal(changes.length, 1);
    assert.equal(changes[0].type, "promoted");
  });

  it("ignores unchanged claims", () => {
    const claims = [{ id: "c1", status: "proven", statement: "Same", evidenceRefs: ["e1"] }];
    const changes = diffClaims(claims, claims);
    assert.equal(changes.length, 0);
  });
});

describe("diffEvidence", () => {
  it("detects new evidence ref", () => {
    const current = [{ id: "c1", status: "proven", statement: "A", evidenceRefs: ["e1", "e2"] }];
    const previous = [{ id: "c1", status: "proven", statement: "A", evidenceRefs: ["e1"] }];
    const changes = diffEvidence(current, previous);
    assert.equal(changes.length, 1);
    assert.deepEqual(changes[0].newRefs, ["e2"]);
  });

  it("ignores claims without new evidence", () => {
    const claims = [{ id: "c1", status: "proven", statement: "A", evidenceRefs: ["e1"] }];
    const changes = diffEvidence(claims, claims);
    assert.equal(changes.length, 0);
  });
});

describe("diffPositioning", () => {
  it("detects tagline change", () => {
    const changes = diffPositioning(
      { tagline: "New tagline", positioning: {} },
      { tagline: "Old tagline", positioning: {} }
    );
    assert.equal(changes.length, 1);
    assert.equal(changes[0].field, "tagline");
  });

  it("ignores whitespace-only tagline change", () => {
    const changes = diffPositioning(
      { tagline: "  Same tagline  ", positioning: {} },
      { tagline: "Same tagline", positioning: {} }
    );
    assert.equal(changes.length, 0);
  });
});

describe("isMaterialChange", () => {
  it("returns false for identical strings", () => {
    assert.equal(isMaterialChange("hello", "hello"), false);
  });

  it("returns false for whitespace-only difference", () => {
    assert.equal(isMaterialChange("hello  world", "hello world"), false);
  });

  it("returns false for casing-only difference", () => {
    assert.equal(isMaterialChange("Hello World", "hello world"), false);
  });

  it("returns true for material difference", () => {
    assert.equal(isMaterialChange("hello", "goodbye"), true);
  });

  it("returns true when one is empty", () => {
    assert.equal(isMaterialChange("hello", ""), true);
  });

  it("returns false when both are empty/null", () => {
    assert.equal(isMaterialChange(null, null), false);
    assert.equal(isMaterialChange("", ""), false);
  });
});

import { describe, it, expect } from "vitest";
import type { TastePack } from "@taste-compiler/core";
import { checkTokenViolations } from "../evaluators/token-checker.js";
import type { ExtractedStyle } from "../evaluators/token-checker.js";
import { checkGrammarViolations } from "../evaluators/grammar-checker.js";
import type {
  ExtractedComponent,
  ExtractedScreen,
} from "../evaluators/grammar-checker.js";
import { checkCopyViolations } from "../evaluators/copy-checker.js";
import type { ExtractedCopy } from "../evaluators/copy-checker.js";
import { checkBudgetViolations } from "../evaluators/budget-checker.js";
import type { ExtractedMetrics } from "../evaluators/budget-checker.js";
import { checkForbiddenPatternViolations } from "../evaluators/forbidden-checker.js";
import type { ExtractedClassUsage } from "../evaluators/forbidden-checker.js";
import { checkLawViolations } from "../evaluators/law-checker.js";
import type { ExtractedInteraction } from "../evaluators/law-checker.js";
import { runChecks, buildReport } from "../checker.js";
import type { ExtractedTarget } from "../checker.js";

// ---------------------------------------------------------------------------
// Shared fixture: minimal valid TastePack
// ---------------------------------------------------------------------------

function makePack(overrides?: Partial<TastePack>): TastePack {
  return {
    schemaVersion: "0.1.0",
    packVersion: "0.1.0",
    product: { name: "TestApp", summary: "A test app" },
    provenance: {
      sourceHash: "abc123",
      compiledAt: "2026-04-01T00:00:00Z",
      compilerVersion: "0.1.0",
    },
    artifacts: {
      visualTokens: {
        colors: [{ role: "primary" }],
        typography: [{ role: "body" }],
        spacing: [
          { name: "space-sm", value: "8px" },
          { name: "space-md", value: "16px" },
          { name: "space-lg", value: "24px" },
        ],
        radii: [{ name: "radius-sm", value: "4px" }],
        motion: [{ name: "transition-default", duration: "300ms" }],
      },
      componentGrammar: {
        allowed: ["Card", "Button", "Input"],
        banned: ["DataGrid", "Carousel"],
        compositionRules: [
          {
            id: "cr1",
            rule: "No DataGrid in calm layouts",
            rationale: "DataGrid is too dense for this product",
          },
        ],
      },
      interactionLaws: [
        {
          id: "law-destructive-confirm",
          law: "Destructive actions require confirmation",
          severity: "error",
        },
        {
          id: "law-submit-validation",
          law: "Form submit disabled until valid",
          severity: "error",
        },
        {
          id: "law-draft-preservation",
          law: "Draft state preserved on back navigation",
          severity: "error",
        },
        {
          id: "law-empty-state",
          law: "Empty states require a primary next step",
          severity: "error",
        },
      ],
      copyRules: {
        bannedPhrases: [
          { phrase: "blazing fast", reason: "Marketing hype" },
          { phrase: "world-class", reason: "Overused" },
        ],
        toneWords: {
          encouraged: ["thoughtful", "calm"],
          discouraged: ["revolutionary", "disruptive"],
        },
        maxReadingLevel: "grade-8",
        claimQualifiers: [
          { pattern: "AI-powered", qualifier: "AI-assisted" },
          { pattern: "guaranteed uptime", qualifier: "targeted uptime" },
        ],
      },
      complexityBudgets: {
        maxTopLevelNavItems: 5,
        maxPrimaryActionsPerScreen: 1,
        maxModalDepth: 2,
        maxDistinctInteractionModesPerFlow: 3,
        custom: [],
      },
      forbiddenPatterns: [
        {
          id: "fp1",
          pattern: "Dense dashboard grid",
          reason: "Anti-calm",
          severity: "error",
          detection: {
            componentNames: ["KPIPanel", "DenseGrid"],
            classPatterns: ["grid-cols-5", "grid-cols-6"],
            importPatterns: ["@enterprise/dashboard"],
          },
        },
        {
          id: "fp2",
          pattern: "Legacy tooltip",
          reason: "Deprecated",
          severity: "warn",
          detection: {
            componentNames: ["LegacyTooltip"],
          },
        },
      ],
    },
    goldens: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// token-checker
// ---------------------------------------------------------------------------

describe("checkTokenViolations", () => {
  const pack = makePack();

  it("detects raw hex colors", () => {
    const styles: ExtractedStyle[] = [
      {
        file: "src/App.tsx",
        line: 10,
        type: "color",
        value: "#ff5733",
        isRaw: true,
        snippet: 'bg-[#ff5733]',
      },
    ];

    const violations = checkTokenViolations(pack, styles);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("TOK-001");
    expect(violations[0].severity).toBe("error");
    expect(violations[0].message).toContain("#ff5733");
  });

  it("groups consecutive color violations in the same file (CR-1)", () => {
    const styles: ExtractedStyle[] = [
      // A constant map spanning 6 lines — should become 1 grouped violation
      { file: "src/theme.ts", line: 10, type: "color", value: "#58a6ff", isRaw: true, snippet: 'npc: "#58a6ff"' },
      { file: "src/theme.ts", line: 11, type: "color", value: "#f85149", isRaw: true, snippet: 'enemy: "#f85149"' },
      { file: "src/theme.ts", line: 12, type: "color", value: "#d29922", isRaw: true, snippet: 'merchant: "#d29922"' },
      { file: "src/theme.ts", line: 13, type: "color", value: "#3fb950", isRaw: true, snippet: 'quest-giver: "#3fb950"' },
      { file: "src/theme.ts", line: 14, type: "color", value: "#bc8cff", isRaw: true, snippet: 'companion: "#bc8cff"' },
      { file: "src/theme.ts", line: 15, type: "color", value: "#ff7b72", isRaw: true, snippet: 'boss: "#ff7b72"' },
      // A separate block 20 lines away — should become a 2nd violation
      { file: "src/theme.ts", line: 40, type: "color", value: "#fff", isRaw: true, snippet: 'color: "#fff"' },
    ];

    const violations = checkTokenViolations(pack, styles);
    const colorViolations = violations.filter((v) => v.ruleId === "TOK-001");
    expect(colorViolations).toHaveLength(2); // 2 groups, not 7

    // First group: 6 evidence items
    expect(colorViolations[0].evidence).toHaveLength(6);
    expect(colorViolations[0].message).toContain("6 raw color literals");
    expect(colorViolations[0].message).toContain("lines 10-15");

    // Second group: 1 evidence item (singleton)
    expect(colorViolations[1].evidence).toHaveLength(1);
    expect(colorViolations[1].message).toContain("#fff");
  });

  it("groups violations per file independently", () => {
    const styles: ExtractedStyle[] = [
      { file: "src/A.tsx", line: 1, type: "color", value: "#abc", isRaw: true, snippet: 'color: "#abc"' },
      { file: "src/A.tsx", line: 2, type: "color", value: "#def", isRaw: true, snippet: 'background: "#def"' },
      { file: "src/B.tsx", line: 1, type: "color", value: "#123", isRaw: true, snippet: 'color: "#123"' },
    ];

    const violations = checkTokenViolations(pack, styles);
    const colorViolations = violations.filter((v) => v.ruleId === "TOK-001");
    expect(colorViolations).toHaveLength(2); // 1 per file
    expect(colorViolations[0].evidence).toHaveLength(2); // A.tsx group
    expect(colorViolations[1].evidence).toHaveLength(1); // B.tsx
  });

  it("detects off-scale spacing", () => {
    const styles: ExtractedStyle[] = [
      {
        file: "src/Card.tsx",
        line: 5,
        type: "spacing",
        value: "13px",
        isRaw: true,
        snippet: 'p-[13px]',
      },
    ];

    const violations = checkTokenViolations(pack, styles);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("TOK-002");
    expect(violations[0].severity).toBe("warn");
    expect(violations[0].message).toContain("13px");
  });

  it("allows spacing values on the approved scale", () => {
    const styles: ExtractedStyle[] = [
      {
        file: "src/Layout.tsx",
        line: 3,
        type: "spacing",
        value: "16px",
        isRaw: true,
        snippet: 'p-[16px]',
      },
    ];

    const violations = checkTokenViolations(pack, styles);
    expect(violations).toHaveLength(0);
  });

  it("clean sample with valid tokens passes", () => {
    const styles: ExtractedStyle[] = [
      {
        file: "src/Button.tsx",
        line: 7,
        type: "color",
        value: "var(--primary)",
        isRaw: false,
        snippet: "color: var(--primary)",
      },
      {
        file: "src/Button.tsx",
        line: 8,
        type: "spacing",
        value: "8px",
        isRaw: true,
        snippet: 'p-[8px]',
      },
    ];

    const violations = checkTokenViolations(pack, styles);
    expect(violations).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// grammar-checker
// ---------------------------------------------------------------------------

describe("checkGrammarViolations", () => {
  const pack = makePack();

  it("detects banned component imports", () => {
    const components: ExtractedComponent[] = [
      {
        file: "src/Dashboard.tsx",
        line: 3,
        name: "DataGrid",
        importPath: "@ui/components",
        snippet: 'import { DataGrid } from "@ui/components"',
      },
    ];
    const screens: ExtractedScreen[] = [];

    const violations = checkGrammarViolations(pack, components, screens);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("GRAM-001");
    expect(violations[0].severity).toBe("error");
    expect(violations[0].message).toContain("DataGrid");
  });

  it("detects multiple primary actions exceeding budget", () => {
    const components: ExtractedComponent[] = [];
    const screens: ExtractedScreen[] = [
      {
        file: "src/Home.tsx",
        primaryActionCount: 3,
        components: ["Button", "Card"],
      },
    ];

    const violations = checkGrammarViolations(pack, components, screens);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("GRAM-006");
    expect(violations[0].message).toContain("3 primary actions");
  });

  it("clean sample passes", () => {
    const components: ExtractedComponent[] = [
      {
        file: "src/Page.tsx",
        line: 1,
        name: "Card",
        importPath: "@ui/components",
        snippet: 'import { Card } from "@ui/components"',
      },
    ];
    const screens: ExtractedScreen[] = [
      {
        file: "src/Page.tsx",
        primaryActionCount: 1,
        components: ["Card", "Button"],
      },
    ];

    const violations = checkGrammarViolations(pack, components, screens);
    expect(violations).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// copy-checker
// ---------------------------------------------------------------------------

describe("checkCopyViolations", () => {
  const pack = makePack();

  it("detects banned phrases", () => {
    const copyBlocks: ExtractedCopy[] = [
      {
        file: "src/Hero.tsx",
        line: 12,
        text: "Our blazing fast platform delivers results",
        snippet: '<h1>Our blazing fast platform delivers results</h1>',
      },
    ];

    const violations = checkCopyViolations(pack, copyBlocks);
    const banned = violations.filter((v) => v.ruleId === "COPY-001");
    expect(banned.length).toBeGreaterThanOrEqual(1);
    expect(banned[0].severity).toBe("error");
    expect(banned[0].message).toContain("blazing fast");
  });

  it("detects discouraged tone words", () => {
    const copyBlocks: ExtractedCopy[] = [
      {
        file: "src/About.tsx",
        line: 5,
        text: "A revolutionary approach to note-taking",
        snippet: "<p>A revolutionary approach to note-taking</p>",
      },
    ];

    const violations = checkCopyViolations(pack, copyBlocks);
    const toneViolations = violations.filter((v) => v.ruleId === "COPY-002");
    expect(toneViolations.length).toBeGreaterThanOrEqual(1);
    expect(toneViolations[0].severity).toBe("warn");
    expect(toneViolations[0].message).toContain("revolutionary");
  });

  it("detects unqualified claims", () => {
    const copyBlocks: ExtractedCopy[] = [
      {
        file: "src/Features.tsx",
        line: 20,
        text: "Our AI-powered assistant handles everything",
        snippet: "<p>Our AI-powered assistant handles everything</p>",
      },
    ];

    const violations = checkCopyViolations(pack, copyBlocks);
    const claimViolations = violations.filter((v) => v.ruleId === "COPY-004");
    expect(claimViolations.length).toBeGreaterThanOrEqual(1);
    expect(claimViolations[0].severity).toBe("error");
    expect(claimViolations[0].message).toContain("AI-powered");
  });

  it("already-qualified claims pass", () => {
    const copyBlocks: ExtractedCopy[] = [
      {
        file: "src/Features.tsx",
        line: 20,
        text: "Our AI-assisted tools help you work smarter",
        snippet: "<p>Our AI-assisted tools help you work smarter</p>",
      },
    ];

    const violations = checkCopyViolations(pack, copyBlocks);
    const claimViolations = violations.filter((v) => v.ruleId === "COPY-004");
    expect(claimViolations).toHaveLength(0);
  });

  it("clean copy passes", () => {
    const copyBlocks: ExtractedCopy[] = [
      {
        file: "src/Calm.tsx",
        line: 3,
        text: "Take a moment to reflect on your day",
        snippet: "<p>Take a moment to reflect on your day</p>",
      },
    ];

    const violations = checkCopyViolations(pack, copyBlocks);
    expect(violations).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// budget-checker
// ---------------------------------------------------------------------------

describe("checkBudgetViolations", () => {
  const pack = makePack();

  it("detects exceeded nav count", () => {
    const metrics: ExtractedMetrics = {
      topLevelNavItems: 8,
    };

    const violations = checkBudgetViolations(pack, metrics);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("BUD-001");
    expect(violations[0].severity).toBe("error");
    expect(violations[0].message).toContain("8");
    expect(violations[0].message).toContain("5");
  });

  it("detects exceeded primary actions", () => {
    const metrics: ExtractedMetrics = {
      primaryActionsPerScreen: new Map([
        ["src/Dashboard.tsx", 3],
      ]),
    };

    const violations = checkBudgetViolations(pack, metrics);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("BUD-002");
    expect(violations[0].message).toContain("Dashboard");
    expect(violations[0].message).toContain("3");
  });

  it("detects exceeded modal depth", () => {
    const metrics: ExtractedMetrics = {
      modalDepth: 4,
    };

    const violations = checkBudgetViolations(pack, metrics);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("BUD-003");
    expect(violations[0].message).toContain("4");
  });

  it("detects exceeded interaction modes", () => {
    const metrics: ExtractedMetrics = {
      interactionModesPerFlow: new Map([
        ["onboarding", 5],
      ]),
    };

    const violations = checkBudgetViolations(pack, metrics);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("BUD-004");
    expect(violations[0].message).toContain("onboarding");
    expect(violations[0].message).toContain("5");
  });

  it("within-budget passes", () => {
    const metrics: ExtractedMetrics = {
      topLevelNavItems: 4,
      primaryActionsPerScreen: new Map([["src/Home.tsx", 1]]),
      modalDepth: 1,
      interactionModesPerFlow: new Map([["checkout", 2]]),
    };

    const violations = checkBudgetViolations(pack, metrics);
    expect(violations).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// forbidden-checker
// ---------------------------------------------------------------------------

describe("checkForbiddenPatternViolations", () => {
  const pack = makePack();

  it("detects forbidden components by name", () => {
    const components: ExtractedComponent[] = [
      {
        file: "src/Stats.tsx",
        line: 2,
        name: "KPIPanel",
        importPath: "@enterprise/dashboard",
        snippet: 'import { KPIPanel } from "@enterprise/dashboard"',
      },
    ];
    const classes: ExtractedClassUsage[] = [];

    const violations = checkForbiddenPatternViolations(pack, components, classes);
    const compViolations = violations.filter((v) => v.ruleId === "FP-002");
    expect(compViolations.length).toBeGreaterThanOrEqual(1);
    expect(compViolations[0].message).toContain("KPIPanel");
  });

  it("detects forbidden class patterns", () => {
    const components: ExtractedComponent[] = [];
    const classes: ExtractedClassUsage[] = [
      {
        file: "src/Grid.tsx",
        line: 15,
        className: "grid-cols-6",
        snippet: '<div className="grid grid-cols-6">',
      },
    ];

    const violations = checkForbiddenPatternViolations(pack, components, classes);
    const classViolations = violations.filter((v) => v.ruleId === "FP-001");
    expect(classViolations.length).toBeGreaterThanOrEqual(1);
    expect(classViolations[0].message).toContain("grid-cols-6");
  });

  it("detects forbidden import patterns", () => {
    const components: ExtractedComponent[] = [
      {
        file: "src/Panel.tsx",
        line: 1,
        name: "SomeWidget",
        importPath: "@enterprise/dashboard/widgets",
        snippet: 'import { SomeWidget } from "@enterprise/dashboard/widgets"',
      },
    ];
    const classes: ExtractedClassUsage[] = [];

    const violations = checkForbiddenPatternViolations(pack, components, classes);
    const importViolations = violations.filter((v) => v.ruleId === "FP-003");
    expect(importViolations.length).toBeGreaterThanOrEqual(1);
    expect(importViolations[0].message).toContain("@enterprise/dashboard");
  });

  it("clean files pass", () => {
    const components: ExtractedComponent[] = [
      {
        file: "src/Card.tsx",
        line: 1,
        name: "Card",
        importPath: "@ui/components",
        snippet: 'import { Card } from "@ui/components"',
      },
    ];
    const classes: ExtractedClassUsage[] = [
      {
        file: "src/Card.tsx",
        line: 5,
        className: "grid-cols-2",
        snippet: '<div className="grid grid-cols-2">',
      },
    ];

    const violations = checkForbiddenPatternViolations(pack, components, classes);
    expect(violations).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// law-checker
// ---------------------------------------------------------------------------

describe("checkLawViolations", () => {
  const pack = makePack();

  it("detects destructive action without confirmation (LAW-001)", () => {
    const interactions: ExtractedInteraction[] = [
      {
        file: "src/Settings.tsx",
        line: 42,
        snippet: '<button onClick={handleDelete}>Delete Account</button>',
        kind: "destructive-action",
        hasConfirmation: false,
      },
    ];

    const violations = checkLawViolations(pack, interactions);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("LAW-001");
    expect(violations[0].severity).toBe("error");
    expect(violations[0].class).toBe("interaction-law");
    expect(violations[0].message).toContain("Settings.tsx");
  });

  it("passes when destructive action has confirmation", () => {
    const interactions: ExtractedInteraction[] = [
      {
        file: "src/Settings.tsx",
        line: 42,
        snippet: "if (confirm('Delete?')) handleDelete()",
        kind: "destructive-action",
        hasConfirmation: true,
      },
    ];

    const violations = checkLawViolations(pack, interactions);
    expect(violations).toHaveLength(0);
  });

  it("detects form submit without validation gate (LAW-002)", () => {
    const interactions: ExtractedInteraction[] = [
      {
        file: "src/Login.tsx",
        line: 18,
        snippet: '<button type="submit">Submit</button>',
        kind: "form-submit",
        hasValidationGate: false,
      },
    ];

    const violations = checkLawViolations(pack, interactions);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("LAW-002");
    expect(violations[0].severity).toBe("error");
  });

  it("passes when form submit has validation gate", () => {
    const interactions: ExtractedInteraction[] = [
      {
        file: "src/Login.tsx",
        line: 18,
        snippet: '<button type="submit" disabled={!isValid}>Submit</button>',
        kind: "form-submit",
        hasValidationGate: true,
      },
    ];

    const violations = checkLawViolations(pack, interactions);
    expect(violations).toHaveLength(0);
  });

  it("detects navigation without draft preservation (LAW-003)", () => {
    const interactions: ExtractedInteraction[] = [
      {
        file: "src/Editor.tsx",
        line: 55,
        snippet: "navigate('/home')",
        kind: "navigation",
        hasDraftPreservation: false,
      },
    ];

    const violations = checkLawViolations(pack, interactions);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("LAW-003");
  });

  it("passes when navigation preserves draft", () => {
    const interactions: ExtractedInteraction[] = [
      {
        file: "src/Editor.tsx",
        line: 55,
        snippet: "useBlocker(() => isDirty)",
        kind: "navigation",
        hasDraftPreservation: true,
      },
    ];

    const violations = checkLawViolations(pack, interactions);
    expect(violations).toHaveLength(0);
  });

  it("detects empty state without primary action (LAW-004)", () => {
    const interactions: ExtractedInteraction[] = [
      {
        file: "src/ProjectList.tsx",
        line: 30,
        snippet: "<p>No projects yet</p>",
        kind: "empty-state",
        hasPrimaryAction: false,
      },
    ];

    const violations = checkLawViolations(pack, interactions);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("LAW-004");
  });

  it("passes when empty state has primary action", () => {
    const interactions: ExtractedInteraction[] = [
      {
        file: "src/ProjectList.tsx",
        line: 30,
        snippet: '<EmptyState action={<Button>Create Project</Button>} />',
        kind: "empty-state",
        hasPrimaryAction: true,
      },
    ];

    const violations = checkLawViolations(pack, interactions);
    expect(violations).toHaveLength(0);
  });

  it("detects multiple violations across different law kinds", () => {
    const interactions: ExtractedInteraction[] = [
      {
        file: "src/Settings.tsx",
        line: 42,
        snippet: "handleDelete()",
        kind: "destructive-action",
        hasConfirmation: false,
      },
      {
        file: "src/Form.tsx",
        line: 10,
        snippet: '<button type="submit">Go</button>',
        kind: "form-submit",
        hasValidationGate: false,
      },
      {
        file: "src/Empty.tsx",
        line: 5,
        snippet: "<p>Nothing here</p>",
        kind: "empty-state",
        hasPrimaryAction: false,
      },
    ];

    const violations = checkLawViolations(pack, interactions);
    expect(violations).toHaveLength(3);
    const ruleIds = violations.map((v) => v.ruleId);
    expect(ruleIds).toContain("LAW-001");
    expect(ruleIds).toContain("LAW-002");
    expect(ruleIds).toContain("LAW-004");
  });

  it("skips laws not present in pack", () => {
    // Pack with only one law
    const limitedPack = makePack({
      artifacts: {
        ...makePack().artifacts,
        interactionLaws: [
          {
            id: "law-destructive-confirm",
            law: "Destructive actions require confirmation",
            severity: "error",
          },
        ],
      },
    });

    const interactions: ExtractedInteraction[] = [
      {
        file: "src/Form.tsx",
        line: 10,
        snippet: '<button type="submit">Go</button>',
        kind: "form-submit",
        hasValidationGate: false,
      },
    ];

    // form-submit maps to law-submit-validation, which is NOT in this pack
    const violations = checkLawViolations(limitedPack, interactions);
    expect(violations).toHaveLength(0);
  });

  it("respects warn severity from pack", () => {
    const warnPack = makePack({
      artifacts: {
        ...makePack().artifacts,
        interactionLaws: [
          {
            id: "law-empty-state",
            law: "Empty states require a primary next step",
            severity: "warn",
          },
        ],
      },
    });

    const interactions: ExtractedInteraction[] = [
      {
        file: "src/List.tsx",
        line: 8,
        snippet: "<p>No items</p>",
        kind: "empty-state",
        hasPrimaryAction: false,
      },
    ];

    const violations = checkLawViolations(warnPack, interactions);
    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe("warn");
  });

  it("clean interactions pass", () => {
    const interactions: ExtractedInteraction[] = [
      {
        file: "src/Settings.tsx",
        line: 42,
        snippet: "confirm('Delete?') && handleDelete()",
        kind: "destructive-action",
        hasConfirmation: true,
      },
      {
        file: "src/Login.tsx",
        line: 18,
        snippet: '<button disabled={!valid} type="submit">Go</button>',
        kind: "form-submit",
        hasValidationGate: true,
      },
      {
        file: "src/Editor.tsx",
        line: 55,
        snippet: "useBlocker(() => isDirty)",
        kind: "navigation",
        hasDraftPreservation: true,
      },
      {
        file: "src/Projects.tsx",
        line: 30,
        snippet: '<EmptyState action={<CreateButton />} />',
        kind: "empty-state",
        hasPrimaryAction: true,
      },
    ];

    const violations = checkLawViolations(pack, interactions);
    expect(violations).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// runChecks() integration
// ---------------------------------------------------------------------------

describe("runChecks", () => {
  it("aggregates violations from all checkers", () => {
    const pack = makePack();
    const target: ExtractedTarget = {
      styles: [
        {
          file: "src/App.tsx",
          line: 10,
          type: "color",
          value: "#ff5733",
          isRaw: true,
          snippet: "bg-[#ff5733]",
        },
      ],
      components: [
        {
          file: "src/Dashboard.tsx",
          line: 3,
          name: "DataGrid",
          importPath: "@ui/components",
          snippet: 'import { DataGrid } from "@ui/components"',
        },
      ],
      screens: [
        {
          file: "src/Dashboard.tsx",
          primaryActionCount: 3,
          components: ["DataGrid"],
        },
      ],
      copyBlocks: [
        {
          file: "src/Hero.tsx",
          line: 12,
          text: "Our blazing fast AI-powered platform",
          snippet: "<h1>Our blazing fast AI-powered platform</h1>",
        },
      ],
      metrics: {
        topLevelNavItems: 8,
      },
      classes: [
        {
          file: "src/Grid.tsx",
          line: 15,
          className: "grid-cols-6",
          snippet: '<div className="grid grid-cols-6">',
        },
      ],
      interactions: [
        {
          file: "src/Settings.tsx",
          line: 42,
          snippet: '<button onClick={handleDelete}>Delete Account</button>',
          kind: "destructive-action" as const,
          hasConfirmation: false,
        },
      ],
    };

    const violations = runChecks(pack, target);
    // Should have violations from all 6 checkers
    const ruleIds = new Set(violations.map((v) => v.ruleId));
    expect(ruleIds.has("TOK-001")).toBe(true); // raw hex color
    expect(ruleIds.has("GRAM-001")).toBe(true); // banned component
    expect(ruleIds.has("COPY-001")).toBe(true); // banned phrase
    expect(ruleIds.has("BUD-001")).toBe(true); // nav budget
    expect(ruleIds.has("FP-001")).toBe(true); // forbidden class pattern
    expect(ruleIds.has("LAW-001")).toBe(true); // destructive without confirm
    expect(violations.length).toBeGreaterThanOrEqual(6);
  });
});

// ---------------------------------------------------------------------------
// buildReport()
// ---------------------------------------------------------------------------

describe("buildReport", () => {
  it("has correct error/warn/info counts", () => {
    const pack = makePack();
    const target: ExtractedTarget = {
      styles: [
        {
          file: "src/A.tsx",
          line: 1,
          type: "color",
          value: "#abc",
          isRaw: true,
          snippet: "bg-[#abc]",
        },
        {
          file: "src/A.tsx",
          line: 2,
          type: "spacing",
          value: "13px",
          isRaw: true,
          snippet: "p-[13px]",
        },
      ],
      components: [],
      screens: [],
      copyBlocks: [],
      metrics: {},
      classes: [],
      interactions: [],
    };

    const violations = runChecks(pack, target);
    const report = buildReport(pack, "src/", violations);

    // 1 error (hex color), 1 warn (off-scale spacing)
    expect(report.summary.errors).toBe(1);
    expect(report.summary.warnings).toBe(1);
    expect(report.summary.infos).toBe(0);
    expect(report.summary.passed).toBe(false);
    expect(report.product).toBe("TestApp");
    expect(report.target).toBe("src/");
    expect(report.packVersion).toBe("0.1.0");
    expect(report.checkedAt).toBeTruthy();
  });

  it("passed is true when no errors", () => {
    const pack = makePack();
    const target: ExtractedTarget = {
      styles: [],
      components: [],
      screens: [],
      copyBlocks: [],
      metrics: {},
      classes: [],
      interactions: [],
    };

    const violations = runChecks(pack, target);
    const report = buildReport(pack, "src/", violations);

    expect(report.summary.errors).toBe(0);
    expect(report.summary.warnings).toBe(0);
    expect(report.summary.infos).toBe(0);
    expect(report.summary.passed).toBe(true);
    expect(report.violations).toHaveLength(0);
  });
});

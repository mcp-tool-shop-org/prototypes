import { describe, it, expect } from "vitest";
import { buildPandocArgs } from "./build-args.js";
import {
  PANDOC_PRESET_SPECS,
  buildPandocBaseArgs,
  type PandocPresetSpec,
} from "./preset-spec.js";
import {
  isPandocStepLine,
  calculatePandocPercent,
} from "./progress.js";
import {
  estimatePandocOutputBytes,
  checkFormatCompatibility,
} from "./preflight.js";
import type { ConvertDocument, PandocPreset } from "./schemas.js";

// ── buildPandocArgs golden tests ──────────────────────────────────

describe("buildPandocArgs", () => {
  const ALL_PRESETS = Object.keys(PANDOC_PRESET_SPECS) as PandocPreset[];

  it.each(ALL_PRESETS)("preset %s produces correct args", (preset) => {
    const req: ConvertDocument = {
      inputPath: "doc.md",
      outputPath: `out.${PANDOC_PRESET_SPECS[preset].outputExt}`,
      preset,
      timeoutSeconds: 60,
      maxOutputBytes: 0,
    };

    const args = buildPandocArgs(req);

    // Must contain the preset's output format
    expect(args).toContain(PANDOC_PRESET_SPECS[preset].to);

    // Must contain --from
    expect(args).toContain("--from");
    const fromIdx = args.indexOf("--from");
    expect(args[fromIdx + 1]).toBe(PANDOC_PRESET_SPECS[preset].from);

    // Must contain --to
    expect(args).toContain("--to");
    const toIdx = args.indexOf("--to");
    expect(args[toIdx + 1]).toBe(PANDOC_PRESET_SPECS[preset].to);

    // Must contain base args
    for (const baseArg of buildPandocBaseArgs()) {
      expect(args).toContain(baseArg);
    }

    // Input must be last
    expect(args[args.length - 1]).toBe("doc.md");

    // Output must be second-to-last (after -o)
    const outputIdx = args.indexOf("-o");
    expect(outputIdx).toBeGreaterThan(-1);
    expect(args[outputIdx + 1]).toBe(
      `out.${PANDOC_PRESET_SPECS[preset].outputExt}`,
    );
  });

  it("includes optional template when provided", () => {
    const req: ConvertDocument = {
      inputPath: "doc.md",
      outputPath: "out.pdf",
      preset: "academic-pdf",
      templatePath: "/templates/academic.latex",
      timeoutSeconds: 60,
      maxOutputBytes: 0,
    };

    const args = buildPandocArgs(req);

    expect(args).toContain("--template");
    const tmplIdx = args.indexOf("--template");
    expect(args[tmplIdx + 1]).toBe("/templates/academic.latex");
  });

  it("includes optional bibliography when provided", () => {
    const req: ConvertDocument = {
      inputPath: "doc.md",
      outputPath: "out.pdf",
      preset: "academic-pdf",
      bibliographyPath: "/refs/bibliography.bib",
      timeoutSeconds: 60,
      maxOutputBytes: 0,
    };

    const args = buildPandocArgs(req);

    expect(args).toContain("--bibliography");
    const bibIdx = args.indexOf("--bibliography");
    expect(args[bibIdx + 1]).toBe("/refs/bibliography.bib");
  });

  it("includes optional CSS when provided", () => {
    const req: ConvertDocument = {
      inputPath: "doc.md",
      outputPath: "out.html",
      preset: "blog-post",
      cssPath: "/styles/blog.css",
      timeoutSeconds: 60,
      maxOutputBytes: 0,
    };

    const args = buildPandocArgs(req);

    expect(args).toContain("--css");
    const cssIdx = args.indexOf("--css");
    expect(args[cssIdx + 1]).toBe("/styles/blog.css");
  });

  it("newsletter falls back to blog-post in spec", () => {
    expect(PANDOC_PRESET_SPECS.newsletter.fallbackTo).toBe("blog-post");
    expect(PANDOC_PRESET_SPECS.newsletter.isPremium).toBe(true);
  });
});

// ── Preset spec invariants ───────────────────────────────────────

describe("PANDOC_PRESET_SPECS", () => {
  it("every preset has a positive estimatedSteps", () => {
    for (const [name, spec] of Object.entries(PANDOC_PRESET_SPECS)) {
      expect(spec.estimatedSteps, `${name}.estimatedSteps`).toBeGreaterThan(0);
    }
  });

  it("non-premium presets have no fallback", () => {
    for (const [name, spec] of Object.entries(PANDOC_PRESET_SPECS)) {
      if (!spec.isPremium) {
        expect(spec.fallbackTo, `${name}.fallbackTo`).toBeNull();
      }
    }
  });

  it("premium presets have a valid fallback", () => {
    for (const [name, spec] of Object.entries(PANDOC_PRESET_SPECS)) {
      if (spec.isPremium) {
        expect(
          spec.fallbackTo,
          `${name}.fallbackTo`,
        ).not.toBeNull();
        expect(
          Object.keys(PANDOC_PRESET_SPECS),
          `${name}.fallbackTo points to valid preset`,
        ).toContain(spec.fallbackTo);
      }
    }
  });
});

// ── Progress parser ──────────────────────────────────────────────

describe("pandoc progress", () => {
  it("isPandocStepLine recognizes processing keywords", () => {
    expect(isPandocStepLine("[INFO]", "Writing output")).toBe(true);
    expect(isPandocStepLine("[makePDF]", "Running xelatex")).toBe(true);
    expect(isPandocStepLine("processing", "chapter 3")).toBe(true);
    expect(isPandocStepLine("converting", "images")).toBe(true);
    expect(isPandocStepLine("reading", "metadata")).toBe(true);
    expect(isPandocStepLine("task", "done")).toBe(true);
  });

  it("isPandocStepLine rejects non-step lines", () => {
    expect(isPandocStepLine("debug", "trace output")).toBe(false);
    expect(isPandocStepLine("memory", "allocated 4096")).toBe(false);
  });

  it("calculatePandocPercent clamps to 0-99", () => {
    expect(calculatePandocPercent(0, 10)).toBe(0);
    expect(calculatePandocPercent(5, 10)).toBe(50);
    expect(calculatePandocPercent(10, 10)).toBe(99); // capped at 99
    expect(calculatePandocPercent(15, 10)).toBe(99); // over-step
    expect(calculatePandocPercent(0, 0)).toBe(0);    // zero steps
  });
});

// ── Preflight helpers ────────────────────────────────────────────

describe("preflight helpers", () => {
  it("estimatePandocOutputBytes applies correct expansion factors", () => {
    const inputSize = 10_000;

    // blog-post → html5 → factor 1.8
    expect(estimatePandocOutputBytes(inputSize, "blog-post")).toBe(
      Math.ceil(inputSize * 1.8),
    );
    // academic-pdf → pdf → factor 0.8
    expect(estimatePandocOutputBytes(inputSize, "academic-pdf")).toBe(
      Math.ceil(inputSize * 0.8),
    );
    // ebook → epub → factor 1.2
    expect(estimatePandocOutputBytes(inputSize, "ebook")).toBe(
      Math.ceil(inputSize * 1.2),
    );
    // slides → revealjs → factor 2.5
    expect(estimatePandocOutputBytes(inputSize, "slides")).toBe(
      Math.ceil(inputSize * 2.5),
    );
    // newsletter → html → factor 1.5
    expect(estimatePandocOutputBytes(inputSize, "newsletter")).toBe(
      Math.ceil(inputSize * 1.5),
    );
  });

  it("checkFormatCompatibility returns ok for markdown presets", () => {
    const result = checkFormatCompatibility("html", "markdown");
    expect(result.ok).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it("checkFormatCompatibility warns on format mismatch", () => {
    const result = checkFormatCompatibility("markdown", "latex");
    expect(result.ok).toBe(true);
    expect(result.warning).toContain("differs from");
  });

  it("checkFormatCompatibility passes on exact match", () => {
    const result = checkFormatCompatibility("latex", "latex");
    expect(result.ok).toBe(true);
    expect(result.warning).toBeUndefined();
  });
});

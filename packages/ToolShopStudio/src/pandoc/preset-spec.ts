import type { PandocPreset } from "./schemas.js";

// ── PandocPresetSpec: pure data, no runtime logic ─────────────────

export interface PandocPresetSpec {
  /** Pandoc --from format */
  from: string;
  /** Pandoc --to format */
  to: string;
  /** Output file extension (without dot) */
  outputExt: string;
  /** Additional pandoc args specific to this preset */
  extraArgs: string[];
  /** Whether this preset requires premium templates/processing */
  isPremium: boolean;
  /** Fallback preset if this one fails */
  fallbackTo: PandocPreset | null;
  /** Estimated processing steps for progress calculation */
  estimatedSteps: number;
}

export const PANDOC_PRESET_SPECS: Record<PandocPreset, PandocPresetSpec> = {
  "blog-post": {
    from: "markdown",
    to: "html5",
    outputExt: "html",
    extraArgs: ["--standalone", "--embed-resources", "--metadata=lang:en"],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 5,
  },
  "academic-pdf": {
    from: "markdown",
    to: "pdf",
    outputExt: "pdf",
    extraArgs: [
      "--pdf-engine=xelatex",
      "--citeproc",
      "--toc",
      "--number-sections",
    ],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 12,
  },
  "ebook": {
    from: "markdown",
    to: "epub",
    outputExt: "epub",
    extraArgs: ["--toc", "--toc-depth=2", "--epub-chapter-level=2"],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 8,
  },
  "slides": {
    from: "markdown",
    to: "revealjs",
    outputExt: "html",
    extraArgs: [
      "--standalone",
      "--slide-level=2",
      "-V", "revealjs-url=https://unpkg.com/reveal.js",
    ],
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 6,
  },
  "newsletter": {
    from: "markdown",
    to: "html5",
    outputExt: "html",
    extraArgs: [
      "--standalone",
      "--embed-resources",
      "--metadata=lang:en",
    ],
    isPremium: true,
    fallbackTo: "blog-post",
    estimatedSteps: 7,
  },
} as const;

// ── Common invariant args for all presets ──────────────────────────

/**
 * Base pandoc args applied to every conversion.
 * --verbose emits processing steps (needed for progress parsing).
 * --fail-if-warnings makes pandoc exit non-zero on warnings.
 * -s is --standalone (ensure complete document output).
 */
export function buildPandocBaseArgs(): string[] {
  return [
    "--verbose",
    "--fail-if-warnings",
    "-s",
  ];
}

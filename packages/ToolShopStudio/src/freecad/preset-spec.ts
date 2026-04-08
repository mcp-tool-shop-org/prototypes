import type { FreeCADPreset, FreeCADQuality } from "./schemas.js";

// ── FreeCADPresetSpec: pure data, no runtime logic ───────────────

export interface FreeCADPresetSpec {
  /** Output file format (STL, STEP, GLB, 3MF, OBJ) */
  exportFormat: string;
  /** Output file extension (without dot) */
  outputExt: string;
  /**
   * Safe, hardcoded Python one-liner for FreeCADCmd -c.
   * Uses $INPUT and $OUTPUT placeholders (replaced by buildFreeCADArgs).
   * Never exec/eval — only audited import + export calls.
   */
  pythonExpr: string;
  /** Quality CLI flag (e.g. "--mesh-repair", "--precision=0.001") */
  qualityFlag: string;
  /** Whether this preset requires premium processing */
  isPremium: boolean;
  /** Fallback preset if this one fails */
  fallbackTo: FreeCADPreset | null;
  /** Estimated processing steps for progress calculation */
  estimatedSteps: number;
}

export const FREECAD_PRESET_SPECS: Record<FreeCADPreset, FreeCADPresetSpec> = {
  "stl-print-ready": {
    exportFormat: "STL",
    outputExt: "stl",
    pythonExpr:
      'import FreeCAD; doc=FreeCAD.open("$INPUT"); __import__("Mesh").export(doc.Objects, "$OUTPUT")',
    qualityFlag: "--mesh-repair",
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 8,
  },
  "step-precision": {
    exportFormat: "STEP",
    outputExt: "step",
    pythonExpr:
      'import FreeCAD, Import; doc=FreeCAD.open("$INPUT"); Import.export(doc.Objects, "$OUTPUT")',
    qualityFlag: "--precision=0.001",
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 10,
  },
  "glb-web-ready": {
    exportFormat: "GLB",
    outputExt: "glb",
    pythonExpr:
      'import FreeCAD; doc=FreeCAD.open("$INPUT"); doc.saveAs("$OUTPUT")',
    qualityFlag: "--optimize",
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 6,
  },
  "3mf-slicer-ready": {
    exportFormat: "3MF",
    outputExt: "3mf",
    pythonExpr:
      'import FreeCAD, Mesh; doc=FreeCAD.open("$INPUT"); Mesh.export(doc.Objects, "$OUTPUT")',
    qualityFlag: "--color",
    isPremium: true,
    fallbackTo: "stl-print-ready",
    estimatedSteps: 12,
  },
  "obj-mesh": {
    exportFormat: "OBJ",
    outputExt: "obj",
    pythonExpr:
      'import FreeCAD, Mesh; doc=FreeCAD.open("$INPUT"); Mesh.export(doc.Objects, "$OUTPUT")',
    qualityFlag: "",
    isPremium: false,
    fallbackTo: null,
    estimatedSteps: 5,
  },
} as const;

// ── Common invariant args for all presets ─────────────────────────

/**
 * Base FreeCAD CLI args applied to every export.
 * --headless runs without GUI.
 * --no-gui prevents X11 dependency.
 * -c tells FreeCADCmd to execute the following Python expression.
 */
export function buildFreeCADBaseArgs(): string[] {
  return [
    "--headless",
    "--no-gui",
    "-c",
  ];
}

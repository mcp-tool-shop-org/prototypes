import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parse as parseYaml } from "yaml";
import {
  TasteSourceSchema,
  type TasteSource,
  type TasteReference,
  type AntiExample,
  type Principle,
  type CoreFlow,
  type CritiqueNote,
  type BudgetInput,
  type ForbiddenPatternSeed,
} from "@taste-compiler/core";

export interface LoadResult {
  source: TasteSource;
  warnings: string[];
}

async function loadYaml<T>(filePath: string): Promise<T | undefined> {
  try {
    const content = await readFile(filePath, "utf-8");
    return parseYaml(content) as T;
  } catch {
    return undefined;
  }
}

/**
 * Load a TasteSource from a directory of YAML files.
 * Expected structure:
 *   product.yaml
 *   references.yaml
 *   anti-examples.yaml
 *   principles.yaml
 *   flows.yaml
 *   critique.yaml
 *   budgets.yaml
 *   forbidden-patterns.yaml  (optional)
 *   metadata.yaml
 */
export async function loadSourceDir(dir: string): Promise<LoadResult> {
  const absDir = resolve(dir);
  const warnings: string[] = [];

  const product = await loadYaml<{ name: string; summary: string }>(
    join(absDir, "product.yaml")
  );
  if (!product) {
    throw new Error(`Missing required file: ${join(absDir, "product.yaml")}`);
  }

  const references =
    (await loadYaml<TasteReference[]>(join(absDir, "references.yaml"))) ?? [];
  const antiExamples =
    (await loadYaml<AntiExample[]>(join(absDir, "anti-examples.yaml"))) ?? [];
  const principles = await loadYaml<Principle[]>(
    join(absDir, "principles.yaml")
  );
  if (!principles || principles.length === 0) {
    throw new Error(
      `Missing or empty required file: ${join(absDir, "principles.yaml")}`
    );
  }
  const flows =
    (await loadYaml<CoreFlow[]>(join(absDir, "flows.yaml"))) ?? [];
  const critique =
    (await loadYaml<CritiqueNote[]>(join(absDir, "critique.yaml"))) ?? [];
  const budgets = await loadYaml<BudgetInput>(join(absDir, "budgets.yaml"));
  const forbiddenPatternSeeds =
    (await loadYaml<ForbiddenPatternSeed[]>(join(absDir, "forbidden-patterns.yaml"))) ?? [];
  const metadata = await loadYaml<{
    createdBy: string;
    createdAt: string;
    version: string;
  }>(join(absDir, "metadata.yaml"));

  if (!metadata) {
    throw new Error(
      `Missing required file: ${join(absDir, "metadata.yaml")}`
    );
  }

  // Check for missing anti-example rationale
  for (const ae of antiExamples) {
    if (!ae.reason || ae.reason.trim() === "") {
      warnings.push(`Anti-example "${ae.id}" is missing a reason`);
    }
  }

  // Check for empty principles
  for (const p of principles) {
    if (!p.rationale || p.rationale.trim() === "") {
      warnings.push(`Principle "${p.id}" is missing rationale`);
    }
  }

  const raw = {
    product,
    references,
    antiExamples,
    principles,
    flows,
    critique,
    budgets,
    forbiddenPatternSeeds,
    metadata,
  };

  const parsed = TasteSourceSchema.parse(raw);
  return { source: parsed, warnings };
}

/**
 * Load a TasteSource from a single JSON or YAML file.
 */
export async function loadSourceFile(filePath: string): Promise<LoadResult> {
  const abs = resolve(filePath);
  const content = await readFile(abs, "utf-8");
  const raw = abs.endsWith(".json") ? JSON.parse(content) : parseYaml(content);
  const source = TasteSourceSchema.parse(raw);
  return { source, warnings: [] };
}

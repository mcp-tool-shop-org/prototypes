import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { TastePackSchema } from "@taste-compiler/core";
import { explain, formatExplainText } from "@taste-compiler/compiler";

export async function explainCommand(args: string[]): Promise<void> {
  const packPath =
    findArg(args, "--pack") || "./taste/pack/taste-pack.json";

  const raw = await readFile(resolve(packPath), "utf-8");
  const pack = TastePackSchema.parse(JSON.parse(raw));
  const sections = explain(pack);

  console.log(formatExplainText(sections));
}

function findArg(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

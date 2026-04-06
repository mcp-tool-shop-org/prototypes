import { writeFileSync } from "node:fs";
import { DEFAULT_POLICY } from "@receipt-factory/policy";

export interface PolicyInitOptions {
  output?: string;
}

/**
 * Scaffold a default policy.json file.
 */
export function handlePolicyInit(opts: PolicyInitOptions = {}): void {
  const outputPath = opts.output ?? "policy.json";

  const content = JSON.stringify(DEFAULT_POLICY, null, 2) + "\n";
  writeFileSync(outputPath, content);
  console.log(`Policy file written to ${outputPath}`);
}

import { mkdirSync, existsSync } from "node:fs";

export function handleInit(): void {
  const dir = "receipts";

  if (existsSync(dir)) {
    console.log(`Directory "${dir}" already exists.`);
    return;
  }

  mkdirSync(dir, { recursive: true });
  console.log(`Created "${dir}/" directory for receipt storage.`);
  console.log("");
  console.log("Next steps:");
  console.log("  rf make ci --from github --run <RUN_ID>");
  console.log("  rf verify receipts/ci/<date>/<id>.json");
}

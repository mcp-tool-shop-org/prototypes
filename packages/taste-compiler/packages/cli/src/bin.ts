#!/usr/bin/env node

import { parseArgs } from "node:util";
import { initCommand } from "./commands/init.js";
import { validateSourceCommand } from "./commands/validate-source.js";
import { compileCommand } from "./commands/compile.js";
import { explainCommand } from "./commands/explain.js";
import { checkCommand } from "./commands/check.js";
import { diffCommand } from "./commands/diff.js";
import { goldensVerifyCommand } from "./commands/goldens-verify.js";

const USAGE = `
taste — Compile subjective design taste into enforceable artifacts

Commands:
  init                  Create starter taste workspace
  validate-source       Check authoring inputs before compile
  compile               Compile TasteSource into TastePack
  explain               Explain what the compiler inferred
  check                 Run static checks against app artifacts
  diff                  Check only changed files (PR gate)
  goldens verify        Verify golden flows are intact

Options:
  --help, -h            Show this help
  --version, -v         Show version
`.trim();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(USAGE);
    return;
  }

  if (command === "--version" || command === "-v") {
    console.log("0.1.0");
    return;
  }

  const commandArgs = args.slice(1);

  switch (command) {
    case "init":
      await initCommand(commandArgs);
      break;
    case "validate-source":
      await validateSourceCommand(commandArgs);
      break;
    case "compile":
      await compileCommand(commandArgs);
      break;
    case "explain":
      await explainCommand(commandArgs);
      break;
    case "check":
      await checkCommand(commandArgs);
      break;
    case "diff":
      await diffCommand(commandArgs);
      break;
    case "goldens":
      if (commandArgs[0] === "verify") {
        await goldensVerifyCommand(commandArgs.slice(1));
      } else {
        console.error(`Unknown goldens subcommand: ${commandArgs[0]}`);
        process.exit(1);
      }
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log(USAGE);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

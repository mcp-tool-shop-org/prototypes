#!/usr/bin/env node

import { Command } from "commander";
import { VERSION } from "./version.js";
import { handleMake } from "./commands/make.js";
import { handleRender } from "./commands/render.js";
import { handleVerify } from "./commands/verify.js";
import { handleSign, handleSignPolicy } from "./commands/sign.js";
import { handleInit } from "./commands/init.js";
import { handleCollect } from "./commands/collect.js";
import { handleIndex } from "./commands/index-cmd.js";
import { handleSearch } from "./commands/search.js";
import { handleGraph } from "./commands/graph.js";
import { handlePolicyInit } from "./commands/policy.js";
import {
  handleBundleCreate,
  handleBundleVerify,
  handleBundleSign,
  handleBundleInspect,
} from "./commands/bundle.js";

const program = new Command();

program
  .name("rf")
  .description("receipt-factory — create, collect, render, verify, and sign receipts")
  .version(VERSION);

program
  .command("make <kind>")
  .description("Create a receipt (kinds: ci, release, registry-sync, security-audit, sbom)")
  .requiredOption("--from <source>", "Data source (supported: github, evidence)")
  .option("--run <id>", "Run ID (defaults to GITHUB_RUN_ID in CI)")
  .option("--repo <owner/name>", "Repository (defaults to GITHUB_REPOSITORY)")
  .option("--tag <tag>", "Release tag (for release kind)")
  .option("--pack <dir>", "Evidence pack directory (for --from evidence)")
  .option("--output <dir>", "Output directory (default: receipts)")
  .action(handleMake);

program
  .command("collect <kind>")
  .description("Collect evidence into a portable pack (kinds: ci, release, registry-sync, security-audit, sbom)")
  .requiredOption("--from <source>", "Data source (supported: github)")
  .option("--run <id>", "Run ID (defaults to GITHUB_RUN_ID in CI)")
  .option("--repo <owner/name>", "Repository (defaults to GITHUB_REPOSITORY)")
  .option("--tag <tag>", "Release tag (for release kind)")
  .option("--output <dir>", "Output directory (default: evidence)")
  .action(handleCollect);

program
  .command("render <file>")
  .description("Render a receipt to markdown or HTML")
  .option("--format <fmt>", "Output format: md, html", "md")
  .option("--output <path>", "Output file path")
  .action(handleRender);

program
  .command("verify <file>")
  .description("Verify receipt integrity")
  .option("--offline", "Skip link reachability checks", false)
  .option("--strict", "Enable lint checks for receipt quality", false)
  .option("--follow", "Recursively verify referenced receipts", false)
  .option("--refs-strict", "Fail verification on missing or unreadable references", false)
  .option("--policy <path>", "Path to policy.json for lint rules")
  .option("--require-policy-signature", "Require a signed policy (cosign sidecar)", false)
  .option("--require-bundle-signature", "Require a signed bundle (cosign sidecar, for .zip bundles)", false)
  .option("--receipts-dir <dir>", "Directory for resolving reference paths")
  .action(handleVerify);

program
  .command("lint <file>")
  .description("Verify receipt with strict lint checks (alias for verify --strict)")
  .option("--offline", "Skip link reachability checks", false)
  .option("--policy <path>", "Path to policy.json for lint rules")
  .action((file: string, opts: { offline: boolean; policy?: string }) =>
    handleVerify(file, { ...opts, strict: true }),
  );

program
  .command("sign <file>")
  .description("Sign a receipt with cosign")
  .option("--keyless", "Use keyless signing (OIDC, for CI)", false)
  .option("--key <path>", "Path to cosign private key")
  .option("--embed", "Embed signature into receipt integrity block", false)
  .action(handleSign);

program
  .command("index [dir]")
  .description("Build a receipt index from a directory of receipts")
  .option("--output <path>", "Output path for index.json")
  .option("--validate", "Run integrity checks on each receipt", false)
  .action(handleIndex);

program
  .command("search")
  .description("Search the receipt index")
  .option("--kind <kind>", "Filter by receipt kind (ci_run, release, registry_sync, audit, sbom)")
  .option("--repo <name>", "Filter by repository name (partial match)")
  .option("--since <date>", "Filter receipts created after this date")
  .option("--until <date>", "Filter receipts created before this date")
  .option("--index <path>", "Path to index.json (default: receipts/index.json)")
  .action(handleSearch);

program
  .command("graph [dir]")
  .description("Emit JSON graph of receipt references")
  .action(handleGraph);

const policyCmd = program
  .command("policy")
  .description("Manage receipt policies");

policyCmd
  .command("init")
  .description("Scaffold a default policy.json file")
  .option("--output <path>", "Output path (default: policy.json)")
  .action(handlePolicyInit);

policyCmd
  .command("sign <file>")
  .description("Sign a policy file with cosign (detached sidecar)")
  .option("--keyless", "Use keyless signing (OIDC, for CI)", false)
  .option("--key <path>", "Path to cosign private key")
  .action(handleSignPolicy);

const bundleCmd = program
  .command("bundle")
  .description("Create, verify, and inspect receipt bundles");

bundleCmd
  .command("create <file>")
  .description("Create a portable receipt bundle (zip)")
  .option("--follow", "Include referenced receipts", false)
  .option("--include-evidence", "Include evidence packs", false)
  .option("--policy <path>", "Include a policy file in the bundle")
  .option("--out <path>", "Output path for the zip file")
  .option("--receipts-dir <dir>", "Directory for resolving reference paths")
  .action(handleBundleCreate);

bundleCmd
  .command("verify <file>")
  .description("Verify a receipt bundle")
  .option("--strict", "Enable strict lint checks", false)
  .option("--require-bundle-signature", "Require a signed bundle (cosign sidecar)", false)
  .action(handleBundleVerify);

bundleCmd
  .command("sign <file>")
  .description("Sign a bundle with cosign (detached sidecar)")
  .option("--keyless", "Use keyless signing (OIDC, for CI)", false)
  .option("--key <path>", "Path to cosign private key")
  .action(handleBundleSign);

bundleCmd
  .command("inspect <file>")
  .description("Show bundle manifest summary")
  .action(handleBundleInspect);

program
  .command("init")
  .description("Create receipts/ directory")
  .action(handleInit);

program.parse();

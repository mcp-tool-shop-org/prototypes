#!/usr/bin/env node
/**
 * ConsensusOS CLI binary entrypoint
 */
import { main } from "./cli.js";

main().then((code) => {
  process.exitCode = code;
}).catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});

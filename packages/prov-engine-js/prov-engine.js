#!/usr/bin/env node
/**
 * prov-engine.js — Minimal non-Python provenance engine for prov-spec interop.
 *
 * Commands:
 *   node prov-engine.js describe
 *   node prov-engine.js digest <path/to/input.json>
 *   node prov-engine.js wrap <path/to/payload.json>
 *   node prov-engine.js verify-digest <path/to/artifact.json>
 *
 * Design goals:
 * - Zero dependencies (Node.js built-ins only)
 * - Deterministic canonicalization matching prov-spec Section 6
 * - Pass prov-spec test vectors unmodified
 *
 * Implements:
 *   integrity.digest.sha256
 *   adapter.wrap.envelope_v0_1
 */

import fs from "node:fs";
import crypto from "node:crypto";
import process from "node:process";

const VERSION = "1.0.1";
const SPEC_VERSION = "0.1.0";

// ============================================================================
// Utilities
// ============================================================================

function die(msg, code = 1) {
  process.stderr.write(String(msg).trimEnd() + "\n");
  process.exit(code);
}

function readJsonFile(path) {
  const text = fs.readFileSync(path, "utf8");
  return JSON.parse(text);
}

function writeJson(obj, pretty = true) {
  const output = pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
  process.stdout.write(output + "\n");
}

// ============================================================================
// Canonical JSON (prov-spec Section 6)
// ============================================================================

/**
 * Canonical JSON serialization per prov-spec Section 6.1:
 * - Encoding: UTF-8
 * - Keys: Sorted lexicographically (Unicode code point order)
 * - Whitespace: None between tokens
 * - Numbers: No leading zeros, no trailing zeros after decimal, no positive sign
 * - Strings: Minimal escaping (only required escapes)
 * - Separators: ',' between elements, ':' between key-value
 *
 * This is compatible with JCS (RFC 8785) subset.
 */
function canonicalize(value) {
  if (value === null) return "null";

  const type = typeof value;

  if (type === "boolean") {
    return value ? "true" : "false";
  }

  if (type === "string") {
    return JSON.stringify(value);
  }

  if (type === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Non-finite numbers not allowed in canonical JSON");
    }
    // JSON.stringify handles:
    // - -0 => "0"
    // - No leading zeros
    // - No trailing zeros after decimal
    // - No positive sign
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalize(item));
    return "[" + items.join(",") + "]";
  }

  if (type === "object") {
    const keys = Object.keys(value).sort();
    const pairs = keys.map((key) => {
      return JSON.stringify(key) + ":" + canonicalize(value[key]);
    });
    return "{" + pairs.join(",") + "}";
  }

  throw new Error(`Non-JSON value type: ${type}`);
}

// ============================================================================
// Digest computation
// ============================================================================

/**
 * Compute SHA-256 digest of UTF-8 bytes.
 * Returns lowercase hex string.
 */
function sha256Hex(utf8String) {
  const hash = crypto.createHash("sha256");
  hash.update(utf8String, "utf8");
  return hash.digest("hex");
}

/**
 * Compute artifact digest per prov-spec.
 * Returns { alg, value } object.
 */
function computeDigest(content) {
  const canonical = canonicalize(content);
  const hex = sha256Hex(canonical);
  return {
    alg: "sha256",
    value: hex,
  };
}

// ============================================================================
// Commands
// ============================================================================

/**
 * describe - Print capability manifest
 */
function cmdDescribe() {
  const manifest = {
    schema: "prov-capabilities@v0.1",
    engine: {
      name: "prov-engine-js",
      version: VERSION,
      vendor: "prov-spec",
      repo: "https://github.com/mcp-tool-shop-org/prov-engine-js",
      license: "MIT",
    },
    implements: [
      "adapter.wrap.envelope_v0_1",
      "integrity.digest.sha256",
    ],
    optional: [],
    conformance_level: "fully-conformant",
    constraints: {
      canonicalization: "jcs-subset",
      supported_digest_algorithms: ["sha256"],
    },
    test_vectors_validated: [
      "integrity.digest.sha256",
      "adapter.wrap.envelope_v0_1",
    ],
    known_deviations: [],
  };
  writeJson(manifest);
}

/**
 * digest - Compute canonical form and digest for input JSON
 *
 * Matches prov-spec vector format:
 * Input:  any JSON
 * Output: { canonical_form, digest: { alg, value } }
 */
function cmdDigest(inputPath) {
  const input = readJsonFile(inputPath);
  const canonical = canonicalize(input);
  const digest = computeDigest(input);

  const output = {
    canonical_form: canonical,
    digest: digest,
  };
  writeJson(output);
}

/**
 * wrap - Wrap payload in mcp.envelope.v0.1
 *
 * Matches prov-spec vector format:
 * Input:  any JSON payload
 * Output: { schema_version, result }
 */
function cmdWrap(inputPath) {
  const payload = readJsonFile(inputPath);

  // Check for double-wrap (pass-through rule)
  if (
    payload &&
    typeof payload === "object" &&
    payload.schema_version === "mcp.envelope.v0.1"
  ) {
    // Already an envelope, pass through unchanged
    writeJson(payload);
    return;
  }

  const envelope = {
    schema_version: "mcp.envelope.v0.1",
    result: payload,
  };
  writeJson(envelope);
}

/**
 * verify-digest - Verify a digest claim
 *
 * Input: { content, digest: { alg, value } }
 * Output: exit 0 if valid, exit 1 if invalid
 */
function cmdVerifyDigest(inputPath) {
  const input = readJsonFile(inputPath);

  if (!input.content) {
    die("Missing 'content' field");
  }
  if (!input.digest || !input.digest.alg || !input.digest.value) {
    die("Missing or invalid 'digest' field");
  }
  if (input.digest.alg !== "sha256") {
    die(`Unsupported digest algorithm: ${input.digest.alg}`);
  }

  const computed = computeDigest(input.content);

  if (computed.value !== input.digest.value) {
    die(`Digest mismatch: expected ${input.digest.value}, got ${computed.value}`);
  }

  // Success - silent exit 0
  process.exit(0);
}

/**
 * check-vector - Run against a prov-spec vector directory
 *
 * Reads input.json, computes result, compares with expected.json
 */
function cmdCheckVector(vectorPath) {
  const inputPath = vectorPath + "/input.json";
  const expectedPath = vectorPath + "/expected.json";

  if (!fs.existsSync(inputPath)) {
    die(`Missing input.json in ${vectorPath}`);
  }
  if (!fs.existsSync(expectedPath)) {
    die(`Missing expected.json in ${vectorPath}`);
  }

  const input = readJsonFile(inputPath);
  const expected = readJsonFile(expectedPath);

  // Determine vector type from expected shape
  if (expected.canonical_form !== undefined && expected.digest !== undefined) {
    // integrity.digest.sha256 vector
    const canonical = canonicalize(input);
    const digest = computeDigest(input);

    if (canonical !== expected.canonical_form) {
      die(`Canonical form mismatch:\n  Expected: ${expected.canonical_form}\n  Got:      ${canonical}`);
    }
    if (digest.alg !== expected.digest.alg) {
      die(`Digest algorithm mismatch: expected ${expected.digest.alg}, got ${digest.alg}`);
    }
    if (digest.value !== expected.digest.value) {
      die(`Digest value mismatch:\n  Expected: ${expected.digest.value}\n  Got:      ${digest.value}`);
    }

    process.stdout.write(`PASS: integrity.digest.sha256 vector\n`);
    process.exit(0);
  }

  if (expected.schema_version === "mcp.envelope.v0.1") {
    // adapter.wrap.envelope_v0_1 vector
    const envelope = {
      schema_version: "mcp.envelope.v0.1",
      result: input,
    };

    if (envelope.schema_version !== expected.schema_version) {
      die(`Schema version mismatch`);
    }
    if (JSON.stringify(envelope.result) !== JSON.stringify(expected.result)) {
      die(`Result mismatch`);
    }

    process.stdout.write(`PASS: adapter.wrap.envelope_v0_1 vector\n`);
    process.exit(0);
  }

  die(`Unknown vector type in ${vectorPath}`);
}

// ============================================================================
// CLI
// ============================================================================

function printHelp() {
  const help = `
prov-engine.js v${VERSION} (prov-spec v${SPEC_VERSION})

A minimal, zero-dependency Node.js provenance engine.

Commands:
  describe                     Print capability manifest (prov-capabilities.json)
  digest <input.json>          Compute canonical form and SHA-256 digest
  wrap <payload.json>          Wrap payload in mcp.envelope.v0.1
  verify-digest <input.json>   Verify a digest claim (exit 0 if valid)
  check-vector <vector-dir>    Run against a prov-spec test vector

Examples:
  node prov-engine.js describe
  node prov-engine.js digest input.json
  node prov-engine.js wrap payload.json
  node prov-engine.js check-vector spec/vectors/integrity.digest.sha256

Implements:
  - integrity.digest.sha256
  - adapter.wrap.envelope_v0_1
`.trim();
  console.log(help);
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    printHelp();
    process.exit(0);
  }

  if (cmd === "--version" || cmd === "-v") {
    console.log(`prov-engine.js v${VERSION}`);
    process.exit(0);
  }

  switch (cmd) {
    case "describe":
      cmdDescribe();
      break;

    case "digest":
      if (!args[1]) die("digest requires <input.json>");
      cmdDigest(args[1]);
      break;

    case "wrap":
      if (!args[1]) die("wrap requires <payload.json>");
      cmdWrap(args[1]);
      break;

    case "verify-digest":
      if (!args[1]) die("verify-digest requires <input.json>");
      cmdVerifyDigest(args[1]);
      break;

    case "check-vector":
      if (!args[1]) die("check-vector requires <vector-dir>");
      cmdCheckVector(args[1]);
      break;

    default:
      die(`Unknown command: ${cmd}\nRun 'node prov-engine.js help' for usage.`);
  }
}

main();

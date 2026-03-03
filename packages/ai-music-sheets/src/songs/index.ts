// ─── ai-music-sheets: Song Loader ───────────────────────────────────────────
//
// Imports all songs and registers them with the global SongRegistry.
// Import this file once at startup to populate the registry.
//
// Adding a new song:
//   1. Create src/songs/<genre>/<slug>.ts exporting a SongEntry
//   2. Import + add to the `allSongs` array below
//   3. The registry validates on register — bad data won't slip through
// ─────────────────────────────────────────────────────────────────────────────

import { registerSongs } from "../registry/index.js";
import type { SongEntry } from "../types.js";

// ─── Classical ──────────────────────────────────────────────────────────────
import { moonlightSonataMvt1 } from "./classical/moonlight-sonata-mvt1.js";

// ─── Jazz ───────────────────────────────────────────────────────────────────
import { autumnLeaves } from "./jazz/autumn-leaves.js";

// ─── Pop ────────────────────────────────────────────────────────────────────
import { letItBe } from "./pop/let-it-be.js";

// ─── Blues ───────────────────────────────────────────────────────────────────
import { basic12BarBlues } from "./blues/basic-12-bar-blues.js";

// ─── Rock ───────────────────────────────────────────────────────────────────
import { dreamOn } from "./rock/dream-on.js";

// ─── R&B ────────────────────────────────────────────────────────────────────
import { aintNoSunshine } from "./rnb/aint-no-sunshine.js";

// ─── Latin ──────────────────────────────────────────────────────────────────
import { bossaNovaBasic } from "./latin/bossa-nova-basic.js";

// ─── Film / TV ──────────────────────────────────────────────────────────────
import { theEntertainer } from "./film/the-entertainer.js";

// ─── Ragtime ────────────────────────────────────────────────────────────────
import { mapleLeafRag } from "./ragtime/maple-leaf-rag.js";

// ─── New Age ────────────────────────────────────────────────────────────────
import { riverFlowsInYou } from "./new-age/river-flows-in-you.js";

// ─── Master list ────────────────────────────────────────────────────────────

export const allSongs: SongEntry[] = [
  moonlightSonataMvt1,
  autumnLeaves,
  letItBe,
  basic12BarBlues,
  dreamOn,
  aintNoSunshine,
  bossaNovaBasic,
  theEntertainer,
  mapleLeafRag,
  riverFlowsInYou,
];

// Auto-register on import
registerSongs(allSongs);

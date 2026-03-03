// CLI entry point for `pnpm registry:validate`
// Imports all songs (which self-register) then validates the registry.

import "../songs/index.js";
import { validateRegistry } from "./index.js";

validateRegistry();

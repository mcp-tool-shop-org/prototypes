#!/usr/bin/env node
/**
 * Post-build script to add shebang and make CLI executable
 * 
 * TypeScript doesn't preserve shebangs, so we add it after compilation.
 */

import { readFileSync, writeFileSync, chmodSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distIndexPath = join(__dirname, '..', 'dist', 'index.js');

try {
  // Read the compiled file
  let content = readFileSync(distIndexPath, 'utf-8');

  // Add shebang if not present
  if (!content.startsWith('#!/usr/bin/env node')) {
    content = '#!/usr/bin/env node\n' + content;
    writeFileSync(distIndexPath, content, 'utf-8');
    console.log('✓ Added shebang to dist/index.js');
  } else {
    console.log('✓ Shebang already present in dist/index.js');
  }

  // Make executable (755 permissions)
  chmodSync(distIndexPath, 0o755);
  console.log('✓ Made dist/index.js executable');

} catch (err) {
  console.error('Error adding shebang:', err);
  process.exit(1);
}

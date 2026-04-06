import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '..', 'dist', 'index.js');
const shebang = '#!/usr/bin/env node\n';

try {
  if (!fs.existsSync(distPath)) {
    console.error(`Error: ${distPath} does not exist. Run 'npm run build' first.`);
    process.exit(1);
  }

  let content = fs.readFileSync(distPath, 'utf8');

  // Only add shebang if it doesn't exist
  if (!content.startsWith('#!')) {
    content = shebang + content;
    fs.writeFileSync(distPath, content, 'utf8');
    console.log('✓ Added shebang to dist/index.js');
  }

  // Make executable on Unix-like systems
  if (process.platform !== 'win32') {
    fs.chmodSync(distPath, '755');
    console.log('✓ Made dist/index.js executable');
  }
} catch (error) {
  console.error('Error adding shebang:', error);
  process.exit(1);
}

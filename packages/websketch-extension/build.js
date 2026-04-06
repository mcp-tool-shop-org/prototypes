import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, writeFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');
const srcDir = join(__dirname, 'src');
const staticDir = join(__dirname, 'src', 'static');

// Required assets for a functional extension
const REQUIRED_ASSETS = {
  icons: ['icon16.png', 'icon48.png', 'icon128.png'],
  html: ['popup.html', 'options.html'],
};

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Validate required assets exist
function validateAssets() {
  const missing = [];

  // Check icons
  const iconsDir = join(staticDir, 'icons');
  if (!existsSync(iconsDir)) {
    missing.push(`Directory: ${iconsDir}`);
  } else {
    for (const icon of REQUIRED_ASSETS.icons) {
      const iconPath = join(iconsDir, icon);
      if (!existsSync(iconPath)) {
        missing.push(`Icon: ${icon}`);
      }
    }
  }

  // Check HTML files
  for (const html of REQUIRED_ASSETS.html) {
    const htmlPath = join(staticDir, html);
    if (!existsSync(htmlPath)) {
      missing.push(`HTML: ${html}`);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required assets:');
    missing.forEach((asset) => console.error(`  - ${asset}`));
    console.error('\nCreate these files in src/static/ or run with --allow-missing for development.');
    if (!process.argv.includes('--allow-missing')) {
      process.exit(1);
    }
  }
}

// Copy static assets
function copyStaticAssets() {
  console.log('📁 Copying static assets...');

  // Copy icons
  const iconsDir = join(staticDir, 'icons');
  const distIconsDir = join(distDir, 'icons');
  
  if (existsSync(iconsDir)) {
    if (!existsSync(distIconsDir)) {
      mkdirSync(distIconsDir, { recursive: true });
    }

    const icons = readdirSync(iconsDir).filter((f) => f.endsWith('.png'));
    icons.forEach((icon) => {
      copyFileSync(join(iconsDir, icon), join(distIconsDir, icon));
      console.log(`  ✓ ${icon}`);
    });
  }

  // Copy HTML files
  REQUIRED_ASSETS.html.forEach((html) => {
    const srcPath = join(staticDir, html);
    if (existsSync(srcPath)) {
      copyFileSync(srcPath, join(distDir, html));
      console.log(`  ✓ ${html}`);
    }
  });
}

// Generate manifest.json
function generateManifest() {
  console.log('📝 Generating manifest.json...');

  const manifest = {
    manifest_version: 3,
    name: 'WebSketch Capture',
    version: '0.1.0',
    description: 'Capture web pages as WebSketch IR',
    permissions: ['activeTab', 'scripting', 'storage'],
    action: {
      default_popup: 'popup.html',
      default_icon: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png',
      },
    },
    options_page: 'options.html',
    icons: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content.js'],
        run_at: 'document_idle',
      },
    ],
  };

  writeFileSync(join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('  ✓ manifest.json');
}

// Build configuration
const buildConfig = {
  entryPoints: [join(srcDir, 'content.ts'), join(srcDir, 'popup.ts'), join(srcDir, 'options.ts')],
  bundle: true,
  outdir: distDir,
  format: 'iife',
  target: 'chrome100',
  platform: 'browser',
  minify: !process.argv.includes('--watch'),
  sourcemap: process.argv.includes('--watch'),
  logLevel: 'info',
  // websketch-ir's text.js uses dynamic import("crypto") for fingerprinting.
  // The extension doesn't use fingerprinting — mark crypto as external so
  // esbuild doesn't fail trying to bundle a Node built-in for the browser.
  external: ['crypto'],
};

// Main build function
async function build() {
  console.log('🔨 Building websketch-extension...\n');

  try {
    // Validate assets before building
    validateAssets();

    // Copy static assets
    copyStaticAssets();

    // Generate manifest
    generateManifest();

    // Build TypeScript
    console.log('⚡ Building TypeScript...');
    if (process.argv.includes('--watch')) {
      const context = await esbuild.context(buildConfig);
      await context.watch();
      console.log('👀 Watching for changes...');
    } else {
      await esbuild.build(buildConfig);
      console.log('✅ Build complete!\n');
      console.log('📦 Load unpacked extension from: dist/');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

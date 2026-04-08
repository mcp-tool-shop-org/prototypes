import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'ToolShopStudio',
  description: 'Six MCP tools + live Registry (FFmpeg, Pandoc, FreeCAD, GDAL, OpenSCAD, Blender) — schema-first, sandboxed, observable.',
  logoBadge: 'TS',
  brandName: 'ToolShopStudio',
  repoUrl: 'https://github.com/mcp-tool-shop-org/ToolShopStudio',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/toolshopstudio',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: '6 tools · 32 presets · 15 formats',
    headline: 'ToolShopStudio',
    headlineAccent: 'one install for ordinary creators.',
    description: 'FFmpeg, Pandoc, FreeCAD, GDAL, OpenSCAD, and Blender — wired for MCP with schema-first safety, sandboxed execution, and premium-to-guaranteed fallback.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'npm install @mcptoolshop/toolshopstudio' },
      { label: 'Transcode', code: 'transcodeForYouTube({ preset: "yt-1080p-h264" })' },
      { label: 'Registry', code: 'registry.searchByOutputFormat("STL")' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'tools',
      title: 'Six Tools, One Surface',
      subtitle: 'Every tool shares the same frozen contract: schema-first, sandboxed, observable, context DI, zero raw args.',
      features: [
        { title: 'FFmpeg YouTube MCP', desc: 'YouTube-safe presets with guaranteed + premium tiers, closed-GOP locks, and dual thumbnails.' },
        { title: 'Pandoc MCP', desc: 'Zero-flag document conversion: blog, academic PDF, ebook, slides, newsletter.' },
        { title: 'FreeCAD MCP', desc: 'Safe 3D CAD export to STL, STEP, GLB, 3MF, OBJ — headless, no user code.' },
      ],
    },
    {
      kind: 'features',
      id: 'tools-2',
      title: '',
      features: [
        { title: 'GDAL MCP', desc: 'Geospatial transforms: reproject rasters, convert vectors, clip regions — the FFmpeg of GIS.' },
        { title: 'OpenSCAD MCP', desc: 'Pure-text parametric CAD: STL, OBJ, 3MF, PNG preview, DXF — text in, mesh out.' },
        { title: 'Blender MCP', desc: 'Headless 3D rendering: PNG preview, GLB export, video, STL mesh, Cycles — no GUI needed.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      subtitle: 'Install once, use six tools.',
      cards: [
        { title: 'Install', code: 'npm install @mcptoolshop/toolshopstudio' },
        { title: 'Transcode video', code: `import { transcodeForYouTube } from "@mcptoolshop/toolshopstudio";

const video = await transcodeForYouTube({
  inputPath: "input.mp4",
  outputPath: "output.mp4",
  preset: "yt-1080p-h264"
}, context);` },
        { title: 'Convert documents', code: `import { pandoc } from "@mcptoolshop/toolshopstudio";

const doc = await pandoc.convertDocument({
  inputPath: "thesis.md",
  outputPath: "thesis.pdf",
  preset: "academic-pdf"
}, context);` },
        { title: 'Query the registry', code: `import { registry } from "@mcptoolshop/toolshopstudio";

registry.searchByPreset("academic-pdf");
registry.searchByOutputFormat("STL");
registry.getAllPremiumPresets();` },
      ],
    },
    {
      kind: 'data-table',
      id: 'presets',
      title: 'Preset Overview',
      subtitle: '32 presets across 6 tools — guaranteed tiers always work, premium tiers auto-fallback.',
      columns: ['Tool', 'Presets', 'Formats', 'Tier'],
      rows: [
        ['FFmpeg', '7', 'MP4 (H.264, H.265, HDR)', 'Guaranteed + Premium'],
        ['Pandoc', '5', 'HTML, PDF, EPUB, Reveal.js', 'Guaranteed + Premium'],
        ['FreeCAD', '5', 'STL, STEP, GLB, 3MF, OBJ', 'Guaranteed + Premium'],
        ['GDAL', '5', 'TIFF, GeoJSON, PNG, SHP', 'Guaranteed + Premium'],
        ['OpenSCAD', '5', 'STL, OBJ, 3MF, PNG, DXF', 'Guaranteed + Premium'],
        ['Blender', '5', 'PNG, GLB, MP4, STL', 'Guaranteed + Premium'],
      ],
    },
    {
      kind: 'features',
      id: 'architecture',
      title: 'Architecture',
      subtitle: 'Shared contract across all six tools.',
      features: [
        { title: 'Schema-first', desc: 'Zod schemas for every input/output. Fully type-safe, zero raw CLI args.' },
        { title: 'Context DI', desc: 'All side effects injected via context objects. 100% mockable, 318 tests passing.' },
        { title: 'Observable', desc: 'Typed notifications (progress, warnings, ready) at every pipeline stage. AbortController propagated throughout.' },
      ],
    },
    {
      kind: 'api',
      id: 'registry',
      title: 'Live Registry',
      subtitle: 'Self-documenting, MCP-ready. Query tools, presets, and output formats at runtime.',
      apis: [
        { signature: 'registry.findTool(<span style="color:var(--color-accent)">"openscad"</span>)', description: 'Full ToolDefinition with presets, patterns, and output formats.' },
        { signature: 'registry.searchByPreset(<span style="color:var(--color-accent)">"academic-pdf"</span>)', description: 'Find which tool owns a preset. Returns tool ID, preset config, and fallback chain.' },
        { signature: 'registry.searchByOutputFormat(<span style="color:var(--color-accent)">"STL"</span>)', description: 'All presets that produce a given format — across FreeCAD, OpenSCAD, and Blender.' },
        { signature: 'registry.getAllPremiumPresets()', description: '9 premium presets with their guaranteed fallback chains.' },
      ],
    },
  ],
};

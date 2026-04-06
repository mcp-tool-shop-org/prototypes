import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Sonic-Core',
  description: 'Audio control plane for TypeScript — playback, synthesis, routing, and device management via a native runtime sidecar',
  logoBadge: 'SC',
  brandName: 'Sonic-Core',
  repoUrl: 'https://github.com/mcp-tool-shop-org/sonic-core',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'TypeScript audio engine',
    headline: 'Audio control plane',
    headlineAccent: 'for TypeScript.',
    description: 'Playback, synthesis, routing, and device management. sonic-core owns the control plane while a NativeAOT sidecar handles the actual audio through OpenAL Soft.',
    primaryCta: { href: '#quickstart', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'git clone https://github.com/mcp-tool-shop-org/sonic-core\ncd sonic-core && npm install && npm run build' },
      { label: 'Play', code: "import { SonicEngine } from '@sonic-core/engine';\nconst engine = new SonicEngine(backend);\nawait engine.play('file:///path/to/sound.wav',\n  { loop: true, initial_volume: 0.7 });" },
      { label: 'MCP', code: 'SONIC_RUNTIME_PATH=./runtime \\\n  npx @sonic-core/service' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything you need to build audio-powered applications.',
      features: [
        {
          title: 'SidecarBackend',
          desc: 'Spawns and manages the native runtime binary. Auto-restart on crash, protocol negotiation, consecutive timeout detection, and handle mapping.',
        },
        {
          title: 'Per-Playback Device Routing',
          desc: 'Route individual playbacks to specific audio devices. Enumerate available outputs and switch on the fly.',
        },
        {
          title: 'Gain, Pan, Fade',
          desc: 'Per-playback volume, stereo panning, and timed fades. All control happens in TypeScript — the runtime executes.',
        },
        {
          title: '13 MCP Tools',
          desc: 'FastMCP server exposes play, pause, resume, stop, seek, volume, pan, spatial, devices, leases, and more over stdio.',
        },
        {
          title: 'Strict Protocol Boundary',
          desc: 'ndjson-stdio-v1 wire format with versioned handshake. TypeScript never touches audio buffers — the runtime owns the DSP.',
        },
        {
          title: 'Event System',
          desc: 'playback_ended, device changes, and runtime lifecycle events flow from runtime to engine via structured event envelopes.',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick Start',
      cards: [
        {
          title: 'Build',
          code: '# Clone and build\ngit clone https://github.com/mcp-tool-shop-org/sonic-core\ncd sonic-core\nnpm install\nnpm run build\nnpm test',
        },
        {
          title: 'Use the Engine',
          code: "import { SonicEngine, SidecarBackend } from '@sonic-core/engine';\n\nconst sidecar = new SidecarBackend({\n  executablePath: process.env.SONIC_RUNTIME_PATH,\n});\nawait sidecar.start();\n\nconst engine = new SonicEngine(sidecar);\nconst { playbackId } = await engine.play(source, {\n  loop: true,\n  initial_volume: 0.5,\n});",
        },
        {
          title: 'MCP Service',
          code: '# Start the MCP service (stdio mode)\nSONIC_RUNTIME_PATH=./sonic-runtime \\\n  npx @sonic-core/service\n\n# Available tools:\n# play, pause, resume, stop, seek,\n# set_volume, set_pan, get_devices,\n# set_output_device, renew_lease,\n# get_playback_state, replace_playback,\n# set_spatial_position',
        },
      ],
    },
  ],
};

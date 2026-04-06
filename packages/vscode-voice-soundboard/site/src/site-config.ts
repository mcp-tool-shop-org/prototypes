import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Voice Soundboard — VS Code Extension',
  description: 'TTS synthesis with 48 voices, presets, and multi-speaker dialogue — powered by MCP Voice Soundboard',
  logoBadge: 'VS',
  brandName: 'Voice Soundboard',
  repoUrl: 'https://github.com/mcp-tool-shop-org/vscode-voice-soundboard',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'VS Code Extension',
    headline: 'Give your editor a voice.',
    headlineAccent: '48 of them.',
    description: 'TTS synthesis with 48 voices across 9 languages, voice presets, and multi-speaker dialogue — all in a VS Code sidebar. Free local backend via Kokoro, or plug in OpenAI/ElevenLabs.',
    primaryCta: { href: 'https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.vscode-voice-soundboard', label: 'Install from Marketplace' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'ext install mcp-tool-shop.vscode-voice-soundboard' },
      { label: 'Speak selection', code: 'Ctrl+Shift+S  →  speaks highlighted text' },
      { label: 'Dialogue export', code: 'Dialogue tab  →  Export VTT\n# → .vtt file with timecodes per speaker' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything you need to add voice to your workflow.',
      features: [
        {
          title: '48 Voices, 9 Languages',
          desc: 'English, Japanese, Mandarin, Spanish, French, Hindi, Italian, Portuguese. Pick from a visual grid, preview live, pin your favourites.',
        },
        {
          title: 'Multi-Speaker Dialogue',
          desc: 'Write scripts in the Dialogue tab, assign a different voice per line, play the whole scene. Export as WebVTT with auto-calculated timecodes.',
        },
        {
          title: 'Free Local Backend',
          desc: 'Runs on Kokoro TTS via Python — zero API cost, fully offline. Swap to OpenAI, ElevenLabs, or Azure with one setting change.',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Getting Started',
      cards: [
        {
          title: '1. Install',
          code: 'ext install mcp-tool-shop.vscode-voice-soundboard\n\n# or search "Voice Soundboard" in the Extensions panel',
        },
        {
          title: '2. Open the sidebar',
          code: '# Click the microphone icon in the Activity Bar\n# — or —\nCtrl+Shift+P → Voice Soundboard: Toggle Panel',
        },
        {
          title: '3. Speak any selection',
          code: '# Highlight text in any editor, then:\nCtrl+Shift+S\n\n# Works in code, markdown, JSON — anywhere',
        },
        {
          title: '4. Write a dialogue script',
          code: '# In the Dialogue tab:\nSpeaker A [bm_george]:  Hello, how are you?\nSpeaker B [af_jessica]: Great, thanks for asking!\n\n# Click Play All, then Export VTT',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'commands',
      title: 'Commands',
      subtitle: 'All commands available via the Command Palette (Ctrl+Shift+P / Cmd+Shift+P).',
      columns: ['Command', 'Shortcut', 'Description'],
      rows: [
        ['Voice Soundboard: Speak Text…', '—', 'Open input box and speak entered text'],
        ['Voice Soundboard: Speak Selection', 'Ctrl+Shift+S', 'Speak the current editor selection'],
        ['Voice Soundboard: Stop Speaking', '—', 'Stop current audio playback immediately'],
        ['Voice Soundboard: Change Voice', '—', 'Quick-pick from all 48 voices'],
        ['Voice Soundboard: Toggle Panel', '—', 'Show or hide the sidebar panel'],
        ['Voice Soundboard: Export Dialogue as WebVTT', '—', 'Synthesise dialogue and save as .vtt'],
      ],
    },
    {
      kind: 'api',
      id: 'settings',
      title: 'Settings',
      subtitle: 'Configure via VS Code settings (voiceSoundboard.*).',
      apis: [
        {
          signature: 'voiceSoundboard.defaultVoice: string',
          description: 'Default voice ID used when the extension activates (default: "bm_george").',
        },
        {
          signature: 'voiceSoundboard.speed: number',
          description: 'Speech speed multiplier from 0.5 (slow) to 2.0 (fast) (default: 1.0).',
        },
        {
          signature: 'voiceSoundboard.backend: "python" | "http" | "mock"',
          description: '"python" = free local Kokoro TTS. "http" = cloud (OpenAI/ElevenLabs/Azure). "mock" = silent, for testing.',
        },
        {
          signature: 'voiceSoundboard.autoStart: boolean',
          description: 'Auto-start the MCP server when the extension activates (default: true).',
        },
        {
          signature: 'voiceSoundboard.format: "wav" | "mp3" | "ogg"',
          description: 'Audio output format (default: "wav").',
        },
        {
          signature: 'voiceSoundboard.openaiApiKey: string',
          description: 'API key for the http backend (OpenAI, ElevenLabs, Azure). Leave empty for local Python/Kokoro.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'scorecard',
      title: 'Quality scorecard',
      subtitle: 'Ship Gate audit — 45/50.',
      columns: ['Category', 'Score', 'Notes'],
      rows: [
        ['A. Security', '9/10', 'SECURITY.md, local-only default, API keys in VS Code encrypted storage'],
        ['B. Error Handling', '8/10', 'Backend auto-start, graceful fallback, status messages'],
        ['C. Operator Docs', '9/10', 'README, CHANGELOG, landing page, settings docs'],
        ['D. Shipping Hygiene', '9/10', 'CI + tests (102), VS Code Marketplace, Codecov coverage'],
        ['E. Identity', '10/10', 'Logo, translations, landing page, Marketplace listing'],
      ],
    },
  ],
};

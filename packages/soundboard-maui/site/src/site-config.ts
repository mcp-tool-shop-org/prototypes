import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Soundboard MAUI',
  description: 'Cross-platform .NET MAUI desktop client for the Sound Board voice engine. SDK-first, real-time streaming, engine-agnostic.',
  logoBadge: 'SM',
  brandName: 'Soundboard MAUI',
  repoUrl: 'https://github.com/mcp-tool-shop-org/soundboard-maui',
  npmUrl: 'https://www.nuget.org/packages/Soundboard.Client',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Open source',
    headline: 'Soundboard MAUI',
    headlineAccent: 'SDK-first. Stream speech, not files.',
    description: 'Cross-platform .NET MAUI desktop client and standalone SDK for the Sound Board voice engine. Real-time audio streaming over WebSocket, engine-agnostic design.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'dotnet add package Soundboard.Client' },
      { label: 'Speak', code: 'await client.SpeakAsync(request, progress);' },
      { label: 'Stream', code: 'new Progress<AudioChunk>(c => Play(c.PcmData))' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Core Features',
      subtitle: 'The SDK is the product. The MAUI app is a reference client.',
      features: [
        { title: 'SDK-First Design', desc: 'Soundboard.Client is a standalone .NET 8+ library with zero UI dependencies. Use it in console apps, WPF, ASP.NET, or MAUI.' },
        { title: 'Real-Time Streaming', desc: 'Audio arrives chunk-by-chunk over WebSocket via IProgress<AudioChunk>. No waiting for full synthesis.' },
        { title: 'Engine-Agnostic', desc: 'The SDK speaks a documented API contract. Swap engines without changing your code.' },
        { title: 'Multi-Target', desc: 'Ships for net8.0, net9.0, and net10.0. Reference it from any modern .NET project.' },
        { title: 'Structured Logging', desc: 'Built-in ILogger support for diagnostics without pulling in a logging framework.' },
        { title: 'Reference Clients', desc: 'A MAUI desktop app and CLI tool show real integration patterns you can copy.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        {
          title: 'Install & speak',
          code: 'dotnet add package Soundboard.Client\n\n// Speak in five lines\nvar client = new SoundboardClient();\nvar presets = await client.GetPresetsAsync();\nvar voices = await client.GetVoicesAsync();\n\nawait client.SpeakAsync(\n    new SpeakRequest("Hello!", presets[0], voices[0]),\n    new Progress<AudioChunk>(c => Play(c.PcmData)));',
        },
        {
          title: 'Configuration',
          code: 'var client = new SoundboardClient(\n    new SoundboardClientOptions\n    {\n        BaseUrl = "http://my-engine:9000",\n        HttpTimeout = TimeSpan.FromSeconds(15),\n        WebSocketConnectTimeout = TimeSpan.FromSeconds(10),\n        WebSocketReceiveTimeout = TimeSpan.FromSeconds(60)\n    });',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'sdk-api',
      title: 'SDK Surface',
      columns: ['Method', 'Description'],
      rows: [
        ['GetHealthAsync()', 'Engine health check — version info and readiness status'],
        ['GetPresetsAsync()', 'List available preset identifiers (narrator, conversational, etc.)'],
        ['GetVoicesAsync()', 'List available voice identifiers'],
        ['SpeakAsync(request, progress)', 'Stream synthesized speech via IProgress<AudioChunk>'],
        ['StopAsync()', 'Send a stop command to the engine'],
      ],
    },
    {
      kind: 'data-table',
      id: 'packages',
      title: 'NuGet Packages',
      columns: ['Package', 'Description'],
      rows: [
        ['Soundboard.Client', 'Front-door SDK — streaming TTS client for any compatible engine. Pure C#, zero UI deps.'],
        ['Soundboard.Maui.Audio', 'NAudio-based PCM16 streaming playback adapter for Windows. Buffering, thread-safe, state tracking.'],
      ],
    },
    {
      kind: 'features',
      id: 'architecture',
      title: 'Architecture',
      subtitle: 'Control plane over HTTP. Data plane over WebSocket. Engine lives in a separate repository.',
      features: [
        { title: 'Soundboard.Client', desc: 'The product — pure C# SDK, net8.0+. Handles connection lifecycle, JSON framing, base64 decoding, graceful WebSocket close.' },
        { title: 'Soundboard.Maui.Audio', desc: 'NAudio PCM16 playback adapter for Windows. Provides IAudioPlayer with buffering and thread-safe start/stop/flush.' },
        { title: 'Reference Clients', desc: 'MAUI desktop app (net10.0) and console CLI (net8.0) demonstrate real SDK integration patterns.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'docs',
      title: 'Documentation',
      columns: ['Document', 'Purpose'],
      rows: [
        ['getting-started-sdk.md', 'SDK integration guide'],
        ['streaming-model.md', 'How audio streaming works'],
        ['api-contract.md', 'Engine-SDK wire protocol'],
        ['api.md', 'SDK API reference (v1.0 stability)'],
        ['error-model.md', 'Failure modes and handling'],
        ['compatibility.md', 'SDK-engine compatibility matrix'],
      ],
    },
  ],
};

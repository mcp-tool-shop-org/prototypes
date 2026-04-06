---
title: MCP App Builder
---

<style>
  :root {
    --bg: #0d1117;
    --surface: #161b22;
    --border: #30363d;
    --text: #e6edf3;
    --text-muted: #8b949e;
    --accent: #f0883e;
    --accent-hover: #f4a261;
    --green: #3fb950;
    --blue: #58a6ff;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    line-height: 1.6;
  }
  a { color: var(--blue); text-decoration: none; }
  a:hover { color: var(--accent-hover); text-decoration: underline; }
  .hero {
    text-align: center;
    padding: 4rem 1.5rem 3rem;
    max-width: 720px;
    margin: 0 auto;
  }
  .hero img { width: 80px; border-radius: 16px; margin-bottom: 1.5rem; }
  .hero h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; }
  .hero .tagline { font-size: 1.15rem; color: var(--text-muted); margin-bottom: 2rem; }
  .badges { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2rem; }
  .badges img { height: 22px; }
  .cta {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: var(--accent); color: #fff; padding: 0.65rem 1.5rem;
    border-radius: 6px; font-weight: 600; font-size: 0.95rem;
    transition: background 0.15s;
  }
  .cta:hover { background: var(--accent-hover); text-decoration: none; color: #fff; }
  .cta + .cta { margin-left: 0.75rem; }
  .grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem; max-width: 900px; margin: 0 auto 3rem; padding: 0 1.5rem;
  }
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 1.5rem;
  }
  .card h3 { font-size: 1rem; margin-bottom: 0.4rem; }
  .card p { font-size: 0.88rem; color: var(--text-muted); }
  .section { max-width: 720px; margin: 0 auto 3rem; padding: 0 1.5rem; }
  .section h2 { font-size: 1.4rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
  pre {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; padding: 1rem; overflow-x: auto;
    font-size: 0.85rem; line-height: 1.5;
  }
  code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; }
  table { width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-top: 0.5rem; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); }
  th { color: var(--text-muted); font-weight: 600; }
  .template-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem; }
  .template-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 1.25rem; text-align: center;
  }
  .template-card h4 { margin-bottom: 0.3rem; }
  .template-card p { font-size: 0.82rem; color: var(--text-muted); }
  footer {
    text-align: center; padding: 2rem 1.5rem;
    color: var(--text-muted); font-size: 0.8rem;
    border-top: 1px solid var(--border);
  }
  @media (max-width: 640px) {
    .template-grid { grid-template-columns: 1fr; }
  }
</style>

<div class="hero">
  <h1>MCP App Builder</h1>
  <p class="tagline">Build, test, and ship MCP servers with interactive UI components — from VS Code.</p>
  <div class="badges">
    <img src="https://img.shields.io/badge/MCP-1.0-green" alt="MCP 1.0" />
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT" />
  </div>
  <a class="cta" href="https://github.com/mcp-tool-shop-org/mcp-app-builder">View on GitHub</a>
</div>

<div class="grid">
  <div class="card">
    <h3>Scaffolding</h3>
    <p>Create MCP servers with guided setup. Pick a template, name it, and get a working project in seconds.</p>
  </div>
  <div class="card">
    <h3>Schema Validation</h3>
    <p>Real-time validation of mcp.json and mcp-tools.json with IntelliSense and diagnostics.</p>
  </div>
  <div class="card">
    <h3>Type Generation</h3>
    <p>Generate strongly-typed TypeScript interfaces from your tool definitions. Type-safe handlers included.</p>
  </div>
  <div class="card">
    <h3>20+ UI Components</h3>
    <p>Tables, charts, forms, cards, wizards — compliant with the MCP Apps standard (January 2026).</p>
  </div>
  <div class="card">
    <h3>Test Harness</h3>
    <p>Auto-generated tests from tool definitions. Validate output types, content, and patterns.</p>
  </div>
  <div class="card">
    <h3>Auto-Validate on Save</h3>
    <p>Schemas validated automatically when you save mcp.json or mcp-tools.json. Zero friction.</p>
  </div>
</div>

<div class="section">
  <h2>Templates</h2>
  <div class="template-grid">
    <div class="template-card">
      <h4>Basic</h4>
      <p>Hello-world server.<br/>Single tool, minimal setup.</p>
    </div>
    <div class="template-card">
      <h4>With UI</h4>
      <p>Tables + charts.<br/>Interactive components ready.</p>
    </div>
    <div class="template-card">
      <h4>Full</h4>
      <p>Tools + resources + prompts.<br/>Complete MCP server.</p>
    </div>
  </div>
</div>

<div class="section">
  <h2>Quick Start</h2>
<pre><code># From VS Code Command Palette
Ctrl+Shift+P → "MCP: New Server"

# Keyboard shortcut
Ctrl+Alt+N  (Cmd+Alt+N on Mac)</code></pre>
</div>

<div class="section">
  <h2>Commands</h2>
  <table>
    <tr><th>Command</th><th>Shortcut</th><th>Description</th></tr>
    <tr><td>MCP: New Server</td><td>Ctrl+Alt+N</td><td>Create a new MCP server project</td></tr>
    <tr><td>MCP: Validate Schema</td><td>Ctrl+Alt+V</td><td>Validate current config file</td></tr>
    <tr><td>MCP: Generate Types</td><td>—</td><td>TypeScript from tool definitions</td></tr>
    <tr><td>MCP: Test Server</td><td>—</td><td>Run tests against MCP tools</td></tr>
    <tr><td>MCP: Open Dashboard</td><td>—</td><td>Visual command dashboard</td></tr>
  </table>
</div>

<footer>
  MIT &middot; <a href="https://github.com/mcp-tool-shop-org">mcp-tool-shop-org</a> &middot; <a href="https://modelcontextprotocol.io">MCP Spec</a>
</footer>

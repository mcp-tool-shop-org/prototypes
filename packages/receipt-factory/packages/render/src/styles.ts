/**
 * Embedded CSS for standalone HTML receipt pages.
 * Clean, readable, dark-mode friendly.
 */
export const RECEIPT_CSS = `
:root {
  --bg: #ffffff;
  --fg: #1a1a2e;
  --muted: #6b7280;
  --border: #e5e7eb;
  --accent: #2563eb;
  --code-bg: #f3f4f6;
  --success: #16a34a;
  --warn: #d97706;
  --table-stripe: #f9fafb;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a;
    --fg: #e2e8f0;
    --muted: #94a3b8;
    --border: #334155;
    --accent: #60a5fa;
    --code-bg: #1e293b;
    --success: #4ade80;
    --warn: #fbbf24;
    --table-stripe: #1e293b;
  }
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
  color: var(--fg);
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
h2 { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; }
h3 { font-size: 1rem; margin: 1rem 0 0.5rem; }

blockquote {
  border-left: 3px solid var(--accent);
  padding: 0.5rem 1rem;
  color: var(--muted);
  margin: 0.5rem 0 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

th, td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border: 1px solid var(--border);
}

th { background: var(--code-bg); font-weight: 600; }
tr:nth-child(even) { background: var(--table-stripe); }

code {
  background: var(--code-bg);
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
  font-size: 0.85em;
  font-family: "Fira Code", "Cascadia Code", monospace;
}

pre {
  background: var(--code-bg);
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.5rem 0;
}

pre code { background: none; padding: 0; }

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

ul, ol { padding-left: 1.5rem; margin: 0.5rem 0; }
li { margin: 0.25rem 0; }

details {
  margin-top: 1.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.75rem 1rem;
}

summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--muted);
}

summary:hover { color: var(--fg); }

.copy-btn {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 3px;
  cursor: pointer;
  color: var(--muted);
  margin-left: 0.5rem;
}

.copy-btn:hover { color: var(--fg); border-color: var(--accent); }

.receipt-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 0.8rem;
  text-align: center;
}
`.trim();

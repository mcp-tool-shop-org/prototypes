import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { scanCssVarFile, scanInlineStyles } from "../cssvar/scanner.js";

let tempDir: string;

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "cssvar-test-"));
});

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("scanCssVarFile", () => {
  it("skips :root variable definitions", async () => {
    const file = join(tempDir, "tokens.css");
    await writeFile(
      file,
      `:root {
  --bg-primary: #1a1a1e;
  --accent: #4a9eff;
  --text-muted: #68686e;
}
`
    );
    const styles = await scanCssVarFile(file);
    expect(styles).toHaveLength(0);
  });

  it("detects raw hex outside :root", async () => {
    const file = join(tempDir, "component.css");
    await writeFile(
      file,
      `:root {
  --bg-primary: #1a1a1e;
}

.panel {
  background-color: #ff5733;
  color: var(--text-primary);
}
`
    );
    const styles = await scanCssVarFile(file);
    expect(styles).toHaveLength(1);
    expect(styles[0].value).toBe("#ff5733");
    expect(styles[0].isRaw).toBe(true);
    expect(styles[0].line).toBe(6);
  });

  it("detects rgb() and rgba() bypasses", async () => {
    const file = join(tempDir, "rgb.css");
    await writeFile(
      file,
      `.card {
  background-color: rgba(255, 100, 50, 0.8);
  border-color: rgb(10, 20, 30);
  color: var(--text-primary);
}
`
    );
    const styles = await scanCssVarFile(file);
    expect(styles).toHaveLength(2);
    expect(styles[0].value).toContain("rgba");
    expect(styles[1].value).toContain("rgb");
  });

  it("detects hsl() bypasses", async () => {
    const file = join(tempDir, "hsl.css");
    await writeFile(
      file,
      `.item {
  color: hsl(200, 50%, 50%);
}
`
    );
    const styles = await scanCssVarFile(file);
    expect(styles).toHaveLength(1);
    expect(styles[0].value).toContain("hsl");
  });

  it("allows var(), transparent, currentColor, inherit", async () => {
    const file = join(tempDir, "clean.css");
    await writeFile(
      file,
      `.clean {
  color: var(--text-primary);
  background-color: transparent;
  border-color: currentColor;
  outline-color: inherit;
}
`
    );
    const styles = await scanCssVarFile(file);
    expect(styles).toHaveLength(0);
  });

  it("ignores non-color properties", async () => {
    const file = join(tempDir, "layout.css");
    await writeFile(
      file,
      `.box {
  width: 100px;
  height: 50px;
  padding: 16px;
  margin: 8px;
  display: flex;
}
`
    );
    const styles = await scanCssVarFile(file);
    expect(styles).toHaveLength(0);
  });

  it("skips standalone custom property definitions outside :root", async () => {
    const file = join(tempDir, "scoped-vars.css");
    await writeFile(
      file,
      `.dark-theme {
  --bg-primary: #0d1117;
  --text-primary: #c9d1d9;
}
`
    );
    const styles = await scanCssVarFile(file);
    expect(styles).toHaveLength(0);
  });
});

describe("scanInlineStyles", () => {
  it("detects hex colors in JSX style objects", async () => {
    const file = join(tempDir, "component.tsx");
    await writeFile(
      file,
      `export function Panel() {
  return (
    <div style={{ backgroundColor: "#ff5733", color: "#1a1a2e" }}>
      Hello
    </div>
  );
}
`
    );
    const styles = await scanInlineStyles(file);
    expect(styles.length).toBeGreaterThanOrEqual(2);
    const values = styles.map((s) => s.value);
    expect(values).toContain("#ff5733");
    expect(values).toContain("#1a1a2e");
  });

  it("detects hex in CSSProperties typed objects", async () => {
    const file = join(tempDir, "styles.ts");
    await writeFile(
      file,
      `const buttonBase: React.CSSProperties = {
  backgroundColor: "#222226",
  color: "#e8e8ec",
  borderColor: "transparent",
};
`
    );
    const styles = await scanInlineStyles(file);
    expect(styles.length).toBeGreaterThanOrEqual(2);
    expect(styles.some((s) => s.value === "#222226")).toBe(true);
    expect(styles.some((s) => s.value === "#e8e8ec")).toBe(true);
  });

  it("allows var() references in inline styles", async () => {
    const file = join(tempDir, "clean-component.tsx");
    await writeFile(
      file,
      `export function Clean() {
  return (
    <div style={{ backgroundColor: "var(--bg-panel)", color: "var(--text-primary)" }}>
      Hello
    </div>
  );
}
`
    );
    const styles = await scanInlineStyles(file);
    expect(styles).toHaveLength(0);
  });

  it("allows transparent and inherit", async () => {
    const file = join(tempDir, "allowed.tsx");
    await writeFile(
      file,
      `const style = {
  backgroundColor: "transparent",
  color: "inherit",
  borderColor: "currentColor",
};
`
    );
    const styles = await scanInlineStyles(file);
    expect(styles).toHaveLength(0);
  });

  it("detects rgb/rgba in inline styles", async () => {
    const file = join(tempDir, "rgb-inline.tsx");
    await writeFile(
      file,
      `const style = {
  backgroundColor: "rgba(255, 0, 0, 0.5)",
  color: "rgb(10, 20, 30)",
};
`
    );
    const styles = await scanInlineStyles(file);
    expect(styles).toHaveLength(2);
  });

  it("reports correct file, line, and snippet", async () => {
    const file = join(tempDir, "located.tsx");
    await writeFile(
      file,
      `// line 1
// line 2
const x = { color: "#abc123" };
`
    );
    const styles = await scanInlineStyles(file);
    expect(styles.length).toBeGreaterThanOrEqual(1);
    expect(styles[0].file).toBe(file);
    expect(styles[0].line).toBe(3);
    expect(styles[0].snippet).toContain("#abc123");
  });

  it("ignores non-color properties with hex-like values", async () => {
    const file = join(tempDir, "non-color.tsx");
    await writeFile(
      file,
      `const config = {
  width: "#something",
  apiKey: "#abc123",
  version: "1.0.0",
};
`
    );
    const styles = await scanInlineStyles(file);
    expect(styles).toHaveLength(0);
  });
});

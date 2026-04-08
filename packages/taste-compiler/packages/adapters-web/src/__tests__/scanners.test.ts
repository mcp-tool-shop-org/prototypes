import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { scanReactFile } from "../react/scanner.js";
import { scanTailwindFile } from "../tailwind/scanner.js";
import { scanCopyInFile } from "../copy/scanner.js";

// ---------------------------------------------------------------------------
// Temp directory for fixture files
// ---------------------------------------------------------------------------

const TEMP_DIR = join(tmpdir(), "taste-compiler-scanner-tests");

beforeEach(async () => {
  await mkdir(TEMP_DIR, { recursive: true });
});

afterAll(async () => {
  await rm(TEMP_DIR, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Helper: write a fixture file and return its path
// ---------------------------------------------------------------------------

async function writeFixture(name: string, content: string): Promise<string> {
  const filePath = join(TEMP_DIR, name);
  await writeFile(filePath, content, "utf-8");
  return filePath;
}

// ---------------------------------------------------------------------------
// scanReactFile
// ---------------------------------------------------------------------------

describe("scanReactFile", () => {
  it("extracts component imports with correct names, paths, line numbers", async () => {
    const filePath = await writeFixture(
      "imports.tsx",
      `import { Button, Card } from "@ui/components";
import Modal from "@ui/modal";
import { Input } from "@ui/forms";

export function Page() {
  return <div><Button /><Card /><Modal /><Input /></div>;
}`
    );

    const { components } = await scanReactFile(filePath);

    const names = components.map((c) => c.name);
    expect(names).toContain("Button");
    expect(names).toContain("Card");
    expect(names).toContain("Modal");
    expect(names).toContain("Input");

    const button = components.find((c) => c.name === "Button")!;
    expect(button.importPath).toBe("@ui/components");
    expect(button.line).toBe(1);
    expect(button.file).toBe(filePath);

    const modal = components.find((c) => c.name === "Modal")!;
    expect(modal.importPath).toBe("@ui/modal");
    expect(modal.line).toBe(2);
  });

  it("counts primary action buttons (variant=\"primary\")", async () => {
    const filePath = await writeFixture(
      "primary-actions.tsx",
      `import { Button } from "@ui/components";

export function Page() {
  return (
    <div>
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Submit</Button>
    </div>
  );
}`
    );

    const { screen } = await scanReactFile(filePath);
    expect(screen.primaryActionCount).toBe(2);
  });

  it("tracks JSX component usage", async () => {
    const filePath = await writeFixture(
      "jsx-usage.tsx",
      `import { Button, Card, Badge } from "@ui/components";

export function Page() {
  return (
    <Card>
      <Badge>New</Badge>
      <Button variant="secondary">Click</Button>
    </Card>
  );
}`
    );

    const { screen } = await scanReactFile(filePath);
    expect(screen.components).toContain("Card");
    expect(screen.components).toContain("Badge");
    expect(screen.components).toContain("Button");
    expect(screen.file).toBe(filePath);
  });

  it("handles file with no imports or components", async () => {
    const filePath = await writeFixture(
      "empty.tsx",
      `export function Page() {
  return <div>Hello world</div>;
}`
    );

    const { components, screen } = await scanReactFile(filePath);
    expect(components).toHaveLength(0);
    expect(screen.primaryActionCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// scanTailwindFile
// ---------------------------------------------------------------------------

describe("scanTailwindFile", () => {
  it("detects raw hex colors in Tailwind brackets (bg-[#ff5733])", async () => {
    const filePath = await writeFixture(
      "tailwind-hex.tsx",
      `export function Card() {
  return <div className="bg-[#ff5733] text-[#000]">Content</div>;
}`
    );

    const { styles } = await scanTailwindFile(filePath);
    const colors = styles.filter((s) => s.type === "color");
    expect(colors.length).toBe(2);
    expect(colors[0].value).toBe("#ff5733");
    expect(colors[0].isRaw).toBe(true);
    expect(colors[0].line).toBe(2);
    expect(colors[1].value).toBe("#000");
  });

  it("detects inline hex colors (color: #abc)", async () => {
    const filePath = await writeFixture(
      "inline-hex.tsx",
      `export function Card() {
  return (
    <div style="color: #abc123; background-color: #fff">Content</div>
  );
}`
    );

    const { styles } = await scanTailwindFile(filePath);
    const colors = styles.filter((s) => s.type === "color");
    expect(colors.length).toBe(2);
    expect(colors.some((c) => c.value === "#abc123")).toBe(true);
    expect(colors.some((c) => c.value === "#fff")).toBe(true);
  });

  it("detects raw spacing (p-[13px])", async () => {
    const filePath = await writeFixture(
      "raw-spacing.tsx",
      `export function Card() {
  return <div className="p-[13px] m-[7px] gap-[42px]">Content</div>;
}`
    );

    const { styles } = await scanTailwindFile(filePath);
    const spacing = styles.filter((s) => s.type === "spacing");
    expect(spacing.length).toBe(3);
    expect(spacing[0].value).toBe("13px");
    expect(spacing[1].value).toBe("7px");
    expect(spacing[2].value).toBe("42px");
    expect(spacing.every((s) => s.isRaw)).toBe(true);
  });

  it("detects grid-cols patterns for forbidden checks", async () => {
    const filePath = await writeFixture(
      "grid-cols.tsx",
      `export function Dashboard() {
  return <div className="grid grid-cols-6">Content</div>;
}`
    );

    const { classes } = await scanTailwindFile(filePath);
    expect(classes.length).toBe(1);
    expect(classes[0].className).toBe("grid-cols-6");
    expect(classes[0].line).toBe(2);
  });

  it("handles clean file with no violations", async () => {
    const filePath = await writeFixture(
      "clean.tsx",
      `export function Card() {
  return <div className="bg-primary text-white p-4 m-2">Content</div>;
}`
    );

    const { styles, classes } = await scanTailwindFile(filePath);
    expect(styles).toHaveLength(0);
    expect(classes).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// scanCopyInFile
// ---------------------------------------------------------------------------

describe("scanCopyInFile", () => {
  it("extracts user-facing prop values (label, title, placeholder)", async () => {
    const filePath = await writeFixture(
      "copy-props.tsx",
      `export function Form() {
  return (
    <div>
      <Input label="Enter your name" placeholder="Jane Doe" />
      <Button title="Submit your response">Go</Button>
    </div>
  );
}`
    );

    const copyBlocks = await scanCopyInFile(filePath);
    const texts = copyBlocks.map((b) => b.text);
    expect(texts).toContain("Enter your name");
    expect(texts).toContain("Jane Doe");
    expect(texts).toContain("Submit your response");
  });

  it("extracts JSX text content between tags", async () => {
    const filePath = await writeFixture(
      "copy-jsx.tsx",
      `export function Page() {
  return (
    <div>
      <h1>Welcome to our platform</h1>
      <p>Start your journey today with calm tools</p>
    </div>
  );
}`
    );

    const copyBlocks = await scanCopyInFile(filePath);
    const texts = copyBlocks.map((b) => b.text);
    expect(texts).toContain("Welcome to our platform");
    expect(texts).toContain("Start your journey today with calm tools");
  });

  it("skips comments and short text", async () => {
    const filePath = await writeFixture(
      "copy-skip.tsx",
      `export function Page() {
  return (
    <div>
      {/* This is a comment that should be skipped */}
      <span>OK</span>
      <p>This text is long enough to be captured</p>
    </div>
  );
}`
    );

    const copyBlocks = await scanCopyInFile(filePath);
    const texts = copyBlocks.map((b) => b.text);
    // "OK" is only 2 chars, should be skipped
    expect(texts).not.toContain("OK");
    // Comment content should be skipped
    expect(texts.some((t) => t.includes("comment that should be skipped"))).toBe(false);
    // Long enough text should be captured
    expect(texts).toContain("This text is long enough to be captured");
  });

  it("returns correct file and line numbers", async () => {
    const filePath = await writeFixture(
      "copy-lines.tsx",
      `export function Page() {
  return (
    <div>
      <h1>First heading text here</h1>
      <p>Second paragraph text here</p>
    </div>
  );
}`
    );

    const copyBlocks = await scanCopyInFile(filePath);
    expect(copyBlocks.length).toBeGreaterThanOrEqual(2);
    for (const block of copyBlocks) {
      expect(block.file).toBe(filePath);
      expect(block.line).toBeGreaterThan(0);
      expect(block.snippet).toBeTruthy();
    }
  });
});

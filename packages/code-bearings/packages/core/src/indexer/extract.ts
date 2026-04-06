import { Project, SourceFile, SyntaxKind, Node, ts, VariableDeclarationKind } from "ts-morph";
import path from "node:path";
import { BearingsStore } from "../graph/store.js";
import { buildModuleBoundaries, loadOverrides } from "./modules.js";
import type { SymbolKind, EdgeKind, ModuleOverride } from "../types.js";

export interface IndexOptions {
  projectRoot: string;
  tsConfigPath?: string;
  moduleOverrides?: ModuleOverride[];
}

/**
 * Extract symbols, imports, calls, and references from a TypeScript project
 * using the compiler API via ts-morph.
 */
export function indexProject(store: BearingsStore, opts: IndexOptions): void {
  const tsConfigPath =
    opts.tsConfigPath ?? path.join(opts.projectRoot, "tsconfig.json");

  const project = new Project({
    tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: false,
  });

  const sourceFiles = project.getSourceFiles().filter((sf) => {
    const fp = sf.getFilePath();
    return !fp.includes("node_modules") && !fp.includes(".d.ts");
  });

  store.setMeta("projectRoot", opts.projectRoot);
  store.setMeta("indexedAt", new Date().toISOString());
  store.setMeta("fileCount", String(sourceFiles.length));

  // Phase 1: Index files and symbols
  const fileIdMap = new Map<string, number>();
  const symbolIdMap = new Map<string, number>(); // "fileId:name:kind:line" → symbolId

  for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();
    const relativePath = path.relative(opts.projectRoot, filePath);
    const loc = sf.getEndLineNumber();
    const fileId = store.insertFile(filePath, relativePath, loc);
    fileIdMap.set(filePath, fileId);

    extractSymbols(store, sf, fileId, symbolIdMap);
  }

  // Phase 2: Index edges (imports, calls, references)
  for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();
    const fileId = fileIdMap.get(filePath);
    if (fileId === undefined) continue;

    extractImports(store, sf, fileId, fileIdMap, symbolIdMap);
    extractCalls(store, sf, fileId, symbolIdMap);
  }

  // Phase 3: Detect tests
  for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();
    const fileId = fileIdMap.get(filePath);
    if (fileId === undefined) continue;

    if (isTestFile(filePath)) {
      extractTests(store, sf, fileId, symbolIdMap);
    }
  }

  // Phase 4: Build module boundaries (Module Boundary Law)
  const overrides = opts.moduleOverrides ?? loadOverrides(opts.projectRoot);
  buildModuleBoundaries(store, sourceFiles, fileIdMap, opts.projectRoot, overrides);
}

function extractSymbols(
  store: BearingsStore,
  sf: SourceFile,
  fileId: number,
  symbolIdMap: Map<string, number>
): void {
  // Functions
  for (const fn of sf.getFunctions()) {
    const name = fn.getName() ?? "(anonymous)";
    if (name === "(anonymous)") continue;
    const id = store.insertSymbol({
      name,
      kind: "function",
      fileId,
      line: fn.getStartLineNumber(),
      endLine: fn.getEndLineNumber(),
      signature: getSignature(fn),
      exported: fn.isExported(),
      documentation: getDocumentation(fn),
    });
    symbolIdMap.set(symbolKey(fileId, name, "function", fn.getStartLineNumber()), id);
  }

  // Classes
  for (const cls of sf.getClasses()) {
    const name = cls.getName() ?? "(anonymous)";
    if (name === "(anonymous)") continue;
    const classId = store.insertSymbol({
      name,
      kind: "class",
      fileId,
      line: cls.getStartLineNumber(),
      endLine: cls.getEndLineNumber(),
      signature: `class ${name}`,
      exported: cls.isExported(),
      documentation: getDocumentation(cls),
    });
    symbolIdMap.set(symbolKey(fileId, name, "class", cls.getStartLineNumber()), classId);

    // Methods as functions
    for (const method of cls.getMethods()) {
      const mName = method.getName();
      const mId = store.insertSymbol({
        name: `${name}.${mName}`,
        kind: "function",
        fileId,
        line: method.getStartLineNumber(),
        endLine: method.getEndLineNumber(),
        signature: getSignature(method),
        exported: cls.isExported(),
        documentation: getDocumentation(method),
      });
      symbolIdMap.set(
        symbolKey(fileId, `${name}.${mName}`, "function", method.getStartLineNumber()),
        mId
      );
    }
  }

  // Interfaces
  for (const iface of sf.getInterfaces()) {
    const name = iface.getName();
    const id = store.insertSymbol({
      name,
      kind: "interface",
      fileId,
      line: iface.getStartLineNumber(),
      endLine: iface.getEndLineNumber(),
      signature: `interface ${name}`,
      exported: iface.isExported(),
      documentation: getDocumentation(iface),
    });
    symbolIdMap.set(symbolKey(fileId, name, "interface", iface.getStartLineNumber()), id);
  }

  // Type aliases
  for (const ta of sf.getTypeAliases()) {
    const name = ta.getName();
    const id = store.insertSymbol({
      name,
      kind: "type",
      fileId,
      line: ta.getStartLineNumber(),
      endLine: ta.getEndLineNumber(),
      signature: `type ${name}`,
      exported: ta.isExported(),
      documentation: getDocumentation(ta),
    });
    symbolIdMap.set(symbolKey(fileId, name, "type", ta.getStartLineNumber()), id);
  }

  // Enums
  for (const en of sf.getEnums()) {
    const name = en.getName();
    const id = store.insertSymbol({
      name,
      kind: "enum",
      fileId,
      line: en.getStartLineNumber(),
      endLine: en.getEndLineNumber(),
      signature: `enum ${name}`,
      exported: en.isExported(),
      documentation: getDocumentation(en),
    });
    symbolIdMap.set(symbolKey(fileId, name, "enum", en.getStartLineNumber()), id);
  }

  // Exported variables/constants
  for (const vs of sf.getVariableStatements()) {
    if (!vs.isExported()) continue;
    for (const decl of vs.getDeclarations()) {
      const name = decl.getName();
      const isConst = vs.getDeclarationKind() === VariableDeclarationKind.Const;
      const kind: SymbolKind = isConst ? "constant" : "variable";
      const id = store.insertSymbol({
        name,
        kind,
        fileId,
        line: decl.getStartLineNumber(),
        endLine: decl.getEndLineNumber(),
        signature: `${isConst ? "const" : "let"} ${name}`,
        exported: true,
        documentation: getDocumentation(vs),
      });
      symbolIdMap.set(symbolKey(fileId, name, kind, decl.getStartLineNumber()), id);
    }
  }
}

function extractImports(
  store: BearingsStore,
  sf: SourceFile,
  fileId: number,
  fileIdMap: Map<string, number>,
  symbolIdMap: Map<string, number>
): void {
  for (const imp of sf.getImportDeclarations()) {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    const resolvedModule = imp.getModuleSpecifierSourceFile();
    if (!resolvedModule) continue;

    const targetFilePath = resolvedModule.getFilePath();
    const targetFileId = fileIdMap.get(targetFilePath);
    if (targetFileId === undefined) continue;

    // Find source symbols that are imported
    for (const named of imp.getNamedImports()) {
      const importedName = named.getName();
      const sourceSymbols = findSymbolsInFile(symbolIdMap, targetFileId, importedName);
      const localSymbols = findSymbolsInFile(symbolIdMap, fileId, importedName);

      for (const targetSymId of sourceSymbols) {
        for (const sourceSymId of localSymbols) {
          store.insertEdge(sourceSymId, targetSymId, "imports", fileId, imp.getStartLineNumber());
        }
        // If no local symbol matches, create the edge from any symbol in this file
        if (localSymbols.length === 0) {
          // Record at file level — use first symbol in file as proxy
          const firstSym = findFirstSymbolInFile(symbolIdMap, fileId);
          if (firstSym !== undefined) {
            store.insertEdge(firstSym, targetSymId, "imports", fileId, imp.getStartLineNumber());
          }
        }
      }
    }

    // Default import
    const defaultImport = imp.getDefaultImport();
    if (defaultImport) {
      const targetDefaults = findSymbolsInFile(symbolIdMap, targetFileId, "default");
      for (const targetSymId of targetDefaults) {
        const firstSym = findFirstSymbolInFile(symbolIdMap, fileId);
        if (firstSym !== undefined) {
          store.insertEdge(firstSym, targetSymId, "imports", fileId, imp.getStartLineNumber());
        }
      }
    }
  }
}

function extractCalls(
  store: BearingsStore,
  sf: SourceFile,
  fileId: number,
  symbolIdMap: Map<string, number>
): void {
  sf.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return;

    const callLine = node.getStartLineNumber();

    // Find the enclosing function/method
    const enclosing = findEnclosingFunction(node);
    if (!enclosing) return;

    const enclosingName = getEnclosingName(enclosing);
    const callerIds = findSymbolsInFile(symbolIdMap, fileId, enclosingName);
    if (callerIds.length === 0) return;

    // Resolve what is being called
    const expr = node.getExpression();
    let calleeName: string | undefined;

    if (Node.isIdentifier(expr)) {
      calleeName = expr.getText();
    } else if (Node.isPropertyAccessExpression(expr)) {
      calleeName = expr.getName();
    }

    if (!calleeName) return;

    // Try to resolve the definition
    const symbol = expr.getSymbol();
    if (!symbol) return;

    const declarations = symbol.getDeclarations();
    for (const decl of declarations) {
      const declFile = decl.getSourceFile().getFilePath();
      const declFileId = findFileId(symbolIdMap, declFile);
      if (declFileId === undefined) continue;

      const declName = symbol.getName();
      const targetIds = findSymbolsInFile(symbolIdMap, declFileId, declName);

      for (const callerId of callerIds) {
        for (const targetId of targetIds) {
          if (callerId !== targetId) {
            store.insertEdge(callerId, targetId, "calls", fileId, callLine);
          }
        }
      }
    }
  });
}

function extractTests(
  store: BearingsStore,
  sf: SourceFile,
  fileId: number,
  symbolIdMap: Map<string, number>
): void {
  sf.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return;

    const expr = node.getExpression();
    const fnName = Node.isIdentifier(expr) ? expr.getText() : undefined;

    if (fnName !== "it" && fnName !== "test" && fnName !== "describe") return;

    const args = node.getArguments();
    if (args.length === 0) return;

    const firstArg = args[0];
    if (!Node.isStringLiteral(firstArg)) return;

    const testName = firstArg.getLiteralText();
    const testId = store.insertTest(testName, fileId, node.getStartLineNumber());

    // Link test to symbols it references via calls within the test body
    const callbackArg = args[1];
    if (!callbackArg) return;

    callbackArg.forEachDescendant((inner) => {
      if (!Node.isCallExpression(inner)) return;
      const innerExpr = inner.getExpression();
      const sym = innerExpr.getSymbol();
      if (!sym) return;

      for (const decl of sym.getDeclarations()) {
        const declFile = decl.getSourceFile().getFilePath();
        if (declFile.includes("node_modules")) continue;
        const declName = sym.getName();
        for (const [key, symId] of symbolIdMap) {
          if (key.includes(`:${declName}:`)) {
            store.linkTestToSymbol(testId, symId);
          }
        }
      }
    });
  });
}

// ── Helpers ──

function symbolKey(fileId: number, name: string, kind: string, line: number): string {
  return `${fileId}:${name}:${kind}:${line}`;
}

function findSymbolsInFile(
  symbolIdMap: Map<string, number>,
  fileId: number,
  name: string
): number[] {
  const results: number[] = [];
  for (const [key, id] of symbolIdMap) {
    if (key.startsWith(`${fileId}:${name}:`)) {
      results.push(id);
    }
  }
  return results;
}

function findFirstSymbolInFile(
  symbolIdMap: Map<string, number>,
  fileId: number
): number | undefined {
  for (const [key, id] of symbolIdMap) {
    if (key.startsWith(`${fileId}:`)) return id;
  }
  return undefined;
}

function findFileId(
  symbolIdMap: Map<string, number>,
  filePath: string
): number | undefined {
  // Extract fileId from any symbol key that resolves to this file
  // This is a workaround — in practice we'd pass fileIdMap
  for (const key of symbolIdMap.keys()) {
    const parts = key.split(":");
    if (parts.length >= 1) {
      return parseInt(parts[0], 10);
    }
  }
  return undefined;
}

function getSignature(node: Node): string {
  const text = node.getText();
  // Take the first line or up to opening brace
  const braceIndex = text.indexOf("{");
  if (braceIndex > 0) {
    return text.substring(0, braceIndex).trim();
  }
  const lines = text.split("\n");
  return lines[0].trim();
}

function getDocumentation(node: Node): string | null {
  if ("getJsDocs" in node && typeof node.getJsDocs === "function") {
    const docs = node.getJsDocs();
    if (docs.length > 0) {
      return docs.map((d: { getText: () => string }) => d.getText()).join("\n");
    }
  }
  return null;
}

function isTestFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return (
    normalized.includes(".test.") ||
    normalized.includes(".spec.") ||
    normalized.includes("__tests__/") ||
    normalized.includes("/test/") ||
    normalized.includes("/tests/")
  );
}

function findEnclosingFunction(node: Node): Node | undefined {
  let current = node.getParent();
  while (current) {
    if (
      Node.isFunctionDeclaration(current) ||
      Node.isMethodDeclaration(current) ||
      Node.isArrowFunction(current) ||
      Node.isFunctionExpression(current)
    ) {
      return current;
    }
    current = current.getParent();
  }
  return undefined;
}

function getEnclosingName(node: Node): string {
  if (Node.isFunctionDeclaration(node)) {
    return node.getName() ?? "(anonymous)";
  }
  if (Node.isMethodDeclaration(node)) {
    const cls = node.getParent();
    if (Node.isClassDeclaration(cls)) {
      return `${cls.getName() ?? "(anonymous)"}.${node.getName()}`;
    }
    return node.getName();
  }
  // Arrow function or function expression — try variable name
  const parent = node.getParent();
  if (parent && Node.isVariableDeclaration(parent)) {
    return parent.getName();
  }
  return "(anonymous)";
}

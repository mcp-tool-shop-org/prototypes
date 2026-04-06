import Database from "better-sqlite3";
import { SCHEMA_SQL } from "./schema.js";
import type {
  Confidence,
  FileRecord,
  SymbolRecord,
  SymbolKind,
  EdgeRecord,
  EdgeKind,
  TestRecord,
  ModuleRecord,
  ModuleDepRecord,
  ModuleMetrics,
} from "../types.js";

export class BearingsStore {
  readonly db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.exec(SCHEMA_SQL);
  }

  close(): void {
    this.db.close();
  }

  // ── Files ──

  insertFile(path: string, relativePath: string, linesOfCode: number): number {
    const stmt = this.db.prepare(
      `INSERT OR IGNORE INTO files (path, relative_path, lines_of_code) VALUES (?, ?, ?)`
    );
    stmt.run(path, relativePath, linesOfCode);
    const row = this.db
      .prepare(`SELECT id FROM files WHERE path = ?`)
      .get(path) as { id: number };
    return row.id;
  }

  getFile(id: number): FileRecord | undefined {
    const row = this.db.prepare(`SELECT * FROM files WHERE id = ?`).get(id) as
      | { id: number; path: string; relative_path: string; lines_of_code: number }
      | undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      path: row.path,
      relativePath: row.relative_path,
      linesOfCode: row.lines_of_code,
    };
  }

  getAllFiles(): FileRecord[] {
    const rows = this.db.prepare(`SELECT * FROM files`).all() as {
      id: number;
      path: string;
      relative_path: string;
      lines_of_code: number;
    }[];
    return rows.map((r) => ({
      id: r.id,
      path: r.path,
      relativePath: r.relative_path,
      linesOfCode: r.lines_of_code,
    }));
  }

  getFileByPath(filePath: string): FileRecord | undefined {
    // Normalize separators for cross-platform matching
    const normalized = filePath.replace(/\\/g, "/");
    const row = this.db
      .prepare(`SELECT * FROM files WHERE REPLACE(path, '\\', '/') = ? OR REPLACE(relative_path, '\\', '/') = ?`)
      .get(normalized, normalized) as {
      id: number;
      path: string;
      relative_path: string;
      lines_of_code: number;
    } | undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      path: row.path,
      relativePath: row.relative_path,
      linesOfCode: row.lines_of_code,
    };
  }

  // ── Symbols ──

  insertSymbol(s: Omit<SymbolRecord, "id">): number {
    const stmt = this.db.prepare(
      `INSERT OR IGNORE INTO symbols (name, kind, file_id, line, end_line, signature, exported, documentation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(
      s.name,
      s.kind,
      s.fileId,
      s.line,
      s.endLine,
      s.signature,
      s.exported ? 1 : 0,
      s.documentation
    );
    const row = this.db
      .prepare(
        `SELECT id FROM symbols WHERE file_id = ? AND name = ? AND kind = ? AND line = ?`
      )
      .get(s.fileId, s.name, s.kind, s.line) as { id: number };
    return row.id;
  }

  getSymbol(id: number): SymbolRecord | undefined {
    const row = this.db
      .prepare(`SELECT * FROM symbols WHERE id = ?`)
      .get(id) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return this.mapSymbolRow(row);
  }

  getSymbolsByFile(fileId: number): SymbolRecord[] {
    const rows = this.db
      .prepare(`SELECT * FROM symbols WHERE file_id = ?`)
      .all(fileId) as Record<string, unknown>[];
    return rows.map((r) => this.mapSymbolRow(r));
  }

  getExportedSymbolsByFile(fileId: number): SymbolRecord[] {
    const rows = this.db
      .prepare(`SELECT * FROM symbols WHERE file_id = ? AND exported = 1`)
      .all(fileId) as Record<string, unknown>[];
    return rows.map((r) => this.mapSymbolRow(r));
  }

  findSymbolByName(name: string): SymbolRecord[] {
    const rows = this.db
      .prepare(`SELECT * FROM symbols WHERE name = ?`)
      .all(name) as Record<string, unknown>[];
    return rows.map((r) => this.mapSymbolRow(r));
  }

  private mapSymbolRow(row: Record<string, unknown>): SymbolRecord {
    return {
      id: row.id as number,
      name: row.name as string,
      kind: row.kind as SymbolKind,
      fileId: row.file_id as number,
      line: row.line as number,
      endLine: row.end_line as number,
      signature: row.signature as string,
      exported: (row.exported as number) === 1,
      documentation: (row.documentation as string) ?? null,
    };
  }

  // ── Edges ──

  insertEdge(
    sourceSymbolId: number,
    targetSymbolId: number,
    kind: EdgeKind,
    evidenceFileId: number,
    evidenceLine: number
  ): number {
    const stmt = this.db.prepare(
      `INSERT INTO edges (source_symbol_id, target_symbol_id, kind, evidence_file_id, evidence_line)
       VALUES (?, ?, ?, ?, ?)`
    );
    const info = stmt.run(
      sourceSymbolId,
      targetSymbolId,
      kind,
      evidenceFileId,
      evidenceLine
    );
    return Number(info.lastInsertRowid);
  }

  getEdgesFrom(symbolId: number, kind?: EdgeKind): EdgeRecord[] {
    const sql = kind
      ? `SELECT * FROM edges WHERE source_symbol_id = ? AND kind = ?`
      : `SELECT * FROM edges WHERE source_symbol_id = ?`;
    const rows = (
      kind
        ? this.db.prepare(sql).all(symbolId, kind)
        : this.db.prepare(sql).all(symbolId)
    ) as Record<string, unknown>[];
    return rows.map((r) => this.mapEdgeRow(r));
  }

  getEdgesTo(symbolId: number, kind?: EdgeKind): EdgeRecord[] {
    const sql = kind
      ? `SELECT * FROM edges WHERE target_symbol_id = ? AND kind = ?`
      : `SELECT * FROM edges WHERE target_symbol_id = ?`;
    const rows = (
      kind
        ? this.db.prepare(sql).all(symbolId, kind)
        : this.db.prepare(sql).all(symbolId)
    ) as Record<string, unknown>[];
    return rows.map((r) => this.mapEdgeRow(r));
  }

  private mapEdgeRow(row: Record<string, unknown>): EdgeRecord {
    return {
      id: row.id as number,
      sourceSymbolId: row.source_symbol_id as number,
      targetSymbolId: row.target_symbol_id as number,
      kind: row.kind as EdgeKind,
      evidenceFileId: row.evidence_file_id as number,
      evidenceLine: row.evidence_line as number,
    };
  }

  // ── Tests ──

  insertTest(name: string, fileId: number, line: number): number {
    const stmt = this.db.prepare(
      `INSERT INTO tests (name, file_id, line) VALUES (?, ?, ?)`
    );
    const info = stmt.run(name, fileId, line);
    return Number(info.lastInsertRowid);
  }

  linkTestToSymbol(testId: number, symbolId: number): void {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO test_targets (test_id, symbol_id) VALUES (?, ?)`
      )
      .run(testId, symbolId);
  }

  getTestsForSymbol(symbolId: number): TestRecord[] {
    const rows = this.db
      .prepare(
        `SELECT t.* FROM tests t
         JOIN test_targets tt ON t.id = tt.test_id
         WHERE tt.symbol_id = ?`
      )
      .all(symbolId) as { id: number; name: string; file_id: number; line: number }[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      fileId: r.file_id,
      line: r.line,
      targetSymbolIds: this.getTestTargetIds(r.id),
    }));
  }

  private getTestTargetIds(testId: number): number[] {
    const rows = this.db
      .prepare(`SELECT symbol_id FROM test_targets WHERE test_id = ?`)
      .all(testId) as { symbol_id: number }[];
    return rows.map((r) => r.symbol_id);
  }

  // ── Modules ──

  insertModule(
    name: string,
    boundaryKind: ModuleRecord["boundaryKind"],
    opts?: {
      boundaryConfidence?: Confidence;
      boundaryReason?: string;
      hasBarrel?: boolean;
      hasPackageJson?: boolean;
    }
  ): number {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO modules (name, boundary_kind, boundary_confidence, boundary_reason, has_barrel, has_package_json)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        name,
        boundaryKind,
        opts?.boundaryConfidence ?? "medium",
        opts?.boundaryReason ?? "",
        opts?.hasBarrel ? 1 : 0,
        opts?.hasPackageJson ? 1 : 0
      );
    const row = this.db
      .prepare(`SELECT id FROM modules WHERE name = ?`)
      .get(name) as { id: number };
    return row.id;
  }

  linkModuleFile(moduleId: number, fileId: number): void {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO module_files (module_id, file_id) VALUES (?, ?)`
      )
      .run(moduleId, fileId);
  }

  getModule(name: string): ModuleRecord | undefined {
    const row = this.db
      .prepare(`SELECT * FROM modules WHERE name = ?`)
      .get(name) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return this.mapModuleRow(row);
  }

  getAllModules(): ModuleRecord[] {
    const rows = this.db.prepare(`SELECT * FROM modules`).all() as Record<string, unknown>[];
    return rows.map((r) => this.mapModuleRow(r));
  }

  private mapModuleRow(row: Record<string, unknown>): ModuleRecord {
    const id = row.id as number;
    const fileIds = (
      this.db
        .prepare(`SELECT file_id FROM module_files WHERE module_id = ?`)
        .all(id) as { file_id: number }[]
    ).map((f) => f.file_id);
    return {
      id,
      name: row.name as string,
      fileIds,
      boundaryKind: row.boundary_kind as ModuleRecord["boundaryKind"],
      boundaryConfidence: (row.boundary_confidence as Confidence) ?? "medium",
      boundaryReason: (row.boundary_reason as string) ?? "",
      hasBarrel: (row.has_barrel as number) === 1,
      hasPackageJson: (row.has_package_json as number) === 1,
    };
  }

  // ── Module Dependencies ──

  upsertModuleDep(
    sourceModuleId: number,
    targetModuleId: number,
    weight: number
  ): void {
    this.db
      .prepare(
        `INSERT INTO module_deps (source_module_id, target_module_id, weight)
         VALUES (?, ?, ?)
         ON CONFLICT(source_module_id, target_module_id)
         DO UPDATE SET weight = weight + excluded.weight`
      )
      .run(sourceModuleId, targetModuleId, weight);
  }

  getModuleDeps(moduleId: number): ModuleDepRecord[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM module_deps WHERE source_module_id = ?`
      )
      .all(moduleId) as {
      source_module_id: number;
      target_module_id: number;
      weight: number;
    }[];
    return rows.map((r) => ({
      sourceModuleId: r.source_module_id,
      targetModuleId: r.target_module_id,
      weight: r.weight,
    }));
  }

  getModuleReverseDeps(moduleId: number): ModuleDepRecord[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM module_deps WHERE target_module_id = ?`
      )
      .all(moduleId) as {
      source_module_id: number;
      target_module_id: number;
      weight: number;
    }[];
    return rows.map((r) => ({
      sourceModuleId: r.source_module_id,
      targetModuleId: r.target_module_id,
      weight: r.weight,
    }));
  }

  /**
   * Get the symbol-level edges that explain a module dependency.
   * Returns the actual import/call edges between symbols in the two modules.
   */
  getModuleDepTrace(
    sourceModuleId: number,
    targetModuleId: number
  ): { sourceSymbol: SymbolRecord; targetSymbol: SymbolRecord; edgeKind: EdgeKind; line: number }[] {
    const sourceFiles = (
      this.db
        .prepare(`SELECT file_id FROM module_files WHERE module_id = ?`)
        .all(sourceModuleId) as { file_id: number }[]
    ).map((r) => r.file_id);
    const targetFiles = (
      this.db
        .prepare(`SELECT file_id FROM module_files WHERE module_id = ?`)
        .all(targetModuleId) as { file_id: number }[]
    ).map((r) => r.file_id);

    if (sourceFiles.length === 0 || targetFiles.length === 0) return [];

    const traces: { sourceSymbol: SymbolRecord; targetSymbol: SymbolRecord; edgeKind: EdgeKind; line: number }[] = [];

    for (const sourceFileId of sourceFiles) {
      const symbols = this.getSymbolsByFile(sourceFileId);
      for (const sym of symbols) {
        const edges = this.getEdgesFrom(sym.id);
        for (const edge of edges) {
          if (edge.kind !== "imports" && edge.kind !== "calls") continue;
          const targetSym = this.getSymbol(edge.targetSymbolId);
          if (!targetSym) continue;
          if (targetFiles.includes(targetSym.fileId)) {
            traces.push({
              sourceSymbol: sym,
              targetSymbol: targetSym,
              edgeKind: edge.kind,
              line: edge.evidenceLine,
            });
          }
        }
      }
    }

    return traces;
  }

  /**
   * Get indirect dependencies: modules reachable in 2+ hops from this module.
   */
  getIndirectDeps(moduleId: number, maxDepth = 3): { moduleId: number; depth: number }[] {
    const directDeps = new Set(this.getModuleDeps(moduleId).map((d) => d.targetModuleId));
    const visited = new Set<number>([moduleId, ...directDeps]);
    const indirect: { moduleId: number; depth: number }[] = [];

    let frontier = Array.from(directDeps);
    let depth = 2;

    while (frontier.length > 0 && depth <= maxDepth) {
      const nextFrontier: number[] = [];
      for (const fId of frontier) {
        const deps = this.getModuleDeps(fId);
        for (const dep of deps) {
          if (!visited.has(dep.targetModuleId)) {
            visited.add(dep.targetModuleId);
            indirect.push({ moduleId: dep.targetModuleId, depth });
            nextFrontier.push(dep.targetModuleId);
          }
        }
      }
      frontier = nextFrontier;
      depth++;
    }

    return indirect;
  }

  getModuleMetrics(moduleId: number): ModuleMetrics {
    const files = this.db
      .prepare(`SELECT file_id FROM module_files WHERE module_id = ?`)
      .all(moduleId) as { file_id: number }[];

    if (files.length === 0) {
      return {
        moduleId,
        symbolCount: 0,
        exportedSymbolCount: 0,
        fanIn: 0,
        fanOut: 0,
        testCount: 0,
        linesOfCode: 0,
      };
    }

    const fileIds = files.map((f) => f.file_id);
    const placeholders = fileIds.map(() => "?").join(",");

    const symbolCount = (
      this.db
        .prepare(
          `SELECT COUNT(*) as c FROM symbols WHERE file_id IN (${placeholders})`
        )
        .get(...fileIds) as { c: number }
    ).c;

    const exportedSymbolCount = (
      this.db
        .prepare(
          `SELECT COUNT(*) as c FROM symbols WHERE file_id IN (${placeholders}) AND exported = 1`
        )
        .get(...fileIds) as { c: number }
    ).c;

    const fanOut = (
      this.db
        .prepare(
          `SELECT COUNT(*) as c FROM module_deps WHERE source_module_id = ?`
        )
        .get(moduleId) as { c: number }
    ).c;

    const fanIn = (
      this.db
        .prepare(
          `SELECT COUNT(*) as c FROM module_deps WHERE target_module_id = ?`
        )
        .get(moduleId) as { c: number }
    ).c;

    const testCount = (
      this.db
        .prepare(
          `SELECT COUNT(DISTINCT t.id) as c FROM tests t
           JOIN test_targets tt ON t.id = tt.test_id
           JOIN symbols s ON tt.symbol_id = s.id
           WHERE s.file_id IN (${placeholders})`
        )
        .get(...fileIds) as { c: number }
    ).c;

    const linesOfCode = (
      this.db
        .prepare(
          `SELECT COALESCE(SUM(lines_of_code), 0) as c FROM files WHERE id IN (${placeholders})`
        )
        .get(...fileIds) as { c: number }
    ).c;

    return {
      moduleId,
      symbolCount,
      exportedSymbolCount,
      fanIn,
      fanOut,
      testCount,
      linesOfCode,
    };
  }

  // ── Meta ──

  setMeta(key: string, value: string): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO bearings_meta (key, value) VALUES (?, ?)`
      )
      .run(key, value);
  }

  getMeta(key: string): string | undefined {
    const row = this.db
      .prepare(`SELECT value FROM bearings_meta WHERE key = ?`)
      .get(key) as { value: string } | undefined;
    return row?.value;
  }

  // ── Bulk operations ──

  clear(): void {
    this.db.exec(`
      DELETE FROM test_targets;
      DELETE FROM tests;
      DELETE FROM edges;
      DELETE FROM entrypoints;
      DELETE FROM module_deps;
      DELETE FROM module_files;
      DELETE FROM modules;
      DELETE FROM symbols;
      DELETE FROM files;
      DELETE FROM bearings_meta;
    `);
  }
}

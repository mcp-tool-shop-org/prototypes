/** SQLite schema for Code Bearings graph storage */

export const SCHEMA_SQL = `
-- Layer A: Extracted Truth

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL UNIQUE,
  relative_path TEXT NOT NULL,
  lines_of_code INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS symbols (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  file_id INTEGER NOT NULL REFERENCES files(id),
  line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  signature TEXT NOT NULL DEFAULT '',
  exported INTEGER NOT NULL DEFAULT 0,
  documentation TEXT,
  UNIQUE(file_id, name, kind, line)
);

CREATE TABLE IF NOT EXISTS edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_symbol_id INTEGER NOT NULL REFERENCES symbols(id),
  target_symbol_id INTEGER NOT NULL REFERENCES symbols(id),
  kind TEXT NOT NULL,
  evidence_file_id INTEGER NOT NULL REFERENCES files(id),
  evidence_line INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  file_id INTEGER NOT NULL REFERENCES files(id),
  line INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS test_targets (
  test_id INTEGER NOT NULL REFERENCES tests(id),
  symbol_id INTEGER NOT NULL REFERENCES symbols(id),
  PRIMARY KEY (test_id, symbol_id)
);

CREATE TABLE IF NOT EXISTS entrypoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol_id INTEGER NOT NULL REFERENCES symbols(id),
  kind TEXT NOT NULL
);

-- Layer B: Derived Structure

CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  boundary_kind TEXT NOT NULL DEFAULT 'file',
  boundary_confidence TEXT NOT NULL DEFAULT 'medium',
  boundary_reason TEXT NOT NULL DEFAULT '',
  has_barrel INTEGER NOT NULL DEFAULT 0,
  has_package_json INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS module_files (
  module_id INTEGER NOT NULL REFERENCES modules(id),
  file_id INTEGER NOT NULL REFERENCES files(id),
  PRIMARY KEY (module_id, file_id)
);

CREATE TABLE IF NOT EXISTS module_deps (
  source_module_id INTEGER NOT NULL REFERENCES modules(id),
  target_module_id INTEGER NOT NULL REFERENCES modules(id),
  weight INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (source_module_id, target_module_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols(file_id);
CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name);
CREATE INDEX IF NOT EXISTS idx_symbols_exported ON symbols(exported);
CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_symbol_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_symbol_id);
CREATE INDEX IF NOT EXISTS idx_edges_kind ON edges(kind);
CREATE INDEX IF NOT EXISTS idx_module_files_file ON module_files(file_id);

-- Metadata
CREATE TABLE IF NOT EXISTS bearings_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

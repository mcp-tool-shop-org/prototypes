import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ProjectConfig, ProjectNote } from './types.js';
import { log } from '../utils/logger.js';

export class ProjectStore {
  private dir: string;
  private notesDir: string;
  private configPath: string;

  constructor(baseDir?: string) {
    this.dir = baseDir ?? path.join(process.cwd(), '.game-dev-mcp');
    this.notesDir = path.join(this.dir, 'notes');
    this.configPath = path.join(this.dir, 'project.json');
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
    if (!fs.existsSync(this.notesDir)) {
      fs.mkdirSync(this.notesDir, { recursive: true });
    }
  }

  isInitialized(): boolean {
    return fs.existsSync(this.configPath);
  }

  getConfig(): ProjectConfig | null {
    if (!fs.existsSync(this.configPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf-8')) as ProjectConfig;
    } catch {
      return null;
    }
  }

  saveConfig(config: ProjectConfig): void {
    this.ensureDir();
    config.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    log.debug('Saved project config', 'project');
  }

  initProject(name: string, ueVersion?: string, description?: string): ProjectConfig {
    const config: ProjectConfig = {
      name,
      ueVersion,
      description,
      conventions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.saveConfig(config);
    return config;
  }

  addConvention(convention: string): ProjectConfig {
    const config = this.getConfig();
    if (!config) throw new Error('Project not initialized. Call ue_project_init first.');
    if (!config.conventions.includes(convention)) {
      config.conventions.push(convention);
      this.saveConfig(config);
    }
    return config;
  }

  addNote(title: string, content: string, tags: string[] = []): ProjectNote {
    this.ensureDir();
    const note: ProjectNote = {
      id: randomUUID().slice(0, 8),
      title,
      content,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const notePath = path.join(this.notesDir, `${note.id}.json`);
    fs.writeFileSync(notePath, JSON.stringify(note, null, 2));
    log.debug(`Added note: ${note.id}`, 'project');
    return note;
  }

  getNote(id: string): ProjectNote | null {
    const notePath = path.join(this.notesDir, `${id}.json`);
    if (!fs.existsSync(notePath)) return null;
    try {
      return JSON.parse(fs.readFileSync(notePath, 'utf-8')) as ProjectNote;
    } catch {
      return null;
    }
  }

  deleteNote(id: string): boolean {
    const notePath = path.join(this.notesDir, `${id}.json`);
    if (!fs.existsSync(notePath)) return false;
    fs.unlinkSync(notePath);
    return true;
  }

  listNotes(tagFilter?: string): ProjectNote[] {
    if (!fs.existsSync(this.notesDir)) return [];

    const notes: ProjectNote[] = [];
    for (const file of fs.readdirSync(this.notesDir)) {
      if (!file.endsWith('.json')) continue;
      try {
        const note = JSON.parse(
          fs.readFileSync(path.join(this.notesDir, file), 'utf-8'),
        ) as ProjectNote;
        if (tagFilter && !note.tags.includes(tagFilter)) continue;
        notes.push(note);
      } catch {
        // skip corrupt files
      }
    }
    return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  searchNotes(query: string): ProjectNote[] {
    const notes = this.listNotes();
    const lower = query.toLowerCase();
    return notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(lower) ||
          n.content.toLowerCase().includes(lower) ||
          n.tags.some((t) => t.toLowerCase().includes(lower)),
      )
      .slice(0, 20);
  }
}

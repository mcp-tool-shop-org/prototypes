import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import { Sandbox, resetSandbox } from '../src/security/sandbox.js';

describe('Sandbox', () => {
  let sandbox: Sandbox;
  const tmpDir = os.tmpdir();

  beforeEach(() => {
    resetSandbox();
    sandbox = new Sandbox({ allowed_paths: [tmpDir] });
  });

  describe('isPathAllowed', () => {
    it('allows paths within allowed directories', async () => {
      await sandbox.initialize();
      const allowed = sandbox.isPathAllowed(path.join(tmpDir, 'test.txt'));
      expect(allowed).toBe(true);
    });

    it('rejects paths outside allowed directories', async () => {
      await sandbox.initialize();
      const allowed = sandbox.isPathAllowed('/etc/passwd');
      expect(allowed).toBe(false);
    });

    it('rejects paths with traversal to escape sandbox', async () => {
      await sandbox.initialize();
      const traversal = path.join(tmpDir, '..', '..', 'etc', 'passwd');
      const allowed = sandbox.isPathAllowed(traversal);
      expect(allowed).toBe(false);
    });

    it('allows the exact allowed path itself', async () => {
      await sandbox.initialize();
      const allowed = sandbox.isPathAllowed(tmpDir);
      expect(allowed).toBe(true);
    });
  });

  describe('validatePath', () => {
    it('returns null for valid paths', async () => {
      const error = await sandbox.validatePath(path.join(tmpDir, 'test.txt'));
      expect(error).toBeNull();
    });

    it('returns error for paths outside sandbox', async () => {
      const error = await sandbox.validatePath('/etc/shadow');
      expect(error).not.toBeNull();
      expect(error!.code).toBe('PATH_OUTSIDE_SANDBOX');
    });

    it('detects path traversal attempts', async () => {
      const error = await sandbox.validatePath(path.join(tmpDir, '..', '..', '..', 'etc', 'passwd'));
      expect(error).not.toBeNull();
    });
  });

  describe('validateFileSize', () => {
    it('allows files within size limit', () => {
      const error = sandbox.validateFileSize(1024);
      expect(error).toBeNull();
    });

    it('rejects files exceeding size limit', () => {
      const error = sandbox.validateFileSize(200_000_000);
      expect(error).not.toBeNull();
      expect(error!.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('validateDepth', () => {
    it('allows valid recursion depth', () => {
      const error = sandbox.validateDepth(5);
      expect(error).toBeNull();
    });

    it('rejects excessive recursion depth', () => {
      const error = sandbox.validateDepth(50);
      expect(error).not.toBeNull();
      expect(error!.code).toBe('DEPTH_EXCEEDED');
    });
  });

  describe('denied_paths', () => {
    it('rejects paths matching denied patterns', async () => {
      const sb = new Sandbox({
        allowed_paths: [tmpDir],
        denied_paths: ['**/.git/**', '**/node_modules/**'],
      });
      await sb.initialize();
      const gitPath = path.join(tmpDir, '.git', 'config');
      const allowed = sb.isPathAllowed(gitPath);
      expect(allowed).toBe(false);
    });
  });

  describe('config', () => {
    it('returns config copy', () => {
      const config = sandbox.getConfig();
      expect(config.max_file_size).toBe(104857600);
      expect(config.max_depth).toBe(20);
    });

    it('updates config at runtime', () => {
      sandbox.updateConfig({ max_file_size: 50_000_000 });
      expect(sandbox.getConfig().max_file_size).toBe(50_000_000);
    });
  });
});

/**
 * Parse a unified diff into structured change regions.
 */

export interface DiffHunk {
  filePath: string;
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  addedLines: number[];
  removedLines: number[];
  /** Content of added lines (trimmed) */
  addedContent: string[];
  /** Content of removed lines (trimmed) */
  removedContent: string[];
}

export interface DiffFile {
  filePath: string;
  oldFilePath?: string; // set when renamed/copied
  hunks: DiffHunk[];
  isNew: boolean;
  isDeleted: boolean;
  isRename: boolean;
  isCopy: boolean;
  similarity?: number; // rename/copy similarity percentage
}

/**
 * Parse unified diff text (from git diff) into structured DiffFile objects.
 */
export function parseDiff(diffText: string): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = diffText.split("\n");
  let currentFile: DiffFile | null = null;
  let currentHunk: DiffHunk | null = null;
  let lineInHunk = 0;
  let oldLine = 0;
  let newLine = 0;

  let pendingOldPath: string | undefined;
  let pendingRename = false;
  let pendingCopy = false;
  let pendingSimilarity: number | undefined;
  let pendingDeleted = false;
  let pendingNew = false;

  for (const line of lines) {
    // New file header
    if (line.startsWith("diff --git")) {
      if (currentFile) files.push(currentFile);
      currentFile = null;
      currentHunk = null;
      pendingOldPath = undefined;
      pendingRename = false;
      pendingCopy = false;
      pendingSimilarity = undefined;
      pendingDeleted = false;
      pendingNew = false;
      continue;
    }

    // Rename detection: rename from / rename to
    if (line.startsWith("rename from ")) {
      pendingOldPath = line.slice(12);
      pendingRename = true;
      continue;
    }
    if (line.startsWith("rename to ")) {
      // Will be captured by +++ line
      continue;
    }

    // Copy detection
    if (line.startsWith("copy from ")) {
      pendingOldPath = line.slice(10);
      pendingCopy = true;
      continue;
    }
    if (line.startsWith("copy to ")) {
      continue;
    }

    // Similarity index
    const simMatch = line.match(/^similarity index (\d+)%/);
    if (simMatch) {
      pendingSimilarity = parseInt(simMatch[1], 10);
      continue;
    }

    // File path from --- line (captures old path for renames)
    if (line.startsWith("--- a/")) {
      if (!pendingOldPath) {
        pendingOldPath = line.slice(6);
      }
      continue;
    }

    // File path from +++ line
    if (line.startsWith("+++ b/")) {
      const filePath = line.slice(6);
      currentFile = {
        filePath,
        hunks: [],
        isNew: pendingNew,
        isDeleted: false,
        isRename: pendingRename,
        isCopy: pendingCopy,
        similarity: pendingSimilarity,
      };
      if (pendingRename || pendingCopy) {
        currentFile.oldFilePath = pendingOldPath;
      }
      continue;
    }

    if (line.startsWith("+++ /dev/null")) {
      // File was deleted — create a deleted entry using the old path
      if (pendingOldPath) {
        currentFile = {
          filePath: pendingOldPath,
          hunks: [],
          isNew: false,
          isDeleted: true,
          isRename: false,
          isCopy: false,
        };
      }
      continue;
    }

    if (line.startsWith("--- /dev/null")) {
      pendingNew = true;
      if (currentFile) currentFile.isNew = true;
      pendingOldPath = undefined;
      continue;
    }

    // New file marker
    if (line.startsWith("new file mode")) {
      if (currentFile) currentFile.isNew = true;
      continue;
    }

    if (line.startsWith("deleted file mode")) {
      pendingDeleted = true;
      continue;
    }

    // Hunk header
    const hunkMatch = line.match(
      /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/
    );
    if (hunkMatch && currentFile) {
      const oldStart = parseInt(hunkMatch[1], 10);
      const oldCount = parseInt(hunkMatch[2] ?? "1", 10);
      const newStart = parseInt(hunkMatch[3], 10);
      const newCount = parseInt(hunkMatch[4] ?? "1", 10);

      currentHunk = {
        filePath: currentFile.filePath,
        oldStart,
        oldCount,
        newStart,
        newCount,
        addedLines: [],
        removedLines: [],
        addedContent: [],
        removedContent: [],
      };
      currentFile.hunks.push(currentHunk);
      oldLine = oldStart;
      newLine = newStart;
      lineInHunk = 0;
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith("+")) {
      currentHunk.addedLines.push(newLine);
      currentHunk.addedContent.push(line.slice(1));
      newLine++;
    } else if (line.startsWith("-")) {
      currentHunk.removedLines.push(oldLine);
      currentHunk.removedContent.push(line.slice(1));
      oldLine++;
    } else {
      // Context line
      oldLine++;
      newLine++;
    }
    lineInHunk++;
  }

  if (currentFile) files.push(currentFile);

  return files;
}

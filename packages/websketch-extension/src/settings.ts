/**
 * Settings storage helper — reads/writes WebSketch limits from chrome.storage.sync.
 */

import { DEFAULT_LIMITS, type WebSketchLimits } from '@mcptoolshop/websketch-ir';

const STORAGE_KEY = 'websketch_limits';

export async function loadSettings(): Promise<WebSketchLimits> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY];
      resolve({
        maxDepth: stored?.maxDepth ?? DEFAULT_LIMITS.maxDepth,
        maxNodes: stored?.maxNodes ?? DEFAULT_LIMITS.maxNodes,
        maxStringLength: stored?.maxStringLength ?? DEFAULT_LIMITS.maxStringLength,
      });
    });
  });
}

export async function saveSettings(limits: Partial<WebSketchLimits>): Promise<void> {
  const current = await loadSettings();
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: { ...current, ...limits } }, resolve);
  });
}

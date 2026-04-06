/**
 * Options page script — configures WebSketch capture limits.
 */

import { DEFAULT_LIMITS } from '@mcptoolshop/websketch-ir';
import { loadSettings, saveSettings } from './settings';

const maxDepthInput = document.getElementById('maxDepth') as HTMLInputElement;
const maxNodesInput = document.getElementById('maxNodes') as HTMLInputElement;
const maxStringLengthInput = document.getElementById('maxStringLength') as HTMLInputElement;
const saveButton = document.getElementById('save-btn') as HTMLButtonElement;
const resetButton = document.getElementById('reset-btn') as HTMLButtonElement;
const toastElement = document.getElementById('toast') as HTMLDivElement;

async function init(): Promise<void> {
  const settings = await loadSettings();
  maxDepthInput.value = String(settings.maxDepth);
  maxNodesInput.value = String(settings.maxNodes);
  maxStringLengthInput.value = String(settings.maxStringLength);
}

saveButton.addEventListener('click', async () => {
  await saveSettings({
    maxDepth: parseInt(maxDepthInput.value, 10) || DEFAULT_LIMITS.maxDepth,
    maxNodes: parseInt(maxNodesInput.value, 10) || DEFAULT_LIMITS.maxNodes,
    maxStringLength: parseInt(maxStringLengthInput.value, 10) || DEFAULT_LIMITS.maxStringLength,
  });
  showToast('Settings saved!');
});

resetButton.addEventListener('click', async () => {
  await saveSettings({
    maxDepth: DEFAULT_LIMITS.maxDepth,
    maxNodes: DEFAULT_LIMITS.maxNodes,
    maxStringLength: DEFAULT_LIMITS.maxStringLength,
  });
  maxDepthInput.value = String(DEFAULT_LIMITS.maxDepth);
  maxNodesInput.value = String(DEFAULT_LIMITS.maxNodes);
  maxStringLengthInput.value = String(DEFAULT_LIMITS.maxStringLength);
  showToast('Reset to defaults!');
});

function showToast(message: string): void {
  toastElement.textContent = message;
  toastElement.classList.add('visible');
  setTimeout(() => toastElement.classList.remove('visible'), 2000);
}

init();

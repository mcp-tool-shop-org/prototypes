/**
 * Popup script - UI for triggering captures
 */

interface CaptureResponse {
  success: boolean;
  capture?: Record<string, unknown> & { warnings?: string[] };
  error?: string;
}

const captureButton = document.getElementById('capture-btn') as HTMLButtonElement;
const statusElement = document.getElementById('status') as HTMLDivElement;
const outputElement = document.getElementById('output') as HTMLPreElement;
const settingsLink = document.getElementById('settings-link') as HTMLAnchorElement;

captureButton.addEventListener('click', async () => {
  captureButton.disabled = true;
  statusElement.textContent = 'Capturing...';
  statusElement.className = 'status';
  outputElement.textContent = '';

  // Clear any previous warning banner
  const existing = document.getElementById('warning-banner');
  if (existing) existing.remove();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      throw new Error('No active tab found');
    }

    // Send message to content script
    const response = (await chrome.tabs.sendMessage(tab.id, {
      type: 'CAPTURE_PAGE',
    })) as CaptureResponse;

    if (response.success && response.capture) {
      statusElement.textContent = 'Capture successful!';
      statusElement.className = 'status success';
      outputElement.textContent = JSON.stringify(response.capture, null, 2);

      // Show warning banner if capture was truncated
      if (response.capture.warnings && response.capture.warnings.length > 0) {
        const banner = document.createElement('div');
        banner.id = 'warning-banner';
        banner.className = 'status warning';
        banner.textContent = `Capture truncated: ${response.capture.warnings[0]}`;
        statusElement.parentNode?.insertBefore(banner, statusElement.nextSibling);
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(JSON.stringify(response.capture));
      statusElement.textContent += ' (Copied to clipboard)';
    } else {
      throw new Error(response.error || 'Capture failed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    statusElement.textContent = `Error: ${errorMessage}`;
    statusElement.className = 'status error';
  } finally {
    captureButton.disabled = false;
  }
});

settingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// @ts-check

/** @type {ReturnType<typeof acquireVsCodeApi>} */
const vscode = acquireVsCodeApi();

/** @type {Array<{id: string, name: string, gender: string, accent: string, style: string, language: string}>} */
let voices = [];

/** @type {Array<{name: string, voice: string, speed: number, description: string}>} */
let presets = [];

let defaultVoice = "bm_george";
let defaultSpeed = 1.0;
let activeFilter = "all";
let errorTimeout = null;

// Elements
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");
const statusChip = document.getElementById("statusChip");
const speakText = /** @type {HTMLTextAreaElement} */ (document.getElementById("speakText"));
const voiceSelect = /** @type {HTMLSelectElement} */ (document.getElementById("voiceSelect"));
const speedSlider = /** @type {HTMLInputElement} */ (document.getElementById("speedSlider"));
const speedValue = document.getElementById("speedValue");
const speakBtn = document.getElementById("speakBtn");
const stopBtn = document.getElementById("stopBtn");
const presetsContainer = document.getElementById("presets");
const voiceSearch = /** @type {HTMLInputElement} */ (document.getElementById("voiceSearch"));
const voiceFilters = document.getElementById("voiceFilters");
const voiceList = document.getElementById("voiceList");
const dialogueScript = /** @type {HTMLTextAreaElement} */ (document.getElementById("dialogueScript"));
const castPanel = document.getElementById("castPanel");
const dialoguePlayBtn = document.getElementById("dialoguePlayBtn");
const dialogueExportBtn = document.getElementById("dialogueExportBtn");

// Tab switching
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.getAttribute("data-tab");
    document.getElementById(`tab-${target}`)?.classList.add("active");
  });
});

// Speed slider
speedSlider?.addEventListener("input", () => {
  if (speedValue) speedValue.textContent = `${parseFloat(speedSlider.value).toFixed(1)}x`;
});

// Speak button
speakBtn?.addEventListener("click", () => {
  const text = speakText?.value?.trim();
  if (!text) return;
  vscode.postMessage({
    type: "speak",
    text,
    voice: voiceSelect?.value || defaultVoice,
    speed: parseFloat(speedSlider?.value || "1.0"),
  });
});

// Stop button
stopBtn?.addEventListener("click", () => {
  vscode.postMessage({ type: "stop" });
});

// Voice search
voiceSearch?.addEventListener("input", () => {
  renderVoiceList();
});

// Dialogue play
dialoguePlayBtn?.addEventListener("click", () => {
  const script = dialogueScript?.value?.trim();
  if (!script) return;

  const cast = getCastAssignments();
  vscode.postMessage({
    type: "dialogue",
    script,
    cast: Object.keys(cast).length > 0 ? cast : undefined,
    speed: parseFloat(speedSlider?.value || "1.0"),
  });
});

// Dialogue export as WebVTT
dialogueExportBtn?.addEventListener("click", () => {
  const script = dialogueScript?.value?.trim();
  if (!script) return;

  const cast = getCastAssignments();
  vscode.postMessage({
    type: "exportDialogue",
    script,
    cast: Object.keys(cast).length > 0 ? cast : undefined,
    speed: parseFloat(speedSlider?.value || "1.0"),
  });
});

// Detect speakers in dialogue for cast assignment
dialogueScript?.addEventListener("input", () => {
  updateCastPanel();
});

// Request initial status
vscode.postMessage({ type: "requestStatus" });

// Handle messages from extension
window.addEventListener("message", (event) => {
  const msg = event.data;
  switch (msg.type) {
    case "status":
      handleStatus(msg);
      break;
    case "speaking":
      handleSpeaking(msg.speaking);
      break;
    case "error":
      handleError(msg.message);
      break;
    case "setupRequired":
      handleSetup(msg.message, msg.backend);
      break;
  }
});

/**
 * @param {object} msg
 */
function handleStatus(msg) {
  if (msg.connected) {
    statusChip.textContent = "Ready";
    statusChip.className = "status-chip ready";
    speakBtn.disabled = false;
    dialoguePlayBtn.disabled = false;
    if (dialogueExportBtn) dialogueExportBtn.disabled = false;

    voices = msg.voices || [];
    presets = msg.presets || [];
    defaultVoice = msg.defaultVoice || "bm_george";
    defaultSpeed = msg.defaultSpeed || 1.0;

    speedSlider.value = String(defaultSpeed);
    speedValue.textContent = `${defaultSpeed.toFixed(1)}x`;

    renderVoiceSelect();
    renderPresets();
    renderVoiceFilters();
    renderVoiceList();
  } else {
    statusChip.textContent = "Disconnected";
    statusChip.className = "status-chip offline";
    speakBtn.disabled = true;
    dialoguePlayBtn.disabled = true;
    if (dialogueExportBtn) dialogueExportBtn.disabled = true;
  }
}

/** @param {boolean} speaking */
function handleSpeaking(speaking) {
  if (speaking) {
    speakBtn.style.display = "none";
    stopBtn.style.display = "";
  } else {
    speakBtn.style.display = "";
    stopBtn.style.display = "none";
  }
}

/** @param {string} message */
function handleError(message) {
  statusChip.textContent = `Error: ${message}`;
  statusChip.className = "status-chip offline";
  if (errorTimeout) clearTimeout(errorTimeout);
  errorTimeout = setTimeout(() => {
    errorTimeout = null;
    statusChip.textContent = "Ready";
    statusChip.className = "status-chip ready";
  }, 3000);
}

function renderVoiceSelect() {
  if (!voiceSelect) return;
  voiceSelect.innerHTML = "";

  const groups = groupVoicesByLanguage();
  for (const [lang, langVoices] of Object.entries(groups)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = lang;
    for (const v of langVoices) {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = `${v.name} (${v.gender})`;
      if (v.id === defaultVoice) opt.selected = true;
      optgroup.appendChild(opt);
    }
    voiceSelect.appendChild(optgroup);
  }
}

function renderPresets() {
  if (!presetsContainer) return;
  presetsContainer.innerHTML = "";
  for (const p of presets) {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.textContent = p.name.charAt(0).toUpperCase() + p.name.slice(1);
    btn.title = `${p.description} (${p.voice}, ${p.speed}x)`;
    btn.addEventListener("click", () => {
      voiceSelect.value = p.voice;
      speedSlider.value = String(p.speed);
      speedValue.textContent = `${p.speed.toFixed(1)}x`;
      document.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
    presetsContainer.appendChild(btn);
  }
}

function renderVoiceFilters() {
  if (!voiceFilters) return;
  const filters = ["All", "American", "British", "Japanese", "Male", "Female"];
  voiceFilters.innerHTML = "";
  for (const f of filters) {
    const chip = document.createElement("button");
    chip.className = `filter-chip${f.toLowerCase() === activeFilter ? " active" : ""}`;
    chip.textContent = f;
    chip.addEventListener("click", () => {
      activeFilter = f.toLowerCase();
      document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderVoiceList();
    });
    voiceFilters.appendChild(chip);
  }
}

function renderVoiceList() {
  if (!voiceList) return;
  const query = voiceSearch?.value?.toLowerCase() || "";

  const filtered = voices.filter((v) => {
    if (query && !v.name.toLowerCase().includes(query) && !v.id.toLowerCase().includes(query)) {
      return false;
    }
    if (activeFilter === "male" && v.gender !== "male") return false;
    if (activeFilter === "female" && v.gender !== "female") return false;
    if (activeFilter === "american" && !v.accent.toLowerCase().includes("american")) return false;
    if (activeFilter === "british" && !v.accent.toLowerCase().includes("british")) return false;
    if (activeFilter === "japanese" && !v.language.toLowerCase().includes("japan")) return false;
    return true;
  });

  voiceList.innerHTML = "";
  for (const v of filtered) {
    const card = document.createElement("div");
    card.className = "voice-card";

    const info = document.createElement("div");
    info.className = "info";
    const nameEl = document.createElement("div");
    nameEl.className = "name";
    nameEl.textContent = v.name;
    const detailEl = document.createElement("div");
    detailEl.className = "detail";
    detailEl.textContent = `${v.accent} ${v.gender} \u2014 ${v.style}`;
    info.appendChild(nameEl);
    info.appendChild(detailEl);

    const previewBtn = document.createElement("button");
    previewBtn.className = "preview-btn";
    previewBtn.textContent = "Preview";
    previewBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "preview", voiceId: v.id, voiceName: v.name });
    });

    card.appendChild(info);
    card.appendChild(previewBtn);
    voiceList.appendChild(card);
  }
}

function updateCastPanel() {
  if (!castPanel) return;
  const script = dialogueScript?.value || "";
  const speakers = [...new Set(
    script.split("\n")
      .map((line) => line.match(/^([^:]+):/)?.[1]?.trim())
      .filter(Boolean),
  )];

  if (speakers.length === 0) {
    castPanel.innerHTML = "";
    return;
  }

  castPanel.innerHTML = "<div style='font-size:11px;opacity:0.7;margin-bottom:4px'>Cast Assignment</div>";
  for (const speaker of speakers) {
    const row = document.createElement("div");
    row.className = "cast-row";

    const label = document.createElement("span");
    label.className = "speaker-name";
    label.textContent = speaker;

    const select = document.createElement("select");
    select.dataset.speaker = speaker;
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "(auto)";
    select.appendChild(defaultOpt);

    for (const v of voices) {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = `${v.name} (${v.accent} ${v.gender})`;
      select.appendChild(opt);
    }

    row.appendChild(label);
    row.appendChild(select);
    castPanel.appendChild(row);
  }
}

/** @returns {Record<string, string>} */
function getCastAssignments() {
  const cast = {};
  castPanel?.querySelectorAll("select")?.forEach((sel) => {
    const speaker = sel.dataset.speaker;
    if (speaker && sel.value) {
      cast[speaker] = sel.value;
    }
  });
  return cast;
}

/**
 * @param {string} message
 * @param {string} backend
 */
function handleSetup(message, backend) {
  statusChip.textContent = "Setup Required";
  statusChip.className = "status-chip setup";
  speakBtn.disabled = true;
  dialoguePlayBtn.disabled = true;
  if (dialogueExportBtn) dialogueExportBtn.disabled = true;

  // Show setup guidance in the speak tab
  const speakTab = document.getElementById("tab-speak");
  if (speakTab) {
    const existing = speakTab.querySelector(".setup-banner");
    if (existing) existing.remove();

    const banner = document.createElement("div");
    banner.className = "setup-banner";

    const icon = document.createElement("div");
    icon.className = "setup-icon";
    icon.textContent = "\u2699";

    const text = document.createElement("div");
    text.className = "setup-text";
    text.textContent = message || "TTS backend setup required";

    const btn = document.createElement("button");
    btn.className = "setup-action";
    btn.textContent = "Open Settings";
    btn.addEventListener("click", () => {
      vscode.postMessage({ type: "openSettings" });
    });

    banner.appendChild(icon);
    banner.appendChild(text);
    banner.appendChild(btn);
    speakTab.insertBefore(banner, speakTab.firstChild);
  }
}

/** @returns {Record<string, Array>} */
function groupVoicesByLanguage() {
  const groups = {};
  for (const v of voices) {
    const lang = v.language || v.accent || "Other";
    if (!groups[lang]) groups[lang] = [];
    groups[lang].push(v);
  }
  return groups;
}

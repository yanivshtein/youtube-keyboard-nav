const { ACTIONS, DEFAULT_BINDINGS, prettyBinding, loadBindings, saveBindings, resetBindings, getBindingFromEvent } = window.YTKeybindings;

const keyButtons = new Map();
let currentBindings = { ...DEFAULT_BINDINGS };
let captureAction = null;

function setMessage(text, kind = "info") {
  const el = document.getElementById("status");
  el.textContent = text;
  el.className = `status ${kind}`;
}

function render() {
  ACTIONS.forEach((action) => {
    const btn = keyButtons.get(action.id);
    if (!btn) return;
    btn.textContent = prettyBinding(currentBindings[action.id]);
  });

  const newTabKey = document.getElementById("newTabKey");
  if (newTabKey) {
    newTabKey.textContent = `Ctrl/Cmd + ${prettyBinding(currentBindings.open)}`;
  }
}

function hasDuplicates(bindings) {
  const seen = new Set();
  for (const action of ACTIONS) {
    const code = bindings[action.id];
    if (!code) continue;
    if (seen.has(code)) return true;
    seen.add(code);
  }
  return false;
}

function stopCapture() {
  captureAction = null;
  keyButtons.forEach((btn) => btn.classList.remove("capturing"));
}

function startCapture(actionId) {
  stopCapture();
  captureAction = actionId;
  const btn = keyButtons.get(actionId);
  if (!btn) return;
  btn.classList.add("capturing");
  btn.textContent = "Press key...";
  setMessage("Press a key to assign it.", "info");
}

document.addEventListener("keydown", (e) => {
  if (!captureAction) return;

  e.preventDefault();
  e.stopPropagation();

  const binding = getBindingFromEvent(e);
  if (!binding) {
    setMessage("Pick a non-modifier key.", "error");
    return;
  }

  const nextBindings = { ...currentBindings, [captureAction]: binding };
  if (hasDuplicates(nextBindings)) {
    setMessage("Each action must use a unique key.", "error");
    return;
  }

  currentBindings = nextBindings;
  stopCapture();
  render();
  setMessage("Key updated. Click Save to apply.", "success");
});

async function init() {
  const rows = document.getElementById("rows");

  ACTIONS.forEach((action, index) => {
    const row = document.createElement("div");
    row.className = "row";
    row.style.setProperty("--row-index", String(index + 1));

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = action.label;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "key-btn";
    button.addEventListener("click", () => startCapture(action.id));

    row.append(label, button);
    rows.appendChild(row);
    keyButtons.set(action.id, button);
  });

  currentBindings = await loadBindings();
  render();
  setMessage("Ready.", "info");
}

document.getElementById("saveBtn").addEventListener("click", async () => {
  if (hasDuplicates(currentBindings)) {
    setMessage("Each action must use a unique key.", "error");
    return;
  }

  currentBindings = await saveBindings(currentBindings);
  render();
  setMessage("Controls saved.", "success");
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  stopCapture();
  currentBindings = await resetBindings();
  render();
  setMessage("Default controls restored.", "success");
});

window.addEventListener("blur", () => {
  if (captureAction) stopCapture();
});

init().catch(() => {
  setMessage("Failed to load controls.", "error");
});

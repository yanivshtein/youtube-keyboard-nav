(function () {
  const STORAGE_KEY = "ytKeyBindings";

  const DEFAULT_BINDINGS = {
    moveUp: "KeyW",
    moveDown: "KeyS",
    moveLeft: "KeyA",
    moveRight: "KeyD",
    open: "Enter",
    back: "KeyB",
    home: "KeyH",
    focusSearch: "Slash",
    clear: "Escape",
  };

  const ACTIONS = [
    { id: "moveUp", label: "Move up" },
    { id: "moveDown", label: "Move down" },
    { id: "moveLeft", label: "Move left" },
    { id: "moveRight", label: "Move right" },
    { id: "open", label: "Open selected item" },
    { id: "back", label: "Back to previous page" },
    { id: "home", label: "Go to YouTube Home" },
    { id: "focusSearch", label: "Focus search" },
    { id: "clear", label: "Clear selection / exit typing" },
  ];

  const NAME_TO_CODE = {
    w: "KeyW",
    a: "KeyA",
    s: "KeyS",
    d: "KeyD",
    b: "KeyB",
    h: "KeyH",
    enter: "Enter",
    esc: "Escape",
    escape: "Escape",
    slash: "Slash",
    "/": "Slash",
    "?": "Slash",
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    arrowup: "ArrowUp",
    arrowdown: "ArrowDown",
    arrowleft: "ArrowLeft",
    arrowright: "ArrowRight",
    space: "Space",
  };

  function normalizeBinding(value) {
    if (!value || typeof value !== "string") return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^(Key[A-Z]|Digit[0-9]|F([1-9]|1[0-2])|Arrow(Up|Down|Left|Right)|Enter|Escape|Space|Tab|Slash|Period|Comma|Backspace|Delete|Home|End|PageUp|PageDown)$/.test(trimmed)) {
      return trimmed;
    }

    const lower = trimmed.toLowerCase();
    if (NAME_TO_CODE[lower]) return NAME_TO_CODE[lower];

    if (lower.length === 1 && /[a-z]/.test(lower)) {
      return `Key${lower.toUpperCase()}`;
    }

    if (lower.length === 1 && /[0-9]/.test(lower)) {
      return `Digit${lower}`;
    }

    return null;
  }

  function prettyBinding(code) {
    if (!code) return "Unassigned";

    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);

    const friendly = {
      Enter: "Enter",
      Escape: "Esc",
      Slash: "/",
      ArrowUp: "Up",
      ArrowDown: "Down",
      ArrowLeft: "Left",
      ArrowRight: "Right",
      Space: "Space",
      Tab: "Tab",
      Period: ".",
      Comma: ",",
      Backspace: "Backspace",
      Delete: "Delete",
      Home: "Home",
      End: "End",
      PageUp: "Page Up",
      PageDown: "Page Down",
    };

    return friendly[code] || code;
  }

  function sanitizeBindings(raw) {
    const out = { ...DEFAULT_BINDINGS };

    if (!raw || typeof raw !== "object") return out;

    ACTIONS.forEach((action) => {
      const normalized = normalizeBinding(raw[action.id]);
      if (normalized) out[action.id] = normalized;
    });

    return out;
  }

  function getStorageArea() {
    return chrome.storage && chrome.storage.sync ? chrome.storage.sync : chrome.storage.local;
  }

  async function loadBindings() {
    const area = getStorageArea();
    const result = await area.get(STORAGE_KEY);
    return sanitizeBindings(result[STORAGE_KEY]);
  }

  async function saveBindings(bindings) {
    const area = getStorageArea();
    const sanitized = sanitizeBindings(bindings);
    await area.set({ [STORAGE_KEY]: sanitized });
    return sanitized;
  }

  async function resetBindings() {
    const area = getStorageArea();
    await area.set({ [STORAGE_KEY]: { ...DEFAULT_BINDINGS } });
    return { ...DEFAULT_BINDINGS };
  }

  function getBindingFromEvent(e) {
    if (!e || !e.code) return null;

    if (
      e.code === "ControlLeft" ||
      e.code === "ControlRight" ||
      e.code === "ShiftLeft" ||
      e.code === "ShiftRight" ||
      e.code === "AltLeft" ||
      e.code === "AltRight" ||
      e.code === "MetaLeft" ||
      e.code === "MetaRight"
    ) {
      return null;
    }

    if (e.code === "NumpadEnter") return "Enter";
    if (e.code === "IntlRo" || (e.key === "/" && !e.shiftKey)) return "Slash";
    return normalizeBinding(e.code) || normalizeBinding(e.key);
  }

  function eventMatchesBinding(e, binding) {
    if (!binding) return false;

    if (binding === "Slash") {
      return (
        e.code === "Slash" ||
        e.code === "IntlRo" ||
        (e.key === "/" && !e.shiftKey) ||
        e.key === "?"
      );
    }

    if (binding === "Enter") {
      return e.code === "Enter" || e.code === "NumpadEnter";
    }

    return e.code === binding;
  }

  window.YTKeybindings = {
    STORAGE_KEY,
    DEFAULT_BINDINGS,
    ACTIONS,
    normalizeBinding,
    prettyBinding,
    sanitizeBindings,
    loadBindings,
    saveBindings,
    resetBindings,
    getBindingFromEvent,
    eventMatchesBinding,
  };
})();

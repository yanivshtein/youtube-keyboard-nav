function getVideo() {
  return document.querySelector("video");
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function isTypingContext() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName ? el.tagName.toLowerCase() : "";
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

function togglePlay() {
  const v = getVideo();
  if (!v) return;
  if (v.paused) v.play();
  else v.pause();
}

function seek(deltaSeconds) {
  const v = getVideo();
  if (!v || Number.isNaN(v.duration)) return;
  v.currentTime = clamp(v.currentTime + deltaSeconds, 0, v.duration);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== "YT_COMMAND") return;
  if (isTypingContext()) return;

  switch (msg.command) {
    case "yt-toggle-play":
      togglePlay();
      break;
    case "yt-seek-back":
      seek(-5);
      break;
    case "yt-seek-forward":
      seek(5);
      break;
    default:
      break;
  }
});

let navMode = false;
let navIndex = 0;
let lastHighlighted = null;

function getVideoCandidates() {
  const cards = Array.from(document.querySelectorAll("ytd-rich-item-renderer"));

  return cards.filter((card) => {
    // Must have a real watch link inside
    const a = card.querySelector('a[href*="/watch"]');
    if (!a) return false;

    const rect = card.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}




function clearHighlight() {
  if (lastHighlighted) {
    lastHighlighted.style.boxShadow = "";
    lastHighlighted.style.borderRadius = "";
    lastHighlighted.style.background = "";
  }
  lastHighlighted = null;
}

function highlight(card) {
  clearHighlight();
  lastHighlighted = card;

  // Very visible highlight that won't get lost
  card.style.boxShadow = "0 0 0 4px #1a73e8";
  card.style.borderRadius = "14px";
  card.style.background = "rgba(26,115,232,0.08)";

  card.scrollIntoView({ block: "center", behavior: "smooth" });
}



function showNavToast(text) {
  // Tiny overlay so you know mode is ON/OFF
  let toast = document.getElementById("yt-nav-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "yt-nav-toast";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.padding = "10px 12px";
    toast.style.borderRadius = "10px";
    toast.style.background = "rgba(0,0,0,0.8)";
    toast.style.color = "white";
    toast.style.fontSize = "13px";
    toast.style.zIndex = "999999";
    toast.style.fontFamily = "system-ui, -apple-system, Arial";
    document.documentElement.appendChild(toast);
  }

  toast.textContent = text;
  toast.style.display = "block";

  clearTimeout(showNavToast._t);
  showNavToast._t = setTimeout(() => {
    toast.style.display = "none";
  }, 1200);
}

function toggleNavMode() {
  navMode = !navMode;
  navIndex = 0;
  clearHighlight();

  showNavToast(navMode ? "Navigation mode: ON" : "Navigation mode: OFF");

  if (navMode) {
    const items = getVideoCandidates();
    if (items.length > 0) highlight(items[0]);
  }
}

// Capture keyboard on YouTube pages
document.addEventListener(
  "keydown",
  (e) => {
    if (isTypingContext()) return;

    // Toggle navigation mode with Alt+Shift+N (Option+Shift+N on Mac)
    if (e.altKey && e.shiftKey && e.code === "KeyN") {
      e.preventDefault();
      toggleNavMode();
      return;
    }

    if (!navMode) return;
    console.log("NAV MODE key:", e.key, e.code);

    const items = getVideoCandidates();
    console.log("Candidates found:", items.length);

    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      navIndex = Math.min(items.length - 1, navIndex + 1);
      highlight(items[navIndex]);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      navIndex = Math.max(0, navIndex - 1);
      highlight(items[navIndex]);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const a = items[navIndex].querySelector('a[href*="/watch"]');
            if (a) a.click();

      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      navMode = false;
      clearHighlight();
      showNavToast("Navigation mode: OFF");
      return;
    }
  },
  true // capture phase helps beat some site handlers
);

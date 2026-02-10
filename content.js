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

let navIndex = 0;
let lastHighlighted = null;

function getVideoCandidates() {
  const cards = Array.from(
    document.querySelectorAll(
      [
        "ytd-rich-item-renderer",
        "ytd-compact-video-renderer",
        "ytd-compact-radio-renderer",
        "ytd-compact-playlist-renderer",
        "ytd-video-renderer",
        "ytd-reel-item-renderer",
        "ytd-channel-renderer",
        ".ytGridShelfViewModelGridShelfItem",
        "yt-lockup-view-model.ytd-item-section-renderer",
      ].join(",")
    )
  );

  return cards.filter((card) => {
    // Must have a real watch/shorts/channel link inside
    const a = card.querySelector(
      'a[href*="/watch"], a[href^="/shorts/"], a[href^="/@"]'
    );
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

function ensureSelection(items) {
  if (items.length === 0) return false;
  if (!lastHighlighted || !items.includes(lastHighlighted)) {
    navIndex = 0;
    highlight(items[0]);
  }
  return true;
}

function getCurrentIndex(items) {
  if (!lastHighlighted) return -1;
  return items.indexOf(lastHighlighted);
}

function findNextByDirection(items, direction) {
  if (!ensureSelection(items)) return -1;

  const currentIndex = getCurrentIndex(items);
  if (currentIndex < 0) return 0;

  const current = items[currentIndex];
  const currentRect = current.getBoundingClientRect();
  const cx = currentRect.left + currentRect.width / 2;
  const cy = currentRect.top + currentRect.height / 2;

  let bestIndex = -1;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let i = 0; i < items.length; i += 1) {
    if (i === currentIndex) continue;
    const rect = items[i].getBoundingClientRect();

    const tx = rect.left + rect.width / 2;
    const ty = rect.top + rect.height / 2;

    let valid = false;
    let primary = 0;
    let secondary = 0;

    if (direction === "down") {
      valid = rect.top >= currentRect.bottom + 4;
      primary = rect.top - currentRect.bottom;
      secondary = Math.abs(tx - cx);
    } else if (direction === "up") {
      valid = rect.bottom <= currentRect.top - 4;
      primary = currentRect.top - rect.bottom;
      secondary = Math.abs(tx - cx);
    } else if (direction === "right") {
      const verticalOverlap =
        Math.min(rect.bottom, currentRect.bottom) -
        Math.max(rect.top, currentRect.top);
      valid = rect.left >= currentRect.right + 4 && verticalOverlap > 0;
      primary = rect.left - currentRect.right;
      secondary = Math.abs(ty - cy);
    } else if (direction === "left") {
      const verticalOverlap =
        Math.min(rect.bottom, currentRect.bottom) -
        Math.max(rect.top, currentRect.top);
      valid = rect.right <= currentRect.left - 4 && verticalOverlap > 0;
      primary = currentRect.left - rect.right;
      secondary = Math.abs(ty - cy);
    }

    if (!valid) continue;

    const score = primary * 1000 + secondary;
    if (score < bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (bestIndex !== -1) return bestIndex;

  // Fallback: closest on the same row (tight vertical band)
  if (direction === "left" || direction === "right") {
    const maxVertical = currentRect.height * 0.6;
    for (let i = 0; i < items.length; i += 1) {
      if (i === currentIndex) continue;
      const rect = items[i].getBoundingClientRect();
      const tx = rect.left + rect.width / 2;
      const ty = rect.top + rect.height / 2;

      const verticalDistance = Math.abs(ty - cy);
      if (verticalDistance > maxVertical) continue;

      let valid = false;
      let primary = 0;
      let secondary = 0;

      if (direction === "right") {
        valid = tx > cx + 4;
        primary = tx - cx;
        secondary = verticalDistance;
      } else if (direction === "left") {
        valid = tx < cx - 4;
        primary = cx - tx;
        secondary = verticalDistance;
      }

      if (!valid) continue;

      const score = primary * 1000 + secondary;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
  }

  return bestIndex;
}

// Capture keyboard on YouTube pages
document.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Escape") {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        e.preventDefault();
        active.blur();
        return;
      }
    }

    if (e.key === "h" || e.key === "H") {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        active.blur();
      }
      e.preventDefault();
      window.location.href = "https://www.youtube.com/";
      return;
    }

    if (isTypingContext()) return;

    const items = getVideoCandidates();
    if (items.length === 0) return;

    if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      const nextIndex = findNextByDirection(items, "down");
      if (nextIndex >= 0) {
        navIndex = nextIndex;
        highlight(items[navIndex]);
      }
      return;
    }

    if (e.key === "w" || e.key === "W") {
      e.preventDefault();
      const nextIndex = findNextByDirection(items, "up");
      if (nextIndex >= 0) {
        navIndex = nextIndex;
        highlight(items[navIndex]);
      }
      return;
    }

    if (e.key === "d" || e.key === "D") {
      e.preventDefault();
      const nextIndex = findNextByDirection(items, "right");
      if (nextIndex >= 0) {
        navIndex = nextIndex;
        highlight(items[navIndex]);
      }
      return;
    }

    if (e.key === "a" || e.key === "A") {
      e.preventDefault();
      const nextIndex = findNextByDirection(items, "left");
      if (nextIndex >= 0) {
        navIndex = nextIndex;
        highlight(items[navIndex]);
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (!ensureSelection(items)) return;
      const card = items[navIndex];
      const a =
        card.querySelector('a[href*="/watch"]') ||
        card.querySelector('a[href^="/shorts/"]') ||
        card.querySelector('a[href^="/@"]');
      if (!a) return;

      if (e.ctrlKey || e.metaKey) {
        window.open(a.href, "_blank");
      } else {
        a.click();
      }

      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      clearHighlight();
      navIndex = 0;
      return;
    }
  },
  true // capture phase helps beat some site handlers
);

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

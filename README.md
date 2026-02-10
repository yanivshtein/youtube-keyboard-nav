# YouTube Keyboard Nav

A browser extension that enables keyboard navigation on YouTube pages (navigate thumbnails, open videos, and control playback using the keyboard).

## Installation (Developer / Unpacked)
1. Open Chrome/Edge: go to `chrome://extensions/` (or Firefox: `about:debugging#/runtime/this-firefox`).
2. Enable "Developer mode".
3. Click "Load unpacked" and select this project folder (`youtube keyboard nav`).
4. Confirm the extension is listed and enabled.

## How to operate the extension
1. Open YouTube. The extension is always on; no toggle is required.
2. Use the keyboard shortcuts below to move around thumbnails and control playback.

Keyboard shortcuts:
- A / D: move selection horizontally between thumbnails (where applicable).
- W / S: move selection vertically through the list or grid of videos.
- Enter: open the currently selected video.
- Ctrl + Enter: open the selected video in a new tab.
- B: go back to the previous page.
- Space: toggle play / pause when the video player has focus.
- `/` (slash): focus the YouTube search box (YouTube default).
- Esc: clear selection / blur search.
- `f` or Shift+F: toggle fullscreen when the player has focus.

Note: Some default YouTube keys remain active; this extension augments navigation for lists/grids, search results, and the Home page sidebar.

## Customizing keyboard shortcuts
- In Chrome/Edge go to `chrome://extensions/shortcuts` to view or change assigned shortcuts for this extension.
- In Firefox, check the extension's "Manage" page or extension settings (if available) for shortcut options.

## Troubleshooting
- Extension not working: ensure it is enabled and re-load unpacked extension.
- Conflicting shortcuts: reassign via `chrome://extensions/shortcuts`.
- If YouTube updates change page structure, try reloading the page or the extension.

## Feedback & Contributing
Please open issues or pull requests in this repository with bug reports or suggestions.

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) return;

  if (!tab.url.startsWith("https://www.youtube.com/")) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "YT_COMMAND", command });
  } catch (err) {
    // Content script isn't present in this tab (yet)
    console.warn("No content script in this tab. Refresh YouTube page.", err);
  }
});

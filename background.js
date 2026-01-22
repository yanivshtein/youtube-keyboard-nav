chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || !tab.url) return;

  if (!tab.url.startsWith("https://www.youtube.com/")) return;

  chrome.tabs.sendMessage(tab.id, { type: "YT_COMMAND", command });
});

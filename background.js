chrome.action.onClicked.addListener(async (tab) => {
  // Inject content script into the current tab
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });
});

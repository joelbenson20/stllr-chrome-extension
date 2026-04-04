chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Re-init when user switches tabs
chrome.tabs.onActivated.addListener(() => {
  chrome.runtime.sendMessage({ type: "TAB_CHANGED" }).catch(() => {});
});

// Re-init when the current tab navigates to a new URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    chrome.runtime.sendMessage({ type: "TAB_CHANGED" }).catch(() => {});
  }
});

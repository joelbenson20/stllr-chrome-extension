chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// When the side panel opens, init if the tab is already fully loaded
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'side_panel') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.status === 'complete') {
        chrome.runtime.sendMessage({ type: "TAB_CHANGED" }).catch(() => {});
      }
    });
  }
});

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

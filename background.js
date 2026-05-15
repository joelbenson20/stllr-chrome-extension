chrome.action.onClicked.addListener(async (tab) => {

    // Clear old page data
    chrome.storage.session.remove('pageData');

    // Open the side panel for the current tab
    await chrome.sidePanel.open({ tabId: tab.id });

    // Read page data and store it before notifying the panel
    const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
            head: document.head.innerHTML,
            innerText: document.documentElement.innerText
        })
    });
    await chrome.storage.session.set({
        pageData: {
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
            head: result.head,
            innerText: result.innerText
        }
    });
})
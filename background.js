chrome.action.onClicked.addListener(async (tab) => {

    // Clear old page data
    chrome.storage.session.remove('page');

    // Open the side panel for the current tab
    await chrome.sidePanel.open({ tabId: tab.id });

    try {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async () => {
                if (document.readyState === 'loading') {
                    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
                }
                return { head: document.head.innerHTML, innerText: document.documentElement.innerText };
            }
        });
        await chrome.storage.session.set({
            page: {
                restricted: false,
                data: {
                    url: tab.url,
                    title: tab.title,
                    favIconUrl: tab.favIconUrl,
                    head: result.head,
                    innerText: result.innerText
                }
            }
        });
    } catch (e) {
        await chrome.storage.session.set({
            page: { 
                restricted: true ,
                data: null
            }
        })
    }
})

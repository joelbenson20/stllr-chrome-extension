import { BASE_URL, getContent } from './api.js';
import { indexView } from './views.js';


export async function initOnReady() {
    renderLoadingSpinner();
    var inited = false;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    async function maybeRefresh() {
        if (!inited) {
            inited = true;
            indexView();
        }
    }

    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            maybeRefresh();
        }
    });

    // Re-check in case the tab finished loading between the query and the listener being attached
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab.status === 'complete') {
        maybeRefresh();
    }
}

function renderLoadingSpinner() {
    document.body.innerHTML = `
    <div class="position-fixed vh-100 w-100 d-flex justify-content-center align-items-center top-0 start-0">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>`
}

initOnReady();
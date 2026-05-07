import { BASE_URL, getContent } from './api.js';
import { initPageStarButtons } from './libs/stllr/pages.js';
import { initComments } from './libs/stllr/comments.js';


async function initOnReady() {
    renderLoadingSpinner();
    var inited = false;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    function maybeRefresh() {
        if (!inited) {
            inited = true;
            getContent('extension/');
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

export function initPanelElements() {
    initViewButtons();
    initLinks();
    initBootstrapTooltips();
    initPageStarButtons();
    initComments();
}

function initViewButtons() {
    const refreshButton = document.getElementById('refreshButton');
    refreshButton.addEventListener('click', (e) => {
        initOnReady();
    })
    const forumLink = document.getElementById('forumLink');
    forumLink.addEventListener('click', (e) => {
        getContent('extension/forum/');
    })
    const chatLink = document.getElementById('relayLink');
    chatLink.addEventListener('click', (e) => {
        getContent('extension/relay/');
    })
    const similarLink = document.getElementById('similarLink');
    similarLink.addEventListener('click', (e) => {
        getContent('extension/similar/');
    })
}

function initLinks() {
    document.body.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href]');
        if (!anchor){
            return
        }
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')){
            return
        }
        e.preventDefault();
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.update(tabs[0].id, { url: href });
    });
})}

function initBootstrapTooltips() {
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]',
    );
    const tooltipList = [...tooltipTriggerList].map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
    );
}

initOnReady();
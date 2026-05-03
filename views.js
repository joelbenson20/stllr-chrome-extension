import { getCSRFToken, getPageData, BASE_URL } from './api.js';
import { initPageStarButtons } from './pages.js';
import { initComments } from './comments.js';

async function refresh() {

    var pageData = await getPageData();
    var csrfToken = await getCSRFToken();
    if (!csrfToken) {
        return
    }

    try {
        fetch(BASE_URL + 'extension/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({ pageData })
        })
        .then(response => response.json())
        .then(response => {
            if (response.status === "200") {
                document.body.innerHTML = response.html
                initBootstrapTooltips();
                initLinks();
                initRefreshButton();
                initForumLink();
                initChatLink();
                initPageStarButtons();
            }
            else if (response.status === "405"){
                document.body.innerHTML = response.html
            }
        })
    }
    catch {
        document.body.innerHTML = 'Fetch to server failed.'
    }
}

export async function refreshOnReady() {

    var refreshed = false;
    renderLoadingSpinner();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    function maybeRefresh() {
        if (!refreshed) {
            refreshed = true;
            refresh();
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

async function forum() {

    var pageData = await getPageData();
    var csrfToken = await getCSRFToken();
    if (!csrfToken) {
        return
    }

    try {
        fetch(BASE_URL + 'extension/forum/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({ pageData })
        })
        .then(response => response.json())
        .then(response => {
            if (response.status === "200") {
                document.body.innerHTML = response.html
                initBootstrapTooltips();
                initLinks();
                initRefreshButton();
                initForumLink();
                initChatLink();
                initPageStarButtons();
            }
            else if (response.status === "403" || response.status === "404"){
                document.body.innerHTML = response.html
            }
        })
    }
    catch {
        document.body.innerHTML = 'Fetch to server failed.'
    }
}

async function chat() {

    var pageData = await getPageData();
    var csrfToken = await getCSRFToken();
    if (!csrfToken) {
        return
    }

    try {
        fetch(BASE_URL + 'extension/chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({ pageData })
        })
        .then(response => response.json())
        .then(response => {
            if (response.status === "200") {
                document.body.innerHTML = response.html
                initBootstrapTooltips();
                initLinks();
                initRefreshButton();
                initForumLink();
                initChatLink();
                initPageStarButtons();
            }
            else if (response.status === "403" || response.status === "404"){
                document.body.innerHTML = response.html
            }
        })
    }
    catch {
        document.body.innerHTML = 'Fetch to server failed.'
    }
}


function initRefreshButton() {
    const refreshButton = document.getElementById('refreshButton');
    refreshButton.addEventListener('click', (e) => {
        refreshOnReady();
    })
}

function initForumLink() {
    const forumLink = document.getElementById('forumLink');
    forumLink.addEventListener('click', (e) => {
        forum();
    })
}

function initChatLink() {
    const chatLink = document.getElementById('chatLink');
    chatLink.addEventListener('click', (e) => {
        chat()
    })
}

function initBootstrapTooltips() {
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]',
    );
    const tooltipList = [...tooltipTriggerList].map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
    );
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

function renderLoadingSpinner() {
    document.body.innerHTML = `
    <div class="position-fixed vh-100 w-100 d-flex justify-content-center align-items-center top-0 start-0">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>`
}
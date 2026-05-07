import { initPanelElements } from './index.js';


export const BASE_URL = "http://127.0.0.1:8000/";

const CSRF_TOKEN_PATH = 'extension/csrf-token/';

export async function getCSRFToken() {
    try {
        const response = await fetch(BASE_URL + CSRF_TOKEN_PATH, {
            method: "GET",
            credentials: "include",
        });
        const data = await response.json();
        if (data.status === '200') {
            return data.csrfToken;
        } else if (data.status === '401') {
            document.body.innerHTML = data.html;
        }
    } catch {
        document.body.innerHTML = "<p>Failed to connect to the server.</p>";
        return null;
    }
}

export async function getPageData() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            const readMeta = (property) =>
                document.querySelector(`meta[property="${property}"]`)?.content ||
                document.querySelector(`meta[name="${property}"]`)?.content ||
                null;

            return {
                head: document.head.innerHTML,
                innerText: document.documentElement.innerText
            };
        },
    });

    return {
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
        head: result.head,
        innerText: result.innerText,
    };
}

export async function getContent(path) {
    var pageData = await getPageData();
    var csrfToken = await getCSRFToken();
    if (!csrfToken) {
        return
    }

    try {
        fetch(BASE_URL + path, {
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
            document.body.innerHTML = response.html
            initPanelElements()
        })
    }
    catch {
        document.body.innerHTML = "Stllr's web server is not responding."
    }
}
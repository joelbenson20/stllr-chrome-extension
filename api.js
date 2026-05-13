export const BASE_HOST = "127.0.0.1:8000";
export const BASE_URL = "http://127.0.0.1:8000/";

const CSRF_TOKEN_PATH = 'api/csrf-token/';
const WS_TICKET_PATH = 'api/ws-ticket/';

export async function getCSRFToken() {
    try {
        const response = await fetch(BASE_URL + CSRF_TOKEN_PATH, {
            method: "GET",
            credentials: "include",
        });
        const data = await response.json();
        return data.csrfToken
    } catch {
        console.log('Failed to get CSRF token.')
        return null;
    }
}

export async function getWSTicket() {
    try {
        const response = await fetch(BASE_URL + WS_TICKET_PATH, {
            method: "GET",
            credentials: "include",
        });
        const data = await response.json();
        return data.ticket
    } catch {
        console.log('Failed to get WebSocket ticket.')
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
        const response = await fetch(BASE_URL + path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({ pageData })
        });
        const data = await response.json();
        return data.html;
    }
    catch {
        document.body.innerHTML = "Stllr's web server is not responding."
    }
}
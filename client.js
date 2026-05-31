export const STLLR_URL = 'http://127.0.0.1:8000';

const CSRF_TOKEN_PATH = '/extension/csrf-token/';
const WS_TICKET_PATH = '/extension/ws-ticket/';

const EXTENSION_VERSION = chrome.runtime.getManifest().version;


export async function fetchCSRFToken() {
    let response;
    try {
        response = await fetch(STLLR_URL + CSRF_TOKEN_PATH, {
            method: "GET",
            credentials: "include",
            headers: { 'X-Extension-Version': EXTENSION_VERSION },
        });
    } catch {
        return {
            ok: false,
            status: 503,
            html: '<p class="p-4">Failed to connect to the stllr web server.</p>'
        }
    }
    const data = await response.json();
    if (!response.ok) {
        return {
            ok: false,
            status: response.status,
            html: data.html
        }
    }
    return {
        ok: response.ok,
         ...data
    }
}

export async function fetchWSTicket() {
    try {
        const response = await fetch(STLLR_URL + WS_TICKET_PATH, {
            method: "GET",
            credentials: "include",
            headers: { 'X-Extension-Version': EXTENSION_VERSION },
        });
        const data = await response.json();
        return data.ticket
    } catch {
        console.log('Failed to fetch WebSocket ticket.')
        return null;
    }
}

export async function fetchView(path) {

    var csrfToken;
    var response = await fetchCSRFToken();
    if (!response.ok) {
        return response.html;
    }
    csrfToken = response.token;

    let fetchResponse;
    try {
        fetchResponse = await fetch(STLLR_URL + path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
                'X-Extension-Version': EXTENSION_VERSION
            },
            credentials: 'include',
            body: JSON.stringify(await chrome.storage.session.get('page'))
        });
    } catch {
        return '<p class="p-4">Failed to connect to the stllr web server.</p>';
    }
    const data = await fetchResponse.json();
    return data.html;
}
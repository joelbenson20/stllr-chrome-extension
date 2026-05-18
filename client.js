export const STLLR_URL = "http://127.0.0.1:8000";

const CSRF_TOKEN_PATH = '/extension/csrf-token/';
const WS_TICKET_PATH = '/extension/ws-ticket/';


export async function fetchCSRFToken() {
    try {
        var response = await fetch(STLLR_URL + CSRF_TOKEN_PATH, {
            method: "GET",
            credentials: "include",
        });
        response = await response.json();
        return response;
    } catch {
        return {
            status: 500,
            html: '<p class="p-4">We have failed to make contact with the Stllr web server.</p>'
        }
    }
}

export async function fetchWSTicket() {
    try {
        const response = await fetch(STLLR_URL + WS_TICKET_PATH, {
            method: "GET",
            credentials: "include",
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
    if (response.status === 200) {
        csrfToken = response.token
    }
    else if (response.status === 403 || response.status === 500) {
        return response.html
    }

    try {
        response = await fetch(STLLR_URL + path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify(await chrome.storage.session.get('page'))
        });
        response = await response.json();
        return response.html;
    }
    catch {
        return '<p class="p-4">We have failed to make contact with the Stllr web server.</p>'
    }
}
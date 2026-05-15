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


export async function getContent(path) {
    var { pageData } = await chrome.storage.session.get('pageData');
    var csrfToken = await getCSRFToken();
    if (!csrfToken) {
        return "Please log in to use Stllr. (Or our server is down.)";
    }

    try {
        var response = await fetch(BASE_URL + path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({ pageData })
        });
        response = await response.json();
        return response.html;
    }
    catch {
        return "Stllr's web server is not responding.";
    }
}
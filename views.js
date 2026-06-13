import { STLLR_URL, fetchView } from './client.js';
import { initRoom, closeRoomSocket } from './libs/stllr/rooms.js';


let _loadingPromise = null; // Track loading status

export async function loadingView() {
    if (_loadingPromise) return _loadingPromise;
    _loadingPromise = (async () => {
        document.body.innerHTML = `
            <div class="d-flex justify-content-center align-items-center vh-100">
                <div class="glow-expand" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        await new Promise(resolve => setTimeout(resolve, 750));
        _loadingPromise = null;
    })();
    return _loadingPromise;
}

export async function restrictedView() {
    document.body.innerHTML = await fetchView('/extension/restricted/');
}

export async function indexView() { // Defaults to forum view
    document.body.innerHTML = await fetchView('/extension/');
    document.body.classList.remove('fade-in');
    void document.body.offsetWidth;
    document.body.classList.add('fade-in');
    init();
}

async function frameView() {
    document.body.innerHTML = await fetchView('/extension/?tab=frame');
    init();
}

 async function forumView() {
    document.body.innerHTML = await fetchView('/extension/?tab=forum');
    init();
 }

 async function roomView() {
    document.body.innerHTML = await fetchView('/extension/?tab=room');
    init();
    await initRoom();
 }

 async function nearbyView() {
    document.body.innerHTML = await fetchView('/extension/?tab=nearby');
    init();
 }

function init() {

    // Close room socket if open
    closeRoomSocket();

    // Initalize tab buttons
    const frameTab = document.getElementById('frameTab');
    frameTab?.addEventListener('click', async (e) => {
        frameView();
    })

    const forumTab = document.getElementById('forumTab');
    forumTab?.addEventListener('click', async (e) => {
        forumView();
    })
    const roomTab = document.getElementById('roomTab');
    roomTab?.addEventListener('click', async (e) => {
        roomView();
    })
    const nearbyTab = document.getElementById('nearbyTab');
    nearbyTab?.addEventListener('click', async (e) => {
        nearbyView();
    })

    // Initialize bootstrap elements
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]',
    );
    const tooltipList = [...tooltipTriggerList].map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
    );
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(
    (el) => new bootstrap.Popover(el),
    );

    // Initialize external links
    document.body.addEventListener('click', (e) => {
        if (e.defaultPrevented) return;
        const anchor = e.target.closest('a[href]');
        if (!anchor) {
            return
        }
        const raw = anchor.getAttribute('href');
        const href = raw.startsWith('http') ? raw : STLLR_URL + raw;
        if (!href || href.startsWith('#')) {
            return
        }
        e.preventDefault();
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (anchor.target === '_blank') {
                chrome.tabs.create({ url: href, openerTabId: tabs[0].id });
            } else {
                chrome.tabs.update(tabs[0].id, { url: href });
            }
        });
    })

}
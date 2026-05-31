import { STLLR_URL, fetchView } from './client.js';
import { initPages } from './libs/stllr/pages.js';
import { initForums } from './libs/stllr/forums.js';
import { initRoom, closeRoomSocket } from './libs/stllr/rooms.js';
import { initModals } from './libs/stllr/modals.js';


export async function loadingView() {
    document.body.innerHTML = `
        <div class="d-flex justify-content-center align-items-center vh-100">
            <div class="glow-expand" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    await new Promise(resolve => setTimeout(resolve, 750));
}

export async function restrictedView() {
    document.body.innerHTML = await fetchView('/extension/restricted/');
}

export async function indexView() {
    document.body.innerHTML = await fetchView('/extension/');
    document.body.classList.remove('fade-in');
    void document.body.offsetWidth;
    document.body.classList.add('fade-in');
    init();
    initForums(); // Defaults to forum
}

 async function forumView() {
    document.body.innerHTML = await fetchView('/extension/?tab=forum');
    init();
    initForums();
 }

 async function roomView() {
    document.body.innerHTML = await fetchView('/extension/?tab=room');
    init();
    await initRoom();
 }

 async function similarView() {
    document.body.innerHTML = await fetchView('/extension/?tab=similar');
    init();
 }

function init() {

    // Close room socket if open
    closeRoomSocket();

    // Initalize tab buttons
    const forumTab = document.getElementById('forumTab');
    forumTab.addEventListener('click', async (e) => {
        forumView();
    })
    const roomTab = document.getElementById('roomTab');
    roomTab.addEventListener('click', async (e) => {
        roomView();
    })
    const similarTab = document.getElementById('similarTab');
    similarTab.addEventListener('click', async (e) => {
        similarView();
    })

    // Initialize bootstrap elements
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]',
    );
    const tooltipList = [...tooltipTriggerList].map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
    );

    // Initialize stllr elements
    initPages();
    initModals();

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
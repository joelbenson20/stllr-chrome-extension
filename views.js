import { STLLR_URL, fetchView } from './client.js';
import { initPages } from './libs/stllr/pages.js';
import { initForum } from './libs/stllr/forums.js';
import { initRoom, closeRoomSocket } from './libs/stllr/rooms.js';


export async function loadingView() {
    document.body.innerHTML = await fetchView('/extension/loading/');
}

export async function restrictedView() {
    document.body.innerHTML = await fetchView('/extension/restricted/');
}

export async function indexView() {
    document.body.innerHTML = await fetchView('/extension/');
    init();
    initForum(); // Defaults to forum
}

 async function forumView() {
    document.body.innerHTML = await fetchView('/extension/?tab=forum');
    init();
    initForum();
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

    // Initialize stllr elements
    initPages();

    // Initialize external links
    document.body.addEventListener('click', (e) => {
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
            chrome.tabs.update(tabs[0].id, { url: href });
        })
    })

    // Initialize bootstrap elements
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]',
    );
    const tooltipList = [...tooltipTriggerList].map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
    );

    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    const popoverList = [...popoverTriggerList].map(
        (popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl, {trigger: 'hover'})
    );

}
import { getContent } from './api.js';
import { initOnReady } from './index.js';
import { initPageStarButtons } from './libs/stllr/pages.js';
import { initForum } from './libs/stllr/forums.js';
import { initRoom } from './libs/stllr/rooms.js';

export async function indexView() {
    document.body.innerHTML = await getContent('extension/');
    initElements();
    initForum();
}

 async function forumView() {
    document.body.innerHTML = await getContent('extension/forum/');
    initElements();
    initForum();
 }

 async function roomView() {
    document.body.innerHTML = await getContent('extension/room/');
    initElements();
    await initRoom();
 }


 async function similarView() {
    document.body.innerHTML = await getContent('extension/similar/');
    initElements();
 }

function initElements() {

    // Initialize extension tabs
    const refreshButton = document.getElementById('refreshButton');
    refreshButton.addEventListener('click', (e) => {
        initOnReady();
    })
    const forumLink = document.getElementById('forumLink');
    forumLink.addEventListener('click', async (e) => {
        forumView();
    })
    const roomLink = document.getElementById('roomLink');
    roomLink.addEventListener('click', async (e) => {
        roomView();
    })
    const similarLink = document.getElementById('similarLink');
    similarLink.addEventListener('click', async (e) => {
        similarView();
    })

    // Initialize links to redirect current tab
    document.body.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href]');
        if (!anchor) {
            return
        }
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) {
            return
        }
        e.preventDefault();
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.update(tabs[0].id, { url: href });
        })
    })

    // Initialize bootstrap tooltips
    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]',
    );
    const tooltipList = [...tooltipTriggerList].map(
        (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
    );

    // Initialize page star buttons
    initPageStarButtons();

}
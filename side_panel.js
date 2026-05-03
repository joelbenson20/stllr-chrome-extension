import { getCsrfToken, getPageData, BASE_URL } from './api.js';
import { initPageStarButtons } from './pageStarButtons.js';
import { initComments } from './comments.js';

const EXTENSION_WINDOW = document.getElementById('extensionWindow');
const REFRESH_BUTTON = document.getElementById('refreshButton');

async function init() {
  
  const pageData = await getPageData();
  
  let csrfToken = await getCsrfToken();
  if (!csrfToken) {
    throw new Error("Failed to get CSRF token. Please ensure you are logged in to the Float web application and that the Float server is not down.");
  }

  try {
    let response = await fetch(BASE_URL + 'extension/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({ pageData })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
    }

    response = await response.json();
    EXTENSION_WINDOW.innerHTML = response.html;

  } catch (error) {
    console.error('Error fetching extension data:', error);
    EXTENSION_WINDOW.innerHTML = '<p>' + error.message + '</p>';
    return;
  }

  const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]',
  );
  const tooltipList = [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
  );

  initPageStarButtons();
  initComments();

  EXTENSION_WINDOW.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    e.preventDefault();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.update(tabs[0].id, { url: href });
    });
  });

}

function initWhenReady() {

  EXTENSION_WINDOW.innerHTML = `
    <div class="d-flex justify-content-center p-3">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
}

initWhenReady()

REFRESH_BUTTON.addEventListener('click', (e) => {
  initWhenReady();
})
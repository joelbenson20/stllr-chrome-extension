import { getCsrfToken, getPageData, FLOAT_API_URL } from './api.js';
import { initPageVoteButtons } from './pageVotes.js';
import './commentsAPI.js';

const EXTENSION_WINDOW = document.getElementById('extensionWindow');

async function init() {

  EXTENSION_WINDOW.innerHTML = `
    <div class="d-flex justify-content-center p-3">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;  
  
  const pageData = await getPageData();
  let csrfToken = await getCsrfToken();
  if (!csrfToken) {
    throw new Error("Failed to get CSRF token. Please ensure you are logged in to the Float web application and that the Float server is not down.");
  }

  try {

    let response = await fetch(`${FLOAT_API_URL}/extension/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({ pageData })
    });

    response = await response.json();
    EXTENSION_WINDOW.innerHTML = response.html;

  } catch (error) {
    console.error('Error fetching extension data:', error);
    EXTENSION_WINDOW.innerHTML = '<p>' + error.message + '</p>';
    return;
  }

  //initialize tooltips
  const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]',
  );
  const tooltipList = [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
  );

  //initialize vote buttons
  initPageVoteButtons();

}


init().catch((error) => {
  console.error(error);
  EXTENSION_WINDOW.innerHTML = '<p>' + error.message + '</p>';
})

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TAB_CHANGED") {
    init().catch(error);
    EXTENSION_WINDOW.innerHTML = '<p>' + error.message + '</p>';
  }
});
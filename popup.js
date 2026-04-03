import { initFloatButtons, FLOAT_API_URL } from './api.js';

async function getCurrentTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.url;
}

async function init() {
  const extensionWindow = document.getElementById('extensionWindow');
  const webpageUrl = await getCurrentTabUrl();

  const response = await fetch(`${FLOAT_API_URL}/extension`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'URL': webpageUrl
    },
    credentials: 'include'
  });

  const data = await response.json();

  await chrome.storage.session.set({ csrfToken: data.csrfToken });

  extensionWindow.innerHTML = data.html;
  initFloatButtons();
}

init().catch(error => console.error('Error:', error));
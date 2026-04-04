import { getCsrfToken, initFloatButtons, FLOAT_API_URL } from './api.js';

const EXTENSION_WINDOW = document.getElementById('extensionWindow');

async function getWebpageData() {

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found. Try refreshing the page or clicking the extension icon again.");

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const readMeta = (property) =>
        document.querySelector(`meta[property="${property}"]`)?.content ||
        document.querySelector(`meta[name="${property}"]`)?.content ||
        null;

      return {
        description: readMeta('og:description') || null,
        imageUrl: readMeta('og:image') || null,
        siteName: readMeta('og:site_name') || null
      };
    }
  });

  return {
    url: tab.url,
    title: tab.title,
    description: result.description,
    imageUrl: result.imageUrl,
    siteName: result.siteName,
    favIconUrl: tab.favIconUrl
  };

}

async function init() {

  EXTENSION_WINDOW.innerHTML = '<p>Loading...</p>';
  const webpageData = await getWebpageData();

  try {

    const response = await fetch(`${FLOAT_API_URL}/extension/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': await getCsrfToken()
    },
    credentials: 'include',
    body: JSON.stringify({ webpageData })
  });

  const payload = await response.json();
  EXTENSION_WINDOW.innerHTML = payload.html;

  }
  catch (error) {
    console.error('Error fetching extension data:', error);
    EXTENSION_WINDOW.innerHTML = '<p>Error loading content.</p>';
    return;
  }

  initFloatButtons();
}

init().catch((error) => {
  console.error(error);
  EXTENSION_WINDOW.innerHTML = '<p>' + error.message + '</p>';
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TAB_CHANGED") {
    init().catch((error) => {
      console.error(error);
      EXTENSION_WINDOW.innerHTML = '<p>' + error.message + '</p>';
    });
  }
});
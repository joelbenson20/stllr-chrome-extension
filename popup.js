import { initFloatButtons, FLOAT_API_URL } from './api.js';

async function getOgMetadataFromActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const readMeta = (property) =>
          document.querySelector(`meta[property="${property}"]`)?.content ||
          document.querySelector(`meta[name="${property}"]`)?.content ||
          null;

        return {
          description: readMeta('og:description') || null,
          imageUrl: readMeta('og:image') || null
        };
      }
    });

    return {
      url: tab.url,
      title: tab.title,
      description: result?.description || '',
      imageUrl: result?.imageUrl || ''
    };
  } catch (error) {
    console.warn('Could not read OG metadata from active tab:', error);
    return {
      url: tab.url,
      title: tab.title,
      description: '',
      imageUrl: ''
    };
  }
}

async function init() {
  const extensionWindow = document.getElementById('extensionWindow');
  const webpageData = await getOgMetadataFromActiveTab();

  const response = await fetch(`${FLOAT_API_URL}/extension`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'webpageData': JSON.stringify(webpageData),
    },
    credentials: 'include',
  });

  const data = await response.json();

  await chrome.storage.session.set({ csrfToken: data.csrfToken });

  extensionWindow.innerHTML = data.html;
  initFloatButtons();
}

init().catch(error => console.error('Error:', error));
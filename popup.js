import { initFloatButtons, FLOAT_API_URL } from './api.js';

async function getWebpageData() {
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
          imageUrl: readMeta('og:image') || null,
          siteName: readMeta('og:site_name') || null
        };
      }
    });

    return {
      url: tab.url,
      title: tab.title,
      description: result?.description,
      imageUrl: result?.imageUrl,
      siteName: result?.siteName,
      favIconUrl: tab.favIconUrl
    };
  } catch (error) {

    console.warn('Could not read OG metadata from active tab:', error);

    return {
      url: tab.url,
      title: tab.title,
      description: '',
      imageUrl: '',
      siteName: '',
      favIconUrl: tab.favIconUrl
    };

  }
}

async function init() {
  const extensionWindow = document.getElementById('extensionWindow');
  const webpageData = await getWebpageData();

  try {  

  const response = await fetch(`${FLOAT_API_URL}/extension`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'webpageData': JSON.stringify(webpageData),
    },
    credentials: 'include',
  });

  const payload = await response.json();

  extensionWindow.innerHTML = payload.html;

  } catch (error) {
    console.log('Error connecting to the server:', error);
    extensionWindow.innerHTML = '<p>Error connecting to the server.</p>';
    return;
  }

  initFloatButtons();
}

init().catch(error => console.error('Error:', error));
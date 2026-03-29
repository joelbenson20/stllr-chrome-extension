async function getCurrentTabUrl() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab.url;
}

async function init() {

  const FLOAT_API_URL = 'http://127.0.0.1:8000/api';
  const extensionWindow = document.getElementById('extensionWindow');
  const webpageUrl = await getCurrentTabUrl();

  fetch(`${FLOAT_API_URL}/extension`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'URL': webpageUrl
    }
  })
    .then(response => {
        return response.text();
    })
    .then( html => {
      extensionWindow.innerHTML = html;
    })
    .catch(error => console.error('Error:', error));
}

init();
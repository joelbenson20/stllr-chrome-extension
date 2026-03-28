const FLOAT_API_URL = 'http://127.0.0.1:8000/api';
const feedWindow = document.getElementById('feedWindow');

async function getUrl() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions); 
  return tab.url;
}

getUrl().then((url) => {
  document.getElementById('urlDisplay').innerText = url;
});

fetch(`${FLOAT_API_URL}/index`)
      .then(response => {
        return response.text();
      })
      .then( html => {
        feedWindow.innerHTML = html;
      })
      .catch(error => console.error('Error:', error));

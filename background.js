let urlDisplay = document.getElementById('urlDisplay');

async function updateUrl() {
  let queryOptions = { active: true, currentWindow: true };
  // chrome.tabs.query returns a promise in Manifest V3 service workers
  let [tab] = await chrome.tabs.query(queryOptions); 

  urlDisplay.innerText = tab.url;
}

updateUrl(); // Call the function to update the URL display when the popup is opened
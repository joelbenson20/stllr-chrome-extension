import { BASE_URL, getContent } from './api.js';
import { indexView } from './views.js';

renderLoadingSpinner();

// Refresh panel when a new pageData value is written to session storage
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'session' && changes.pageData?.newValue) {
        indexView();
    }
})
// If session storage is already set, fall back to 'get' method
chrome.storage.session.get('pageData').then(({ pageData }) => {
    if (pageData) indexView();
})

function renderLoadingSpinner() {
    document.body.innerHTML = `
    <div class="position-fixed vh-100 w-100 d-flex justify-content-center align-items-center top-0 start-0">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>`
}

import { loadingView, restrictedView, indexView } from './views.js';


// Set loading view
await loadingView();

// Index view when a new page value is written to session storage
chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'session' && changes.page?.newValue) {
        await loadingView();
        const page = changes.page.newValue;
        page.restricted ? restrictedView() : indexView();
    }
})

// Or if page is already set in storage
chrome.storage.session.get('page').then(({ page }) => {
    page.restricted ? restrictedView() : indexView()
})
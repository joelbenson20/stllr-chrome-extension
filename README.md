# stellr-chrome-extension

**The universal forum.**

stellr is a Chrome extension that turns every webpage on the internet into a discussion forum. When you open the side panel on any page, stellr fetches (or creates) a forum thread tied to that URL, letting you read and post comments, reply to other users, and star pages and comments — all without leaving the page you're on.

The extension is the client half of the stellr platform. It pairs with a stellr (a.k.a. Float) web backend that stores users, pages, comments, and stars, and renders the forum HTML returned to the side panel.

## How it works

1. Clicking the toolbar icon opens stellr in Chrome's side panel.
2. The extension scrapes basic metadata from the active tab (URL, title, favicon, page text, `<head>`) and POSTs it to the backend.
3. The backend looks up or creates a forum entry for that URL and returns rendered HTML for the page's comment thread.
4. The HTML is injected into the side panel, and the extension wires up interactivity for comment forms, replies, and star buttons.

## Repository layout

### Extension entry points

- **[manifest.json](manifest.json)** — Manifest V3 declaration. Registers the side panel, the `background.js` service worker, and host permissions for the stellr backend plus all `http(s)` sites (so page scraping works anywhere).
- **[background.js](background.js)** — Service worker. Configures Chrome so clicking the extension's toolbar icon opens the side panel.
- **[side_panel.html](side_panel.html)** — Side panel markup. Includes Bootstrap, the top button bar (enter forum / page info / comments / chat), and the `#extensionWindow` container the backend HTML is injected into.
- **[side_panel.css](side_panel.css)** — Side panel styling (dark theme, glass effect helper).
- **[side_panel.js](side_panel.js)** — Side panel controller. On load (and on refresh) it fetches a CSRF token, sends the active tab's page data to `extension/` on the backend, injects the returned HTML, and initializes Bootstrap tooltips, page star buttons, and comment interactions.

### Modules

- **[api.js](api.js)** — Backend communication helpers. Exports `BASE_URL`, `getCsrfToken()` (fetches a CSRF token from `extension/csrf-token/` with credentials), and `getPageData()` (uses `chrome.scripting.executeScript` to extract `head` HTML and `innerText` from the active tab, plus its URL/title/favicon).
- **[comments.js](comments.js)** — Comment-thread interactivity. `initComments()` wires up every comment form, reply form, and star button on the page. Submitting a comment POSTs the form, splices the rendered reply into the right place in the tree (top-level or under its parent), and recursively initializes the new comment's own form and star button. Also handles auto-focus on reply, expanding/collapsing the textarea, and starring/unstarring comments via `comments/star/`.
- **[pageStarButtons.js](pageStarButtons.js)** — Star/unstar handler for the page itself. `initPageStarButtons()` POSTs to `page/star/` and toggles the icon, the count, and the button's `data-action` between `star` and `unstar`.

### Assets

- **[icons/](icons)** — 16/32/48/128 px extension icons.
- **[libs/](libs)** — Vendored Bootstrap and Bootstrap Icons bundles used by the side panel.

## Development

Load the extension unpacked in Chrome:

1. Visit `chrome://extensions`, enable **Developer mode**.
2. Click **Load unpacked** and select this repository's root.
3. Make sure the stellr backend is running at the URL configured in `api.js` / `comments.js` / `pageStarButtons.js`, and that you're logged in there in the same browser profile (the extension relies on the backend session cookie for CSRF and authentication).

The backend host is currently hard-coded in three files (`api.js`, `comments.js`, `pageStarButtons.js`) — update all three when pointing at a different server.

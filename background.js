chrome.action.onClicked.addListener(async (tab) => {

    // Clear old page data
    chrome.storage.session.remove('page');

    // Open the side panel for the current tab
    await chrome.sidePanel.open({ tabId: tab.id });

    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['libs/readability/Readability.js']
        });

        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async () => {
                if (document.readyState === 'loading') {
                    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
                }

                const meta = name => document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.content?.trim() || null;

                // Try Readability first
                let article = null;
                let content = null;
                try {
                    article = new Readability(document.cloneNode(true)).parse();
                    if (article?.textContent?.trim().length > 200) {
                        content = article.textContent.trim();
                    }
                } catch (e) {}

                // Fallback: text density scoring across block elements
                if (!content) {
                    const score = el => el.innerText.length / (el.innerHTML.length || 1);
                    const candidates = [...document.querySelectorAll('article, main, section, div')];
                    const best = candidates.reduce((a, b) => score(a) > score(b) ? a : b, document.body);
                    content = [...best.querySelectorAll('p')]
                        .map(p => p.innerText.trim())
                        .filter(t => t.length > 80)
                        .join('\n\n');
                }

                const siteName =
                    meta('og:site_name') ||
                    null;

                const title =
                    article?.title ||
                    meta('og:title') ||
                    meta('twitter:title') ||
                    document.title?.trim() ||
                    null;

                const description =
                    article?.excerpt ||
                    meta('og:description') ||
                    meta('twitter:description') ||
                    meta('description') ||
                    null;

                const imageUrl =
                    meta('og:image') ||
                    meta('twitter:image') ||
                    [...document.querySelectorAll('img')]
                        .filter(img => img.naturalWidth >= 200 && img.naturalHeight >= 200)
                        .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight))
                        [0]?.src ||
                    null;

                return {
                    content, title, description, imageUrl, siteName,
                    head: document.head.innerHTML,
                    innerText: document.documentElement.innerText.replace(/\s+/g, ' ').trim().slice(0, 50000)
                };
            }
        });
        await chrome.storage.session.set({
            page: {
                restricted: false,
                data: {
                    url: tab.url,
                    title: result.title || tab.title || null,
                    description: result.description,
                    imageUrl: result.imageUrl,
                    siteName: result.siteName,
                    favIconUrl: tab.favIconUrl,
                    content: result.content,
                    head: result.head,
                    innerText: result.innerText
                }
            }
        });
    } catch (e) {
        await chrome.storage.session.set({
            page: { 
                restricted: true ,
                data: null
            }
        })
    }
})

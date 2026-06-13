export function initPages() {

    // Pin Buttons
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.page-pin-button');
        if (!button) return;
        const formData = new FormData();
        formData.append('action', button.dataset.action);
        fetch(new URL(button.dataset.endpoint, document.baseURI).href, {
            method: 'POST',
            headers: { 'X-CSRFToken': button.dataset.csrfToken },
            mode: 'same-origin',
            body: formData,
        })
        .then(response => {
            if (!response.ok) return;
            const isPinning = button.dataset.action === 'pin';
            button.dataset.action = isPinning ? 'unpin' : 'pin';
            button.querySelector('span').textContent = isPinning ? 'Remove Pin' : 'Pin page';
        });
    });

    // Feeds
    const initFeed = (feeder) => {
        let loading = false;
        let intersecting = false;

        const loadMore = (attempt = 0) => {
            if (loading) return;
            loading = true;
            const params = new URLSearchParams();
            if (feeder.dataset.sort) params.set('sort', feeder.dataset.sort);
            if (feeder.dataset.seed) params.set('seed', feeder.dataset.seed);
            if (feeder.dataset.query) params.set('query', feeder.dataset.query);
            if (feeder.dataset.starredBy) params.set('starred_by', feeder.dataset.starredBy);
            if (feeder.dataset.nearTo) params.set('near_to', feeder.dataset.nearTo);
            params.set('p', feeder.dataset.p);
            fetch(new URL(feeder.dataset.endpoint, document.baseURI).href + '?' + params.toString())
                .then(r => r.text())
                .then(html => {
                    if (html === '') {
                        feeder.remove();
                    } else {
                        const tmp = document.createElement('div');
                        tmp.innerHTML = html;
                        const items = [...tmp.querySelectorAll('.page')];
                        items.forEach((item, i) => {
                            setTimeout(() => feeder.insertAdjacentElement('beforebegin', item), i * 80);
                        });
                        setTimeout(() => {
                            feeder.dataset.p = parseInt(feeder.dataset.p) + 1;
                            loading = false;
                            if (intersecting) loadMore();
                        }, items.length * 80);
                    }
                })
                .catch(() => {
                    console.log('Retrying...')
                    loading = false;
                    if (attempt < 3) {
                        const delay = 1000 * 2 ** attempt + Math.random() * 1000;
                        setTimeout(() => loadMore(attempt + 1), delay);
                    }
                });
        };

        new IntersectionObserver(
            entries => {
                intersecting = entries[0].isIntersecting;
                if (intersecting) loadMore();
            },
            { rootMargin: '300px' }
        ).observe(feeder);
    };

    document.querySelectorAll('.page-feeder').forEach(initFeed);

    // Watch for feeders injected after initial load
    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                if (node.matches('.page-feeder')) initFeed(node);
                node.querySelectorAll('.page-feeder').forEach(initFeed);
            }
        }
    }).observe(document.body, { childList: true, subtree: true });

}

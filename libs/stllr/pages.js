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
    document.querySelectorAll('.page-feed').forEach(feed => {
        const feeder = feed.querySelector('.page-feeder');
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
            params.set('p', feeder.dataset.page);
            fetch(feeder.dataset.endpoint + '?' + params.toString())
                .then(r => r.text())
                .then(html => {
                    if (html === '') {
                        feeder.remove();
                    } else {
                        feeder.insertAdjacentHTML('beforebegin', html);
                        feeder.dataset.page = parseInt(feeder.dataset.page) + 1;
                        loading = false;
                        if (intersecting) loadMore();
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
    });

}
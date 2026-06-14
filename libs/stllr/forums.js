import { showAlert } from './alerts.js';

// Markdown preview
document.addEventListener('click', (e) => {
    const button = e.target.closest('.markdown-preview-button');
    if (!button) return;
    const form = button.closest('form');
    const textarea = form.querySelector('textarea');
    const previewContainer = form.querySelector('.markdown-preview');
    const editButton = form.querySelector('.markdown-edit-button');
    const submitButton = form.querySelector('[type="submit"]');
    const formData = new FormData();
    formData.append('content', textarea.value);
    fetch(new URL(button.dataset.endpoint, document.baseURI).href, {
        method: 'POST',
        headers: {'X-CSRFToken': form.querySelector('[name=csrfmiddlewaretoken]').value},
        body: formData
    })
    .then(response => response.ok ? response.json() : null)
    .then(data => {
        if (!data) return;
        previewContainer.innerHTML = data.markdown;
        previewContainer.style.display = 'block';
        button.style.display = 'none';
        editButton.style.display = 'block';
        textarea.style.display = 'none';
        if (submitButton) submitButton.disabled = true;
    });
});

// Markdown edit
document.addEventListener('click', (e) => {
    const button = e.target.closest('.markdown-edit-button');
    if (!button) return;
    e.preventDefault();
    const form = button.closest('form');
    const textarea = form.querySelector('textarea');
    const previewContainer = form.querySelector('.markdown-preview');
    const previewButton = form.querySelector('.markdown-preview-button');
    const submitButton = form.querySelector('[type="submit"]');
    previewContainer.innerHTML = '';
    previewContainer.style.display = 'none';
    previewButton.style.display = 'block';
    button.style.display = 'none';
    textarea.style.display = 'block';
    if (submitButton) submitButton.disabled = false;
    const end = textarea.value.length;
    textarea.focus();
    textarea.setSelectionRange(end, end);
});

// Mute button
document.addEventListener('click', (e) => {
    const button = e.target.closest('.post-mute-button');
    if (!button) return;
    const formData = new FormData();
    formData.append('action', button.dataset.action);
    fetch(new URL(button.dataset.endpoint, document.baseURI).href, {
        method: 'POST',
        headers: {'X-CSRFToken': button.dataset.csrfToken},
        mode: 'same-origin',
        body: formData,
    })
    .then(response => {
        if (!response.ok) return;
        const isMuting = button.dataset.action === 'mute';
        const authorId = button.closest('.post')?.dataset.authorId;
        document.querySelectorAll(`.post[data-author-id="${authorId}"]`).forEach(postEl => {
            postEl.querySelector('.post-content')?.classList.toggle('d-none', isMuting);
            postEl.querySelector('.post-content-muted')?.classList.toggle('d-none', !isMuting);
        });
        document.querySelectorAll('.post-mute-button').forEach(btn => {
            if (btn.closest('.post')?.dataset.authorId !== authorId) return;
            btn.dataset.action = isMuting ? 'unmute' : 'mute';
            const span = btn.querySelector('span');
            const username = span.textContent.replace(/^(Mute|Unmute) /, '');
            span.textContent = `${isMuting ? 'Unmute' : 'Mute'} ${username}`;
        });
    });
});

// Post form submission
document.addEventListener('submit', async (e) => {
    const form = e.target.closest('.post-form, .reply-form');
    if (!form) return;
    e.preventDefault();
    try {
        const response = await fetch(form.dataset.endpoint, {
            method: 'POST',
            headers: {'X-CSRFToken': form.querySelector('[name=csrfmiddlewaretoken]').value},
            body: new FormData(form)
        });
        if (!response.ok) {
            let message = 'Something went wrong. Please try again.';
            try {
                const data = await response.json();
                const first = Object.values(data.errors ?? {}).flat()[0];
                if (first) message = first;
            } catch {}
            showAlert(message);
            return;
        }
        const data = await response.json();
        const parentId = form.querySelector('[name=parent]').value;
        if (parentId) {
            const parentPost = document.querySelector(`#post${parentId}`);
            parentPost.querySelector('.display-children').insertAdjacentHTML('afterbegin', data.post);
            bootstrap.Collapse.getOrCreateInstance(document.querySelector(`#replyForm${parentId}`)).hide();
            const replyCountSpan = parentPost.querySelector('.descendant-count');
            if (replyCountSpan) replyCountSpan.textContent = parseInt(replyCountSpan.textContent) + 1;
        } else {
            document.querySelector('.post-feed').insertAdjacentHTML('afterbegin', data.post);
        }
        form.reset();
    } catch {
        showAlert('Something went wrong. Please try again.');
    }
});

// Tracks last valid user-typed content (after the @mention prefix) per textarea
const replyUserContent = new WeakMap();

// Reply auto-focus and @mention pre-fill
document.addEventListener('shown.bs.collapse', (e) => {
    const textarea = e.target.querySelector('.reply-form textarea');
    if (!textarea) return;
    const username = e.target.dataset.replyUsername;
    if (username && !textarea.value.startsWith(`@${username} `)) {
        textarea.value = `@${username} `;
    }
    replyUserContent.set(textarea, '');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
});

// Prevent deletion of the @mention prefix
document.addEventListener('input', (e) => {
    const textarea = e.target.closest('.reply-form textarea');
    if (!textarea) return;
    const collapseEl = textarea.closest('[data-reply-username]');
    if (!collapseEl) return;
    const prefix = `@${collapseEl.dataset.replyUsername} `;
    if (textarea.value.startsWith(prefix)) {
        replyUserContent.set(textarea, textarea.value.slice(prefix.length));
    } else {
        const saved = replyUserContent.get(textarea) || '';
        textarea.value = prefix + saved;
        textarea.setSelectionRange(prefix.length, prefix.length);
    }
});

// Post feed
function initPostFeed(feed) {
    const feeder = feed.querySelector('.post-feeder');
    let loading = false;
    let intersecting = false;

    const loadMore = (attempt = 0) => {
        if (loading) return;
        loading = true;
        const params = new URLSearchParams();
        params.set('page_id', feeder.dataset.pageId);
        if (feeder.dataset.parentId) params.set('parent_id', feeder.dataset.parentId);
        params.set('seed', feeder.dataset.seed);
        params.set('p', feeder.dataset.p);
        fetch(feeder.dataset.endpoint + '?' + params.toString())
            .then(r => r.text())
            .then(html => {
                if (html === '') {
                    feeder.remove();
                } else {
                    const tmp = document.createElement('div');
                    tmp.innerHTML = html;
                    const displayChildren = feeder.closest('.collapse')?.closest('.post')?.querySelector('.display-children');
                    const items = [...tmp.querySelectorAll('.post')].filter(item =>
                        !displayChildren || !item.id || !displayChildren.querySelector(`#${item.id}`)
                    );
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
}

// Auto-init post feeds inserted after page load (e.g. nested child feeds inside loaded cards)
new MutationObserver(mutations => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.classList.contains('post-feed')) initPostFeed(node);
            node.querySelectorAll('.post-feed').forEach(initPostFeed);
        }
    }
}).observe(document.body, { childList: true, subtree: true });

export function initForums() {
    document.querySelectorAll('.post-feed').forEach(initPostFeed);
    document.querySelector('.post-form, .reply-form')?.querySelector('textarea')?.focus();
}

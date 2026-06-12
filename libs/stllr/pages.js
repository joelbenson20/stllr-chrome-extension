function initPinButtons() {
    document.querySelectorAll('.page-pin-button').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const formData = new FormData();
            formData.append('id', button.dataset.pageId);
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
    });
}

function initPageCardLink(card) {
    card.addEventListener('click', e => {
        if (!e.target.closest('a, button, form')) {
            window.location.href = card.dataset.forumUrl;
        }
    });
}

export function initPages() {
    initPinButtons();
    document.querySelectorAll('.page[data-forum-url]').forEach(initPageCardLink);
}
function initPageStarButtons() {

    const pageStarButtons = document.querySelectorAll('.page-star-button')

    pageStarButtons.forEach(starButton => {
        starButton.addEventListener('click', function(e) {
            e.preventDefault();
            var formData = new FormData();
            formData.append('action', starButton.dataset.action);
            var options = {
                method: 'POST',
                headers: {'X-CSRFToken': starButton.dataset.csrfToken},
                mode: 'same-origin',
                body: formData
            }
            fetch(new URL(starButton.dataset.endpoint, document.baseURI).href, options)
            .then(response => {
                if (!response.ok) return;
                var previousAction = starButton.dataset.action;
                var newAction = previousAction === 'star' ? 'unstar' : 'star';
                starButton.dataset.action = newAction;

                var starCount = starButton.querySelector('.star-count');
                var previousCount = parseInt(starCount.textContent);
                starCount.textContent = previousAction === 'star' ? previousCount + 1 : previousCount - 1;

                var icon = starButton.querySelector('i');
                icon.classList.toggle('bi-star-fill');
                icon.classList.toggle('bi-star');
            })
        })
    })
}

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
    initPageStarButtons();
    initPinButtons();
    document.querySelectorAll('.page[data-forum-url]').forEach(initPageCardLink);
}
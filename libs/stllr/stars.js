export function initStarButtons() {
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.star-button');
        if (!button) return;
        e.preventDefault();

        const formData = new FormData();
        formData.append('action', button.dataset.action);
        formData.append('object_ct', button.dataset.objectCt);
        formData.append('object_id', button.dataset.objectId);

        fetch(new URL(button.dataset.endpoint, document.baseURI).href, {
            method: 'POST',
            headers: {'X-CSRFToken': button.dataset.csrfToken},
            mode: 'same-origin',
            body: formData,
        })
        .then(response => {
            if (!response.ok) return;
            const previousAction = button.dataset.action;
            button.dataset.action = previousAction === 'star' ? 'unstar' : 'star';

            const starCount = button.querySelector('.star-count');
            const previousCount = parseInt(starCount.textContent);
            starCount.textContent = previousAction === 'star' ? previousCount + 1 : previousCount - 1;

            button.querySelector('i').classList.toggle('bi-star-fill');
            button.querySelector('i').classList.toggle('bi-star');
        });
    });
}

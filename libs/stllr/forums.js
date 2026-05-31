function initPostCardLink(card) {
    card.addEventListener('click', e => {
        if (!e.target.closest('a, button, form')) {
            window.location.href = card.dataset.postUrl;
        }
    });
}

function initPostForm(form) {
    initFormSubmission(form);
    if (form.classList.contains('reply-form')) initReplyAutoFocus(form);
    initMarkdownToggle(form);
}

function initMarkdownToggle(form) {
    const textarea = form.querySelector('textarea');
    const previewContainer = form.querySelector('.markdown-preview');
    const previewButton = form.querySelector('.markdown-preview-button');
    const editButton = form.querySelector('.markdown-edit-button');
    const submitButton = form.querySelector('[type="submit"]');

    previewButton.addEventListener('click', () => {
        const csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;
        const formData = new FormData();
        formData.append('content', textarea.value);
        fetch(new URL(previewButton.dataset.endpoint, document.baseURI).href, {
            method: 'POST',
            headers: {'X-CSRFToken': csrfToken},
            body: formData
        })
        .then(r => r.json())
        .then(response => {
            if (response.status === '200') {
                previewContainer.innerHTML = response.markdown;
                previewContainer.style.display = 'block';
                previewButton.style.display = 'none';
                editButton.style.display = 'block';
                textarea.style.display = 'none';
                if (submitButton) submitButton.disabled = true;
            }
        });
    });

    editButton.addEventListener('click', (e) => {
        e.preventDefault();
        previewContainer.innerHTML = '';
        previewContainer.style.display = 'none';
        previewButton.style.display = 'block';
        editButton.style.display = 'none';
        textarea.style.display = 'block';
        if (submitButton) submitButton.disabled = false;
        const end = textarea.value.length;
        textarea.focus();
        textarea.setSelectionRange(end, end);
    });
}

function initFormSubmission(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        var formData = new FormData(form);
        var csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;
        var options = {
            method: 'POST',
            headers: {'X-CSRFToken': csrfToken},
            body: formData
        }
        fetch(form.dataset.endpoint, options)
        .then(response => response.json())
        .then(response => {
            if (response.status === '201') {
                var postTree = document.querySelector('#postFeed');
                var parentId = form.querySelector('[name=parent]').value
                if (parentId) {
                    postTree = document.querySelector(`#children${parentId}`);
                }
                postTree.insertAdjacentHTML('afterbegin', response.post);

                // Initialize new reply form
                var newPost = document.querySelector(`#post${response.postId}`);
                var newStarButton = newPost.querySelector('.post-star-button');
                var newForm = newPost.querySelector('.reply-form')
                initPostStarButton(newStarButton);
                initPostForm(newForm);
                initPostCardLink(newPost);

                // Close form container for threaded posts
                if (parentId) {
                    document.querySelector(`#replyForm${parentId}`)?.classList.remove('show');
                    var replyCountSpan = document.querySelector(`#post${parentId} .children-count`);
                    if (replyCountSpan) replyCountSpan.textContent = parseInt(replyCountSpan.textContent) + 1;
                }

                // Reset and close the form
                form.reset();
                var cancelButton = form.querySelector('.post-cancel-button');
            }
        })
        .catch(error => console.error('Error:', error))
    })
    
}

function initPostStarButton(button) {
    button.addEventListener('click', (e) => {
            e.preventDefault();
            var formData = new FormData()
            formData.append('action', button.dataset.action)
            var options = {
                method: 'POST',
                headers: {'X-CSRFToken': button.dataset.csrfToken},
                mode: 'same-origin',
                body: formData
            }
            fetch(new URL(button.dataset.endpoint, document.baseURI).href, options)
            .then(response => response.json())
            .then(data => {
                if (data['status'] === '200') {
                    var previousAction = button.dataset.action;
                    var newAction = previousAction === 'star' ? 'unstar' : 'star';
                    button.dataset.action = newAction

                    var starCount = button.querySelector('.star-count');
                    var previousCount = parseInt(starCount.textContent);
                    starCount.textContent = previousAction === 'star' ? previousCount + 1 : previousCount - 1;

                    var icon = button.querySelector('i');
                    icon.classList.toggle('bi-star-fill')
                    icon.classList.toggle('bi-star');
                }
            })
        })
}

function initMuteButton(button) {
    button.addEventListener('click', () => {
        const formData = new FormData();
        formData.append('action', button.dataset.action);
        fetch(new URL(button.dataset.endpoint, document.baseURI).href, {
            method: 'POST',
            headers: {'X-CSRFToken': button.dataset.csrfToken},
            mode: 'same-origin',
            body: formData,
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === '200') {
                const isMuting = button.dataset.action === 'mute';
                button.dataset.action = isMuting ? 'unmute' : 'mute';
                const span = button.querySelector('span');
                const username = span.textContent.replace(/^(Mute|Unmute) /, '');
                span.textContent = `${isMuting ? 'Unmute' : 'Mute'} ${username}`;
                const postEl = button.closest('.post');
                if (postEl) {
                    postEl.querySelector('.post-content')?.classList.toggle('d-none', isMuting);
                    postEl.querySelector('.post-content-muted')?.classList.toggle('d-none', !isMuting);
                }
            }
        });
    });
}

function initReplyAutoFocus(form) {
    const collapseEl = form.closest('.collapse');
    if (collapseEl) {
        collapseEl.addEventListener('shown.bs.collapse', () => {
            form.querySelector('textarea').focus();
        });
    }
}

export function initForums() {

    // Star buttons
    var postStarButtons = document.querySelectorAll('.post-star-button');
    postStarButtons.forEach(button => {
        initPostStarButton(button);
    })

    // Post forms and reply forms
    document.querySelectorAll('.post-form, .reply-form').forEach(form => {
        initPostForm(form)
    })

    // Focus in first form
    document.querySelector('.post-form, .reply-form')?.querySelector('textarea')?.focus();

    // Mute buttons
    document.querySelectorAll('.post-mute-button').forEach(initMuteButton);

    // Post card links
    document.querySelectorAll('.post[data-post-url]').forEach(initPostCardLink);

}

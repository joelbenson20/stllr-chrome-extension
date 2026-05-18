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
        fetch(form.action, options)
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
                var newForm = newPost.querySelector('.post-form')
                initPostStarButton(newStarButton);
                initPostForm(newForm);

                // Close form container for threaded posts
                if (parentId) {
                    var parentFormContainer = document.querySelector(`#reply-form-container-${parentId}`);
                    parentFormContainer.classList.remove('show');
                }

                // Reset and close the form
                form.reset();
                var cancelButton = form.querySelector('.post-cancel-button');
            }
        })
        .catch(error => console.error('Error:', error))
    })
    
}

 function initReplyAutoFocus(replyFormContainer) {
    replyFormContainer.addEventListener('shown.bs.collapse', function () {
        this.querySelector('textarea').focus();
    })
}

function initPostStarButton(button) {
    button.addEventListener('click', (e) => {
            e.preventDefault();
            var formData = new FormData()
            formData.append('id', button.dataset.id)
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

function initmarkdownPreviewButton(button) {
    button.addEventListener('click', (e) => {
        var form = button.closest('.post-form');
        var csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;
        
        var textarea = form.querySelector('.post-form-textarea');
        var formData = new FormData();
        formData.append('content', textarea.value);
        var options = {
            method: 'POST',
            headers: {'X-CSRFToken': csrfToken},
            body: formData
        }
         fetch(new URL(button.dataset.endpoint, document.baseURI).href, options)
        .then(response => response.json())
        .then(response => {
            if (response.status === '200') {

                var markdownEditButton = form.querySelector('.post-form-markdown-edit-button');
                var markdownPreviewContainer = form.querySelector('.post-form-markdown-preview-container');

                markdownPreviewContainer.innerHTML = response.markdown;
                button.style.display = 'none';
                markdownPreviewContainer.style.display = 'block';
                markdownEditButton.style.display = 'block';
                textarea.style.display = 'none';

            }
        })

    });
}

function initmarkdownEditButton(button) {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        var form = button.closest('.post-form');
        var markdownPreviewButton = form.querySelector('.post-form-markdown-preview-button');
        var textarea = form.querySelector('.post-form-textarea');
        var markdownPreviewContainer = form.querySelector('.post-form-markdown-preview-container');

        // Hide preview container and edit button, show edit container and preview button
        markdownPreviewContainer.innerHTML = '';
        markdownPreviewContainer.style.display = 'none';
        markdownPreviewButton.style.display = 'block'
        textarea.style.display = 'block';
        button.style.display = 'none';

        // Focus at end of textarea content
        const end = textarea.value.length;
        textarea.focus();
        textarea.setSelectionRange(end, end);
    })
}

 function initPostForm(form) {
    initFormSubmission(form);

    var replyFormContainer = form.closest('.reply-form-container');
    var markdownPreviewButton = form.querySelector('.post-form-markdown-preview-button');
    var markdownEditButton = form.querySelector('.post-form-markdown-edit-button');

    if (replyFormContainer) initReplyAutoFocus(replyFormContainer);
    initmarkdownPreviewButton(markdownPreviewButton);
    initmarkdownEditButton(markdownEditButton);
}

 export function initForum() {

    // Initialize star buttons
    var postStarButtons = document.querySelectorAll('.post-star-button');
    postStarButtons.forEach(button => {
        initPostStarButton(button);
    })

    // Initialize post forms
    var postForms = document.querySelectorAll('.post-form');
    postForms.forEach(form => {
        initPostForm(form)
    })

    // Focus in root form
    var rootPostForm = document.querySelectorAll('.post-form')[0];
    rootPostForm.querySelector('textarea').focus();

 }
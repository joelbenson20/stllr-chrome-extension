import { BASE_URL } from './api.js'

const COMMENT_STAR_PATH = 'comments/star/';
const POST_COMMENT_PATH = 'comments/post/';
const MARKDOWNIFY_PATH = 'api/markdownify/';


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
        fetch(BASE_URL + POST_COMMENT_PATH, options)
        .then(response => response.json())
        .then(response => {
            if (response.status === '201') {
                var commentTree = document.querySelector('.comment-tree');
                var parentId = form.querySelector('[name=parent]').value
                if (parentId) {
                    commentTree = document.querySelector(`#children-${parentId}`);
                }
                commentTree.insertAdjacentHTML('afterbegin', response.comment);

                // Initialize new reply form
                var newComment = document.querySelector(`#comment-${response.commentId}`);
                var newStarButton = newComment.querySelector('.comment-star-button');
                var newForm = newComment.querySelector('.comment-form')
                initCommentStarButton(newStarButton);
                initCommentForm(newForm);

                // Close form container for threaded comments
                if (parentId) {
                    var parentFormContainer = document.querySelector(`#reply-form-container-${parentId}`);
                    parentFormContainer.classList.remove('show');
                }

                // Reset and close the form
                form.reset();
                var cancelButton = form.querySelector('.comment-cancel-button');
                closeCommentForm(cancelButton);
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

function initCommentStarButton(button) {
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
            fetch(BASE_URL + COMMENT_STAR_PATH, options)
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
        var form = button.closest('.comment-form');
        var csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;
        
        var textarea = form.querySelector('.comment-form-textarea');
        var formData = new FormData();
        formData.append('content', textarea.value);
        var options = {
            method: 'POST',
            headers: {'X-CSRFToken': csrfToken},
            body: formData
        }
         fetch(BASE_URL + MARKDOWNIFY_PATH, options)
        .then(response => response.json())
        .then(response => {
            if (response.status === '200') {

                var markdownEditButton = form.querySelector('.comment-form-markdown-edit-button');
                var markdownPreviewContainer = form.querySelector('.comment-form-markdown-preview-container');

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
        var form = button.closest('.comment-form');
        var markdownPreviewButton = form.querySelector('.comment-form-markdown-preview-button');
        var textarea = form.querySelector('.comment-form-textarea');
        var markdownPreviewContainer = form.querySelector('.comment-form-markdown-preview-container');

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

 function initCommentForm(form) {
    initFormSubmission(form);
    // initFormFocus(form);

    var replyFormContainer = form.closest('.reply-form-container');
    // var cancelButton = form.querySelector('.comment-cancel-button');
    var markdownPreviewButton = form.querySelector('.comment-form-markdown-preview-button');
    var markdownEditButton = form.querySelector('.comment-form-markdown-edit-button');

    if (replyFormContainer) initReplyAutoFocus(replyFormContainer);
    // initCancelButton(cancelButton);
    initmarkdownPreviewButton(markdownPreviewButton);
    initmarkdownEditButton(markdownEditButton);
}

 export function initComments() {

    // Initialize star buttons
    var commentStarButtons = document.querySelectorAll('.comment-star-button');
    commentStarButtons.forEach(button => {
        initCommentStarButton(button);
    })

    // Initialize comment forms
    var commentForms = document.querySelectorAll('.comment-form');
    commentForms.forEach(form => {
        initCommentForm(form)
    })

 }
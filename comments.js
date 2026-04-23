const SITE_URL = 'http://127.0.0.1:8000/'
const COMMENT_STAR_PATH = 'comments/star/'


function initCommentForm(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        const actionPath = new URL(form.action).pathname;
        const csrfToken = form.querySelector('[name=csrfmiddlewaretoken]').value;
        const formData = new FormData(form);
        var options = {
            method: 'POST',
            headers: {'X-CSRFToken': csrfToken},
            body: formData
        }
        fetch(SITE_URL + actionPath, options)
        .then(response => response.json())
        .then(response => {
            if (response.status === '201') {
                // In case of no parent, get the root comment tree (first one returned)
                var commentTree = document.querySelector('.comment-tree');
                // If comment parent, get the comment tree of the parent
                var parentId = form.dataset.parentId;
                if (parentId) {
                    commentTree = document.querySelector(`#children-${parentId}`);
                }
                // Insert the new comment
                commentTree.insertAdjacentHTML('afterbegin', response.comment);

                // Initialize new reply form
                var newComment = document.querySelector(`#comment-${response.commentId}`)
                var newForm = newComment.querySelector('.comment-form');
                var newReplyFormContainer = newComment.querySelector('.reply-form-container');
                var newStarButton = newComment.querySelector('.comment-star-button');
                initCommentForm(newForm);
                initFormFocus(newForm);
                initReplyAutoFocus(newReplyFormContainer);
                initCommentStarButton(newStarButton);

                // Close form container for threaded comments
                if (parentId) {
                    var parentFormContainer = document.querySelector(`#reply-form-container-${parentId}`);
                    var parentFormContainerCollapse = bootstrap.Collapse.getOrCreateInstance(parentFormContainer);
                    parentFormContainerCollapse.hide();
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

 function initFormFocus(form) {
    var textarea = form.querySelector('.comment-form-textarea');
    textarea.addEventListener('focus', (e) => {
        var buttons = form.querySelector('.comment-form-buttons');
        if (textarea.offsetHeight < 100) {
            textarea.style.height = "100px";
        }
        textarea.style.resize = "vertical";
        buttons.style.display = "block";
    })
 }

 function initReplyAutoFocus(replyFormContainer) {
    replyFormContainer.addEventListener('shown.bs.collapse', function () {
        this.querySelector('textarea').focus();
    })
}

function initCommentStarButton(starButton) {
    starButton.addEventListener('click', (e) => {
            e.preventDefault();
            var formData = new FormData()
            formData.append('id', starButton.dataset.id)
            formData.append('action', starButton.dataset.action)
            var options = {
                method: 'POST',
                headers: {'X-CSRFToken': starButton.dataset.csrfToken},
                mode: 'same-origin',
                body: formData
            }
            fetch(SITE_URL + COMMENT_STAR_PATH, options)
            .then(response => response.json())
            .then(data => {
                console.log(data)
                if (data['status'] === '200') {
                    var previousAction = starButton.dataset.action;
                    var newAction = previousAction === 'star' ? 'unstar' : 'star';
                    starButton.dataset.action = newAction

                    var starCount = starButton.querySelector('.star-count');
                    var previousCount = parseInt(starCount.textContent);
                    starCount.textContent = previousAction === 'star' ? previousCount + 1 : previousCount - 1;

                    var icon = starButton.querySelector('i');
                    icon.classList.toggle('bi-star-fill')
                    icon.classList.toggle('bi-star');
                }
            })
        })
}

function closeCommentForm(cancelButton) {
    var form = cancelButton.closest('.comment-form');
    var textarea = form.querySelector('.comment-form-textarea');
    var buttons = form.querySelector('.comment-form-buttons');
    buttons.style.display = "none";
    textarea.style.height = "1rem";
    textarea.style.resize = "none";
}

 export function initComments() {
    var commentStarButtons = document.querySelectorAll('.comment-star-button');
    commentStarButtons.forEach(starButton => {
        initCommentStarButton(starButton);
    });
    var commentForms = document.querySelectorAll('.comment-form');
    commentForms.forEach(form => {
        initCommentForm(form);
        initFormFocus(form);
    });
    var replyFormContainers = document.querySelectorAll('.reply-form-container');
    replyFormContainers.forEach(replyFormContainer => {
        initReplyAutoFocus(replyFormContainer);
    })
 }
const SITE_URL = 'http://127.0.0.1:8000/'
const COMMENT_STAR_PATH = 'comments/star/'

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

                // Initialize new comment form and star button
                var newForm = document.querySelector(`#comment-form-${response.commentId}`);
                var newStarButton = document.querySelector(`#comment-star-button-${response.commentId}`);
                initCommentForm(newForm);
                initCommentStarButton(newStarButton);

                // Close form container for threaded comments
                if (parentId) {
                    var formContainer = document.querySelector(`#comment-form-container-${parentId}`);
                    var formContainerCollapse = bootstrap.Collapse.getOrCreateInstance(formContainer);
                    formContainerCollapse.hide();
                }

                // Reset the form
                form.reset();
            }
        })
        .catch(error => console.error('Error:', error))
    })
 }

 export function initComments() {
    var commentStarButtons = document.querySelectorAll('.comment-star-button');
    commentStarButtons.forEach(starButton => {
        initCommentStarButton(starButton);
    });
    var commentForms = document.querySelectorAll('.comment-form');
    commentForms.forEach(form => {
    initCommentForm(form);
    });
 }
const SITE_URL = 'http://127.0.0.1:8000/'
const COMMENT_VOTE_PATH = 'comments/vote/'

function initCommentVoteButton(voteButton) {
    voteButton.addEventListener('click', (e) => {
            e.preventDefault();
            var formData = new FormData()
            formData.append('id', voteButton.dataset.id)
            formData.append('action', voteButton.dataset.action)
            var options = {
                method: 'POST',
                headers: {'X-CSRFToken': voteButton.dataset.csrfToken},
                mode: 'same-origin',
                body: formData
            }
            fetch(SITE_URL + COMMENT_VOTE_PATH, options)
            .then(response => response.json())
            .then(data => {
                console.log(data)
                if (data['status'] === '200') {
                    var previousAction = voteButton.dataset.action;
                    var newAction = previousAction === 'vote' ? 'unvote' : 'vote';
                    voteButton.dataset.action = newAction

                    var voteCount = voteButton.querySelector('.vote-count');
                    var previousCount = parseInt(voteCount.textContent);
                    voteCount.textContent = previousAction === 'vote' ? previousCount + 1 : previousCount - 1;

                    var icon = voteButton.querySelector('i');
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
        fetch('http://127.0.0.1:8000' + actionPath, options)
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

                // Initialize new comment form and vote button
                var newForm = document.querySelector(`#comment-form-${response.commentId}`);
                var newVoteButton = document.querySelector(`#comment-vote-button-${response.commentId}`);
                initCommentForm(newForm);
                initCommentVoteButton(newVoteButton);

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
    var commentVoteButtons = document.querySelectorAll('.comment-vote-button');
    var commentForms = document.querySelectorAll('.comment-form')

    commentVoteButtons.forEach(voteButton => {
    initCommentVoteButton(voteButton);
    });

    commentForms.forEach(form => {
    initCommentForm(form);
    });
 }
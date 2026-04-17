export function initPageVoteButtons() {

    const pageVoteUrl = 'http://127.0.0.1:8000/page/vote/';
    const pageVoteButtons = document.querySelectorAll('a.page-vote-button')

    pageVoteButtons.forEach(voteButton => {
        voteButton.addEventListener('click', function(e) {
            e.preventDefault();
            var formData = new FormData();
            formData.append('id', voteButton.dataset.id)
            formData.append('action', voteButton.dataset.action);
            var options = {
                method: 'POST',
                headers: {'X-CSRFToken': voteButton.dataset.csrfToken},
                mode: 'same-origin',
                body: formData
            }
            fetch(pageVoteUrl, options)
            .then(response => response.json())
            .then(data => {
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
    })
}
import { BASE_URL } from '../../api.js'

const PAGE_STAR_PATH = 'api/star/page/';
const ROOM_COUNT_PATH = 'api/count/room/'

function initPageStarButtons() {

    const pageStarButtons = document.querySelectorAll('.page-star-button')

    pageStarButtons.forEach(starButton => {
        starButton.addEventListener('click', function(e) {
            e.preventDefault();
            var formData = new FormData();
            formData.append('id', starButton.dataset.id)
            formData.append('action', starButton.dataset.action);
            var options = {
                method: 'POST',
                headers: {'X-CSRFToken': starButton.dataset.csrfToken},
                mode: 'same-origin',
                body: formData
            }
            fetch(BASE_URL + PAGE_STAR_PATH, options)
            .then(response => response.json())
            .then(data => {
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
    })
}

async function fetchRoomCounts() {
    const spans = document.querySelectorAll('.room-user-count[data-page-id]');
    if (!spans.length) return;
    const ids = [...spans].map(s => s.dataset.pageId).join(',');
    const data = await fetch(BASE_URL + ROOM_COUNT_PATH + `?ids=${ids}`).then(r => r.json());
    spans.forEach(s => {
        const count = data[s.dataset.pageId];
        if (count !== undefined) s.textContent = count;
    });
}

export function initPages() {
    initPageStarButtons();
    fetchRoomCounts();
}
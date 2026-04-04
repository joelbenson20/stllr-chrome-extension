export const FLOAT_API_URL = 'http://127.0.0.1:8000/api';

export function initFloatButtons() {

    const float_buttons = document.querySelectorAll('.float-button');

    float_buttons.forEach(button => {
        button.addEventListener('click', async () => {

            const webpage_id = button.dataset.webpageId;
            const csrfTokenElement = document.querySelector('#csrf-token');
            if (!csrfTokenElement) {
                console.error('Missing CSRF token input with id="csrf-token"');
                return;
            }
            const csrfToken = csrfTokenElement.value;

            fetch(`${FLOAT_API_URL}/vote/webpage/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ webpage_id: webpage_id })
            })
            .then(response => response.json())
            .then(response => {
                console.log('Response:', response);
                updateFloatButton(button, response.status, response.num_votes);
            })
            .catch(error => console.error('Error:', error));
        });
    });

};

export function updateFloatButton(button, status, num_votes) {
    // If a vote was successfully created
    if (status === '201') {
        button.dataset.voted = 'true';
    }
    // If a vote was successfully deleted
    else if (status === '410') {
        button.dataset.voted = 'false';
    }

    //Update float count
    let floatCount = button.querySelector('.float-count');
    floatCount.textContent = num_votes;
}

initFloatButtons();
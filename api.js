export const FLOAT_API_URL = 'http://127.0.0.1:8000/api';

export function initFloatButtons() {

    const float_buttons = document.querySelectorAll('.float-button');

    float_buttons.forEach(button => {
        button.addEventListener('click', async () => {

            const webpage_id = button.dataset.webpageId;
            const { csrfToken } = await chrome.storage.session.get('csrfToken');

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
            .then(data => {
                console.log('Response received:', data);
                updateFloatButton(button);
            })
            .catch(error => console.error('Error:', error));
        });
    });

};

function updateFloatButton(button) {
    //Toggle the data-voted attribute
    if (button.dataset.voted === 'true') {
        button.dataset.voted = 'false';
    }
        else {
        button.dataset.voted = 'true';
    }

    //Update float count
    let floatCount = button.closest('p').querySelector('.float-count');
    let count = parseInt(floatCount.textContent);
    if (button.dataset.voted === 'true') {
        count += 1;
    } else {
        count -= 1;
    }
    floatCount.textContent = count;
}
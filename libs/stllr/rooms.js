import { BASE_HOST, getWSTicket } from '../../api.js'

export async function initRoom() {
    const data = document.getElementById('stllr-data').dataset;
    const pageId = data.pageId;
    const ticket = await getWSTicket();
    const url = 'ws://' + BASE_HOST + `/ws/room/${pageId}/?ticket=${ticket}`;
    const roomSocket = new WebSocket(url);
    const roomInput = document.getElementById('roomInput');
    const roomFeed = document.getElementById('roomFeed');

    roomInput.addEventListener('input', () => {
        roomInput.style.height = 'auto';
        roomInput.style.height = roomInput.scrollHeight + 'px';
    })

    roomSocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        roomFeed.innerHTML += data.html
        roomFeed.scrollTop = roomFeed.scrollHeight;
    };

    roomInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const content = roomInput.value;
            if (content) {
                roomSocket.send(JSON.stringify({'content': content}));
                roomInput.value = '';
                roomInput.style.height = 'auto';
                roomInput.focus();
            }
        }
    })

    roomSocket.onclose = function(event) {
        console.error('Room socket closed unexpectedly');
    };

    roomInput.focus();
}
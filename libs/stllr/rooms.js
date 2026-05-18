import { STLLR_URL, fetchWSTicket } from '../../client.js'

let activeRoomSocket = null;

export function closeRoomSocket() {
    if (activeRoomSocket && activeRoomSocket.readyState !== WebSocket.CLOSED) {
        activeRoomSocket.close();
        activeRoomSocket = null;
    }
}

export async function initRoom() {

    if (activeRoomSocket && activeRoomSocket.readyState !== WebSocket.CLOSED) {
        activeRoomSocket.close();
    }

    const data = document.getElementById('stllr-data').dataset;
    const pageId = data.pageId;
    const ticket = await fetchWSTicket();
    const url = STLLR_URL.replace(/^http/, 'ws') + `/ws/room/${pageId}/?ticket=${ticket}`;
    const roomSocket = new WebSocket(url);
    activeRoomSocket = roomSocket;
    // END EXTENSION-SPECIFIC CODE

    const messageTextarea = document.querySelector('.message-textarea');
    const messageFeed = document.querySelector('.message-feed');

    roomSocket.onopen = function() {
        const heartbeat = setInterval(() => {
            if (roomSocket.readyState === WebSocket.OPEN) {
                roomSocket.send(JSON.stringify({ type: 'ping' }));
            } else {
                clearInterval(heartbeat)
            }
        }, 10000)

        roomSocket.addEventListener('close', () => clearInterval(heartbeat))
    }

    roomSocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === "room_message") {
            const isAtBottom = messageFeed.scrollHeight - messageFeed.scrollTop <= messageFeed.clientHeight + 10;
            messageFeed.innerHTML += data.html
            if (isAtBottom) messageFeed.scrollTop = messageFeed.scrollHeight;
        }
        else if (data.type === "presence_update") {
            const popover = bootstrap.Popover.getInstance(roomUsersPopover);
            const listHtml = data.users.map(u => `<li class="list-group-item">${u}</li>`).join('');
            const contentHtml = `<ul class="list-group list-group-flush">${listHtml}</ul>`;
                        popover.setContent({
                '.popover-header': 'Users present',
                '.popover-body': contentHtml,
            });
            updateRoomCounts()
        }
    };

    messageTextarea.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const content = messageTextarea.value;
            if (content) {
                roomSocket.send(JSON.stringify({ content: content }));
                messageTextarea.value = '';
                messageTextarea.style.height = 'auto';
                messageTextarea.focus();
            }
        }
    })

    roomSocket.onclose = function(event) {
        console.error('Room socket closed unexpectedly');
    };

    messageTextarea.addEventListener('input', () => {
        messageTextarea.style.height = 'auto';
        messageTextarea.style.height = messageTextarea.scrollHeight + 'px';
    })

    messageTextarea.focus();
}

async function updateRoomCounts() {
    const spans = document.querySelectorAll('.room-user-count[data-page-id]');
    if (!spans.length) return;
    const ids = [...spans].map(s => s.dataset.pageId).join(',');
    const data = await fetch(new URL(spans[0].dataset.endpoint + `?ids=${ids}`, document.baseURI).href).then(r => r.json());
    spans.forEach(s => {
        const count = data[s.dataset.pageId];
        if (count !== undefined) s.textContent = count;
    });
}
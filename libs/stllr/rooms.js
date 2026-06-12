import { STLLR_URL, fetchWSTicket } from '../../client.js';
const wsBase = STLLR_URL.replace(/^http/, 'ws');
const fetchTicket = fetchWSTicket;

let activeRoomSocket = null;

export function closeRoomSocket() {
    if (activeRoomSocket && activeRoomSocket.readyState !== WebSocket.CLOSED) {
        const pageId = activeRoomSocket.url.match(/\/ws\/room\/(\d+)\//)?.[1];
        activeRoomSocket.close();
        activeRoomSocket = null;
        if (pageId) {
            document.querySelectorAll(`#page${pageId} .room-user-count`).forEach(el => {
                const current = parseInt(el.textContent, 10);
                if (!isNaN(current) && current > 0) el.textContent = current - 1;
            });
        }
    }
}

export async function initRoom() {

    const broadcastTextarea = document.querySelector('.broadcast-textarea');
    const broadcastFeed = document.querySelector('.broadcast-feed');
    if (!broadcastFeed || !broadcastTextarea) return;

    if (activeRoomSocket && activeRoomSocket.readyState !== WebSocket.CLOSED) {
        activeRoomSocket.close();
    }

    const pageId = broadcastFeed.dataset.pageId;
    const ticket = fetchTicket ? await fetchTicket() : null;
    const url = wsBase + '/ws/room/' + pageId + '/' + (ticket ? `?ticket=${ticket}` : '');
    const roomSocket = new WebSocket(url);
    activeRoomSocket = roomSocket;

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
            const isAtBottom = broadcastFeed.scrollHeight - broadcastFeed.scrollTop <= broadcastFeed.clientHeight + 10;
            broadcastFeed.innerHTML += data.html
            if (isAtBottom) broadcastFeed.scrollTop = broadcastFeed.scrollHeight;
        }
        else if (data.type === "presence_update") {
            const modal = document.getElementById('roomUsersModal');
            if (modal) modal.dataset.users = JSON.stringify(data.users);
            const countSpan = document.getElementById('room-user-count');
            if (countSpan) countSpan.textContent = data.count;
            document.querySelectorAll(`#page${pageId} .room-user-count`).forEach(el => {
                el.textContent = data.count;
            });
        }
    };

    broadcastTextarea.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const content = broadcastTextarea.value;
            if (content) {
                roomSocket.send(JSON.stringify({ content: content }));
                broadcastTextarea.value = '';
                broadcastTextarea.focus();
            }
        }
    })

    roomSocket.onclose = function(event) {
        console.error('Room socket closed unexpectedly');
    };

    broadcastTextarea.focus();
}
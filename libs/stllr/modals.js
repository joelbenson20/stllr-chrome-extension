export function initModals() {

    // Share modal
    document.addEventListener('show.bs.modal', (event) => {
        const modal = event.target;
        if (modal.id !== 'shareModal') return;
        const trigger = event.relatedTarget;
        if (!trigger) return;
        modal.dataset.currentObjectType = trigger.dataset.objectType;
        modal.dataset.currentObjectId = trigger.dataset.objectId;
        modal.querySelectorAll('.share-contact-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('btn-danger');
            btn.querySelector('.share-btn-status').textContent = '';
        });
    });

    document.addEventListener('click', (event) => {
        const btn = event.target.closest('.share-contact-btn');
        if (!btn || btn.disabled) return;
        const modal = btn.closest('#shareModal');
        if (!modal) return;

        btn.disabled = true;
        const statusEl = btn.querySelector('.share-btn-status');
        statusEl.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        const formData = new FormData();
        formData.append('object_type', modal.dataset.currentObjectType);
        formData.append('object_id', modal.dataset.currentObjectId);
        formData.append('contact_id', btn.dataset.contactId);

        fetch(new URL(modal.dataset.endpoint, document.baseURI).href, {
            method: 'POST',
            headers: {'X-CSRFToken': modal.dataset.csrfToken},
            mode: 'same-origin',
            body: formData,
        })
        .then(response => {
            if (response.ok) {
                statusEl.innerHTML = '<i class="bi bi-check-lg modal-check"></i>';
            } else {
                btn.disabled = false;
                btn.classList.add('btn-danger');
                statusEl.innerHTML = '<i class="bi bi-x-lg"></i>';
                setTimeout(() => {
                    btn.classList.remove('btn-danger');
                    statusEl.innerHTML = '';
                }, 2000);
            }
        });
    });

    // Beacon modal
    document.addEventListener('show.bs.modal', (event) => {
        const modal = event.target;
        if (modal.id !== 'beaconModal') return;
        const trigger = event.relatedTarget;
        if (!trigger) return;
        modal.dataset.currentPageId = trigger.dataset.pageId;

        const btns = modal.querySelectorAll('.beacon-crew-btn');
        btns.forEach(btn => {
            btn.disabled = true;
            btn.classList.remove('btn-success', 'btn-danger');
            btn.querySelector('.beacon-btn-status').textContent = '';
            delete btn.dataset.beaconed;
        });

        const url = new URL(modal.dataset.statusEndpoint, document.baseURI);
        url.searchParams.set('page_id', trigger.dataset.pageId);
        fetch(url.href, {mode: 'same-origin'})
            .then(r => r.json())
            .then(data => {
                const beaconedSet = new Set(data.crew_ids.map(String));
                btns.forEach(btn => {
                    btn.disabled = false;
                    if (beaconedSet.has(btn.dataset.crewId)) {
                        btn.dataset.beaconed = '1';
                        btn.querySelector('.beacon-btn-status').innerHTML = '<i class="bi bi-check-lg modal-check"></i>';
                    }
                });
            })
            .catch(() => btns.forEach(btn => { btn.disabled = false; }));
    });

    document.addEventListener('click', (event) => {
        const btn = event.target.closest('.beacon-crew-btn');
        if (!btn || btn.disabled) return;
        const modal = btn.closest('#beaconModal');
        if (!modal) return;

        const isBeaconed = !!btn.dataset.beaconed;
        btn.disabled = true;
        const statusEl = btn.querySelector('.beacon-btn-status');
        statusEl.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        const formData = new FormData();
        formData.append('page_id', modal.dataset.currentPageId);
        formData.append('crew_id', btn.dataset.crewId);

        const endpoint = isBeaconed ? modal.dataset.deleteEndpoint : modal.dataset.createEndpoint;
        fetch(new URL(endpoint, document.baseURI).href, {
            method: 'POST',
            headers: {'X-CSRFToken': modal.dataset.csrfToken},
            mode: 'same-origin',
            body: formData,
        })
        .then(response => {
            btn.disabled = false;
            if (response.ok) {
                if (isBeaconed) {
                    delete btn.dataset.beaconed;
                    statusEl.innerHTML = '';
                } else {
                    btn.dataset.beaconed = '1';
                    statusEl.innerHTML = '<i class="bi bi-check-lg modal-check"></i>';
                }
            } else {
                btn.classList.add('btn-danger');
                statusEl.innerHTML = '<i class="bi bi-x-lg"></i>';
                setTimeout(() => {
                    btn.classList.remove('btn-danger');
                    statusEl.innerHTML = isBeaconed ? '<i class="bi bi-check-lg modal-check"></i>' : '';
                    if (isBeaconed) btn.dataset.beaconed = '1';
                }, 2000);
            }
        });
    });

    // Room users modal
    document.addEventListener('show.bs.modal', (event) => {
        const modal = event.target;
        if (modal.id !== 'roomUsersModal') return;
        const users = JSON.parse(modal.dataset.users || '[]');
        const list = document.getElementById('roomUsersList');
        list.innerHTML = users.map(u => `<li class="list-group-item">${u}</li>`).join('');
    });

}

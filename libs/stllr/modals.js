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
            btn.classList.remove('btn-success', 'btn-danger');
            btn.classList.add('btn-outline-secondary');
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
                btn.classList.replace('btn-outline-secondary', 'btn-success');
                statusEl.innerHTML = '<i class="bi bi-check-lg"></i>';
            } else {
                btn.disabled = false;
                btn.classList.replace('btn-outline-secondary', 'btn-danger');
                statusEl.innerHTML = '<i class="bi bi-x-lg"></i>';
                setTimeout(() => {
                    btn.classList.replace('btn-danger', 'btn-outline-secondary');
                    statusEl.innerHTML = '';
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

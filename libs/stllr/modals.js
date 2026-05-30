function initShareModal() {
    const shareModal = document.getElementById('shareModal');
    if (!shareModal) return;

    const endpoint = shareModal.dataset.endpoint;
    const csrfToken = shareModal.dataset.csrfToken;

    shareModal.addEventListener('show.bs.modal', function(event) {
        const trigger = event.relatedTarget;
        if (!trigger) return;
        shareModal.dataset.currentObjectType = trigger.dataset.objectType;
        shareModal.dataset.currentObjectId = trigger.dataset.objectId;
        shareModal.querySelectorAll('.share-contact-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('btn-success', 'btn-danger');
            btn.classList.add('btn-outline-secondary');
            btn.querySelector('.share-btn-status').textContent = '';
        });
    });

    shareModal.addEventListener('click', function(event) {
        const btn = event.target.closest('.share-contact-btn');
        if (!btn || btn.disabled) return;

        btn.disabled = true;
        const statusEl = btn.querySelector('.share-btn-status');
        statusEl.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

        const formData = new FormData();
        formData.append('object_type', shareModal.dataset.currentObjectType);
        formData.append('object_id', shareModal.dataset.currentObjectId);
        formData.append('contact_id', btn.dataset.contactId);

        fetch(new URL(endpoint, document.baseURI).href, {
            method: 'POST',
            headers: {'X-CSRFToken': csrfToken},
            mode: 'same-origin',
            body: formData,
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === '200') {
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
}

export function initModals() {
    initShareModal();
}
// Set this in extension context, e.g. 'http://127.0.0.1:8000'. Keep empty on the site.
const SITE_DOMAIN = 'http://127.0.0.1:8000';

function buildSiteUrl(path) {
    return `${SITE_DOMAIN}${path}`;
}

function resolveCsrfToken(sourceEl) {
    if (sourceEl?.dataset?.csrfToken) {
        return sourceEl.dataset.csrfToken;
    }

    const tokenFromClosest = sourceEl?.closest?.('[data-csrf-token]')?.dataset?.csrfToken;
    if (tokenFromClosest) {
        return tokenFromClosest;
    }

    const formToken = document.querySelector('.comment-form')?.dataset?.csrfToken;
    if (formToken) {
        return formToken;
    }

    return '';
}

function showCommentError(form, message) {
    const errorBox = form.querySelector('[data-comment-element="errors"]');
    if (!errorBox) {
        return;
    }
    errorBox.textContent = message || 'Unable to submit comment.';
    errorBox.hidden = false;
}

function hideCommentError(form) {
    const errorBox = form.querySelector('[data-comment-element="errors"]');
    if (!errorBox) {
        return;
    }
    errorBox.hidden = true;
    errorBox.textContent = '';
}

function buildCommentPayload(form) {
    const formData = new FormData(form);
    const payload = {};

    for (const [key, value] of formData.entries()) {
        payload[key] = value;
    }

    delete payload.csrfmiddlewaretoken;
    delete payload.next;

    payload.name = payload.name || '';
    payload.email = payload.email || '';
    payload.url = payload.url || '';
    payload.honeypot = payload.honeypot || '';

    return payload;
}

function toApiContentType(contentType) {
    return (contentType || '').replace('.', '-');
}

function incrementCommentCountBadge() {
    const badge = document.querySelector('.webpage-badge');
    if (!badge) {
        return;
    }

    const textNode = [...badge.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    if (!textNode) {
        return;
    }

    const current = Number.parseInt(textNode.textContent, 10);
    if (Number.isNaN(current)) {
        return;
    }

    textNode.textContent = `${current + 1} `;
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}

function initTooltipsIn(rootEl) {
    if (!window.bootstrap || !rootEl) {
        return;
    }

    const tooltipEls = rootEl.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipEls.forEach((el) => {
        bootstrap.Tooltip.getOrCreateInstance(el);
    });
}

function buildCommentElement(commentData) {
    const wrapper = document.createElement('div');
    wrapper.id = `c${commentData.id}`;
    wrapper.className = 'comment mt-3 pb-3';

    const canReply = Boolean(commentData.allow_reply);
    const safeUserName = escapeHtml(commentData.user_name || 'user');
    const safeDate = escapeHtml(commentData.submit_date || 'just now');
    const safeUserUrl = escapeHtml(commentData.user_url || '');
    const safeComment = escapeHtml(commentData.comment || '');

    wrapper.innerHTML = `
        <div class="d-flex flex-column">
            <h6 class="comment-header mb-1 d-flex justify-content-between" style="font-size: 0.8rem">
                <div class="d-inline flex-grow-1">
                    <b>@${safeUserName}</b>
                    <span class="small text-secondary">${safeDate}</span>
                    <span>${safeUserUrl ? `<a href="${safeUserUrl}" target="_new" class="text-decoration-none">${safeUserUrl}</a>` : ''}</span>
                </div>
            </h6>
            <div class="content py-1">
                <p class="m-0">${safeComment}</p>
            </div>
            <div class="comment-badges my-1">
                <span class="badge floats-badge rounded-pill p-0">
                    <span class="float-count rounded-pill ms-2 me-0" data-bs-toggle="tooltip" data-bs-title="Nobody has floated this comment.">0</span>
                    <a class="float-button btn btn-sm rounded-circle text-decoration-none m-0 py-0 px-1" href="${buildSiteUrl(`/comments/like/${commentData.id}/`)}" aria-label="Float comment" title="Float comment" data-floated="false">
                        <i class="float-icon bi bi-arrow-up-circle-fill"></i>
                    </a>
                </span>
                ${canReply ? `<a class="small text-decoration-none mx-1" href="${buildSiteUrl(`/comments/reply/${commentData.id}/`)}">Reply</a>` : ''}
            </div>
        </div>
    `;

    return wrapper;
}

async function fetchCreatedComment(payload, commentId) {
    const listContentType = toApiContentType(payload.content_type);
    const objectPk = payload.object_pk;
    if (!listContentType || !objectPk) {
        return null;
    }

    const response = await fetch(buildSiteUrl(`/comments/api/${listContentType}/${objectPk}/`), {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'application/json'
        }
    });

    if (!response.ok) {
        return null;
    }

    const comments = await response.json();
    if (!Array.isArray(comments)) {
        return null;
    }

    return comments.find((comment) => Number(comment.id) === Number(commentId)) || null;
}

async function prependCreatedComment(form, payload, commentId) {
    const tree = document.querySelector('.comment-tree');
    if (!tree) {
        return false;
    }

    const commentData = await fetchCreatedComment(payload, commentId);
    if (!commentData) {
        return false;
    }

    const commentEl = buildCommentElement(commentData);
    tree.prepend(commentEl);
    initTooltipsIn(commentEl);
    incrementCommentCountBadge();
    return true;
}

async function submitCommentForm(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('.comment-form')) {
        return;
    }

    event.preventDefault();
    hideCommentError(form);

    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const payload = buildCommentPayload(form);

        const response = await fetch(buildSiteUrl('/comments/api/comment/'), {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': resolveCsrfToken(form)
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 201) {
            const data = await response.json();
            const inserted = await prependCreatedComment(form, payload, data.id);
            if (!inserted) {
                window.location.reload();
                return;
            }

            form.reset();
            hideCommentError(form);
            return;
        }

        if ([202, 204].includes(response.status)) {
            form.reset();
            return;
        }

        let message = 'Unable to submit comment.';
        try {
            const data = await response.json();
            if (typeof data === 'string') {
                message = data;
            } else if (Array.isArray(data)) {
                message = data.join(', ');
            } else if (data && typeof data === 'object') {
                message = Object.entries(data)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join(' | ');
            }
        } catch (jsonError) {
            message = `Unable to submit comment (${response.status}).`;
        }

        showCommentError(form, message);
    } catch (error) {
        showCommentError(form, 'Network error while submitting comment.');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
}

function extractFeedbackData(link) {
    const href = link.getAttribute('href') || '';
    const pathname = new URL(href, window.location.origin).pathname;
    const match = pathname.match(/\/comments\/(like|dislike)\/(\d+)\/?$/);
    if (!match) {
        return null;
    }

    return {
        flag: match[1],
        commentId: Number(match[2])
    };
}

async function toggleCommentFeedback(event) {
    const link = event.target.closest('a.float-button[href*="/comments/like/"], a.float-button[href*="/comments/dislike/"]');
    if (!link) {
        return;
    }

    const feedbackData = extractFeedbackData(link);
    if (!feedbackData) {
        return;
    }

    event.preventDefault();

    try {
        const response = await fetch(buildSiteUrl('/comments/api/feedback/'), {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': resolveCsrfToken(link)
            },
            body: JSON.stringify({
                comment: feedbackData.commentId,
                flag: feedbackData.flag
            })
        });

        if (response.status === 201 || response.status === 204) {
            const floated = response.status === 201;
            link.dataset.floated = floated ? 'true' : 'false';

            const icon = link.querySelector('.float-icon');
            if (icon) {
                if (feedbackData.flag === 'like') {
                    icon.classList.toggle('bi-arrow-up-circle-fill', floated);
                    icon.classList.toggle('bi-arrow-up-circle', !floated);
                } else {
                    icon.classList.toggle('bi-arrow-down-circle-fill', floated);
                    icon.classList.toggle('bi-arrow-down-circle', !floated);
                }
            }

            const countEl = link.closest('.floats-badge')?.querySelector('.float-count');
            if (countEl) {
                const current = Number.parseInt(countEl.textContent, 10) || 0;
                const next = floated ? current + 1 : Math.max(0, current - 1);
                countEl.textContent = String(next);
            }
            return;
        }

        window.location.href = link.href;
    } catch (error) {
        window.location.href = link.href;
    }
}

document.addEventListener('submit', submitCommentForm);
document.addEventListener('click', toggleCommentFeedback);

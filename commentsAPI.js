// Set this in extension context, e.g. 'http://127.0.0.1:8000'. Keep empty on the web server.
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
    payload.reply_to = payload.reply_to || '0';

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

function getNavbarScrollOffset() {
    const extraMargin = 40;
    const navbar = document.querySelector('.navbar.sticky-top, .navbar');
    if (!(navbar instanceof HTMLElement)) {
        return extraMargin;
    }
    return Math.ceil(navbar.getBoundingClientRect().height) + extraMargin;
}

function getPermalinkCommentElement() {
    const hash = window.location.hash;
    if (!hash) {
        return null;
    }

    const hashId = decodeURIComponent(hash).replace(/^#/, '');
    if (!hashId) {
        return null;
    }

    const exactMatch = document.getElementById(hashId);
    if (exactMatch instanceof HTMLElement && exactMatch.classList.contains('comment')) {
        return exactMatch;
    }

    if (/^\d+$/.test(hashId)) {
        const prefixedMatch = document.getElementById(`c${hashId}`);
        if (prefixedMatch instanceof HTMLElement) {
            return prefixedMatch;
        }
    }

    return null;
}

function highlightCommentFromPermalink(commentEl) {
    if (!(commentEl instanceof HTMLElement)) {
        return;
    }

    if (commentEl.dataset.permalinkHighlightTimeoutId) {
        window.clearTimeout(Number(commentEl.dataset.permalinkHighlightTimeoutId));
    }

    commentEl.classList.remove('comment-permalink-highlight');
    // Force a reflow so repeated hash navigation replays the animation.
    void commentEl.offsetWidth;
    commentEl.classList.add('comment-permalink-highlight');

    const timeoutId = window.setTimeout(() => {
        commentEl.classList.remove('comment-permalink-highlight');
        delete commentEl.dataset.permalinkHighlightTimeoutId;
    }, 2500);
    commentEl.dataset.permalinkHighlightTimeoutId = String(timeoutId);
}

function scrollToPermalinkComment(commentEl) {
    if (!(commentEl instanceof HTMLElement)) {
        return;
    }

    const navbarOffset = getNavbarScrollOffset();
    const commentRect = commentEl.getBoundingClientRect();
    const visibleViewportHeight = Math.max(1, window.innerHeight - navbarOffset);
    const desiredTopInViewport = navbarOffset + Math.max(0, (visibleViewportHeight - commentRect.height) / 2);
    const top = window.scrollY + commentRect.top - desiredTopInViewport;

    window.scrollTo({
        top: Math.max(0, top),
        behavior: 'smooth'
    });
}

function handlePermalinkCommentNavigation() {
    const commentEl = getPermalinkCommentElement();
    if (!commentEl) {
        return;
    }

    scrollToPermalinkComment(commentEl);
    highlightCommentFromPermalink(commentEl);
}

function navigateToCommentPermalink(commentId) {
    const numericId = Number.parseInt(String(commentId), 10);
    if (Number.isNaN(numericId) || numericId <= 0) {
        return;
    }

    const permalinkHash = `#c${numericId}`;
    const nextUrl = `${window.location.pathname}${window.location.search}${permalinkHash}`;
    window.history.replaceState(null, '', nextUrl);
    window.requestAnimationFrame(handlePermalinkCommentNavigation);
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
        <div class="comment-frame d-flex flex-column rounded p-2">
            <h6 class="comment-header mb-1 d-flex justify-content-between" style="font-size: 0.8rem">
                <div class="d-inline flex-grow-1">
                    <span class="text-light text-decoration-none">@${safeUserName}</span>
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
                ${canReply ? `<button class="comment-reply-link btn btn-link btn-sm text-decoration-none mx-1 p-0" type="button" data-bs-toggle="collapse" data-bs-target="#reply-form-${commentData.id}" data-reply-to="${commentData.id}" aria-expanded="false" aria-controls="reply-form-${commentData.id}">Reply</button><div class="collapse mt-2" id="reply-form-${commentData.id}" data-reply-form-slot="${commentData.id}"></div>` : ''}
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
    const parentId = Number.parseInt(payload.reply_to, 10);
    if (!Number.isNaN(parentId) && parentId > 0) {
        const parentCommentEl = document.getElementById(`c${parentId}`);
        if (!parentCommentEl) {
            return false;
        }

        let repliesEl = parentCommentEl.querySelector(`#replies-${parentId}`);
        if (!repliesEl) {
            repliesEl = document.createElement('div');
            repliesEl.id = `replies-${parentId}`;
            repliesEl.className = 'collapse show border-start border-light mt-3 ps-4';
            parentCommentEl.append(repliesEl);
        }

        repliesEl.prepend(commentEl);
    } else {
        tree.prepend(commentEl);
    }

    initTooltipsIn(commentEl);
    incrementCommentCountBadge();
    return true;
}

function cloneBaseCommentForm(replyTo) {
    const baseForm = document.querySelector('.comment-form');
    if (!(baseForm instanceof HTMLFormElement)) {
        return null;
    }

    const clone = baseForm.cloneNode(true);
    clone.reset();

    const replyToInput = clone.querySelector('input[name="reply_to"]');
    if (replyToInput) {
        replyToInput.value = String(replyTo);
        replyToInput.defaultValue = String(replyTo);
    }

    const textarea = clone.querySelector('textarea[name="comment"]');
    if (textarea) {
        textarea.value = '';
        textarea.defaultValue = '';
        textarea.id = `id_comment_reply_${replyTo}`;
    }

    const actions = clone.querySelector('.row.form-group.m-2.p-0 .d-flex');
    if (actions && !actions.querySelector('[data-reply-close]')) {
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn btn-sm ms-2';
        closeButton.dataset.replyClose = 'true';
        closeButton.setAttribute('aria-label', 'Close reply form');
        closeButton.innerHTML = '<i class="bi bi-x-lg m-0 p-0"></i>';
        closeButton.addEventListener('click', (event) => {
            event.preventDefault();

            const slotEl = document.getElementById(`reply-form-${replyTo}`);
            if (!slotEl) {
                return;
            }

            if (window.bootstrap?.Collapse) {
                const collapse = bootstrap.Collapse.getOrCreateInstance(slotEl, { toggle: false });
                collapse.hide();
            } else {
                slotEl.classList.remove('show');
            }
        });
        actions.append(closeButton);
    }

    hideCommentError(clone);
    return clone;
}

function ensureReplyFormMounted(slotEl, replyTo) {
    if (!slotEl || slotEl.querySelector('form.comment-form')) {
        return;
    }

    const replyForm = cloneBaseCommentForm(replyTo);
    if (!replyForm) {
        return;
    }

    slotEl.append(replyForm);
}

function handleReplyButtonClick(event) {
    const button = event.target.closest('button[data-reply-to][data-bs-target]');
    if (!button) {
        return;
    }

    const replyTo = Number.parseInt(button.dataset.replyTo || '0', 10);
    if (Number.isNaN(replyTo) || replyTo <= 0) {
        return;
    }

    const targetSelector = button.dataset.bsTarget;
    if (!targetSelector) {
        return;
    }

    const slotEl = document.querySelector(targetSelector);
    ensureReplyFormMounted(slotEl, replyTo);

    slotEl.addEventListener('shown.bs.collapse', () => {
        const textarea = slotEl.querySelector('textarea[name="comment"]');
        textarea?.focus();
    }, { once: true });
}

function closeReplyFormAfterSubmit(form, payload) {
    const replyTo = Number.parseInt(payload.reply_to || '0', 10);
    if (Number.isNaN(replyTo) || replyTo <= 0) {
        return;
    }

    const slotEl = document.getElementById(`reply-form-${replyTo}`);
    if (!slotEl) {
        return;
    }

    if (window.bootstrap?.Collapse) {
        const collapse = bootstrap.Collapse.getOrCreateInstance(slotEl, { toggle: false });
        collapse.hide();
    } else {
        slotEl.classList.remove('show');
    }
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
            closeReplyFormAfterSubmit(form, payload);
            navigateToCommentPermalink(data.id);
            return;
        }

        if ([202, 204].includes(response.status)) {
            form.reset();
            closeReplyFormAfterSubmit(form, payload);
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
    const link = event.target.closest('a.float-button[href*="/comments/like/"], a.float-button[href*="/comments/dislike/"], a.comment-vote-button[href*="/comments/like/"]');
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
            const voted = response.status === 201;
            if (link.classList.contains('comment-vote-button')) {
                link.dataset.voted = voted ? 'true' : 'false';

                const icon = link.querySelector('i');
                if (icon) {
                    icon.classList.toggle('bi-star-fill', voted);
                    icon.classList.toggle('bi-star', !voted);
                }

                const countEl = link.querySelector('.vote-count');
                if (countEl) {
                    const current = Number.parseInt(countEl.textContent, 10) || 0;
                    const next = voted ? current + 1 : Math.max(0, current - 1);
                    countEl.textContent = String(next);
                }
            } else {
                link.dataset.floated = voted ? 'true' : 'false';

                const icon = link.querySelector('.float-icon');
                if (icon) {
                    if (feedbackData.flag === 'like') {
                        icon.classList.toggle('bi-arrow-up-circle-fill', voted);
                        icon.classList.toggle('bi-arrow-up-circle', !voted);
                    } else {
                        icon.classList.toggle('bi-arrow-down-circle-fill', voted);
                        icon.classList.toggle('bi-arrow-down-circle', !voted);
                    }
                }

                const countEl = link.closest('.floats-badge')?.querySelector('.float-count');
                if (countEl) {
                    const current = Number.parseInt(countEl.textContent, 10) || 0;
                    const next = voted ? current + 1 : Math.max(0, current - 1);
                    countEl.textContent = String(next);
                }
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
document.addEventListener('click', handleReplyButtonClick);
window.addEventListener('hashchange', () => {
    window.requestAnimationFrame(handlePermalinkCommentNavigation);
});
window.requestAnimationFrame(handlePermalinkCommentNavigation);

import { FLOAT_API_URL } from "./api.js";

export function initCommentForm() {

  const comment_form = document.querySelector(".comment-form");

  comment_form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = comment_form.querySelector('textarea[name="content"]').value;
    const webpage_id = comment_form.dataset.webpageId;
    const csrfToken = comment_form.dataset.csrfToken;

    fetch(`${FLOAT_API_URL}/create/comment/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify({ content: content, webpage_id: webpage_id }),
    })
      .then((response) => response.json())
      .then((response) => {

        console.log("Response:", response);

        if (response.status === "201") {
          updateCommentSection(comment_form, response);
        }

      })
      .catch((error) => console.error("Error:", error));
  });
}


export function updateCommentSection(comment_form, response) {

  const commentFeed = document.querySelector(".comment-feed");
  commentFeed.insertAdjacentHTML("afterbegin", response.html);

  comment_form.reset();
}
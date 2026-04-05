import { FLOAT_API_URL } from "./api.js";

export function initCommentForms() {
  const comment_form = document.querySelectorAll(".comment-form");

  comment_form.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const content = form.querySelector('textarea[name="content"]').value;
      const webpage_id = form.dataset.webpageId;
      const csrfToken = form.dataset.csrfToken;

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
          // Optionally, you can add code here to update the comment feed with the new comment
        })
        .catch((error) => console.error("Error:", error));
    });
  });
}

import { FLOAT_API_URL } from "./api.js";

export function initFloatButtons() {
  const float_buttons = document.querySelectorAll(".float-button");

  float_buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const webpage_id = button.dataset.webpageId;
      const csrfToken = button.dataset.csrfToken;

      fetch(`${FLOAT_API_URL}/float/webpage/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ webpage_id: webpage_id }),
      })
        .then((response) => response.json())
        .then((response) => {
          console.log("Response:", response);
          updateFloatButton(button, response);
        })
        .catch((error) => console.error("Error:", error));
    });
  });
}

export function updateFloatButton(button, response) {

  if (response.status === "201") {
    button.dataset.floated = "true";
  }
  else if (response.status === "410") {
    button.dataset.floated = "false";
  }

  let floatCount = button.closest(".floats-badge").querySelector(".float-count");
  floatCount.textContent = response.num_votes;
}

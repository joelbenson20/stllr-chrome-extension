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
          updateFloatButton(button, response.status, response.num_votes);
        })
        .catch((error) => console.error("Error:", error));
    });
  });
}

export function updateFloatButton(button, status, num_votes) {
  // If a vote was successfully created
  if (status === "201") {
    button.dataset.voted = "true";
  }
  // If a vote was successfully deleted
  else if (status === "410") {
    button.dataset.voted = "false";
  }

  //Update float count
  let floatCount = button.querySelector(".float-count");
  floatCount.textContent = num_votes;
}

const form = document.querySelector("#one-time-reset-form");
const emailInput = document.querySelector("#reset-email");
const tokenInput = document.querySelector("#reset-token");
const passwordInput = document.querySelector("#new-password");
const repeatPasswordInput = document.querySelector("#repeat-password");
const message = document.querySelector(".form-message");
const submitButton = document.querySelector(".submit-button");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  if (passwordInput.value !== repeatPasswordInput.value) {
    message.textContent = "The passwords do not match.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Resetting…";

  try {
    const response = await fetch("/api/auth/one-time-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        resetToken: tokenInput.value,
        password: passwordInput.value,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The password could not be reset.");

    form.reset();
    message.style.color = "#2e6b36";
    message.textContent = "Password changed. Taking you to login…";
    window.setTimeout(() => {
      location.href = "/login";
    }, 1200);
  } catch (error) {
    message.textContent = error.message;
    submitButton.disabled = false;
    submitButton.innerHTML = "Reset password <span>→</span>";
  }
});

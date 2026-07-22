const form = document.querySelector("#reset-form");
const emailField = document.querySelector("#email-field");
const emailInput = document.querySelector("#reset-email");
const passwordField = document.querySelector("#new-password-field");
const confirmField = document.querySelector("#confirm-new-password-field");
const passwordInput = document.querySelector("#new-password");
const confirmInput = document.querySelector("#confirm-new-password");
const title = document.querySelector("#form-title");
const intro = document.querySelector("#form-intro");
const message = document.querySelector(".form-message");
const resultBox = document.querySelector(".reset-result");
const submitButton = document.querySelector(".submit-button");
const resetMode = location.pathname === "/reset-password";
const token = new URLSearchParams(location.search).get("token");

if (resetMode) {
  title.textContent = "Choose a new password";
  intro.textContent = "Enter a new password for your library account.";
  emailField.hidden = true;
  emailInput.required = false;
  passwordField.hidden = false;
  confirmField.hidden = false;
  passwordInput.required = true;
  confirmInput.required = true;
  submitButton.innerHTML = "Reset password <span>→</span>";
  if (!token) {
    message.textContent = "This reset link is invalid. Request a new one.";
    submitButton.disabled = true;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  resultBox.hidden = true;
  if (resetMode && passwordInput.value !== confirmInput.value) {
    message.textContent = "The passwords do not match.";
    confirmInput.focus();
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = resetMode ? "Resetting password…" : "Creating reset link…";
  try {
    const response = await fetch(resetMode ? "/api/auth/reset-password" : "/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resetMode ? { token, password: passwordInput.value } : { email: emailInput.value }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not reset your password.");
    if (resetMode) {
      resultBox.innerHTML = `${body.message} <a href="/login">Log in now →</a>`;
      form.querySelectorAll("label").forEach((label) => { label.hidden = true; });
      submitButton.hidden = true;
    } else {
      resultBox.textContent = body.resetUrl
        ? "Your local password reset link is ready."
        : body.message;
      if (body.resetUrl) {
        const link = document.createElement("a");
        link.href = body.resetUrl;
        link.textContent = "Reset your password →";
        resultBox.append(document.createElement("br"), link);
      }
      submitButton.disabled = false;
      submitButton.innerHTML = "Send another link <span>→</span>";
    }
    resultBox.hidden = false;
  } catch (error) {
    message.textContent = error.message;
    submitButton.disabled = false;
    submitButton.innerHTML = resetMode ? "Reset password <span>→</span>" : "Send reset link <span>→</span>";
  }
});

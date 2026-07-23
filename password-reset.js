const form = document.querySelector("#reset-form");
const emailField = document.querySelector("#email-field");
const emailInput = document.querySelector("#reset-email");
const codeField = document.querySelector("#verification-code-field");
const codeInput = document.querySelector("#verification-code");
const passwordField = document.querySelector("#new-password-field");
const confirmField = document.querySelector("#confirm-new-password-field");
const passwordInput = document.querySelector("#new-password");
const confirmInput = document.querySelector("#confirm-new-password");
const title = document.querySelector("#form-title");
const intro = document.querySelector("#form-intro");
const message = document.querySelector(".form-message");
const resultBox = document.querySelector(".reset-result");
const submitButton = document.querySelector(".submit-button");

let mode = location.pathname === "/reset-password" ? "password" : "email";
let accountEmail = "";
let token = new URLSearchParams(location.search).get("token");

function showCodeFields() {
  mode = "code";
  title.textContent = "Enter your email code";
  intro.textContent = "We sent a six-digit code to your email. It expires in 10 minutes.";
  emailField.hidden = true;
  emailInput.required = false;
  codeField.hidden = false;
  codeInput.required = true;
  submitButton.disabled = false;
  submitButton.innerHTML = "Verify code <span>→</span>";
  codeInput.focus();
}

function showNewPasswordFields() {
  mode = "password";
  title.textContent = "Choose a new password";
  intro.textContent = "Enter and repeat your new password.";
  emailField.hidden = true;
  codeField.hidden = true;
  emailInput.required = false;
  codeInput.required = false;
  passwordField.hidden = false;
  confirmField.hidden = false;
  passwordInput.required = true;
  confirmInput.required = true;
  submitButton.disabled = false;
  submitButton.innerHTML = "Reset password <span>→</span>";
  passwordInput.focus();
  if (!token) {
    message.textContent = "Your verification has expired. Request a new code.";
    submitButton.disabled = true;
  }
}

if (mode === "password") showNewPasswordFields();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  resultBox.hidden = true;

  if (mode === "password" && passwordInput.value !== confirmInput.value) {
    message.textContent = "The passwords do not match.";
    confirmInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = mode === "email"
    ? "Sending code…"
    : mode === "code"
      ? "Verifying code…"
      : "Resetting password…";

  const endpoint = mode === "email"
    ? "/api/auth/forgot-password"
    : mode === "code"
      ? "/api/auth/verify-reset-code"
      : "/api/auth/reset-password";
  const payload = mode === "email"
    ? { email: emailInput.value }
    : mode === "code"
      ? { email: accountEmail, code: codeInput.value }
      : { token, password: passwordInput.value };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not reset your password.");

    if (mode === "email") {
      accountEmail = emailInput.value.trim();
      showCodeFields();
      return;
    }
    if (mode === "code") {
      const resetAddress = new URL(body.resetUrl, location.origin);
      token = resetAddress.searchParams.get("token");
      history.replaceState({}, "", resetAddress.pathname + resetAddress.search);
      showNewPasswordFields();
      return;
    }

    resultBox.innerHTML = `${body.message} <a href="/login">Log in now →</a>`;
    form.querySelectorAll("label").forEach((label) => { label.hidden = true; });
    submitButton.hidden = true;
    resultBox.hidden = false;
  } catch (error) {
    message.textContent = error.message;
    submitButton.disabled = false;
    submitButton.innerHTML = mode === "email"
      ? "Send email code <span>→</span>"
      : mode === "code"
        ? "Verify code <span>→</span>"
        : "Reset password <span>→</span>";
  }
});

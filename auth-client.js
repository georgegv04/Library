const form = document.querySelector("#auth-form");
const signupTab = document.querySelector("#signup-tab");
const loginTab = document.querySelector("#login-tab");
const nameField = document.querySelector("#name-field");
const confirmField = document.querySelector("#confirm-field");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const confirmInput = document.querySelector("#confirm-password");
const message = document.querySelector(".form-message");
const submitButton = document.querySelector(".submit-button");
const formTitle = document.querySelector("#form-title");
const formIntro = document.querySelector("#form-intro");
const passwordHelp = document.querySelector("#password-help");
const welcomeEyebrow = document.querySelector("#welcome-eyebrow");
const welcomeTitle = document.querySelector("#welcome-title");
const welcomeCopy = document.querySelector("#welcome-copy");
const entryParams = new URLSearchParams(location.search);
const shouldClearCredentials = entryParams.has("logged-out") || entryParams.has("fresh");

let mode = location.pathname === "/login" ? "login" : "signup";
let credentialFieldsLocked = false;

function clearLoginCredentials() {
  credentialFieldsLocked = true;
  form.reset();
  emailInput.value = "";
  passwordInput.value = "";
  emailInput.autocomplete = "off";
  passwordInput.autocomplete = "new-password";
  emailInput.readOnly = true;
  passwordInput.readOnly = true;

  // Password managers can fill a moment after the page loads, so clear again
  // while the fields are still waiting for the user's first interaction.
  [0, 100, 500].forEach((delay) => {
    window.setTimeout(() => {
      if (!credentialFieldsLocked) return;
      emailInput.value = "";
      passwordInput.value = "";
    }, delay);
  });
}

function unlockCredentialFields() {
  if (!credentialFieldsLocked) return;
  credentialFieldsLocked = false;
  emailInput.readOnly = false;
  passwordInput.readOnly = false;
}

function setMode(nextMode) {
  mode = nextMode;
  const signup = mode === "signup";
  form.reset();
  history.replaceState({}, "", signup ? "/signup" : "/login");
  signupTab.setAttribute("aria-selected", String(signup));
  loginTab.setAttribute("aria-selected", String(!signup));
  signupTab.classList.toggle("active", signup);
  loginTab.classList.toggle("active", !signup);
  nameField.hidden = !signup;
  confirmField.hidden = !signup;
  nameInput.required = signup;
  confirmInput.required = signup;
  passwordInput.autocomplete = signup ? "new-password" : "current-password";
  welcomeEyebrow.textContent = signup ? "Your private reading room" : "Welcome home";
  welcomeTitle.textContent = signup
    ? "Every beloved book, waiting on your shelf."
    : "Your books have been waiting for you.";
  welcomeCopy.textContent = signup
    ? "Create a private collection that grows with every chapter of your reading life."
    : "Return to your saved books, your reading progress, and the stories still waiting to be continued.";
  formTitle.textContent = signup ? "Create your account" : "Welcome back";
  formIntro.textContent = signup ? "Start a personal library that belongs only to you." : "Return to your books and reading memories.";
  passwordHelp.hidden = !signup;
  submitButton.innerHTML = signup ? "Create account <span>→</span>" : "Log in <span>→</span>";
  message.textContent = "";
}

signupTab.addEventListener("click", () => setMode("signup"));
loginTab.addEventListener("click", () => {
  setMode("login");
  clearLoginCredentials();
});
[emailInput, passwordInput].forEach((input) => {
  input.addEventListener("pointerdown", unlockCredentialFields);
  input.addEventListener("focus", unlockCredentialFields);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  if (mode === "signup" && passwordInput.value !== confirmInput.value) {
    message.textContent = "The passwords do not match.";
    confirmInput.focus();
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = mode === "signup" ? "Creating account…" : "Logging in…";
  try {
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput.value, email: emailInput.value, password: passwordInput.value }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not continue.");
    location.href = "/library";
  } catch (error) {
    message.textContent = error.message;
    submitButton.disabled = false;
    submitButton.innerHTML = mode === "signup" ? "Create account <span>→</span>" : "Log in <span>→</span>";
  }
});

fetch("/api/auth/me").then((response) => { if (response.ok) location.href = "/library"; });
setMode(mode);
if (shouldClearCredentials) clearLoginCredentials();

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    form.reset();
    emailInput.value = "";
    passwordInput.value = "";
    history.replaceState({}, "", mode === "signup" ? "/signup" : "/login");
  }
});

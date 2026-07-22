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
const forgotLink = document.querySelector(".forgot-link");

let mode = location.pathname === "/login" ? "login" : "signup";

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
  passwordInput.autocomplete = "off";
  formTitle.textContent = signup ? "Create your account" : "Welcome back";
  formIntro.textContent = signup ? "Start a personal library that belongs only to you." : "Return to your books and reading memories.";
  passwordHelp.hidden = !signup;
  forgotLink.hidden = signup;
  submitButton.innerHTML = signup ? "Create account <span>→</span>" : "Log in <span>→</span>";
  message.textContent = "";
}

signupTab.addEventListener("click", () => setMode("signup"));
loginTab.addEventListener("click", () => setMode("login"));

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

window.addEventListener("pageshow", (event) => {
  if (event.persisted || new URLSearchParams(location.search).has("logged-out")) {
    form.reset();
    history.replaceState({}, "", mode === "signup" ? "/signup" : "/login");
  }
});

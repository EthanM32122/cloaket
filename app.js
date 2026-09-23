// ========== STORAGE HELPERS ==========
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem("musiclet_users") || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem("musiclet_users", JSON.stringify(users));
}

function getCurrentUser() {
  return localStorage.getItem("musiclet_currentUser");
}

function setCurrentUser(username) {
  if (username) {
    localStorage.setItem("musiclet_currentUser", username);
  } else {
    localStorage.removeItem("musiclet_currentUser");
  }
}

// ========== PAGE NAVIGATION ==========
function showPage(pageId) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");

  // Clear messages
  const regError = document.getElementById("regError");
  const regSuccess = document.getElementById("regSuccess");
  const loginError = document.getElementById("loginError");
  if (regError) regError.textContent = "";
  if (regSuccess) regSuccess.textContent = "";
  if (loginError) loginError.textContent = "";

  // Clear form fields when switching
  if (pageId === "register") {
    document.getElementById("registerForm")?.reset();
  }
  if (pageId === "login") {
    document.getElementById("loginForm")?.reset();
  }
}

// ========== PASSWORD TOGGLE ==========
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "🙈";
  } else {
    input.type = "password";
    btn.textContent = "👁";
  }
}

// ========== REGISTER ==========
function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;
  const errorEl = document.getElementById("regError");
  const successEl = document.getElementById("regSuccess");

  errorEl.textContent = "";
  successEl.textContent = "";

  if (username.length < 3) {
    errorEl.textContent = "Username must be at least 3 characters.";
    return;
  }
  if (password.length < 4) {
    errorEl.textContent = "Password must be at least 4 characters.";
    return;
  }

  const users = getUsers();
  if (users[username.toLowerCase()]) {
    errorEl.textContent = "That username is already taken.";
    return;
  }

  // Store with original casing for display, key is lowercased
  users[username.toLowerCase()] = {
    username: username,
    password: password, // plain text for this demo (not for production!)
    created: Date.now(),
  };
  saveUsers(users);

  successEl.textContent = "Account created! Redirecting to login…";
  setTimeout(() => {
    showPage("login");
    document.getElementById("loginUsername").value = username;
  }, 1200);
}

// ========== LOGIN ==========
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorEl = document.getElementById("loginError");

  errorEl.textContent = "";

  const users = getUsers();
  const user = users[username.toLowerCase()];

  if (!user || user.password !== password) {
    errorEl.textContent = "Invalid username or password.";
    return;
  }

  setCurrentUser(user.username);
  document.getElementById("dashUsername").textContent = user.username;
  showPage("dashboard");
}

// ========== LOGOUT ==========
function handleLogout() {
  setCurrentUser(null);
  showPage("landing");
}

// ========== INIT ==========
document.addEventListener("DOMContentLoaded", () => {
  const current = getCurrentUser();
  if (current) {
    document.getElementById("dashUsername").textContent = current;
    showPage("dashboard");
  } else {
    showPage("landing");
  }
});

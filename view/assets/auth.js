function setSession({ token, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("room");
}

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function requireSessionOrRedirect() {
  const token = getToken();
  const user = getUser();
  if (!token || !user?.username) {
    window.location.href = "/view/login.html";
  }
}

function logout() {
  clearSession();
  window.location.href = "/view/login.html";
}

window.AUTH = { setSession, clearSession, getToken, getUser, requireSessionOrRedirect, logout };

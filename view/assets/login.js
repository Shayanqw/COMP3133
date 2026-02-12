$(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get("new") === "1") {
    $("#info").removeClass("d-none").text("Account created. Please log in.");
  }

  $("#loginForm").on("submit", async function (e) {
    e.preventDefault();

    const body = {
      username: $("#username").val().trim(),
      password: $("#password").val()
    };

    $("#error").addClass("d-none").text("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!data.ok) {
        $("#error").removeClass("d-none").text(data.error || "Login failed.");
        return;
      }

      AUTH.setSession({ token: data.token, user: data.user });
      window.location.href = "/view/rooms.html";
    } catch (err) {
      $("#error").removeClass("d-none").text("Network error.");
    }
  });
});

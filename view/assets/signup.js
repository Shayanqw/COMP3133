$(function () {
  $("#signupForm").on("submit", async function (e) {
    e.preventDefault();

    const body = {
      username: $("#username").val().trim(),
      firstname: $("#firstname").val().trim(),
      lastname: $("#lastname").val().trim(),
      password: $("#password").val()
    };

    $("#error").addClass("d-none").text("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!data.ok) {
        $("#error").removeClass("d-none").text(data.error || "Signup failed.");
        return;
      }

      // after signup, go login
      window.location.href = "/view/login.html?new=1";
    } catch (err) {
      $("#error").removeClass("d-none").text("Network error.");
    }
  });
});

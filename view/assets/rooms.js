$(async function () {
  AUTH.requireSessionOrRedirect();
  const user = AUTH.getUser();

  $("#who").text(`${user.firstname} ${user.lastname} (@${user.username})`);

  $("#logoutBtn").on("click", () => AUTH.logout());

  const token = AUTH.getToken();

  // Load room list from API (predefined)
  const res = await fetch("/api/rooms", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  const $sel = $("#roomSelect");
  $sel.empty();
  (data.rooms || []).forEach((r) => {
    $sel.append(`<option value="${r}">${r}</option>`);
  });

  $("#joinBtn").on("click", () => {
    const room = $sel.val();
    if (!room) return;
    localStorage.setItem("room", room);
    window.location.href = `/view/chat.html?room=${encodeURIComponent(room)}`;
  });
});

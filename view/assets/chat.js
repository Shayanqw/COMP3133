let socket = null;
let activeRoom = null;
let activeDMUser = null;
let typingTimer = null;
let dmTypingTimer = null;

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function appendMessage($box, msg, meUsername) {
  const isMe = msg.from_user === meUsername;
  const cls = isMe ? "msg me" : "msg";
  const metaLeft = isMe ? "You" : `@${escapeHtml(msg.from_user)}`;
  const metaRight = msg.date_sent_text || (msg.date_sent ? new Date(msg.date_sent).toLocaleString() : "");

  const html = `
    <div class="${cls}">
      <div class="meta">
        <span>${metaLeft}</span>
        <span>${escapeHtml(metaRight)}</span>
      </div>
      <div class="text">${escapeHtml(msg.message)}</div>
    </div>
  `;
  $box.append(html);
  $box.scrollTop($box[0].scrollHeight);
}

async function loadGroupHistory(room) {
  const token = AUTH.getToken();
  const res = await fetch(`/api/messages/group/${encodeURIComponent(room)}?limit=80`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.messages || [];
}

async function loadPrivateHistory(other) {
  const token = AUTH.getToken();
  const res = await fetch(`/api/messages/private/${encodeURIComponent(other)}?limit=80`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.messages || [];
}

async function refreshUsers(room) {
  const token = AUTH.getToken();
  const res = await fetch(`/api/users/room/${encodeURIComponent(room)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  renderUsers(data.users || []);
}

function renderUsers(users) {
  const me = AUTH.getUser().username;
  const $list = $("#usersList");
  $list.empty();

  const others = users.filter(u => u !== me);

  if (others.length === 0) {
    $list.append(`<div class="small-muted">No other users online.</div>`);
    return;
  }

  others.forEach(u => {
    const html = `
      <div class="user-pill" data-username="${escapeHtml(u)}">
        <div>
          <div class="fw-semibold">@${escapeHtml(u)}</div>
          <div class="small-muted">Click to DM</div>
        </div>
        <span class="badge badge-soft">DM</span>
      </div>
    `;
    $list.append(html);
  });

  $(".user-pill").on("click", async function () {
    const to = $(this).data("username");
    await openDM(to);
  });
}

async function openDM(username) {
  activeDMUser = username;
  $("#dmWith").text(`@${username}`);
  $("#dmTyping").text("");

  // load history
  const msgs = await loadPrivateHistory(username);
  const $box = $("#dmMessages");
  $box.empty();
  const me = AUTH.getUser().username;
  msgs.forEach(m => appendMessage($box, m, me));

  // show modal
  const modal = new bootstrap.Modal(document.getElementById("dmModal"));
  modal.show();

  // focus input
  setTimeout(() => $("#dmInput").trigger("focus"), 250);
}

$(async function () {
  AUTH.requireSessionOrRedirect();

  const user = AUTH.getUser();
  const token = AUTH.getToken();
  const params = new URLSearchParams(window.location.search);
  activeRoom = params.get("room") || localStorage.getItem("room") || "devops";
  $("#roomName").text(activeRoom);
  $("#who").text(`${user.firstname} ${user.lastname} (@${user.username})`);

  $("#logoutBtn").on("click", () => AUTH.logout());
  $("#leaveBtn").on("click", () => {
    if (socket && activeRoom) socket.emit("leave_room", { room: activeRoom });
    localStorage.removeItem("room");
    window.location.href = "/view/rooms.html";
  });

  // Connect socket
  socket = io("/", { auth: { token } });

  socket.on("connect_error", (err) => {
    $("#status").removeClass("d-none").text(`Socket error: ${err.message}. Please login again.`);
    AUTH.clearSession();
    setTimeout(() => (window.location.href = "/view/login.html"), 1200);
  });

  socket.on("ready", async () => {
    socket.emit("join_room", { room: activeRoom });

    // Load history
    const history = await loadGroupHistory(activeRoom);
    const $box = $("#roomMessages");
    $box.empty();
    history.forEach(m => appendMessage($box, m, user.username));

    // Users
    await refreshUsers(activeRoom);
  });

  socket.on("room_users", ({ room, users }) => {
    if (room === activeRoom) renderUsers(users || []);
  });

  socket.on("system", (payload) => {
    if (payload.room !== activeRoom) return;
    const $box = $("#roomMessages");
    $box.append(`
      <div class="small-muted mb-2">• ${escapeHtml(payload.message)} <span class="ms-1">(${escapeHtml(payload.at)})</span></div>
    `);
    $box.scrollTop($box[0].scrollHeight);
  });

  socket.on("group_message", (msg) => {
    if (msg.room !== activeRoom) return;
    appendMessage($("#roomMessages"), msg, user.username);
  });

  socket.on("private_message", (msg) => {
    // If DM modal open with this user, append live
    const other = msg.from_user === user.username ? msg.to_user : msg.from_user;
    if (activeDMUser && other === activeDMUser) {
      appendMessage($("#dmMessages"), msg, user.username);
    }
    // Optional: show a toast/notice if DM arrives when modal not open
    if (!activeDMUser || other !== activeDMUser) {
      showToast(`New DM from @${other}`);
    }
  });

  socket.on("typing_room", ({ room, from_user, isTyping }) => {
    if (room !== activeRoom) return;
    if (!isTyping) {
      $("#typingLine").text("");
      return;
    }
    $("#typingLine").text(`@${from_user} is typing...`);
  });

  socket.on("typing_private", ({ from_user, isTyping }) => {
    if (activeDMUser !== from_user) return;
    $("#dmTyping").text(isTyping ? `@${from_user} is typing...` : "");
  });

  // Send group message
  $("#sendBtn").on("click", () => {
    const text = $("#roomInput").val().trim();
    if (!text) return;
    socket.emit("group_message", { room: activeRoom, message: text });
    $("#roomInput").val("");
    socket.emit("typing_room", { room: activeRoom, isTyping: false });
  });

  $("#roomInput").on("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $("#sendBtn").trigger("click");
      return;
    }
  });

  // Typing room indicator
  $("#roomInput").on("input", () => {
    socket.emit("typing_room", { room: activeRoom, isTyping: true });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit("typing_room", { room: activeRoom, isTyping: false });
    }, 900);
  });

  // DM send
  $("#dmSendBtn").on("click", () => {
    const text = $("#dmInput").val().trim();
    if (!text || !activeDMUser) return;
    socket.emit("private_message", { to_user: activeDMUser, message: text });
    $("#dmInput").val("");
    socket.emit("typing_private", { to_user: activeDMUser, isTyping: false });
  });

  $("#dmInput").on("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $("#dmSendBtn").trigger("click");
      return;
    }
  });

  $("#dmInput").on("input", () => {
    if (!activeDMUser) return;
    socket.emit("typing_private", { to_user: activeDMUser, isTyping: true });
    clearTimeout(dmTypingTimer);
    dmTypingTimer = setTimeout(() => {
      socket.emit("typing_private", { to_user: activeDMUser, isTyping: false });
    }, 900);
  });

  // Small status refresh timer (optional)
  setInterval(() => {
    if (activeRoom) refreshUsers(activeRoom);
  }, 12000);
});

function showToast(text) {
  const $wrap = $("#toastWrap");
  const id = "t" + Math.random().toString(16).slice(2);
  const html = `
    <div id="${id}" class="toast text-bg-dark border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">${escapeHtml(text)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  $wrap.append(html);
  const el = document.getElementById(id);
  const t = new bootstrap.Toast(el, { delay: 2200 });
  t.show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}

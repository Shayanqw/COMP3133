/**
 * In-memory presence map:
 * - username -> socketId
 * - room -> Set(usernames)
 *
 * This is *not* permanent storage; it is only for online presence.
 */
const userToSocket = new Map();
const roomToUsers = new Map();

export function setUserSocket(username, socketId) {
  userToSocket.set(username, socketId);
}

export function removeUserSocket(username) {
  userToSocket.delete(username);
}

export function getSocketIdByUser(username) {
  return userToSocket.get(username);
}

export function joinRoom(username, room) {
  if (!roomToUsers.has(room)) roomToUsers.set(room, new Set());
  roomToUsers.get(room).add(username);
}

export function leaveRoom(username, room) {
  const set = roomToUsers.get(room);
  if (!set) return;
  set.delete(username);
  if (set.size === 0) roomToUsers.delete(room);
}

export function getOnlineUsersInRoom(room) {
  const set = roomToUsers.get(room);
  return set ? Array.from(set).sort() : [];
}

import { getElement, addEvent } from "./utils.js";
import request from "./request.js";

const chatMap = {};
const userMap = {};

let ws = null;
let currentChatUserId = null;

function getChatUserIdFromHash() {
  const hash = window.location.hash;
  const queryText = hash.split("?")[1];

  if (!queryText) {
    return "";
  }

  const params = new URLSearchParams(queryText);
  return params.get("id");
}

function getChatUserInfo(userId) {
  if (userMap[userId]) {
    return Promise.resolve(userMap[userId]);
  }

  const token = localStorage.getItem("token");

  return request(
    `/user/getDetail/${userId}`,
    "POST",
    {},
    { Authorization: token },
  )
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Get chat user failed:", result.msg);
        return null;
      }

      const user = result.data;

      if (!user.userId) {
        user.userId = Number(userId);
      }

      userMap[userId] = user;
      return user;
    })
    .catch((error) => {
      console.log("Request chat user failed:", error);
      return null;
    });
}

function getChatHistory(userId) {
  const myId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  if (!myId || !userId) {
    return Promise.resolve([]);
  }

  const params = {
    senderId: Number(myId),
    receiverId: Number(userId),
    pageNum: 1,
    pageSize: 10,
  };

  return request("/chat/history", "GET", params, { Authorization: token })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("No chat history:", result.msg);
        return [];
      }

      if (!result.data) {
        return [];
      }

      const records = result.data.records || [];
      return records.reverse();
    })
    .catch((error) => {
      console.log("Request chat history failed:", error);
      return [];
    });
}

function getChatUsersKey() {
  const userId = localStorage.getItem("userId");
  return `chatUsers_${userId}`;
}

function getLocalChatUsers() {
  const chatUsersText = localStorage.getItem(getChatUsersKey());

  if (!chatUsersText) {
    return [];
  }

  return JSON.parse(chatUsersText);
}

function saveLocalChatUser(user, lastContent) {
  const chatUsers = getLocalChatUsers();
  const oldUser = chatUsers.find((item) => {
    return String(item.userId) === String(user.userId);
  });

  const chatUser = {
    userId: user.userId,
    userName: user.userName,
    image: user.image || "",
    lastContent: lastContent || (oldUser ? oldUser.lastContent : ""),
    lastTime: new Date().toISOString(),
  };

  const newChatUsers = chatUsers.filter((item) => {
    return String(item.userId) !== String(user.userId);
  });

  newChatUsers.unshift(chatUser);
  localStorage.setItem(getChatUsersKey(), JSON.stringify(newChatUsers));
}

function renderChatUserInfo(user) {
  const talkerImg = getElement(".talker-img");
  const talkerName = getElement(".talker-name");

  talkerImg.src = "";

  if (user.image) {
    talkerImg.src = user.image;
  }

  talkerName.textContent = user.userName;
}

function renderChatMessages() {
  const myId = localStorage.getItem("userId");
  const chatContent = getElement(".chat-content");
  const messages = chatMap[currentChatUserId] || [];

  chatContent.innerHTML = "";

  messages.forEach((message) => {
    const isMe = String(message.senderId) === String(myId);
    const otherUser = userMap[currentChatUserId];
    const avatarSrc =
      !isMe && otherUser && otherUser.image ? otherUser.image : "";

    let statusHtml = "";

    if (isMe && message.status === "sending") {
      statusHtml =
        '<span class="message-status status-sending">sending...</span>';
    }

    if (isMe && message.status === "failed") {
      statusHtml = '<span class="message-status status-failed">failed</span>';
    }

    chatContent.insertAdjacentHTML(
      "beforeend",
      `
        <div class="${isMe ? "sender-chat" : "recipient-chat"}">
          <div class="chat-bubble-row">
            ${isMe ? "" : `<img class="avatar" src="${avatarSrc}" alt="" />`}
            <div class="message-bubbles">
              <div class="message-bubble">${message.content}</div>
            </div>
          </div>
          ${statusHtml}
        </div>
      `,
    );
  });

  chatContent.scrollTop = chatContent.scrollHeight;
}

function updateMessageStatus(tempId, status) {
  const messages = chatMap[currentChatUserId] || [];
  const message = messages.find((item) => {
    return item.chatMsgId === tempId;
  });

  if (!message) {
    return;
  }

  message.status = status;
  renderChatMessages();
}

function initWebSocket() {
  const token = localStorage.getItem("token");

  if (!token) {
    return;
  }

  if (ws && ws.readyState !== WebSocket.CLOSED) {
    return;
  }

  ws = new WebSocket(`wss://duck1437.shop/ws/chat?token=${token}`);

  ws.onopen = () => {
    console.log("WebSocket connect");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Receive WebSocket message:", data);
    handleSocketMessage(data);
  };

  ws.onclose = () => {
    ws = null;
  };

  ws.onerror = (error) => {
    console.log("WebSocket error:", error);
  };
}

function handleSocketMessage(data) {
  if (Number(data.type) !== 0) {
    return;
  }

  const myId = localStorage.getItem("userId");
  const senderId = data.senderId;
  const receiverId = data.receiverId;

  if (String(senderId) === String(myId)) {
    return;
  }

  if (String(receiverId) !== String(myId)) {
    return;
  }

  const chatUserId = String(senderId);

  if (!chatMap[chatUserId]) {
    chatMap[chatUserId] = [];
  }

  chatMap[chatUserId].push({
    chatMsgId: data.chatMsgId || Date.now(),
    senderId: senderId,
    receiverId: receiverId,
    content: data.content,
    createTime: data.createTime || new Date().toISOString(),
  });

  getChatUserInfo(chatUserId).then((user) => {
    if (user) {
      saveLocalChatUser(user, data.content);
    }
  });

  if (String(chatUserId) === String(currentChatUserId)) {
    renderChatMessages();
  }
}

function sendMessage(content) {
  if (!content.trim() || !currentChatUserId) {
    return;
  }

  initWebSocket();

  const myId = localStorage.getItem("userId");
  const targetId = currentChatUserId;
  const tempId = `temp_${Date.now()}`;

  const message = {
    type: 0,
    senderId: Number(myId),
    receiverId: Number(targetId),
    content: content.trim(),
  };

  if (!chatMap[targetId]) {
    chatMap[targetId] = [];
  }

  chatMap[targetId].push({
    chatMsgId: tempId,
    senderId: Number(myId),
    receiverId: Number(targetId),
    content: content.trim(),
    createTime: new Date().toISOString(),
    status: "sending",
  });

  renderChatMessages();

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    updateMessageStatus(tempId, "sent");
    getChatUserInfo(targetId).then((user) => {
      if (user) {
        saveLocalChatUser(user, content.trim());
      }
    });
    return;
  }

  updateMessageStatus(tempId, "failed");
}

function initChatPage() {
  const pageName = window.location.hash.split("?")[0];

  if (pageName !== "#chat") {
    return;
  }

  const userId = getChatUserIdFromHash();

  if (!userId) {
    return;
  }

  currentChatUserId = userId;
  initWebSocket();

  if (!chatMap[userId]) {
    chatMap[userId] = [];
  }

  getChatUserInfo(userId).then((user) => {
    if (user) {
      renderChatUserInfo(user);
      saveLocalChatUser(user, "");
    }
  });

  getChatHistory(userId).then((messages) => {
    chatMap[userId] = messages;
    renderChatMessages();
  });

  renderChatMessages();
}

function bindChatEvents() {
  const backBtn = getElement(".chat-head .icon-arrowleft");
  const sendBtn = getElement(".send-btn");
  const inputEl = getElement("#send-message");

  addEvent(backBtn, "click", () => {
    currentChatUserId = null;
    window.location.hash = "#message";
  });

  addEvent(sendBtn, "click", () => {
    const content = inputEl.value;

    if (!content.trim()) {
      return;
    }

    sendMessage(content);
    inputEl.value = "";
  });

  addEvent(inputEl, "keypress", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    const content = inputEl.value;

    if (!content.trim()) {
      return;
    }

    sendMessage(content);
    inputEl.value = "";
  });
}

bindChatEvents();

window.addEventListener("hashchange", () => {
  initChatPage();
});

initChatPage();

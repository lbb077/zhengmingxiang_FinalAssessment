import { getElement, getElements, addEvent } from "./utils.js";
import request from "./request.js";

const modeBtns = getElements(".category ul li");
const category = getElement(".category ul");
const messageList = getElement(".message-list");
const likeList = getElement(".like-list");
const followList = getElement(".follow-list");
const commentList = getElement(".message-page .comment-list");
const starList = getElement(".message-page .star-list");
const likeCommentList = getElement(".message-page .like-comment-list");

const listBoxes = [
  messageList,
  likeList,
  followList,
  commentList,
  starList,
  likeCommentList,
];

const typeNames = [
  "message",
  "like",
  "follow",
  "comment",
  "star",
  "like-comment",
];

function getReadMessages() {
  const readText = localStorage.getItem("readMessages");

  if (!readText) {
    return [];
  }

  return JSON.parse(readText);
}

function saveReadMessage(messageId) {
  const readMessages = getReadMessages();
  const id = Number(messageId);

  if (!readMessages.includes(id)) {
    readMessages.push(id);
  }

  localStorage.setItem("readMessages", JSON.stringify(readMessages));
}

function isMessageRead(message) {
  const readMessages = getReadMessages();

  if (readMessages.includes(message.messageId)) {
    return true;
  }

  return message.isRead === 1;
}

function formatTime(createTime) {
  const time = new Date(createTime).getTime();
  const now = Date.now();
  const diff = now - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;

  if (diff < minute) {
    return "just now";
  }

  if (diff < hour) {
    return Math.floor(diff / minute) + " min ago";
  }

  if (diff < 24 * hour) {
    return Math.floor(diff / hour) + " hours ago";
  }

  if (createTime.includes("T")) {
    return createTime.split("T")[0];
  }

  return createTime.split(" ")[0];
}

function getMyMessages(messages) {
  const userId = localStorage.getItem("userId");

  return messages.filter((message) => {
    return message.receiverId === Number(userId);
  });
}

function getChatUsersKey() {
  const userId = localStorage.getItem("userId");
  return `chatUsers_${userId}`;
}

function getChatUsers() {
  const chatUsersText = localStorage.getItem(getChatUsersKey());

  if (!chatUsersText) {
    return [];
  }

  return JSON.parse(chatUsersText);
}

export function getAllMessage() {
  const token = localStorage.getItem("token");

  return request("/message/all", "GET", {}, { Authorization: token })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Get messages failed:", result.msg);
        return [];
      }

      const messages = result.data.messages || [];
      return getMyMessages(messages);
    })
    .catch((error) => {
      console.log("Request messages failed:", error);
      return [];
    });
}

function groupMessages(messages) {
  const groups = {
    message: [],
    like: [],
    follow: [],
    comment: [],
    star: [],
    "like-comment": [],
  };

  messages.forEach((message) => {
    if (message.type === 1) {
      groups.like.push(message);
    }

    if (message.type === 2) {
      groups.star.push(message);
    }

    if (message.type === 3) {
      groups.comment.push(message);
    }

    if (message.type === 4) {
      groups.follow.push(message);
    }

    if (message.type === 5) {
      groups["like-comment"].push(message);
    }
  });

  return groups;
}

function renderList(type, messages) {
  const boxIndex = typeNames.indexOf(type);
  const box = listBoxes[boxIndex];
  const list = box.querySelector("ul");

  list.innerHTML = "";

  if (messages.length === 0) {
    list.insertAdjacentHTML(
      "beforeend",
      '<li class="message-item">No messages</li>',
    );
    return;
  }

  messages.forEach((message) => {
    let dotHtml = "";

    if (!isMessageRead(message)) {
      dotHtml = '<div class="dot"></div>';
    }

    list.insertAdjacentHTML(
      "beforeend",
      `
        <li class="message-item" data-id="${message.messageId}" data-post-id="${message.postId}">
          ${dotHtml}
          <div class="preview">
            <p>${message.content}</p>
            <span class="time">${formatTime(message.createTime)}</span>
          </div>
        </li>
      `,
    );
  });
}

function renderAll(groups) {
  renderList("message", groups.message);
  renderList("like", groups.like);
  renderList("follow", groups.follow);
  renderList("comment", groups.comment);
  renderList("star", groups.star);
  renderList("like-comment", groups["like-comment"]);
}

function renderChatUsers() {
  const list = messageList.querySelector("ul");
  const chatUsers = getChatUsers();

  list.innerHTML = "";

  if (chatUsers.length === 0) {
    list.insertAdjacentHTML(
      "beforeend",
      '<li class="message-item">No messages</li>',
    );
    return;
  }

  chatUsers.forEach((user) => {
    const image = user.image || "";
    const lastContent = user.lastContent || "";
    const lastTime = user.lastTime ? formatTime(user.lastTime) : "";

    list.insertAdjacentHTML(
      "beforeend",
      `
        <li class="message-item" data-user-id="${user.userId}">
          <div class="avater session-avatar">
            <img src="${image}" alt="" />
          </div>
          <div class="preview">
            <p class="session-name">${user.userName}</p>
            <p>${lastContent}</p>
            <span class="time">${lastTime}</span>
          </div>
        </li>
      `,
    );
  });
}

function switchMode(index) {
  modeBtns.forEach((item) => {
    item.classList.remove("category-picked");
  });

  listBoxes.forEach((item) => {
    item.classList.remove("messageList-active");
  });

  modeBtns[index].classList.add("category-picked");
  listBoxes[index].classList.add("messageList-active");
}

function bindCategoryEvents() {
  addEvent(category, "click", (event) => {
    const mode = event.target.closest("li");

    if (!mode) {
      return;
    }

    modeBtns.forEach((item, index) => {
      if (item === mode) {
        switchMode(index);
      }
    });
  });
}

function bindMessageEvents() {
  listBoxes.forEach((box) => {
    const list = box.querySelector("ul");

    addEvent(list, "click", (event) => {
      const item = event.target.closest(".message-item");

      if (!item) {
        return;
      }

      const messageId = item.dataset.id;

      if (!messageId) {
        return;
      }

      const dot = item.querySelector(".dot");

      if (dot) {
        dot.style.display = "none";
      }

      saveReadMessage(messageId);
    });
  });
}

function bindChatUserEvents() {
  const list = messageList.querySelector("ul");

  addEvent(list, "click", (event) => {
    const item = event.target.closest(".message-item");

    if (!item) {
      return;
    }

    const userId = item.dataset.userId;

    if (!userId) {
      return;
    }

    window.location.hash = `#chat?id=${userId}`;
  });
}

function initMessagePage() {
  getAllMessage().then((messages) => {
    const groups = groupMessages(messages);
    renderAll(groups);
    renderChatUsers();
    switchMode(0);
  });
}

bindCategoryEvents();
bindMessageEvents();
bindChatUserEvents();

window.addEventListener("hashchange", () => {
  const pageName = window.location.hash.split("?")[0];

  if (pageName === "#message") {
    initMessagePage();
  }
});

initMessagePage();

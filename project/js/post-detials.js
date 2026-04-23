import { getElement, addEvent } from "./utils.js";
import { posts } from "./data.js";

const back = getElement(".post-detials .avater-info i");
const image = getElement(".post-detials .detial-avater");
const likeButton = getElement(".post-detials .like-btn");
const likeIcon = getElement(".post-detials .like-icon");
const collectButton = getElement(".post-detials .collect-btn");
const collectIcon = getElement(".post-detials .collect-icon");
const likeCount = getElement(".post-detials .detial-dsec p");
const commentInput = getElement(".post-detials .comment-input");
const commentButton = getElement(".post-detials .push-comment");
const commentList = getElement(".post-detials .comment-list");

let currentDetailPost = null;

addEvent(back, "click", () => {
  window.location.hash = "#home";
});

addEvent(image, "click", () => {
  window.location.hash = "#other";
});

function updateLikeButton() {
  if (!currentDetailPost) return;

  if (currentDetailPost.isLiked) {
    likeButton.classList.add("active");
    likeIcon.classList.add("active");
  } else {
    likeButton.classList.remove("active");
    likeIcon.classList.remove("active");
  }

  likeCount.textContent = `${currentDetailPost.likes} likes`;
}

function updateCollectButton() {
  if (!currentDetailPost) return;

  if (currentDetailPost.isCollected) {
    collectButton.classList.add("active");
    collectIcon.classList.add("active");
  } else {
    collectButton.classList.remove("active");
    collectIcon.classList.remove("active");
  }
}

function renderCommentList() {
  if (!currentDetailPost) return;

  const commentData = currentDetailPost.commentList || [];

  if (commentData.length === 0) {
    commentList.innerHTML = '<p class="empty-comment">暂无评论</p>';
    return;
  }

  let html = "";
  commentData.forEach((comment) => {
    html += `
      <div class="comment-item">
        <div class="commenter">
          <img src="${comment.avatar}" alt="#" class="detial-avater" />
        </div>
        <div class="comment-info">
          <p class="commenter-id">${comment.userName}</p>
          <p>${comment.content}</p>
          <div class="icons-and-time">
            <p class="time">${comment.time}</p>
            <div class="comment-icons">
              <i class="iconfont icon-24px"></i>
              <i class="iconfont icon-pinglun"></i>
              <i class="iconfont icon-share"></i>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  commentList.innerHTML = html;
}

addEvent(likeButton, "click", () => {
  if (!currentDetailPost) return;

  if (currentDetailPost.isLiked) {
    currentDetailPost.likes -= 1;
    currentDetailPost.isLiked = false;
  } else {
    currentDetailPost.likes += 1;
    currentDetailPost.isLiked = true;
  }

  updateLikeButton();
});

addEvent(collectButton, "click", () => {
  if (!currentDetailPost) return;

  currentDetailPost.isCollected = !currentDetailPost.isCollected;
  updateCollectButton();
});

addEvent(commentButton, "click", () => {
  if (!currentDetailPost) return;

  const text = commentInput.value.trim();
  if (!text) return;

  if (!currentDetailPost.commentList) {
    currentDetailPost.commentList = [];
  }

  currentDetailPost.commentList.push({
    userName: "Me",
    content: text,
    time: "just now",
    avatar: currentDetailPost.avatar,
  });

  commentInput.value = "";
  renderCommentList();
});

function renderPostDetail() {
  const hash = location.hash;
  if (!hash.includes("id=")) return;

  const id = hash.split("=")[1];
  const currentPost = posts.find((post) => post.id == id);
  if (!currentPost) return;

  currentDetailPost = currentPost;
  currentDetailPost.commentList = currentDetailPost.commentList || [];

  getElement(".post-detials .detial-avater").src = currentPost.avatar;
  getElement(".post-detials .poster-name").textContent = currentPost.userName;
  getElement(".detial-dsec span").textContent = currentPost.content;
  getElement(".add-comment .comment-avater").src = currentPost.avatar;

  const banner = getElement(".photoset");
  banner.innerHTML = "";

  let html = "";
  currentPost.images.forEach((src) => {
    html += `
    <li>
      <img src="${src}" />
    </li>
  `;
  });

  banner.innerHTML = html;
  updateLikeButton();
  updateCollectButton();
  renderCommentList();
}

export { renderPostDetail };

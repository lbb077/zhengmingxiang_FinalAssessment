import { getElement, addEvent } from "./utils.js";
import request from "./request.js";
const editBtn = getElement(".edit-profile");
addEvent(editBtn, "click", () => {
  window.location.hash = "#publish";
});
const messageBtn = getElement(".userName-and-info .message");
addEvent(messageBtn, "click", () => {
  window.location.hash = "#message";
});

// ---------- 获取元素 ----------
const avatarImg = getElement(".Avater .border img");
const usernameEl = getElement(".username");
const signatureEl = getElement(".desc");
const postsEl = getElement(".posts");
const followersEl = getElement(".followers");
const followingEl = getElement(".following");
const personalPostsList = getElement(".text-view ul");
const defaultAvatar = "./resources/test photos/test-user-img.jpg";

// ---------- 获取用户信息 ----------
function getUserInfo() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  request(`/user/getDetail/${userId}`, "POST", {}, { Authorization: token })
    .then((res) => {
      if (res.data.code === 200) {
        const user = res.data.data;

        avatarImg.src = defaultAvatar;
        usernameEl.textContent = user.userName;
        signatureEl.textContent = user.signature;
        postsEl.textContent = user.postCount;
        followersEl.textContent = user.followerCount;
        followingEl.textContent = user.followingCount;
      } else {
        console.error("获取用户信息失败:", res.data.msg);
      }
    })
    .catch((err) => {
      console.error("请求用户信息出错:", err);
    });
}

// ---------- 获取个人帖子 ----------
function getUserPosts() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  request(`/post/getPostByUser/${userId}`, "POST", {}, { Authorization: token })
    .then((res) => {
      if (res.data.code === 200) {
        const posts = res.data.data || [];
        renderUserPosts(posts);
      } else {
        console.error("获取个人帖子失败:", res.data.msg);
      }
    })
    .catch((err) => {
      console.error("请求个人帖子出错:", err);
    });
}

// ---------- 渲染帖子 ----------
function renderUserPosts(posts) {
  personalPostsList.innerHTML = ""; // 先清空

  posts.forEach((post) => {
    const li = document.createElement("li");
    li.dataset.id = post.postId;
    const image = getPostImage(post);

    li.innerHTML = `
      <h3 class="plog-head">${post.title}</h3>
      <p>${post.content}</p>
      ${image ? `<img class="grid-photo" src="${image}" />` : ""}
      <div class="plog-info">
        <p class="push-time">${post.createTime}</p>
        <div class="icons">
          <i class="iconfont icon-24px"></i>
          <i class="iconfont icon-pinglun"></i>
          <i class="iconfont icon-share"></i>
        </div>
      </div>
    `;

    personalPostsList.appendChild(li);
  });

}

addEvent(personalPostsList, "click", (event) => {
  const item = event.target.closest("li");

  if (!item) {
    return;
  }

  const postId = item.dataset.id;

  if (!postId) {
    return;
  }

  window.location.hash = `#post-detials?id=${postId}`;
});

// ---------- 页面切换到个人页时调用 ----------
function getPostImage(post) {
  if (post.images === "") {
    return "";
  }

  return post.images.split(",")[0];
}

getUserInfo();
getUserPosts();

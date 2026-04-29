import { getElement, addEvent } from "./utils.js";
import request from "./request.js";

const otherAvatarImg = getElement(".other .Avater .border img");
const otherBgImg = getElement(".other .profile-bg-img");
const otherUsernameEl = getElement(".other .username");
const otherSignatureEl = getElement(".other .desc");
const otherPostsEl = getElement(".other .posts");
const otherFollowersEl = getElement(".other .followers");
const otherFollowingEl = getElement(".other .following");
const otherPostList = getElement(".other .posts-view ul");
const otherMessageBtn = getElement(".other .message");

function getOtherUserId() {
  const hash = window.location.hash;
  const queryText = hash.split("?")[1];

  if (!queryText) {
    return "";
  }

  const params = new URLSearchParams(queryText);

  return params.get("id");
}

function renderOtherUser(user) {
  if (user.image !== "") {
    if (user.image !== null) {
      if (user.image !== undefined) {
        otherAvatarImg.src = user.image;
      } else {
        otherAvatarImg.src = "";
      }
    } else {
      otherAvatarImg.src = "";
    }
  } else {
    otherAvatarImg.src = "";
  }

  if (
    user.background !== "" &&
    user.background !== null &&
    user.background !== undefined
  ) {
    otherBgImg.src = user.background;
  } else {
    otherBgImg.src = "";
  }

  otherUsernameEl.textContent = user.userName;
  otherSignatureEl.textContent = user.signature;
  otherPostsEl.textContent = user.postCount;
  otherFollowersEl.textContent = user.followerCount;
  otherFollowingEl.textContent = user.followingCount;
}

function getPostImage(post) {
  if (post.images === "") {
    return "";
  }

  return post.images.split(",")[0];
}

function renderOtherPosts(posts) {
  otherPostList.innerHTML = "";

  posts.forEach((post) => {
    if (post.permission === 0) {
      return;
    }

    const image = getPostImage(post);
    let imageHtml = "";

    if (image !== "") {
      imageHtml = `<img src="${image}" alt="" class="image" />`;
    }

    otherPostList.innerHTML += `
      <li class="post-item" data-id="${post.postId}">
        <div class="post">
          <div class="post-head">
            <div class="avatar">
              <div class="avatar-infos">
                <p class="post-title">${post.title}</p>
                <p class="time">${post.createTime}</p>
              </div>
            </div>
          </div>
          ${imageHtml}
          <div class="description">
            <p>${post.content}</p>
            <div class="post-action">
              <i class="iconfont icon-24px"></i>
              <span>${post.likeCount} Likes</span>
              <i class="iconfont icon-pinglun"></i>
              <span>${post.commentCount} comments</span>
            </div>
          </div>
        </div>
      </li>
    `;
  });
}

function getOtherUserInfo() {
  const token = localStorage.getItem("token");
  const userId = getOtherUserId();

  if (!userId) {
    return;
  }

  request(`/user/getDetail/${userId}`, "POST", {}, { Authorization: token })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Get other user failed:", result.msg);
        return;
      }

      renderOtherUser(result.data);
    })
    .catch((error) => {
      console.log("Request other user failed:", error);
    });
}

function getOtherPosts() {
  const token = localStorage.getItem("token");
  const userId = getOtherUserId();

  if (!userId) {
    return;
  }

  request(`/post/getPostByUser/${userId}`, "POST", {}, { Authorization: token })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Get other posts failed:", result.msg);
        return;
      }

      renderOtherPosts(result.data);
    })
    .catch((error) => {
      console.log("Request other posts failed:", error);
    });
}

function loadOtherPage() {
  const pageName = window.location.hash.split("?")[0];

  if (pageName === "#other") {
    getOtherUserInfo();
    getOtherPosts();
  }
}

addEvent(otherPostList, "click", (event) => {
  const item = event.target.closest(".post-item");

  if (!item) {
    return;
  }

  const postId = item.dataset.id;

  if (!postId) {
    return;
  }

  window.location.hash = `#post-detials?id=${postId}`;
});

addEvent(otherMessageBtn, "click", () => {
  window.location.hash = "#message";
});

window.addEventListener("hashchange", () => {
  loadOtherPage();
});

loadOtherPage();


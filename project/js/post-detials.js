import { getElement } from "./utils.js";
import request from "./request.js";

const defaultAvatar = "./resources/test-photos/test-user-img.jpg";

const api = {
  detail: (postId) => `/post/${postId}`,
  comments: (postId) => `/comment/list/${postId}`,
  like: (id) => `/post/like/${id}`,
  cancelLike: (id) => `/post/unlike/${id}`,
  collect: (id) => `/post/fav/${id}`,
  cancelCollect: (id) => `/post/unfav/${id}`,
  follow: (id) => `/follow/${id}`,
  cancelFollow: (id) => `/follow/unfollow/${id}`,
  addComment: "/comment",
};

const back = getElement(".post-detials .avater-info i");
const authorAvatar = getElement(".post-detials .post-header .detial-avater");
const followButton = getElement(".post-detials .follow-me");
const likeButton = getElement(".post-detials .like-btn");
const likeIcon = getElement(".post-detials .like-icon");
const collectButton = getElement(".post-detials .collect-btn");
const collectIcon = getElement(".post-detials .collect-icon");
const likeCount = getElement(".post-detials .detial-dsec p");
const contentText = getElement(".post-detials .detial-dsec span");
const posterName = getElement(".post-detials .poster-name");
const banner = getElement(".post-detials .detial-banner");
const photoList = getElement(".post-detials .photoset");
const circleList = getElement(".post-detials .circle");
const commentAvatar = getElement(".post-detials .comment-avater");
const commentInput = getElement(".post-detials .comment-input");
const commentButton = getElement(".post-detials .push-comment");
const commentList = getElement(".post-detials .comment-list");

let currentDetailPost = null;
let detailEventsBinded = false;

export function getPostIdFromHash() {
  const hash = window.location.hash;
  const paramsText = hash.split("?")[1];

  if (!paramsText) {
    return "";
  }

  const params = new URLSearchParams(paramsText);
  const postId = params.get("id");

  if (!postId) {
    return "";
  }

  return postId;
}

export function getImages(post) {
  if (post.images === "") {
    return [];
  }

  return post.images.split(",");
}

function showDetailError(message) {
  currentDetailPost = null;
  posterName.textContent = "";
  authorAvatar.src = defaultAvatar;
  commentAvatar.src = defaultAvatar;
  likeCount.textContent = "";
  contentText.textContent = message;
  photoList.innerHTML = "";
  circleList.innerHTML = "";
  commentList.innerHTML = `<p class="empty-comment">${message}</p>`;
}

function clearDetailPage() {
  currentDetailPost = null;
  posterName.textContent = "";
  authorAvatar.src = defaultAvatar;
  commentAvatar.src = defaultAvatar;
  likeCount.textContent = "";
  contentText.textContent = "";
  photoList.innerHTML = "";
  circleList.innerHTML = "";
  commentList.innerHTML = "";
  banner.style.display = "none";
  likeButton.classList.remove("active");
  likeIcon.classList.remove("active");
  collectButton.classList.remove("active");
  collectIcon.classList.remove("active");
  followButton.textContent = "follow";
}

function updateLikeButton() {
  if (!currentDetailPost) return;

  if (currentDetailPost.isLiked) {
    likeButton.classList.add("active");
    likeIcon.classList.add("active");
  } else {
    likeButton.classList.remove("active");
    likeIcon.classList.remove("active");
  }

  likeCount.textContent = `${currentDetailPost.likeCount} likes`;
}

function updateCollectButton() {
  if (!currentDetailPost) return;

  if (currentDetailPost.isFavorited) {
    collectButton.classList.add("active");
    collectIcon.classList.add("active");
  } else {
    collectButton.classList.remove("active");
    collectIcon.classList.remove("active");
  }
}

function updateFollowButton() {
  if (!currentDetailPost) return;

  if (currentDetailPost.isFollowing) {
    followButton.textContent = "following";
  } else {
    followButton.textContent = "follow";
  }
}

export function renderDetail(post) {
  const postId = post.postId;
  const userId = post.userId;
  const avatar = defaultAvatar;
  const userName = post.userName;
  const content = post.content;
  const likeCountValue = post.likeCount;
  const images = getImages(post);

  currentDetailPost = {
    postId: postId,
    userId: userId,
    avatar: avatar,
    userName: userName,
    content: content,
    likeCount: likeCountValue,
    isLiked: post.isLiked === 1,
    isFavorited: post.isFavorited === 1,
    isFollowing: false,
  };

  authorAvatar.src = avatar;
  commentAvatar.src = avatar;
  posterName.textContent = userName;
  contentText.textContent = content;

  photoList.innerHTML = "";
  circleList.innerHTML = "";

  if (images.length === 0) {
    banner.style.display = "none";
  } else {
    banner.style.display = "block";

    images.forEach((src) => {
      photoList.innerHTML += `
        <li>
          <img src="${src}" />
        </li>
      `;

      circleList.innerHTML += "<li></li>";
    });
  }

  updateLikeButton();
  updateCollectButton();
  updateFollowButton();
}

export function renderCommentList(comments) {
  if (comments.length === 0) {
    commentList.innerHTML =
      '<p class="empty-comment">\u6682\u65e0\u8bc4\u8bba</p>';
    return;
  }

  let html = "";

  comments.forEach((comment) => {
    const avatar = defaultAvatar;
    const userName = comment.userName;
    const content = comment.content;
    const time = comment.createTime;

    html += `
      <div class="comment-item">
        <div class="commenter">
          <img src="${avatar}" alt="#" class="detial-avater" />
        </div>
        <div class="comment-info">
          <p class="commenter-id">${userName}</p>
          <p>${content}</p>
          <div class="icons-and-time">
            <p class="time">${time}</p>
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

export function getPostDetail() {
  const postId = getPostIdFromHash();
  const token = localStorage.getItem("token");

  clearDetailPage();

  if (!postId) {
    showDetailError("\u5e16\u5b50\u4e0d\u5b58\u5728");
    console.log("Post id is empty");
    return;
  }

  request(api.detail(postId), "GET", {}, { Authorization: token })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        showDetailError(
          "\u5e16\u5b50\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5",
        );
        console.log("Get post detail failed:", result.msg);
        return;
      }

      if (!result.data) {
        showDetailError(
          "\u5e16\u5b50\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5",
        );
        console.log("Get post detail failed:", result.msg);
        return;
      }

      renderDetail(result.data);
      getComments(postId);
    })
    .catch((error) => {
      showDetailError(
        "\u5e16\u5b50\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5",
      );
      console.log("Request post detail error:", error);
    });
}

export function getComments(postId) {
  const token = localStorage.getItem("token");

  request(api.comments(postId), "GET", {}, { Authorization: token })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        commentList.innerHTML =
          '<p class="empty-comment">\u8bc4\u8bba\u52a0\u8f7d\u5931\u8d25</p>';
        console.log("Get comments failed:", result.msg);
        return;
      }

      const list = result.data;
      renderCommentList(list);
    })
    .catch((error) => {
      commentList.innerHTML =
        '<p class="empty-comment">\u8bc4\u8bba\u52a0\u8f7d\u5931\u8d25</p>';
      console.log("Request comments error:", error);
    });
}

export function toggleLike() {
  if (!currentDetailPost) return;

  const postId = getPostIdFromHash();
  const token = localStorage.getItem("token");
  let url = api.like(postId);

  if (currentDetailPost.isLiked) {
    url = api.cancelLike(postId);
  }

  request(url, "POST", {}, { Authorization: token })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Like request failed:", result.msg);
        return;
      }

      currentDetailPost.isLiked = !currentDetailPost.isLiked;

      if (currentDetailPost.isLiked) {
        currentDetailPost.likeCount += 1;
      } else {
        currentDetailPost.likeCount -= 1;
      }

      updateLikeButton();
    })
    .catch((error) => {
      console.log("Like request error:", error);
    });
}

export function toggleCollect() {
  if (!currentDetailPost) return;

  const postId = getPostIdFromHash();
  const token = localStorage.getItem("token");
  let url = api.collect(postId);

  if (currentDetailPost.isFavorited) {
    url = api.cancelCollect(postId);
  }

  request(url, "POST", {}, { Authorization: token })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Collect request failed:", result.msg);
        return;
      }

      currentDetailPost.isFavorited = !currentDetailPost.isFavorited;
      updateCollectButton();
    })
    .catch((error) => {
      console.log("Collect request error:", error);
    });
}

export function toggleFollow() {
  if (!currentDetailPost) return;

  if (!currentDetailPost.userId) return;

  const token = localStorage.getItem("token");
  let url = api.follow(currentDetailPost.userId);

  if (currentDetailPost.isFollowing) {
    url = api.cancelFollow(currentDetailPost.userId);
  }

  request(url, "POST", {}, { Authorization: token })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Follow request failed:", result.msg);
        return;
      }

      currentDetailPost.isFollowing = !currentDetailPost.isFollowing;
      updateFollowButton();
    })
    .catch((error) => {
      console.log("Follow request error:", error);
    });
}

export function submitComment() {
  if (!currentDetailPost) return;

  const postId = getPostIdFromHash();
  const token = localStorage.getItem("token");
  const content = commentInput.value.trim();

  if (!content) {
    return;
  }

  request(
    api.addComment,
    "POST",
    {
      postId: postId,
      parentId: 0,
      content: content,
    },
    { Authorization: token },
  )
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Submit comment failed:", result.msg);
        return;
      }

      commentInput.value = "";
      getComments(postId);
    })
    .catch((error) => {
      console.log("Submit comment error:", error);
    });
}

export function bindDetailEvents() {
  if (detailEventsBinded) {
    return;
  }

  detailEventsBinded = true;

  back.onclick = () => {
    window.location.hash = "#home";
  };

  authorAvatar.onclick = () => {
    if (!currentDetailPost) return;

    if (!currentDetailPost.userId) return;

    window.location.hash = `#other?id=${currentDetailPost.userId}`;
  };

  likeButton.onclick = toggleLike;
  collectButton.onclick = toggleCollect;
  followButton.onclick = toggleFollow;
  commentButton.onclick = submitComment;
}

function renderPostDetail() {
  bindDetailEvents();
  getPostDetail();
}

export { renderPostDetail };


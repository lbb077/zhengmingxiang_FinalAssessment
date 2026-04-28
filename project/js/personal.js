import { getElement, getElements, addEvent } from "./utils.js";
import request from "./request.js";

const editProfileBtn = getElement(".edit-profile");
const messageBtn = getElement(".userName-and-info .message");
const avatarImg = getElement(".personal .Avater .border img");
const usernameEl = getElement(".personal .username");
const signatureEl = getElement(".personal .desc");
const postsEl = getElement(".personal .posts");
const followersEl = getElement(".personal .followers");
const followingEl = getElement(".personal .following");
const postsView = getElement(".posts-view");
const draftView = getElement(".draft-view");
const personalPostsList = getElement(".posts-view ul");
const draftList = getElement(".draft-list");
const tabItems = getElements(".personal .tab-navi-bar li");
const defaultAvatar = "./resources/test-photos/test-user-img.jpg";
let currentPosts = [];

addEvent(editProfileBtn, "click", () => {
  localStorage.removeItem("editPostId");
  localStorage.removeItem("editPostData");
  localStorage.removeItem("editDraftId");
  window.location.hash = "#publish";
});

addEvent(messageBtn, "click", () => {
  window.location.hash = "#message";
});

// 获取个人资料
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

// 获取自己的帖子
function getUserPosts() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  request(`/post/getPostByUser/${userId}`, "POST", {}, { Authorization: token })
    .then((res) => {
      if (res.data.code === 200) {
        const posts = res.data.data;
        currentPosts = posts;
        renderUserPosts(posts);
      } else {
        console.error("获取个人帖子失败:", res.data.msg);
      }
    })
    .catch((err) => {
      console.error("请求个人帖子出错:", err);
    });
}

// 获取帖子第一张图片
function getPostImage(post) {
  if (post.images === "") {
    return "";
  }

  return post.images.split(",")[0];
}

// 把权限数字转成页面上要显示的文字
function getPermissionText(permission) {
  if (permission === 0) {
    return "draft";
  }

  if (permission === 1) {
    return "public";
  }

  if (permission === 2) {
    return "only friends";
  }

  if (permission === 3) {
    return "only me";
  }

  return "unknown";
}

// 渲染自己的帖子列表
function renderUserPosts(posts) {
  personalPostsList.innerHTML = "";

  posts.forEach((post) => {
    const image = getPostImage(post);
    const permissionText = getPermissionText(post.permission);
    let imageHtml = "";

    if (image !== "") {
      imageHtml = `<img src="${image}" alt="" class="image" />`;
    }

    personalPostsList.innerHTML += `
      <li class="post-item" data-id="${post.postId}">
        <div class="post">
          <div class="post-head">
            <div class="avatar">
              <div class="avatar-infos">
                <p class="post-title">${post.title}</p>
                <p class="time">${post.createTime}</p>
              </div>
              <div class="post-change">
                <div class="permission-type">${permissionText}</div>
                <div class="del-or-draft">
                  <button class="del" type="button">del</button>
                  <button class="go-to-draft" type="button">edit</button>
                </div>
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

// 根据 postId 找到当前点击的帖子
function getPostById(postId) {
  let currentPost = null;
  const postIdNumber = Number(postId);

  currentPosts.forEach((post) => {
    if (post.postId === postIdNumber) {
      currentPost = post;
    }
  });

  return currentPost;
}

// 删除自己的帖子
function deletePost(postId) {
  const token = localStorage.getItem("token");

  request(`/post/delete/${postId}`, "POST", {}, { Authorization: token })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("删除帖子失败:", result.msg);
        return;
      }

      console.log("删除帖子成功");
      getUserInfo();
      getUserPosts();
    })
    .catch((err) => {
      console.log("删除帖子请求出错:", err);
    });
}

// 读取本地草稿
function getDraftPosts() {
  const draftText = localStorage.getItem("draftPosts");

  if (!draftText) {
    return [];
  }

  return JSON.parse(draftText);
}

// 渲染草稿列表
function renderDraftPosts() {
  const drafts = getDraftPosts();

  draftList.innerHTML = "";

  if (drafts.length === 0) {
    draftList.innerHTML = '<li class="draft-item">No drafts</li>';
    return;
  }

  drafts.forEach((draft) => {
    draftList.innerHTML += `
      <li class="draft-item" data-draft-id="${draft.id}">
        <div class="draft-main">
          <div class="draft-head">
            <h3 class="draft-title">${draft.title}</h3>
            <span class="draft-time">${draft.createTime}</span>
          </div>
          <p class="draft-content">${draft.content}</p>
        </div>
        <div class="draft-actions">
          <button class="draft-edit" type="button">edit</button>
          <button class="draft-delete" type="button">delete</button>
        </div>
      </li>
    `;
  });
}

// 显示帖子列表
function showPostsView() {
  postsView.style.display = "block";
  draftView.style.display = "none";

  tabItems[0].classList.add("picked");
  tabItems[1].classList.remove("picked");

  getUserPosts();
}

// 显示草稿列表
function showDraftView() {
  postsView.style.display = "none";
  draftView.style.display = "block";

  tabItems[0].classList.remove("picked");
  tabItems[1].classList.add("picked");

  renderDraftPosts();
}

// 点击自己的帖子，进入详情页
addEvent(personalPostsList, "click", (event) => {
  const item = event.target.closest("li");

  if (!item) {
    return;
  }

  const postId = item.dataset.id;

  if (!postId) {
    return;
  }

  const editButton = event.target.closest(".go-to-draft");
  const deleteButton = event.target.closest(".del");

  if (editButton) {
    const post = getPostById(postId);

    if (!post) {
      console.log("帖子不存在");
      return;
    }

    localStorage.setItem("editPostId", postId);
    localStorage.setItem("editPostData", JSON.stringify(post));
    localStorage.removeItem("editDraftId");
    window.location.hash = "#publish";
    return;
  }

  if (deleteButton) {
    deletePost(postId);
    return;
  }

  window.location.hash = `#post-detials?id=${postId}`;
});

// 点击草稿按钮，先做本地编辑和删除
addEvent(draftList, "click", (event) => {
  const editButton = event.target.closest(".draft-edit");
  const deleteButton = event.target.closest(".draft-delete");
  const item = event.target.closest(".draft-item");

  if (!item) {
    return;
  }

  const draftId = item.dataset.draftId;

  if (editButton) {
    localStorage.setItem("editDraftId", draftId);
    window.location.hash = "#publish";
    return;
  }

  if (deleteButton) {
    const drafts = getDraftPosts();
    const newDrafts = [];
    const draftIdNumber = Number(draftId);

    drafts.forEach((draft) => {
      if (draft.id !== draftIdNumber) {
        newDrafts.push(draft);
      }
    });

    localStorage.setItem("draftPosts", JSON.stringify(newDrafts));
    renderDraftPosts();
  }
});

// 绑定个人页 tab
addEvent(tabItems[0], "click", () => {
  showPostsView();
});

addEvent(tabItems[1], "click", () => {
  showDraftView();
});

// 每次进入个人页，刷新个人资料和帖子列表
function loadPersonalPage() {
  getUserInfo();
  showPostsView();
}

window.addEventListener("hashchange", () => {
  const pageName = window.location.hash.split("?")[0];

  if (pageName === "#personal") {
    loadPersonalPage();
  }
});

loadPersonalPage();


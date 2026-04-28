import { getElement } from "./utils.js";
import request from "./request.js";

const otherAvatarImg = getElement(".other .Avater .border img");
const otherUsernameEl = getElement(".other .username");
const otherSignatureEl = getElement(".other .desc");
const otherPostsEl = getElement(".other .posts");
const otherFollowersEl = getElement(".other .followers");
const otherFollowingEl = getElement(".other .following");

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
  if (user.image !== "" && user.image !== null && user.image !== undefined) {
    otherAvatarImg.src = user.image;
  } else {
    otherAvatarImg.removeAttribute("src");
  }

  otherUsernameEl.textContent = user.userName;
  otherSignatureEl.textContent = user.signature;
  otherPostsEl.textContent = user.postCount;
  otherFollowersEl.textContent = user.followerCount;
  otherFollowingEl.textContent = user.followingCount;
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
        console.log("获取其他用户信息失败:", result.msg);
        return;
      }

      renderOtherUser(result.data);
    })
    .catch((error) => {
      console.log("请求其他用户信息出错:", error);
    });
}

function loadOtherPage() {
  const pageName = window.location.hash.split("?")[0];

  if (pageName === "#other") {
    getOtherUserInfo();
  }
}

window.addEventListener("hashchange", () => {
  loadOtherPage();
});

loadOtherPage();

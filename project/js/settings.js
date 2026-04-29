import { getElement, addEvent } from "./utils.js";
import request from "./request.js";

const avatarFile = getElement("#avatar-file");
const backgroundFile = getElement("#background-file");
const usernameInput = getElement("#setting-username");
const saveUsernameBtn = getElement(".save-username");
const logoutBtn = getElement(".logout-btn");
const backBtn = getElement(".settings-back");

function uploadSettingImage(file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();

  formData.append("img", file);

  return request("/user/uploadImg", "POST", formData, {
    Authorization: token,
  })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Image upload failed:", result.msg);
        return "";
      }

      return result.data;
    })
    .catch((error) => {
      console.log("Image upload request failed:", error);
      return "";
    });
}

function updateUser(data) {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  data.userId = Number(userId);

  return request("/user/update", "POST", data, {
    Authorization: token,
  })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200 && result.code !== 0) {
        console.log("Update user failed:", result.msg);
        return;
      }

      console.log("Update user success", result.data);
      window.location.hash = "#personal";
    })
    .catch((error) => {
      console.log("Update user request failed:", error);
    });
}

function changeAvatar() {
  const file = avatarFile.files[0];

  if (!file) {
    return;
  }

  uploadSettingImage(file).then((image) => {
    if (image === "") {
      return;
    }

    updateUser({
      image: image,
    });
  });
}

function changeBackground() {
  const file = backgroundFile.files[0];

  if (!file) {
    return;
  }

  uploadSettingImage(file).then((background) => {
    if (background === "") {
      return;
    }

    updateUser({
      background: background,
    });
  });
}

function changeUsername() {
  const userName = usernameInput.value.trim();

  if (userName === "") {
    console.log("Username cannot be empty");
    return;
  }

  updateUser({
    userName: userName,
  });
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  window.location.hash = "#login";
}

addEvent(avatarFile, "change", () => {
  changeAvatar();
});

addEvent(backgroundFile, "change", () => {
  changeBackground();
});

addEvent(saveUsernameBtn, "click", () => {
  changeUsername();
});

addEvent(logoutBtn, "click", () => {
  logout();
});

addEvent(backBtn, "click", () => {
  window.location.hash = "#personal";
});

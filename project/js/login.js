import { getElement, addEvent } from "./utils.js";

const loginBtn = getElement(".login-btn");
const loginIdInput = getElement(".login-id");
const passwordInput = getElement(".password");
const rememberButton = getElement(".remember-button");
const rememberBox = getElement(".remember-box");
const eyeBtn = getElement(".eye-icons");
const closeEye = getElement(".icon-eye-off");
const openEye = getElement(".icon-eye");

const correctId = "123456";
const correctPwd = "123456";

let isRemember = false;

const errorDiv = document.createElement("div");
errorDiv.className = "login-error";
errorDiv.textContent = "";

if (rememberBox) {
  rememberBox.insertAdjacentElement("afterend", errorDiv);
}

function showError(message) {
  errorDiv.textContent = message;

  loginIdInput.classList.add("input-error");
  passwordInput.classList.add("input-error");

  loginIdInput.classList.remove("shake");
  passwordInput.classList.remove("shake");

  void loginIdInput.offsetWidth;
  void passwordInput.offsetWidth;

  loginIdInput.classList.add("shake");
  passwordInput.classList.add("shake");
}

function clearError() {
  errorDiv.textContent = "";
  loginIdInput.classList.remove("input-error");
  passwordInput.classList.remove("input-error");
}

function saveRememberInfo(id, pwd) {
  localStorage.setItem("id", id);
  localStorage.setItem("pwd", pwd);
}

function removeRememberInfo() {
  localStorage.removeItem("id");
  localStorage.removeItem("pwd");
}

function initRememberInfo() {
  const savedId = localStorage.getItem("id");
  const savedPwd = localStorage.getItem("pwd");

  if (savedId && savedPwd) {
    loginIdInput.value = savedId;
    passwordInput.value = savedPwd;
    isRemember = true;
    rememberBox.classList.add("active");
  }
}

initRememberInfo();

addEvent(rememberButton, "click", function () {
  isRemember = !isRemember;

  if (isRemember) {
    rememberBox.classList.add("active");
  } else {
    rememberBox.classList.remove("active");
  }
});

addEvent(loginBtn, "click", function () {
  const id = loginIdInput.value.trim();
  const pwd = passwordInput.value.trim();

  if (id === "" || pwd === "") {
    showError("Please enter your account and password");
    return;
  }

  if (id !== correctId || pwd !== correctPwd) {
    showError("Incorrect account or password");
    return;
  }

  clearError();
  localStorage.setItem("token", "123456");

  if (isRemember) {
    saveRememberInfo(id, pwd);
  } else {
    removeRememberInfo();
  }

  location.hash = "#home";
});

addEvent(loginIdInput, "input", function () {
  clearError();
});

addEvent(passwordInput, "input", function () {
  clearError();
});

if (eyeBtn) {
  addEvent(eyeBtn, "click", function () {
    const isHidden = passwordInput.type === "password";

    if (isHidden) {
      passwordInput.type = "text";
    } else {
      passwordInput.type = "password";
    }

    closeEye.classList.toggle("eye-active");
    openEye.classList.toggle("eye-active");
  });
}

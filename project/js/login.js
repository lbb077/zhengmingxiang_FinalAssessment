import { getElement, getElements, addEvent } from "./utils.js";

const btn = getElement(".login-btn");
const inputId = getElement(".login-id");
const inputPwd = getElement(".password");
addEvent(btn, "click", () => {
  const id = inputId.value.trim();
  const pwd = inputPwd.value.trim();
  if (!id || !pwd) {
    console.log("请输入账号和密码");
    return;
  }
  const correctId = "123456";
  const correctPwd = "123456";
  if (id !== correctId || pwd !== correctPwd) {
    console.log("wrong id or pwd");
    return;
  }
  localStorage.setItem("id", id);
  localStorage.setItem("pwd", pwd);
  localStorage.setItem("token", "123456");

  location.hash = "#home";
});
const eyeBtn = getElement(".eye-icons");
const closeEye = getElement(".icon-eye-off");
const openEye = getElement(".icon-eye");

addEvent(eyeBtn, "click", () => {
  const isHidden = inputPwd.type === "password";

  inputPwd.type = isHidden ? "text" : "password";
  closeEye.classList.toggle("eye-active");
  openEye.classList.toggle("eye-active");
});

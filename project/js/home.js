import { getElement, getElements, addEvent } from "./utils.js";
// 点击首页的搜索框，跳转搜索页面
const searchBar = getElement(".home .search-bar");
searchBar.addEventListener("click", () => {
  window.location.hash = "#search";
  console.log("gotosearch");
});
// 点击首页的瀑布流帖子或者关注列表的帖子 进入帖子详情界面
const photos = getElements(".home .photo .image");
photos.forEach((item) => {
  addEvent(item, "click", () => {
    window.location.hash = "#post-detials";
    console.log("gotopost");
  });
});
// 点击首页的瀑布流帖子的作者头像 进入该作者的页面
const itemAvaters = getElements(".home .item .avater-img");
itemAvaters.forEach((item) => {
  addEvent(item, "click", () => {
    window.location.hash = "#other";
    console.log("gototherther");
  });
});
const followUsers = getElements(".follow .follow-user li");
followUsers.forEach((item) => {
  addEvent(item, "click", () => {
    window.location.hash = "#other";
    console.log("gototherther");
  });
});
const followPosters = getElements(".follow .follow-post .post-header img");
followPosters.forEach((item) => {
  addEvent(item, "click", () => {
    window.location.hash = "#other";
    console.log("gototherther");
  });
});
const followPhotos = getElements(".follow-content");
followPhotos.forEach((item) => {
  addEvent(item, "click", () => {
    window.location.hash = "#post-detials";
    console.log("gotopost");
  });
});

export function switchHomeMode(index) {
  const modes = [
    getElement(".ForYou"),
    getElement(".Follow"),
    getElement(".Topic"),
  ];
  const buttons = getElements(".mode-toggle button");
  const indicatorLeft = ["5.5vw", "28vw", "48vw"];

  modes.forEach((item) => item.classList.remove("mode-active"));
  buttons.forEach((btn) => btn.classList.remove("btn-picked"));

  modes[index].classList.add("mode-active");
  buttons[index].classList.add("btn-picked");

  getElement(".indicater").style.transform =
    `translateX(${indicatorLeft[index]})`;
}
const modeBtn = getElements(".mode-toggle button");
modeBtn.forEach((item, index) => {
  addEvent(item, "click", () => {
    switchHomeMode(index);
  });
});

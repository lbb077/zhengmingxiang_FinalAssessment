// 这是引入其他的js文件和引入hash变化的函数
import { router } from "./router.js";
import "./utils.js";
import { getElement, getElements, addEvent } from "./utils.js";
import "./login.js";
import "./home.js";
import "./post-detials.js";
import "./publish.js";
import "./personal.js";
import "./other.js";
// hash变化函数 绑定事件
window.addEventListener("hashchange", router);
window.addEventListener("load", router);
// 这是底部tapbar栏的事件绑定 点击跳转页面 更改底部图标的颜色
const barItems = getElements(".bottom-top-bar li");

const tabRoutes = ["#home", "#follow", "#publish", "#message", "#personal"];

barItems.forEach((item, index) => {
  addEvent(item, "click", () => {
    barItems.forEach((tab) => {
      tab.querySelector("i").classList.remove("active-bar");
    });
    item.querySelector("i").classList.add("active-bar");
    console.log(111);
    location.hash = tabRoutes[index];
  });
});

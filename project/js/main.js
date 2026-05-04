import { router } from "./router.js";
import "./utils.js";
import { getElement, getElements, addEvent } from "./utils.js";
import "./login.js";
import "./home.js";
import "./post-detials.js";
import "./publish.js";
import "./personal.js";
import "./other.js";
import "./settings.js";
import "./search.js";
import "./message.js";
import "./chat.js";
window.addEventListener("hashchange", router);
window.addEventListener("load", router);
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

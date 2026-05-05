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
const pageTabMap = {
  "#home": 0,
  "#search": 0,
  "#search-result": 0,
  "#post-detials": 0,
  "#follow": 1,
  "#publish": 2,
  "#message": 3,
  "#chat": 3,
  "#personal": 4,
  "#other": 4,
  "#settings": 4,
};

function clearBottomBarActive() {
  barItems.forEach((tab) => {
    tab.classList.remove("active-bar");
    tab.querySelector("i").classList.remove("active-bar");
  });
}

function updateBottomBarActive() {
  const pageName = (window.location.hash || "#home").split("?")[0];
  const activeIndex = pageTabMap[pageName];

  clearBottomBarActive();

  if (activeIndex === undefined) {
    return;
  }

  barItems[activeIndex].classList.add("active-bar");
  barItems[activeIndex].querySelector("i").classList.add("active-bar");
}

barItems.forEach((item, index) => {
  addEvent(item, "click", () => {
    location.hash = tabRoutes[index];
  });
});

window.addEventListener("hashchange", updateBottomBarActive);
window.addEventListener("load", updateBottomBarActive);

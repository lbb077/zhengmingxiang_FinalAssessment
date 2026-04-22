import { getElement, getElements, addEvent } from "./utils.js";
const back = getElement(".post-detials .avater-info i");
addEvent(back, "click", () => {
  window.location.hash = "#home";
});
const image = getElement(".post-detials .detial-avater");
addEvent(image, "click", () => {
  window.location.hash = "#other";
});

import { getElement, getElements, addEvent } from "./utils.js";
const editBtn = getElement(".edit-profile");
addEvent(editBtn, "click", () => {
  window.location.hash = "#publish";
});
const messageBtn = getElement(".userName-and-info .message");
addEvent(messageBtn, "click", () => {
  window.location.hash = "#message";
});

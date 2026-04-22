export const getElement = (selector) => document.querySelector(selector);
export const getElements = (selector) => document.querySelectorAll(selector);
export const addEvent = (element, event, callback) => {
  element.addEventListener(event, callback);
};

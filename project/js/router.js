import { getElement, getElements } from "./utils.js";
import { switchHomeMode } from "./home.js";
import { renderPostDetail } from "./post-detials.js";

const pages = getElements(
  ".sign-in, .home, .post-detials, .personal, .other, .message-page, .chat-page, .pulish-page, .search-page, .search-result-page",
);

function hideAllPages() {
  pages.forEach((page) => {
    page.style.display = "none";
  });
}
function toggleBottomBar(hash) {
  const bar = getElement(".bottom-top-bar");
  console.log("bar");
  if (hash === "#login") {
    bar.style.display = "none";
  } else {
    bar.style.display = "block";
  }
}
function router() {
  const token = localStorage.getItem("token");
  const hashPage = window.location.hash;
  const userPage = [
    "#home",
    "#follow",
    "#search",
    "#post-detials",
    "#personal",
    "#other",
    "#message",
    "#chat",
    "#publish",
    "#search-result",
  ];
  if (!token && userPage.includes(hashPage)) {
    location.hash = "#login";
  }
  if (token && (hashPage === "" || hashPage === "#login")) {
    location.hash = "#home";
  }
  if (!token && (hashPage === "" || hashPage === "#login")) {
    location.hash = "#login";
  }
  hideAllPages();
  const hash = window.location.hash || "#login";

  switch (hash) {
    case "#login":
      getElement(".sign-in").style.display = "block";
      break;

    case "#home":
      getElement(".home").style.display = "block";
      break;

    case "#follow":
      getElement(".home").style.display = "block";
      switchHomeMode(1);
      console.log(1);
      break;

    case "#search":
      getElement(".search-page").style.display = "block";
      break;

    // case "#post-detials":
    //   getElement(".post-detials").style.display = "block";
    //   break;

    case "#personal":
      getElement(".personal").style.display = "block";
      break;

    case "#other":
      getElement(".other").style.display = "block";
      break;

    case "#message":
      getElement(".message-page").style.display = "block";
      break;

    case "#chat":
      getElement(".chat-page").style.display = "block";
      break;

    case "#publish":
      getElement(".pulish-page").style.display = "block";
      break;

    case "#search-result":
      getElement(".search-result-page").style.display = "block";
      break;
  }
  toggleBottomBar(hash);
  if (hash.startsWith("#post-detials")) {
    getElement(".post-detials").style.display = "block";
    renderPostDetail();
  }
}

export { router };

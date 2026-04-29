import { getElement, addEvent } from "./utils.js";
import request from "./request.js";

const searchInput = getElement("#to-search");
const cleanBtn = getElement("#clean");
const searchBtn = getElement(".search-page .icon");
const historyList = getElement(".search-history");
const resultBack = getElement(".search-result-page .back");
const resultCount = getElement(".search-result-page .result-count");
const resultList = getElement(".search-result .items");

function getSearchText() {
  return searchInput.value.trim();
}

function getSearchHistory() {
  const historyText = localStorage.getItem("searchHistory");

  if (!historyText) {
    return [];
  }

  return JSON.parse(historyText);
}

function saveSearchHistory(keyword) {
  const oldHistory = getSearchHistory();
  const newHistory = [];

  newHistory.push(keyword);

  oldHistory.forEach((item) => {
    if (item !== keyword) {
      newHistory.push(item);
    }
  });

  if (newHistory.length > 10) {
    newHistory.length = 10;
  }

  localStorage.setItem("searchHistory", JSON.stringify(newHistory));
}

function renderSearchHistory() {
  const history = getSearchHistory();

  historyList.innerHTML = "";

  history.forEach((item) => {
    historyList.innerHTML += `
      <li class="item" data-keyword="${item}">
        <p>${item}</p>
      </li>
    `;
  });
}

function goSearchResult(keyword) {
  if (keyword === "") {
    console.log("Please input search text");
    return;
  }

  saveSearchHistory(keyword);
  renderSearchHistory();
  window.location.hash = `#search-result?keyword=${keyword}`;
}

function getKeywordFromHash() {
  const queryText = window.location.hash.split("?")[1];

  if (!queryText) {
    return "";
  }

  const params = new URLSearchParams(queryText);

  return params.get("keyword");
}

function renderSearchUser(user) {
  let userImage = "";

  if (user.url !== "" && user.url !== null && user.url !== undefined) {
    userImage = user.url;
  }

  resultList.innerHTML += `
    <li class="match-item user-result" data-user-id="${user.userId}">
      <div class="post">
        <div class="post-head">
          <div class="avater">
            <div class="avater-img">
              <img src="${userImage}" alt="" />
            </div>
            <div class="avater-infos">
              <p class="avater-id">${user.username}</p>
              <p class="time">${user.createTime}</p>
            </div>
          </div>
          <i class="iconfont icon-a-gf-dots1"></i>
        </div>
        <div class="description">
          <p>User</p>
        </div>
      </div>
    </li>
  `;
}

function renderSearchPost(post) {
  let imageHtml = "";

  if (post.image !== "" && post.image !== null && post.image !== undefined) {
    imageHtml = `<img src="${post.image}" alt="" class="image" />`;
  }

  resultList.innerHTML += `
    <li class="match-item post-result" data-post-id="${post.postId}">
      <div class="post">
        <div class="post-head">
          <div class="avater">
            <div class="avater-infos">
              <p class="avater-id">${post.title}</p>
              <p class="time">${post.createTime}</p>
            </div>
          </div>
          <i class="iconfont icon-a-gf-dots1"></i>
        </div>
        ${imageHtml}
        <div class="description">
          <p>${post.content}</p>
        </div>
      </div>
    </li>
  `;
}

function renderSearchResult(posts, users) {
  resultList.innerHTML = "";
  resultCount.textContent = posts.length + users.length;

  if (posts.length === 0 && users.length === 0) {
    resultList.innerHTML = '<li class="match-item">No results</li>';
    return;
  }

  users.forEach((user) => {
    renderSearchUser(user);
  });

  posts.forEach((post) => {
    renderSearchPost(post);
  });
}

function getSearchResult() {
  const token = localStorage.getItem("token");
  const keyword = getKeywordFromHash();

  if (keyword === "") {
    return;
  }

  request(
    "/search/mock_search",
    "POST",
    {
      keyword: keyword,
      searchType: 0,
      order: 0,
      pageNum: "1",
      pageSize: "10",
    },
    {
      Authorization: token,
    },
  )
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Search failed:", result.msg);
        return;
      }

      const posts = result.data.postLists;
      const users = result.data.userLists;

      renderSearchResult(posts, users);
    })
    .catch((error) => {
      console.log("Search request failed:", error);
    });
}

function loadSearchPage() {
  const pageName = window.location.hash.split("?")[0];

  if (pageName === "#search") {
    renderSearchHistory();
  }

  if (pageName === "#search-result") {
    getSearchResult();
  }
}

addEvent(searchBtn, "click", () => {
  const keyword = getSearchText();

  goSearchResult(keyword);
});

addEvent(cleanBtn, "click", () => {
  searchInput.value = "";
});

addEvent(historyList, "click", (event) => {
  const item = event.target.closest(".item");

  if (!item) {
    return;
  }

  const keyword = item.dataset.keyword;

  searchInput.value = keyword;
  goSearchResult(keyword);
});

addEvent(resultList, "click", (event) => {
  const userItem = event.target.closest(".user-result");

  if (userItem) {
    const userId = userItem.dataset.userId;
    window.location.hash = `#other?id=${userId}`;
    return;
  }

  const postItem = event.target.closest(".post-result");

  if (postItem) {
    const postId = postItem.dataset.postId;
    window.location.hash = `#post-detials?id=${postId}`;
  }
});

addEvent(resultBack, "click", () => {
  window.location.hash = "#search";
});

window.addEventListener("hashchange", () => {
  loadSearchPage();
});

loadSearchPage();

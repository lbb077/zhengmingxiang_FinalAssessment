import { getElement, getElements, addEvent } from "./utils.js";
import { posts } from "./data.js";
// 点击首页的搜索框，跳转搜索页面
const searchBar = getElement(".home .search-bar");
searchBar.addEventListener("click", () => {
  window.location.hash = "#search";
  console.log("gotosearch");
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
// 写了切换不同区域的显示，而且还有底部indicater的切换
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
//现在写假数据渲染帖子
const leftPostList = getElement(".left-post-list");
const rightPostList = getElement(".right-post-list");
function renderPosts() {
  leftPostList.innerHTML = "";
  rightPostList.innerHTML = "";

  posts.forEach((post, index) => {
    let html = "";

    if (post.images.length > 0) {
      html = `
       <li class="item" data-id="${post.id}">
                <div class="photo">
                  <div class="post">
                    <div class="post-head">
                      <div class="avater">
                        <div class="avater-img">
                          <img
                            src="${posts[index].avatar}"
                            alt=""
                          />
                        </div>
                        <div class="avater-infos">
                          <p class="avater-id">${posts[index].userName}</p>
                          <p class="time">${posts[index].time}</p>
                        </div>
                      </div>
                      <i class="iconfont icon-a-gf-dots1"></i>
                    </div>
                    <img
                      src="${posts[index].images[0]}"
                      alt=""
                      class="image"
                    />
                    <div class="description">
                      <p>${posts[index].content}</p> 
                      <div class="post-action">
                        <i class="iconfont icon-24px"></i>
                        <span>${posts[index].likes} + Likes</span>
                        <i class="iconfont icon-pinglun"></i>
                        <span>${posts[index].comments} + commonts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
      `;
    } else {
      html = `
       <li class="item" data-id="${post.id}">
                <div class="only-text">
                  <div class="post">
                    <div class="post-head">
                      <div class="avater">
                        <div class="avater-img">
                          <img
                            src="${posts[index].avatar}"
                            alt=""
                          />
                        </div>
                        <div class="avater-infos">
                          <p class="avater-id">${posts[index].userName}</p>
                          <p class="time">${posts[index].time}</p>
                        </div>
                      </div>
                      <i class="iconfont icon-a-gf-dots1"></i>
                    </div>
                    <p class="post-content">
                      ${posts[index].content}
                    </p>
                    <div class="description">
                      <div class="post-action">
                        <i class="iconfont icon-24px"></i>
                        <span>${posts[index].likes} + likes</span>
                        <i class="iconfont icon-pinglun"></i>
                        <span>${posts[index].comments} + comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
      `;
    }

    if (index % 2 === 0) {
      leftPostList.innerHTML += html;
    } else {
      rightPostList.innerHTML += html;
    }
  });
}

renderPosts();

//获取帖子的id，然后修改hash的id，然后就可以跳转到对应的详情页面了
const postItems = getElements(".ForYou .item");

postItems.forEach((item) => {
  addEvent(item, "click", () => {
    const postId = item.dataset.id;
    console.log(item.dataset.id);
    location.hash = `#post-detials?id=${postId}`;
  });
});

import { getElement, getElements, addEvent } from "./utils.js";
import request from "./request.js";

//获取dom元素
const searchBar = getElement(".home .search-bar");
const forYou = getElement(".ForYou");
const leftPostList = getElement(".left-post-list");
const rightPostList = getElement(".right-post-list");
const followUserList = getElement(".follow .follow-user ul");
const followPostList = getElement(".follow .follow-post ul");
const defaultAvatar = "./resources/test photos/test-user-img.jpg";
const modeBtn = getElements(".mode-toggle button");

addEvent(searchBar, "click", () => {
  window.location.hash = "#search";
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

  if (index === 1) {
    getFollowData(); //如果页面在关注，就渲染关注页面的数据
  }
}

modeBtn.forEach((item, index) => {
  addEvent(item, "click", () => {
    switchHomeMode(index);
  });
});

function getPostImage(post) {
  if (post.images === "") {
    return "";
  }

  return post.images.split(",")[0];
}

function bindForYouEvents() {
  addEvent(forYou, "click", (event) => {
    const item = event.target.closest(".item");

    if (!item) {
      return;
    }

    const avatar = event.target.closest(".avater-img");

    if (avatar) {
      const userId = item.dataset.userId;
      window.location.hash = `#other?id=${userId}`;
      return;
    }

    const postId = item.dataset.id;
    location.hash = `#post-detials?id=${postId}`;
  });
}

function renderPosts(postsData) {
  leftPostList.innerHTML = "";
  rightPostList.innerHTML = "";

  postsData.forEach((post, index) => {
    let html = "";
    const image = getPostImage(post);
    const avatar = defaultAvatar;
    const userName = post.userName;
    const time = post.createTime;
    const content = post.content;
    const likes = post.likeCount;
    const comments = post.commentCount;
    const postId = post.postId;

    if (image) {
      html = `
       <li class="item" data-id="${postId}" data-user-id="${post.userId}">
                <div class="photo">
                  <div class="post">
                    <div class="post-head">
                      <div class="avater">
                        <div class="avater-img">
                          <img
                            src="${avatar}"
                            alt=""
                          />
                        </div>
                        <div class="avater-infos">
                          <p class="avater-id">${userName}</p>
                          <p class="time">${time}</p>
                        </div>
                      </div>
                      <i class="iconfont icon-a-gf-dots1"></i>
                    </div>
                    <img
                      src="${image}"
                      alt=""
                      class="image"
                    />
                    <div class="description">
                      <p>${content}</p> 
                      <div class="post-action">
                        <i class="iconfont icon-24px"></i>
                        <span>${likes}Likes</span>
                        <i class="iconfont icon-pinglun"></i>
                        <span>${comments}commonts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
      `;
    } else {
      html = `
       <li class="item" data-id="${postId}" data-user-id="${post.userId}">
                <div class="only-text">
                  <div class="post">
                    <div class="post-head">
                      <div class="avater">
                        <div class="avater-img">
                          <img
                            src="${avatar}"
                            alt=""
                          />
                        </div>
                        <div class="avater-infos">
                          <p class="avater-id">${userName}</p>
                          <p class="time">${time}</p>
                        </div>
                      </div>
                      <i class="iconfont icon-a-gf-dots1"></i>
                    </div>
                    <p class="post-content">
                      ${content}
                    </p>
                    <div class="description">
                      <div class="post-action">
                        <i class="iconfont icon-24px"></i>
                        <span>${likes}likes</span>
                        <i class="iconfont icon-pinglun"></i>
                        <span>${comments}comments</span>
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

export function getForYouPosts() {
  const token = localStorage.getItem("token");

  request(
    "/post/all",
    "GET",
    {},
    {
      Authorization: token,
    },
  )
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Get ForYou posts failed:", result.msg);
        return;
      }

      const list = result.data;
      const publicPosts = [];

      list.forEach((post) => {
        if (post.permission === 1) {
          publicPosts.push(post);
        }
      });

      const userRequests = publicPosts.map((post) => {
        return request(
          `/user/getDetail/${post.userId}`,
          "POST",
          {},
          { Authorization: token },
        ).then((userRes) => {
          const user = userRes.data.data;

          return {
            ...post,
            userName: user.userName,
          };
        });
      });

      Promise.all(userRequests).then((newList) => {
        renderPosts(newList);
      });
    })
    .catch((error) => {
      console.log("Request error:", error);
    });
}

getForYouPosts();

window.addEventListener("hashchange", () => {
  const pageName = window.location.hash.split("?")[0];

  if (pageName === "#home") {
    getForYouPosts();
  }
});

export function getFollowData() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    return;
  }

  request(
    `/follow/getFollowingIds/${userId}`,
    "GET",
    {},
    {
      Authorization: token,
    },
  )
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Get follow ids failed:", result.msg);
        return;
      }

      const followIds = result.data || [];

      if (followIds.length === 0) {
        renderFollowUsers([]);
        renderFollowPosts([]);
        return;
      }

      const userRequests = followIds.map((id) => {
        return request(
          `/user/getDetail/${id}`,
          "POST",
          {},
          { Authorization: token },
        )
          .then((userRes) => userRes.data.data)
          .catch((error) => {
            console.log("Get follow user failed:", error);
            return null;
          });
      });

      const postRequests = followIds.map((id) => {
        return request(
          `/post/getPostByUser/${id}`,
          "POST",
          {},
          { Authorization: token },
        )
          .then((postRes) => postRes.data.data || [])
          .catch((error) => {
            console.log("Get follow posts failed:", error);
            return [];
          });
      });

      Promise.all([Promise.all(userRequests), Promise.all(postRequests)]).then(
        ([users, postGroups]) => {
          const followUsers = [];
          const followPosts = [];

          users.forEach((user, index) => {
            if (!user) {
              return;
            }

            followUsers.push(user);

            const posts = postGroups[index];

            posts.forEach((post) => {
              followPosts.push({
                ...post,
                userId: followIds[index],
                userName: user.userName,
              });
            });
          });

          renderFollowUsers(followUsers);
          renderFollowPosts(followPosts);
        },
      );
    })
    .catch((error) => {
      console.log("Request follow data error:", error);
    });
}

export function renderFollowUsers(users) {
  followUserList.innerHTML = "";

  if (users.length === 0) {
    followUserList.innerHTML = "<li>No following users</li>";
    return;
  }

  users.forEach((user) => {
    const userId = user.userId;
    const userName = user.userName;
    const avatar = defaultAvatar;

    followUserList.innerHTML += `
      <li data-user-id="${userId}">
        <div class="bg-circle">
          <div class="border">
            <img src="${avatar}" alt="#" />
          </div>
        </div>
        <div class="user-name">${userName}</div>
      </li>
    `;
  });
}

export function renderFollowPosts(posts) {
  followPostList.innerHTML = "";

  if (posts.length === 0) {
    followPostList.innerHTML = "<li>No follow posts</li>";
    return;
  }

  posts.forEach((post) => {
    const postId = post.postId;
    const userId = post.userId;
    const userName = post.userName;
    const avatar = defaultAvatar;
    const image = getPostImage(post);
    const content = post.content;
    const likes = post.likeCount;
    const comments = post.commentCount;

    followPostList.innerHTML += `
      <li data-id="${postId}">
        <div class="post-header">
          <div class="avater-info" data-user-id="${userId}">
            <div class="bg-circle">
              <div class="border">
                <img src="${avatar}" alt="#" />
              </div>
            </div>
            <div class="poster-name">${userName}</div>
          </div>
          <i class="iconfont icon-a-gf-dots1"></i>
        </div>
        ${
          image
            ? `<img src="${image}" alt="#" class="follow-content" />`
            : `<p class="follow-content">${content}</p>`
        }
        <div class="post-info">
          <div class="icons">
            <div class="left">
              <ul>
                <li><i class="iconfont icon-24px"></i></li>
                <li><i class="iconfont icon-pinglun"></i></li>
                <li><i class="iconfont icon-star"></i></li>
              </ul>
            </div>
            <div class="right">
              <i class="iconfont icon-share"></i>
            </div>
          </div>
          <div class="text">
            <p>${likes} Likes</p>
            <span>${content}</span>
            <span>${comments} comments</span>
          </div>
        </div>
      </li>
    `;
  });
}

export function bindFollowEvents() {
  addEvent(followUserList, "click", (event) => {
    const item = event.target.closest("li");

    if (!item) {
      return;
    }

    const userId = item.dataset.userId;

    if (!userId) {
      return;
    }

    window.location.hash = `#other?id=${userId}`;
  });

  addEvent(followPostList, "click", (event) => {
    const avatarInfo = event.target.closest(".avater-info");

    if (avatarInfo) {
      const userId = avatarInfo.dataset.userId;
      window.location.hash = `#other?id=${userId}`;
      return;
    }

    const item = event.target.closest("li");

    if (!item) {
      return;
    }

    const postId = item.dataset.id;

    if (!postId) {
      return;
    }

    window.location.hash = `#post-detials?id=${postId}`;
  });
}

bindForYouEvents();
bindFollowEvents();

import { getElement, getElements, addEvent } from "./utils.js";
import request from "./request.js";

const searchBar = getElement(".home .search-bar");
const homeSearchInput = getElement("#go-to-search");
const searchPage = getElement(".search-page");
const searchPageInput = getElement("#to-search");
const forYou = getElement(".ForYou");
const leftPostList = getElement(".left-post-list");
const rightPostList = getElement(".right-post-list");
const forYouLoading = getElement(".for-you-loading");
const followUserList = getElement(".follow .follow-user ul");
const followPostList = getElement(".follow .follow-post ul");
const topicList = getElement(".topic-list ul");
const topicCount = getElement(".topic-count");
const topicLeftPostList = getElement(".topic-left-post-list");
const topicRightPostList = getElement(".topic-right-post-list");
const topicPostBox = getElement(".Topic .topic");
const modeToggle = getElement(".mode-toggle");
const modeBtn = getElements(".mode-toggle button");
const searchTransition = getElement(".search-transition");
const searchTransitionInput = getElement(".search-transition-input");
const searchTransitionWave = getElement(".search-transition-wave");

let forYouLastPostId = 0;
let forYouLimit = 10;
let forYouPostCount = 0;
let isForYouLoading = false;
let hasMoreForYouPosts = true;
let forYouPostObserver = null;
let isSearchTransitioning = false;

addEvent(searchBar, "click", () => {
  playSearchTransition();
});

function resetSearchTransition() {
  isSearchTransitioning = false;
  searchBar.classList.remove("search-hidden");
  searchTransition.classList.remove("active", "wave-active", "fade-out");
  searchTransitionInput.style.left = "";
  searchTransitionInput.style.top = "";
  searchTransitionInput.style.width = "";
  searchTransitionInput.style.height = "";
  searchTransitionInput.style.transform = "";
  searchTransitionWave.style.left = "";
  searchTransitionWave.style.top = "";
}

function getSearchPageInputRect() {
  const oldDisplay = searchPage.style.display;
  const oldVisibility = searchPage.style.visibility;
  const oldPosition = searchPage.style.position;
  const oldInset = searchPage.style.inset;
  const oldPointerEvents = searchPage.style.pointerEvents;

  searchPage.style.display = "block";
  searchPage.style.visibility = "hidden";
  searchPage.style.position = "fixed";
  searchPage.style.inset = "0";
  searchPage.style.pointerEvents = "none";

  const rect = searchPageInput.getBoundingClientRect();

  searchPage.style.display = oldDisplay;
  searchPage.style.visibility = oldVisibility;
  searchPage.style.position = oldPosition;
  searchPage.style.inset = oldInset;
  searchPage.style.pointerEvents = oldPointerEvents;

  return rect;
}

function playSearchTransition() {
  if (isSearchTransitioning) {
    return;
  }

  isSearchTransitioning = true;

  const startRect = homeSearchInput.getBoundingClientRect();
  const targetRect = getSearchPageInputRect();
  const moveX = targetRect.left - startRect.left;
  const moveY = targetRect.top - startRect.top;
  const waveX = targetRect.left + targetRect.width / 2;
  const waveY = targetRect.top + targetRect.height / 2;

  searchTransitionInput.style.left = `${startRect.left}px`;
  searchTransitionInput.style.top = `${startRect.top}px`;
  searchTransitionInput.style.width = `${startRect.width}px`;
  searchTransitionInput.style.height = `${startRect.height}px`;
  searchTransitionWave.style.left = `${waveX}px`;
  searchTransitionWave.style.top = `${waveY}px`;

  searchTransition.classList.add("active");
  searchBar.classList.add("search-hidden");

  setTimeout(() => {
    searchTransitionInput.style.width = `${targetRect.width}px`;
    searchTransitionInput.style.height = `${targetRect.height}px`;
    searchTransitionInput.style.transform = `translate(${moveX}px, ${moveY}px)`;
  }, 20);

  setTimeout(() => {
    searchTransition.classList.add("wave-active");
  }, 300);

  setTimeout(() => {
    window.location.hash = "#search";
  }, 650);

  setTimeout(() => {
    searchTransition.classList.add("fade-out");
  }, 720);

  setTimeout(() => {
    resetSearchTransition();
  }, 950);
}

//首页帖子模式的切换函数 点击对应的顶部bar栏按钮 切换对应的模式 并且indicater移动到对应的模式下面去的
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
    getFollowData();
  }

  if (index === 2) {
    getTopicButtons();
  }
}

addEvent(modeToggle, "click", (event) => {
  const button = event.target.closest("button");

  if (button) {
    modeBtn.forEach((item, index) => {
      if (item === button) {
        switchHomeMode(index);
      }
    });
  }
});
//工具函数 用来拆分多图片的字符串用的
function getPostImage(post) {
  if (post.images) return post.images.split(",")[0];
  else return "";
}

function isPublicPost(post) {
  return post.permission === 1;
}

function goUserPage(userId) {
  const myUserId = localStorage.getItem("userId");

  if (userId === myUserId) {
    location.hash = "#personal";
    return;
  }

  location.hash = `#other?id=${userId}`;
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
      goUserPage(userId);
      return;
    }

    const postId = item.dataset.id;
    location.hash = `#post-detials?id=${postId}`;
  });
}

function showForYouPost(item) {
  item.classList.add("show-post");
  item.dataset.observed = "1";
}

function getForYouPostObserver() {
  if (forYouPostObserver) {
    return forYouPostObserver;
  }

  forYouPostObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      showForYouPost(entry.target);
      forYouPostObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.15,
  });

  return forYouPostObserver;
}

function observeForYouPosts() {
  const items = getElements(".for-you .item");

  items.forEach((item) => {
    if (item.dataset.observed === "1") {
      return;
    }

    if (!window.IntersectionObserver) {
      showForYouPost(item);
      return;
    }

    item.dataset.observed = "1";
    getForYouPostObserver().observe(item);
  });
}

function renderPosts(postsData) {
  leftPostList.innerHTML = "";
  rightPostList.innerHTML = "";
  forYouPostCount = 0;

  postsData.forEach((post, index) => {
    let html = "";
    const image = getPostImage(post);
    const avatar = post.userImage;
    const userName = post.userName;
    const time = post.createTime;
    const title = post.title || "";
    const content = post.content;
    const likes = post.likeCount;
    const comments = post.commentCount;
    const postId = post.postId;
    let avatarSrc = "";

    if (avatar !== "" && avatar !== null && avatar !== undefined) {
      avatarSrc = `src="${avatar}"`;
    }

    if (image) {
      html = `
       <li class="item" data-id="${postId}" data-user-id="${post.userId}">
                <div class="photo">
                  <div class="post">
                    <div class="post-head">
                      <div class="avater-img">
                        <img
                          ${avatarSrc}
                          alt=""
                        />
                      </div>
                      <p class="avater-id">${userName}</p>
                      <i class="iconfont icon-a-gf-dots1"></i>
                    </div>
                    <img
                      src="${image}"
                      alt=""
                      class="image"
                    />
                    <div class="post-summary">
                      <p class="post-title">${title}</p>
                      <p class="time">${time}</p>
                    </div>
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
                      <div class="avater-img">
                        <img
                          ${avatarSrc}
                          alt=""
                        />
                      </div>
                      <p class="avater-id">${userName}</p>
                      <i class="iconfont icon-a-gf-dots1"></i>
                    </div>
                    <div class="post-summary">
                      <p class="post-title">${title}</p>
                      <p class="time">${time}</p>
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

  observeForYouPosts();
}

function getUserAvatar(user) {
  let avatar = "";

  if (user.image !== "" && user.image !== null && user.image !== undefined) {
    avatar = user.image;
  }

  return avatar;
}

function getPostWithUser(post, token) {
  return request(
    `/user/getDetail/${post.userId}`,
    "POST",
    {},
    { Authorization: token },
  ).then((userRes) => {
    const user = userRes.data.data || {};

    return {
      ...post,
      userName: user.userName || post.userName || "",
      userImage: getUserAvatar(user),
    };
  }).catch((error) => {
    console.log("Get post user failed:", error);

    return {
      ...post,
      userName: post.userName || "",
      userImage: "",
    };
  });
}

function appendPosts(postsData) {
  postsData.forEach((post) => {
    let html = "";
    const image = getPostImage(post);
    const avatar = post.userImage;
    const userName = post.userName;
    const time = post.createTime;
    const title = post.title || "";
    const content = post.content;
    const likes = post.likeCount;
    const comments = post.commentCount;
    const postId = post.postId;
    let avatarSrc = "";

    if (avatar !== "" && avatar !== null && avatar !== undefined) {
      avatarSrc = `src="${avatar}"`;
    }

    if (image) {
      html = `
       <li class="item" data-id="${postId}" data-user-id="${post.userId}">
                <div class="photo">
                  <div class="post">
                    <div class="post-head">
                      <div class="avater-img">
                        <img
                          ${avatarSrc}
                          alt=""
                        />
                      </div>
                      <p class="avater-id">${userName}</p>
                      <i class="iconfont icon-a-gf-dots1"></i>
                    </div>
                    <img
                      src="${image}"
                      alt=""
                      class="image"
                    />
                    <div class="post-summary">
                      <p class="post-title">${title}</p>
                      <p class="time">${time}</p>
                    </div>
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
                      <div class="avater-img">
                        <img
                          ${avatarSrc}
                          alt=""
                        />
                      </div>
                      <p class="avater-id">${userName}</p>
                      <i class="iconfont icon-a-gf-dots1"></i>
                    </div>
                    <div class="post-summary">
                      <p class="post-title">${title}</p>
                      <p class="time">${time}</p>
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

    if (forYouPostCount % 2 === 0) {
      leftPostList.innerHTML += html;
    } else {
      rightPostList.innerHTML += html;
    }

    forYouPostCount++;
  });

  observeForYouPosts();
}

function getTopicButtons() {
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
        console.log("Get topics failed:", result.msg);
        return;
      }

      const posts = result.data;
      const topics = [];

      posts.forEach((post) => {
        if (!isPublicPost(post)) {
          return;
        }

        if (
          post.topic === "" ||
          post.topic === null ||
          post.topic === undefined ||
          post.topic === "null"
        ) {
          return;
        }

        if (!topics.includes(post.topic)) {
          topics.push(post.topic);
        }
      });

      renderTopicButtons(topics);
    })
    .catch((error) => {
      console.log("Request topics failed:", error);
    });
}

function renderTopicButtons(topics) {
  topicList.innerHTML = "";
  topicLeftPostList.innerHTML = "";
  topicRightPostList.innerHTML = "";

  if (topics.length === 0) {
    topicCount.textContent = "No topics yet";
    return;
  }

  topics.forEach((topic, index) => {
    let pickedClass = "";

    if (index === 0) {
      pickedClass = "picked";
    }

    topicList.innerHTML += `
      <li>
        <button class="topic-btn ${pickedClass}" type="button" data-topic="${topic}">
          ${topic}
        </button>
      </li>
    `;
  });

  getTopicPosts(topics[0]);
}

function getTopicPosts(topic) {
  const token = localStorage.getItem("token");

  topicCount.textContent = `Loading ${topic} posts...`;
  topicLeftPostList.innerHTML = "";
  topicRightPostList.innerHTML = "";

  request(
    "/post/topic",
    "GET",
    {
      topic: topic,
    },
    {
      Authorization: token,
    },
  )
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Get topic posts failed:", result.msg);
        return;
      }

      const posts = result.data;
      const publicPosts = [];

      posts.forEach((post) => {
        if (isPublicPost(post)) {
          publicPosts.push(post);
        }
      });

      if (publicPosts.length === 0) {
        topicCount.textContent = "No posts in this topic";
        return;
      }

      const userRequests = publicPosts.map((post) => {
        return getTopicPostWithUser(post, token);
      });

      Promise.all(userRequests).then((newPosts) => {
        topicCount.textContent = `${newPosts.length} posts in ${topic}`;
        renderTopicPosts(newPosts);
      });
    })
    .catch((error) => {
      console.log("Request topic posts failed:", error);
    });
}

function getTopicPostWithUser(post, token) {
  return request(
    `/user/getDetail/${post.userId}`,
    "POST",
    {},
    { Authorization: token },
  ).then((userRes) => {
    const user = userRes.data.data;
    let avatar = "";

    if (user.image !== "" || user.image !== null || user.image !== undefined) {
      avatar = user.image;
    }

    return {
      ...post,
      userName: user.userName,
      userImage: avatar,
    };
  });
}

function renderTopicPosts(posts) {
  topicLeftPostList.innerHTML = "";
  topicRightPostList.innerHTML = "";

  posts.forEach((post, index) => {
    let html = "";
    const image = getPostImage(post);
    const avatar = post.userImage;
    const userName = post.userName;
    const time = post.createTime;
    const title = post.title || "";
    const content = post.content;
    const likes = post.likeCount;
    const comments = post.commentCount;
    const postId = post.postId;
    let avatarSrc = "";

    if (avatar !== "" && avatar !== null && avatar !== undefined) {
      avatarSrc = `src="${avatar}"`;
    }

    if (image !== "") {
      html = `
        <li class="item" data-id="${postId}" data-user-id="${post.userId}">
          <div class="photo">
            <div class="post">
              <div class="post-head">
                <div class="avater-img">
                  <img ${avatarSrc} alt="" />
                </div>
                <p class="avater-id">${userName}</p>
                <i class="iconfont icon-a-gf-dots1"></i>
              </div>
              <img src="${image}" alt="" class="image" />
              <div class="post-summary">
                <p class="post-title">${title}</p>
                <p class="time">${time}</p>
              </div>
              <div class="description">
                <p>${content}</p>
                <div class="post-action">
                  <i class="iconfont icon-24px"></i>
                  <span>${likes} Likes</span>
                  <i class="iconfont icon-pinglun"></i>
                  <span>${comments} comments</span>
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
                <div class="avater-img">
                  <img ${avatarSrc} alt="" />
                </div>
                <p class="avater-id">${userName}</p>
                <i class="iconfont icon-a-gf-dots1"></i>
              </div>
              <div class="post-summary">
                <p class="post-title">${title}</p>
                <p class="time">${time}</p>
              </div>
              <p class="post-content">${content}</p>
              <div class="description">
                <div class="post-action">
                  <i class="iconfont icon-24px"></i>
                  <span>${likes} Likes</span>
                  <i class="iconfont icon-pinglun"></i>
                  <span>${comments} comments</span>
                </div>
              </div>
            </div>
          </div>
        </li>
      `;
    }

    if (index % 2 === 0) {
      topicLeftPostList.innerHTML += html;
    } else {
      topicRightPostList.innerHTML += html;
    }
  });
}

export function getForYouPosts() {
  forYouLastPostId = 0;
  forYouPostCount = 0;
  hasMoreForYouPosts = true;
  leftPostList.innerHTML = "";
  rightPostList.innerHTML = "";
  forYouLoading.textContent = "Loading...";

  getMoreForYouPosts();
}

function getMoreForYouPosts() {
  const token = localStorage.getItem("token");
  let appendCount = 0;

  if (isForYouLoading || !hasMoreForYouPosts) {
    return;
  }

  isForYouLoading = true;
  forYouLoading.textContent = "Loading...";

  request(
    "/post/all",
    "GET",
    {
      lastPostId: forYouLastPostId,
      limit: forYouLimit,
    },
    {
      Authorization: token,
    },
  )
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Get ForYou posts failed:", result.msg);
        hasMoreForYouPosts = false;
        forYouLoading.textContent = "Load failed";
        return;
      }

      const list = result.data || [];
      const publicPosts = [];

      if (list.length === 0) {
        hasMoreForYouPosts = false;
        forYouLoading.textContent = "No more posts";
        return;
      }

      forYouLastPostId = list[list.length - 1].postId;

      if (list.length < forYouLimit) {
        hasMoreForYouPosts = false;
      }

      list.forEach((post) => {
        if (isPublicPost(post)) {
          publicPosts.push(post);
        }
      });

      const userRequests = publicPosts.map((post) => {
        return getPostWithUser(post, token);
      });

      return Promise.all(userRequests).then((newList) => {
        appendCount = newList.length;
        appendPosts(newList);

        if (!hasMoreForYouPosts) {
          forYouLoading.textContent = "No more posts";
        }
      });
    })
    .catch((error) => {
      console.log("Request error:", error);
      hasMoreForYouPosts = false;
      forYouLoading.textContent = "Load failed";
    })
    .finally(() => {
      isForYouLoading = false;

      if (appendCount === 0 && hasMoreForYouPosts) {
        getMoreForYouPosts();
      }
    });
}

getForYouPosts();

window.addEventListener("hashchange", () => {
  const pageName = location.hash.split("?")[0];

  if (pageName === "#home") {
    getForYouPosts();
  }
});

function watchForYouLoading() {
  if (!window.IntersectionObserver) {
    return;
  }

  const forYouObserver = new IntersectionObserver((entries) => {
    const entry = entries[0];

    if (entry.isIntersecting) {
      getMoreForYouPosts();
    }
  });

  forYouObserver.observe(forYouLoading);
}

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
                userImage: user.image,
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
    const avatar = user.image;
    let avatarSrc = "";

    if (avatar !== "" && avatar !== null && avatar !== undefined) {
      avatarSrc = `src="${avatar}"`;
    }

    followUserList.innerHTML += `
      <li data-user-id="${userId}">
        <div class="bg-circle">
          <div class="border">
            <img ${avatarSrc} alt="#" />
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
    const avatar = post.userImage;
    const image = getPostImage(post);
    const content = post.content;
    const likes = post.likeCount;
    const comments = post.commentCount;
    let avatarSrc = "";

    if (avatar !== "" && avatar !== null && avatar !== undefined) {
      avatarSrc = `src="${avatar}"`;
    }

    followPostList.innerHTML += `
      <li data-id="${postId}">
        <div class="post-header">
          <div class="avater-info" data-user-id="${userId}">
            <div class="bg-circle">
              <div class="border">
                <img ${avatarSrc} alt="#" />
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

    goUserPage(userId);
  });

  addEvent(followPostList, "click", (event) => {
    const avatarInfo = event.target.closest(".avater-info");

    if (avatarInfo) {
      const userId = avatarInfo.dataset.userId;
      goUserPage(userId);
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

function bindTopicEvents() {
  addEvent(topicList, "click", (event) => {
    const button = event.target.closest(".topic-btn");

    if (!button) {
      return;
    }

    const buttons = getElements(".topic-list .topic-btn");

    buttons.forEach((item) => {
      item.classList.remove("picked");
    });

    button.classList.add("picked");

    const topic = button.dataset.topic;

    getTopicPosts(topic);
  });

  addEvent(topicPostBox, "click", (event) => {
    const item = event.target.closest(".item");

    if (!item) {
      return;
    }

    const avatar = event.target.closest(".avater-img");

    if (avatar) {
      const userId = item.dataset.userId;
      goUserPage(userId);
      return;
    }

    const postId = item.dataset.id;

    if (!postId) {
      return;
    }

    location.hash = `#post-detials?id=${postId}`;
  });
}

bindForYouEvents();
bindFollowEvents();
bindTopicEvents();
watchForYouLoading();

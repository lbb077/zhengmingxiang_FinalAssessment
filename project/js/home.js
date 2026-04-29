import { getElement, getElements, addEvent } from "./utils.js";
import request from "./request.js";

const searchBar = getElement(".home .search-bar");
const forYou = getElement(".ForYou");
const leftPostList = getElement(".left-post-list");
const rightPostList = getElement(".right-post-list");
const followUserList = getElement(".follow .follow-user ul");
const followPostList = getElement(".follow .follow-post ul");
const topicList = getElement(".topic-list ul");
const topicCount = getElement(".topic-count");
const topicLeftPostList = getElement(".topic-left-post-list");
const topicRightPostList = getElement(".topic-right-post-list");
const topicPostBox = getElement(".Topic .topic");
const modeToggle = getElement(".mode-toggle");
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
    getFollowData();
  }

  if (index === 2) {
    getTopicButtons();
  }
}

addEvent(modeToggle, "click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  modeBtn.forEach((item, index) => {
    if (item === button) {
      switchHomeMode(index);
    }
  });
});

function getPostImage(post) {
  if (post.images === "") {
    return "";
  }

  return post.images.split(",")[0];
}

function goUserPage(userId) {
  const myUserId = localStorage.getItem("userId");

  if (userId === myUserId) {
    window.location.hash = "#personal";
    return;
  }

  window.location.hash = `#other?id=${userId}`;
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

function renderPosts(postsData) {
  leftPostList.innerHTML = "";
  rightPostList.innerHTML = "";

  postsData.forEach((post, index) => {
    let html = "";
    const image = getPostImage(post);
    const avatar = post.userImage;
    const userName = post.userName;
    const time = post.createTime;
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
                      <div class="avater">
                        <div class="avater-img">
                          <img
                            ${avatarSrc}
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
                            ${avatarSrc}
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

function getUserAvatar(user) {
  let avatar = "";

  if (user.image !== "") {
    if (user.image !== null) {
      if (user.image !== undefined) {
        avatar = user.image;
      }
    }
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
    const user = userRes.data.data;

    return {
      ...post,
      userName: user.userName,
      userImage: getUserAvatar(user),
    };
  });
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
        if (post.permission !== 1) {
          return;
        }

        if (post.topic === "") {
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
        if (post.permission === 1) {
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

    if (user.image !== "") {
      if (user.image !== null) {
        if (user.image !== undefined) {
          avatar = user.image;
        }
      }
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
                <div class="avater">
                  <div class="avater-img">
                    <img ${avatarSrc} alt="" />
                  </div>
                  <div class="avater-infos">
                    <p class="avater-id">${userName}</p>
                    <p class="time">${time}</p>
                  </div>
                </div>
                <i class="iconfont icon-a-gf-dots1"></i>
              </div>
              <img src="${image}" alt="" class="image" />
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
                <div class="avater">
                  <div class="avater-img">
                    <img ${avatarSrc} alt="" />
                  </div>
                  <div class="avater-infos">
                    <p class="avater-id">${userName}</p>
                    <p class="time">${time}</p>
                  </div>
                </div>
                <i class="iconfont icon-a-gf-dots1"></i>
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
        return getPostWithUser(post, token);
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

    window.location.hash = `#post-detials?id=${postId}`;
  });
}

bindForYouEvents();
bindFollowEvents();
bindTopicEvents();

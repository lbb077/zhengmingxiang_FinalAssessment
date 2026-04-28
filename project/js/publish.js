import { getElement, getElements, addEvent } from "./utils.js";
import request from "./request.js";
import { getForYouPosts } from "./home.js";

const titleInput = getElement("#pulish-title");
const contentInput = getElement("#pulish-content");
const imageInput = getElement("#pulish-image");
const topicInput = getElement("#input-topic");
const locationInput = getElement("#location");
const publishButton = getElement("#pulish");
const draftButton = getElement("#draft");
const previewList = getElement(".show-photos ul");
const permissionButtons = getElements(".choose-permission button");

let selectedFiles = [];
let oldImageUrls = [];
let currentPermission = 1;
let editPostId = "";
let editDraftId = "";

// 渲染图片预览，预览地址只在本地显示
function renderPreviewImages() {
  previewList.innerHTML = "";

  oldImageUrls.forEach((url, index) => {
    previewList.innerHTML += `
      <li class="photo-item" data-type="old" data-index="${index}">
        <img src="${url}" alt="" />
        <button class="del-img" type="button">
          <i class="iconfont icon-quxiao"></i>
        </button>
      </li>
    `;
  });

  selectedFiles.forEach((file, index) => {
    const imageUrl = URL.createObjectURL(file);

    previewList.innerHTML += `
      <li class="photo-item" data-type="new" data-index="${index}">
        <img src="${imageUrl}" alt="" />
        <button class="del-img" type="button">
          <i class="iconfont icon-quxiao"></i>
        </button>
      </li>
    `;
  });
}

// 上传一张图片，成功后返回服务器图片地址
function uploadOneImage(file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();

  formData.append("img", file);

  return request("/user/uploadImg", "POST", formData, {
    Authorization: token,
  }).then((res) => {
    const result = res.data;

    if (result.code !== 200) {
      console.log("图片上传失败:", result.msg);
      return "";
    }

    return result.data;
  });
}

// 上传所有已选择图片，最后返回 images 字符串
function uploadImages() {
  if (selectedFiles.length === 0) {
    return Promise.resolve(getAllImageText(""));
  }

  const uploadTasks = [];

  selectedFiles.forEach((file) => {
    uploadTasks.push(uploadOneImage(file));
  });

  return Promise.all(uploadTasks).then((urls) => {
    const successUrls = [];

    urls.forEach((url) => {
      if (url !== "") {
        successUrls.push(url);
      }
    });

    return getAllImageText(successUrls.join(","));
  });
}

// 把旧图片和新图片拼成 images 字符串
function getAllImageText(newImageText) {
  const allImages = [];

  oldImageUrls.forEach((url) => {
    allImages.push(url);
  });

  if (newImageText !== "") {
    const newImageUrls = newImageText.split(",");

    newImageUrls.forEach((url) => {
      allImages.push(url);
    });
  }

  return allImages.join(",");
}

// 清空发布表单
function clearPublishForm() {
  titleInput.value = "";
  contentInput.value = "";
  topicInput.value = "";
  locationInput.value = "";
  imageInput.value = "";
  previewList.innerHTML = "";
  selectedFiles = [];
  oldImageUrls = [];
  editPostId = "";
  editDraftId = "";
  localStorage.removeItem("editPostId");
  localStorage.removeItem("editPostData");
  localStorage.removeItem("editDraftId");
}

// 删除一个本地草稿
function removeDraft(draftId) {
  const draftText = localStorage.getItem("draftPosts");
  const newDrafts = [];

  if (!draftText) {
    return;
  }

  const drafts = JSON.parse(draftText);
  const draftIdNumber = Number(draftId);

  drafts.forEach((draft) => {
    if (draft.id !== draftIdNumber) {
      newDrafts.push(draft);
    }
  });

  localStorage.setItem("draftPosts", JSON.stringify(newDrafts));
}

// 保存草稿到 localStorage，不调用创建帖子接口
function saveDraft() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const topic = topicInput.value.trim();
  const location = locationInput.value.trim();

  if (content === "") {
    console.log("草稿内容不能为空");
    return;
  }

  uploadImages().then((images) => {
    const draft = {
      id: Date.now(),
      title: title,
      content: content,
      images: images,
      topic: topic,
      location: location,
      permission: 0,
      createTime: new Date().toLocaleString(),
    };

    const draftText = localStorage.getItem("draftPosts");
    let drafts = [];

    if (draftText) {
      drafts = JSON.parse(draftText);
    }

    if (editDraftId !== "") {
      removeDraft(editDraftId);
      const newDraftText = localStorage.getItem("draftPosts");
      drafts = JSON.parse(newDraftText);
    }

    drafts.unshift(draft);
    localStorage.setItem("draftPosts", JSON.stringify(drafts));

    console.log("草稿保存成功", draft);
    clearPublishForm();
    window.location.hash = "#personal";
  });
}

// 创建帖子，permission 为 1/2/3 时才发布到后端
function createPost(permission) {
  const token = localStorage.getItem("token");
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const topic = topicInput.value.trim();
  const location = locationInput.value.trim();

  if (content === "") {
    console.log("内容不能为空");
    return;
  }

  if (editPostId !== "") {
    updatePost(permission);
    return;
  }

  if (permission === 0) {
    saveDraft();
    return;
  }

  if (permission !== 1 && permission !== 2 && permission !== 3) {
    console.log("权限错误");
    return;
  }

  uploadImages().then((images) => {
    request(
      "/post",
      "POST",
      {
        title: title,
        content: content,
        images: images,
        topic: topic,
        location: location,
        permission: permission,
      },
      {
        Authorization: token,
      },
    )
      .then((res) => {
        const result = res.data;

        if (result.code !== 200) {
          console.log("创建失败:", result.msg);
          return;
        }

        console.log("创建成功", result.data);

        if (editDraftId !== "") {
          removeDraft(editDraftId);
        }

        clearPublishForm();
        window.location.hash = "#home";
        getForYouPosts();
      })
      .catch((error) => {
        console.log("创建帖子请求失败:", error);
      });
  });
}

// 更新正式帖子
function updatePost(permission) {
  const token = localStorage.getItem("token");
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const topic = topicInput.value.trim();
  const location = locationInput.value.trim();

  if (content === "") {
    console.log("内容不能为空");
    return;
  }

  if (
    permission !== 0 &&
    permission !== 1 &&
    permission !== 2 &&
    permission !== 3
  ) {
    console.log("权限错误");
    return;
  }

  uploadImages().then((images) => {
    request(
      `/post/update/${editPostId}`,
      "POST",
      {
        title: title,
        content: content,
        images: images,
        topic: topic,
        location: location,
        permission: permission,
      },
      {
        Authorization: token,
      },
    )
      .then((res) => {
        const result = res.data;

        if (result.code !== 0 && result.code !== 200) {
          console.log("更新失败:", result.msg);
          return;
        }

        console.log("更新成功", result.data);
        clearPublishForm();
        window.location.hash = "#personal";
        getForYouPosts();
      })
      .catch((error) => {
        console.log("更新帖子请求失败:", error);
      });
  });
}

// 根据按钮 class 更新当前权限
function changePermission(button) {
  permissionButtons.forEach((item) => {
    item.classList.remove("picked");
  });

  button.classList.add("picked");

  if (button.classList.contains("push-to-draft")) {
    currentPermission = 0;
  }

  if (button.classList.contains("public")) {
    currentPermission = 1;
  }

  if (button.classList.contains("only-friends")) {
    currentPermission = 2;
  }

  if (button.classList.contains("only-me")) {
    currentPermission = 3;
  }
}

// 根据 permission 设置按钮选中状态
function setPermissionButton(permission) {
  permissionButtons.forEach((button) => {
    button.classList.remove("picked");
  });

  permissionButtons.forEach((button) => {
    if (permission === 0 && button.classList.contains("push-to-draft")) {
      button.classList.add("picked");
    }

    if (permission === 1 && button.classList.contains("public")) {
      button.classList.add("picked");
    }

    if (permission === 2 && button.classList.contains("only-friends")) {
      button.classList.add("picked");
    }

    if (permission === 3 && button.classList.contains("only-me")) {
      button.classList.add("picked");
    }
  });
}

// 回填旧图片
function setOldImages(images) {
  oldImageUrls = [];

  if (images === "") {
    return;
  }

  const imageUrls = images.split(",");

  imageUrls.forEach((url) => {
    oldImageUrls.push(url);
  });
}

// 回填正式帖子
function fillPostForm(post) {
  titleInput.value = post.title;
  contentInput.value = post.content;
  topicInput.value = post.topic;
  locationInput.value = post.location;
  currentPermission = post.permission;
  setPermissionButton(currentPermission);
  setOldImages(post.images);
  renderPreviewImages();
}

// 回填草稿
function fillDraftForm(draft) {
  titleInput.value = draft.title;
  contentInput.value = draft.content;
  topicInput.value = draft.topic;
  locationInput.value = draft.location;
  currentPermission = 0;
  setPermissionButton(currentPermission);
  setOldImages(draft.images);
  renderPreviewImages();
}

// 进入发布页时，判断是否需要回填
function loadPublishPage() {
  const pageName = window.location.hash.split("?")[0];

  if (pageName !== "#publish") {
    return;
  }

  editPostId = "";
  editDraftId = "";
  oldImageUrls = [];
  selectedFiles = [];
  titleInput.value = "";
  contentInput.value = "";
  topicInput.value = "";
  locationInput.value = "";
  imageInput.value = "";
  previewList.innerHTML = "";
  currentPermission = 1;
  setPermissionButton(currentPermission);

  const postText = localStorage.getItem("editPostData");
  const postId = localStorage.getItem("editPostId");
  const draftId = localStorage.getItem("editDraftId");

  if (postText && postId) {
    const post = JSON.parse(postText);
    editPostId = postId;
    fillPostForm(post);
    return;
  }

  if (draftId) {
    const draftText = localStorage.getItem("draftPosts");

    if (!draftText) {
      return;
    }

    const drafts = JSON.parse(draftText);
    const draftIdNumber = Number(draftId);

    drafts.forEach((draft) => {
      if (draft.id === draftIdNumber) {
        editDraftId = draftId;
        fillDraftForm(draft);
      }
    });
  }
}

// 选择图片后保存文件，并刷新预览
addEvent(imageInput, "change", () => {
  selectedFiles = Array.from(imageInput.files);
  renderPreviewImages();
});

// 点击删除按钮时，删除对应图片
addEvent(previewList, "click", (event) => {
  const deleteButton = event.target.closest(".del-img");

  if (!deleteButton) {
    return;
  }

  const item = deleteButton.closest(".photo-item");

  if (!item) {
    return;
  }

  const index = Number(item.dataset.index);
  const type = item.dataset.type;

  if (type === "old") {
    oldImageUrls.splice(index, 1);
  }

  if (type === "new") {
    selectedFiles.splice(index, 1);
  }

  renderPreviewImages();
});

// 点击权限按钮时，切换当前权限
permissionButtons.forEach((button) => {
  addEvent(button, "click", () => {
    changePermission(button);
  });
});

// 正式发布按钮，根据当前权限发布或保存草稿
addEvent(publishButton, "click", () => {
  createPost(currentPermission);
});

// 草稿按钮固定保存草稿
addEvent(draftButton, "click", () => {
  saveDraft();
});

window.addEventListener("hashchange", () => {
  loadPublishPage();
});

loadPublishPage();

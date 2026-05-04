import { getElement, getElements, addEvent } from "./utils.js";
import request from "./request.js";
import { getForYouPosts } from "./home.js";

const titleInput = getElement("#pulish-title");
const contentInput = getElement("#pulish-content");
const imageInput = getElement("#pulish-image");
const topicInput = getElement("#topic");
const locationInput = getElement("#location");
const publishButton = getElement("#pulish");
const draftButton = getElement("#draft");
const previewList = getElement(".show-photos ul");
const publishAvatarImg = getElement(".pulish-head .avater-img");
const permissionButtons = getElements(".choose-permission button");

let selectedFiles = [];
let oldImageUrls = [];
let currentPermission = 1;
let editPostId = "";
let editDraftId = "";

function renderPublishAvatar() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    publishAvatarImg.src = "";
    return;
  }

  request(`/user/getDetail/${userId}`, "POST", {}, { Authorization: token })
    .then((res) => {
      const result = res.data;

      if (result.code !== 200) {
        console.log("Get publish avatar failed:", result.msg);
        return;
      }

      const user = result.data;

      if (user.image !== "" && user.image !== null && user.image !== undefined) {
        publishAvatarImg.src = user.image;
      } else {
        publishAvatarImg.src = "";
      }
    })
    .catch((error) => {
      console.log("Request publish avatar failed:", error);
    });
}

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

function uploadOneImage(file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();

  formData.append("img", file);

  return request("/user/uploadImg", "POST", formData, {
    Authorization: token,
  }).then((res) => {
    const result = res.data;

    if (result.code !== 200) {
      console.log("Image upload failed:", result.msg);
      return "";
    }

    return result.data;
  });
}

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

function saveDraft() {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const topic = topicInput.value.trim();
  const location = locationInput.value.trim();

  if (content === "") {
    console.log("Draft content cannot be empty");
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

    console.log("Draft saved", draft);
    clearPublishForm();
    window.location.hash = "#personal";
  });
}

function createPost(permission) {
  const token = localStorage.getItem("token");
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const topic = topicInput.value.trim();
  const location = locationInput.value.trim();

  if (content === "") {
    console.log("Content cannot be empty");
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
    console.log("Permission error");
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
          console.log("Create failed:", result.msg);
          return;
        }

        console.log("Create success", result.data);

        if (editDraftId !== "") {
          removeDraft(editDraftId);
        }

        clearPublishForm();
        window.location.hash = "#home";
        getForYouPosts();
      })
      .catch((error) => {
        console.log("Create post request failed:", error);
      });
  });
}

function updatePost(permission) {
  const token = localStorage.getItem("token");
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const topic = topicInput.value.trim();
  const location = locationInput.value.trim();

  if (content === "") {
    console.log("Content cannot be empty");
    return;
  }

  if (
    permission !== 0 &&
    permission !== 1 &&
    permission !== 2 &&
    permission !== 3
  ) {
    console.log("Permission error");
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
          console.log("Update failed:", result.msg);
          return;
        }

        console.log("Update success", result.data);
        clearPublishForm();
        window.location.hash = "#personal";
        getForYouPosts();
      })
      .catch((error) => {
        console.log("Update post request failed:", error);
      });
  });
}

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
  renderPublishAvatar();

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

addEvent(imageInput, "change", () => {
  const newFiles = Array.from(imageInput.files);

  newFiles.forEach((file) => {
    selectedFiles.push(file);
  });

  imageInput.value = "";
  renderPreviewImages();
});

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

permissionButtons.forEach((button) => {
  addEvent(button, "click", () => {
    changePermission(button);
  });
});

addEvent(publishButton, "click", () => {
  createPost(currentPermission);
});

addEvent(draftButton, "click", () => {
  saveDraft();
});

window.addEventListener("hashchange", () => {
  loadPublishPage();
});

loadPublishPage();

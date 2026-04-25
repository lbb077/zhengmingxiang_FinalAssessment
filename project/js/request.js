function request(url, method = "GET", data = {}) {
  if (!window.axios) {
    console.log("Axios is not loaded. Please check the CDN script.");
    return Promise.reject(new Error("Axios is not loaded"));
  }

  return window.axios({
    url: url,
    method: method,
    baseURL: "https://duck1437.shop/front-assess",
    params: method === "GET" ? data : {},

    data: method !== "GET" ? data : {},
  });
}
export default request;

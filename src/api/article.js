import request from "./request";


// 查询文章列表
export const getArticleList = () => {
  return request.get('/articles');
};

// 根据 id 查询文章
export const getArticleById = (id) => {
  return request.get(`${'/articles'}/${id}`);
};

// 新建文章
export const addArticle = (data) => {
  return request.post('/articles', data);
};

// 修改文章
export const updateArticle = (data) => {
  const { id, ...payload } = data || {};
  if (!id) {
    return Promise.reject(new Error('updateArticle requires id'));
  }
  console.log("payload:", payload);
  return request.patch(`/articles/${id}`, payload);
};

// 发布文章
export const publishArticle = (data) => {
  const { id, ...payload } = data || {};
  if (!id) {
    return Promise.reject(new Error('publishArticle requires id'));
  }
  return request.patch(`${'/articles'}/${id}/publish`, payload);
};

// 删除文章
export const deleteArticle = (id) => {
  return request.delete(`${'/articles'}/${id}`);
};
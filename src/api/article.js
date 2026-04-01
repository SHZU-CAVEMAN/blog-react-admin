import request from "./request";

// 查询 文章
export const getArticleList = () => {
  return request.get('/article/getAllArticles');
};
// 根据 id 查询文章
export const getArticleById = (id) => {
  return request.get(`/article/getArticleById?id=${id}`);
};

// 增加 文章
export const addArticle = (data) => {
  return request.post('/article/createArticle', data);
};

// 编辑 文章
export const updateArticle = (data) => {
  return request.post('/article/updateArticle', data);
};

// 删除 文章
export const deleteArticle = (id) => {
  return request.post('/article/deleteArticle', { id });
};
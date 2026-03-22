import request from "./request";

// 查询 文章
export const getArticleList = () => {
  return request.get('/article/getall');
};
// 增加 文章
export const addArticle = ()=>{
    return request.get("/article/add")
}
// 编辑 文章
export const updateArticle = (id, data) => {
  return request.put(`/category/${id}`, data);
};

// 删除 文章
export const deleteArticle = (id) => {
  return request.delete(`/category/${id}`);
};
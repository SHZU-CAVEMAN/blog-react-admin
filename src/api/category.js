import request from "./request";

// 查询 分类
export const getCategoryList = () => {
  return request.get('/category/getall');
};
// todo: 增加 文章分类
export const createCategory = (data)=>{
    return request.post("/category/createCategory", data) 
}
// 合并 文章分类
export const mergeCategory = (data) => {
  return request.post("/category/mergeCategory", data);
};
// 修改 文章分类信息
export const updateCategory =(data) => {
  return request.post("/category/updateCategory", data);
}
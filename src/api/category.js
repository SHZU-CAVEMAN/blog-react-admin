import request from "./request";

// 查询 分类
export const getCategoryList = () => {
  return request.get('/category/getall');
};
// 增加 分类
export const addCatagory = ()=>{
    return request.get("/category")
}
// 编辑 分类
export const mergeCategory = (data) => {
  return request.post("/category/mergeCategory", data);
};


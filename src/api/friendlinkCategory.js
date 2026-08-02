import request from './request';
// 获取友链分类
export const getFriendlinkCategoryList = () => {
  return request.get('/friendlink-categories');
};
// 根据id获取分类
export const getFriendlinkCategoryById = (id) => {
  return request.get(`/friendlink-categories/${id}`);
};
// 创建分类
export const createFriendlinkCategory = (data) => {
  return request.post('/friendlink-categories', data);
};
// 更新分类信息
export const updateFriendlinkCategory = (id, data) => {
  return request.patch(`/friendlink-categories/${id}`, data);
};
// 删除分类
export const deleteFriendlinkCategory = (id) => {
  return request.delete(`/friendlink-categories/${id}`);
};

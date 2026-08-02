import request from './request';
// 获取所有友链
export const getFriendlinkList = () => {
  return request.get('/friendlinks');
};
// 根据id获取友链
export const getFriendlinkById = (id) => {
  return request.get(`/friendlinks/${id}`);
};
// 新增友链
export const createFriendlink = (data) => {
  return request.post('/friendlinks', data);
};
// 更新友链信息
export const updateFriendlink = (id, data) => {
  return request.patch(`/friendlinks/${id}`, data);
};
// 删除友链
export const deleteFriendlink = (id) => {
  return request.delete(`/friendlinks/${id}`);
};

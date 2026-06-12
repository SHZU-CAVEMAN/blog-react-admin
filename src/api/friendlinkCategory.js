import request from './request';

export const getFriendlinkCategoryList = () => {
  return request.get('/friendlink-categories');
};

export const getFriendlinkCategoryById = (id) => {
  return request.get(`/friendlink-categories/${id}`);
};

export const createFriendlinkCategory = (data) => {
  return request.post('/friendlink-categories', data);
};

export const updateFriendlinkCategory = (id, data) => {
  return request.patch(`/friendlink-categories/${id}`, data);
};

export const deleteFriendlinkCategory = (id) => {
  return request.delete(`/friendlink-categories/${id}`);
};

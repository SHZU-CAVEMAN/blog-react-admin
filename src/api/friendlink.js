import request from './request';

export const getFriendlinkList = () => {
  return request.get('/friendlinks');
};

export const getFriendlinkById = (id) => {
  return request.get(`/friendlinks/${id}`);
};

export const createFriendlink = (data) => {
  return request.post('/friendlinks', data);
};

export const updateFriendlink = (id, data) => {
  return request.patch(`/friendlinks/${id}`, data);
};

export const deleteFriendlink = (id) => {
  return request.delete(`/friendlinks/${id}`);
};

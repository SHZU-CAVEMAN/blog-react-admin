import request from './request';

// 获取评论列表
export const getAllCommentList = () => {
  return request.get('/comment/getall');
};

// 删除评论
export const deleteCommentById = (id) => {
  return request.delete(`/comment/${id}`);
};

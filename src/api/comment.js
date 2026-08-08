import request from './request';

// 获取评论列表
export const getAllCommentList = () => {
  return request.get('/comment/getall');
};

// 更新评论状态
export const updateCommentStatusById = (id, status) => {
  return request.patch(`/comment/${id}`, { status });
};

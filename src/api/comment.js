import request from './request';

// 获取评论列表
export const getAllCommentList = () => {
  return request.get('/comment/getall');
};

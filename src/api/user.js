import request from './request';

// 登录
export const loginUser = (data) => {
  return request.post('/user/login', data);
};

// 发送邮箱验证码
export const sendEmailCode = (data) => {
  return request.post('/verify/email', data);
};

// 查询全部用户
export const getUserList = () => {
  return request.get('/users');
};

// 修改用户
export const updateUser = (data) => {
  const { id, ...payload } = data || {};
  if (!id) {
    return Promise.reject(new Error('updateUser requires id'));
  }
  return request.patch(`/users/${id}`, payload);
};

// 新增用户
export const createUser = (data) => {
  return request.post('/user/register', data);
};
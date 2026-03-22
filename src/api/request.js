import axios from 'axios';
import { message } from 'antd';

// 创建实例
const service = axios.create({
  baseURL: 'http://127.0.0.1:81', // 统一前缀
  timeout: 5000,
});

// 请求拦截器
service.interceptors.request.use(config => {
  // 可以加 token
  /*
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
    */
  return config;
});

// 响应拦截器
service.interceptors.response.use(
  res => {
    // 统一处理返回数据
    /*
    if (res.status !== 0) {
      message.error(res.data.msg);
      return Promise.reject(res.data);
    }
      */
    return res.data;
  },
  err => {
    message.error('网络错误');
    return Promise.reject(err);
  }
);

export default service;
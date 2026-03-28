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
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// 响应拦截器
service.interceptors.response.use(
  res => {
    return res.data;  
  },
  error => {
    if (error.response && error.response.status === 401) {
      // 清除无效 token
      localStorage.removeItem("token");
      localStorage.removeItem("tokenExpire");
      // 跳转到登录页
      window.location.href = "/login";
    }
  }
);

export default service;
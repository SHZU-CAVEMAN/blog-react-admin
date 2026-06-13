import axios from 'axios';


// 创建实例
const service = axios.create({
  baseURL: 'http://127.0.0.1:81', // 统一前缀
  timeout: 5000,
});

const redirectToLogin = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpire');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// 请求拦截器
service.interceptors.request.use(config => {
  // 可以加 token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  //console.log("config对象",config);
  return config;
});

// 响应拦截器
service.interceptors.response.use(
  res => {
    // 后端统一格式：HTTP 200/201 且 code=0 代表成功
    if ((res.status === 200 || res.status === 201) && Number(res?.data?.code) === 0) {
      return res.data;
    }
    // 其余情况都按业务失败抛出，交给页面层提示
    return Promise.reject(res.data);
  },
  // axios 只会在 HTTP 非 2xx 时走 error 分支
  error => {
    // HTTP 401 统一视为登录失效，直接回登录页
    if (error.response && error.response.status === 401) {
      redirectToLogin();
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default service;
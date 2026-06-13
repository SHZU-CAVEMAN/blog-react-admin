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
    console.log("响应拦截——响应结果：", res);
    // 兼容后端使用 HTTP 200 + { status: 401 } 的业务错误返回
    if (Number(res?.data?.status) === 401) {
      redirectToLogin();
      return Promise.reject(res.data);
    }
    return res.data;
  },
  // axios 只会在 HTTP 非 2xx 时走 error 分支
  // res.send 默认 HTTP 状态码是 200，所以后端业务错误（如 401）会被当成成功响应处理，需要在 then 里再判断一次 status
  error => {
    if (error.response && error.response.status === 401) {
      redirectToLogin();
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default service;
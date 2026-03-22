import React from 'react';  //react核心库
import ReactDOM from 'react-dom/client';  //把react组件挂载到真实dom
import './index.css';
import App from './App';  //主组件
import reportWebVitals from './reportWebVitals';  //性能监视工具

const root = ReactDOM.createRoot(document.getElementById('root'));  //创建react根容器，入参为dom元素

//render的入参：react元素 。
root.render(
  //开发模式，帮助检测问题
  <React.StrictMode>  
    <App />
  </React.StrictMode>
); 

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
// e:可以在devtools 打印 
// 也可以远程发送；
/*
function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  const url = 'https://example.com/analytics';

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
}
reportWebVitals(sendToAnalytics);
*/

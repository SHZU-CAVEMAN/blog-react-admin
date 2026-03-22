import React from "react";
import { Navigate } from "react-router-dom";

/**
 * 受保护路由组件
 * 用来在访问某个页面前进行登录判断
 */
export default function ProtectedRoute({ children }) {
  /*判断是否已登录（此处根据实际逻辑修改）*/
  const token = localStorage.getItem("token");

  /*如果没登录，则重定向到 /login */
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  /* 如果已登录，渲染原本的子组件*/
  return children;
}
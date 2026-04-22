import { Navigate, useLocation } from "react-router-dom";
import MyLayout from "../layouts";
import { getRequiredRoles } from "./routeAccess";

const AuthLayout = () => {
  const location = useLocation();

  const token = localStorage.getItem("token");
  const expireTime = localStorage.getItem("tokenExpire");
  const userRole = localStorage.getItem("userRole") || "user";
  const isExpired = expireTime && Date.now() > expireTime;
  // 没token 或 已过期 → 清除信息 → 跳登录
  if (!token || isExpired) {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpire");
    localStorage.removeItem("userRole");
    return <Navigate to="/login" replace />;
  }

  // 通用角色权限守卫：根据路由配置判断当前用户是否可访问
  const requiredRoles = getRequiredRoles(location.pathname);
  if (requiredRoles && !requiredRoles.includes(userRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  localStorage.setItem("tokenExpire", Date.now() + 2 * 60 * 60 * 1000); // 切换页面时刷新有效期（2小时无路由操作需重新登录）
  return <MyLayout />;
}

export default AuthLayout
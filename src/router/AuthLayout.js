import { Navigate, useLocation } from "react-router-dom";
import MyLayout from "../layouts";
import { getRequiredRoles } from "./routeAccess";

const AuthLayout = () => {
  const location = useLocation();

  // 访问站点根路径时，统一引导到登录页
  if (location.pathname === "/") {
    return <Navigate to="/login" replace />;
  }

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole") || "user";
  // 只依赖后端 token 校验：前端这里只判断是否存在 token。
  // token 过期由接口 401（HTTP 401 或业务 status=401）统一处理并跳转登录页。
  if (!token) {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    return <Navigate to="/login" replace />;
  }

  // 通用角色权限守卫：根据路由配置判断当前用户是否可访问
  const requiredRoles = getRequiredRoles(location.pathname);
  if (requiredRoles && !requiredRoles.includes(userRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <MyLayout />;
}

export default AuthLayout
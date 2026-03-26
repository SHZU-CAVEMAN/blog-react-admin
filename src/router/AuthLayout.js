import { Navigate,useLocation} from "react-router-dom";
import MyLayout from "../layouts";

const AuthLayout = () => {
  useLocation();  //作用：路由变化 → 强制组件重新渲染

  const token = localStorage.getItem("token");
  const expireTime = localStorage.getItem("tokenExpire");
  const isExpired = expireTime && Date.now() > expireTime;
  console.log("tokentokentokentoken",token,expireTime,isExpired)
  // 没token 或 已过期 → 清除信息 → 跳登录
  if (!token || isExpired) {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpire");
    return <Navigate to="/login" replace />;
  }else{
    return <MyLayout/>
  }
}

export default AuthLayout
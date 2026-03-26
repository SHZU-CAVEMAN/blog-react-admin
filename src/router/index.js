import { createBrowserRouter} from "react-router-dom";
import AuthLayout from "./AuthLayout";


import Home from "@/pages/home";
import Guide from "@/pages/guide";
import Permission from "@/pages/permission";

import ArticleCreate from "@/pages/article/create";
import ArticleList from "@/pages/article/list";
import ArticleCategory from "@/pages/article/category";

import Message from "@/pages/other/message";
import Comment from "@/pages/other/comment";
import Link from "@/pages/other/link";

import Login from "@/pages/login";

// createBrowserRouter返回一个路由配置对象
const router = createBrowserRouter([
  {
    // 根路由
    path: "/",
    element: <AuthLayout />,
    loader:()=>{
       // loader 一般用于 进入组件前的初始化数据请求，并且要return 数据（页面组件用 useLoaderData()获取这里返回的数据）
       // loader 不是组件，不能用 hooks 。
    },
    children: [
      { path: "home", element: <Home /> },
      { path: "guide", element: <Guide /> },
      // 权限管理 界面
      { path: "permission", element: <Permission /> },

      { path: "article/create", element: <ArticleCreate /> },
      { path: "article/list", element: <ArticleList /> },
      { path: "article/category", element: <ArticleCategory /> },

      { path: "other/message", element: <Message /> },
      { path: "other/comment", element: <Comment /> },
      { path: "other/friendLink", element: <Link /> },
    ]
  },
  {
    path: "login", 
    element: <Login /> ,
  }
]);

export default router;
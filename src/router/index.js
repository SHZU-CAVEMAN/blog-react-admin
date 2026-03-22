import { createBrowserRouter} from "react-router-dom";
import MyLayout from "../layouts";
import Home from "@/pages/home";
import Guide from "@/pages/guide";
import Permission from "@/pages/permission";

import ArticleCreate from "@/pages/article/create";
import ArticleList from "@/pages/article/list";
import ArticleCategory from "@/pages/article/category";

import Message from "@/pages/other/message";
import Comment from "@/pages/other/comment";
import Link from "@/pages/other/link";


/*
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}> </Route>
    </Routes>

  );
}
*/

// createBrowserRouter返回一个路由配置对象
const router = createBrowserRouter([
  {
    path: "/",
    element: <MyLayout />,
    loader:()=>{
       const token = localStorage.getItem("token");
        if (!token) {
          //跳转到登录界面
        }
    },
    children: [
      { path: "home", element: <Home /> },
      { path: "guide", element: <Guide /> },
      { path: "permission", element: <Permission /> },

      { path: "article/create", element: <ArticleCreate /> },
      { path: "article/list", element: <ArticleList /> },
      { path: "article/category", element: <ArticleCategory /> },

      { path: "other/message", element: <Message /> },
      { path: "other/comment", element: <Comment /> },
      { path: "other/friendLink", element: <Link /> },
    ]
  }
]);

export default router;
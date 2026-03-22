import {RouterProvider} from "react-router-dom";
import AppRouter from "./router";

function App() {
  return (
    // AppRouter由 createBrowserRouter 创建，外面要包一层 RouterProvider （监听浏览器地址变化）
    <RouterProvider router={AppRouter}/>
  )
}

export default App;

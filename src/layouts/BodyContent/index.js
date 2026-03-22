import { Outlet } from "react-router-dom"; // Outlet为内容插槽，"子路由渲染在这"的意思
function BodyContent(){
    return (
        <div>
             <Outlet />
        </div>
    )
}
export default BodyContent
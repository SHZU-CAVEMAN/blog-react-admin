import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
}from '@ant-design/icons';
import { Button } from 'antd';
import "./index.less";

function HeadBar({collapsed,onToggle}){
    // 退出登录逻辑
    const handleLogout = () => {
        // 清空所有登录信息
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpire");
        // 跳转到登录页
        window.location.href = "/login";
    };
    return(
        <div className='head-bar' style={{
               display: "flex",        /* 关键：横向排列 */
               justifyContent: "space-between",  /* 左右分开 */
        }}>
            {/* 一个折叠左侧菜单栏的按钮 */}
            <Button type="dashed" onClick={onToggle}>
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </Button>

            <div className='login-out'
                onClick={handleLogout}
            >
                退出登录
            </div>
        </div>
    )
}

export default HeadBar
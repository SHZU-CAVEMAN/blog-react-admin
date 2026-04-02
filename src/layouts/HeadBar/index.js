import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    BulbOutlined,
    BulbFilled,
}from '@ant-design/icons';
import { Button } from 'antd';
import { useThemeMode } from '@/config/themeContext';
import "./index.less";

function HeadBar({collapsed,onToggle}){
    const { isDark, toggleTheme } = useThemeMode();
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

            <div className='head-bar-actions'>
                <Button type="default" onClick={toggleTheme}>
                    {isDark ? <BulbFilled /> : <BulbOutlined />} {isDark ? '日间模式' : '夜间模式'}
                </Button>
                <div className='login-out'
                    onClick={handleLogout}
                >
                    退出登录
                </div>
            </div>
        </div>
    )
}

export default HeadBar
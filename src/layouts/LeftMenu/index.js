import "./index.less";
import {
    AppstoreOutlined,
    ContainerOutlined,
    DesktopOutlined,
    MailOutlined,
    PieChartOutlined,
} from '@ant-design/icons';  //antd的图标就是一个组件
import {  Menu } from 'antd';
import { useNavigate, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { useThemeMode } from "@/config/themeContext";

function getItem(label, key, icon, children, type) {
    return {
        key,
        icon,
        children,
        label,
        type,
    };
}

const LeftMenu = ({collapsed}) => {
    const { isDark } = useThemeMode();
    const userRole = localStorage.getItem('userRole') || 'user';
    // react 页面跳转 方法
    const navigate = useNavigate();
    // react 当前路由地址 对象
    const location = useLocation();

    const items = useMemo(() => {
        const baseItems = [
            getItem('首页', '/home', <PieChartOutlined />),
            getItem('引导页', '/guide', <DesktopOutlined />),
            getItem('其他', '/other', <AppstoreOutlined />, [
                getItem('消息推送', '/other/message'),
                getItem('评论管理', '/other/comment'),
                getItem('友链管理', '/other/friendLink'),
            ]),
        ];

        if (userRole === 'admin') {
            baseItems.splice(2, 0, getItem('权限管理', '/permission', <ContainerOutlined />));
            baseItems.splice(3, 0, getItem('文章管理', '/article', <MailOutlined />, [
                getItem('编辑发布', '/article/create'),
                getItem('文章列表', '/article/list'),
                getItem('分类管理', '/article/category'),
            ]));
        }

        return baseItems;
    }, [userRole]);

    return (
        <div>
            <Menu
                defaultSelectedKeys={['1']}
                defaultOpenKeys={['sub1']}
                mode="inline"
                theme={isDark ? 'dark' : 'light'}
                style={{height:'100vh'}}
                // 是否折叠
                inlineCollapsed={collapsed}
                // 菜单树
                items={items}
                
                selectedKeys={[location.pathname]}
                // 点击 页面跳转
                onClick={({ key }) => {
                    navigate(key);
                }}
            />
        </div>
    );
};
export default LeftMenu;

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

function getItem(label, key, icon, children, type) {
    return {
        key,
        icon,
        children,
        label,
        type,
    };
}

const items = [
    getItem('首页', '/home', <PieChartOutlined />),
    getItem('引导页', '/guide', <DesktopOutlined />),
    getItem('权限管理', '/permission', <ContainerOutlined />),
    getItem('文章管理', '/article', <MailOutlined />, [
        getItem('文章新增', '/article/create'),
        getItem('文章修改和查看', '/article/list'),
        getItem('分类管理', '/article/category'),
    ]),
    getItem('其他', '/other', <AppstoreOutlined />, [
        getItem('消息推送', '/other/message'),
        getItem('评论管理', '/other/comment'),
        getItem('友链管理', '/other/friendLink'),
    ]),
];

const LeftMenu = ({collapsed}) => {
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <div>
            <Menu
                defaultSelectedKeys={['1']}
                defaultOpenKeys={['sub1']}
                mode="inline"
                theme="dark"
                inlineCollapsed={collapsed}
                items={items}
                style={{height:'100vh'}}
                selectedKeys={[location.pathname]}
                onClick={({ key }) => {
                    navigate(key);
                }}
            />
        </div>
    );
};
export default LeftMenu;

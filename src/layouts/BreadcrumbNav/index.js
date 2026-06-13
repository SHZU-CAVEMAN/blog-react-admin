import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import './index.less';

// 路由路径到面包屑显示文本的映射表
const routeLabelMap = {
    '/home': '首页',
    '/guide': '引导页',
    '/permission': '用户管理',
    '/forbidden': '无权限',
    '/article/create': '编辑发布',
    '/article/list': '文章列表',
    '/article/category': '文章分类',
    '/message': '消息推送',
    '/comment': '评论管理',
    '/friendLink': '友链管理',
    '/friendLink/category': '友链分类管理',
    '/picture': '图片管理',
};

// 根据路由路径获取对应的显示文本，如果没有映射则返回路径本身
const getRouteLabel = (pathname) => routeLabelMap[pathname] || pathname;

function BreadcrumbNav() {
    // 获取当前路由位置和导航函数
    const location = useLocation();
    const navigate = useNavigate();
    // 维护已访问过的路由路径列表，用于显示面包屑导航历史
    const [crumbPaths, setCrumbPaths] = useState([]);

    // 监听路由变化，自动将新访问的路由加入面包屑列表
    useEffect(() => {
        const pathname = location.pathname;
        setCrumbPaths((prev) => {
            // 如果该路由已存在于列表中，则不重复添加
            if (prev.includes(pathname)) {
                return prev;
            }
            // 否则将新路由追加到列表末尾
            return [...prev, pathname];
        });
    }, [location.pathname]);

    // 处理关闭面包屑项的逻辑，使用 useCallback 避免每次渲染时重新创建函数，导致 useMemo 依赖变化
    const handleClose = useCallback((path, event) => {
        event.stopPropagation();
        setCrumbPaths((prev) => {
            // 从列表中移除指定的路由路径
            const next = prev.filter((item) => item !== path);
            // 如果列表为空，则添加首页作为兜底
            if (next.length === 0) {
                next.push('/home');
            }

            // 如果关闭的是当前正在查看的页面，则自动导航到剩余面包屑的最后一项
            if (location.pathname === path) {
                navigate(next[next.length - 1]);
            }
            return next;
        });
    }, [location.pathname, navigate]);

    // 根据路由列表生成面包屑菜单项，包含文本和关闭按钮
    const items = useMemo(() => {
        return crumbPaths.map((path) => ({
            key: path,
            title: (
                // 为当前路由的面包屑项添加 active 类，用于高亮显示（黑色+加粗）
                <span className={`crumb-item ${path === location.pathname ? 'active' : ''}`} onClick={() => navigate(path)}>
                    <span className="crumb-label">{getRouteLabel(path)}</span>
                    {/* 首页不显示关闭按钮，其他页面显示 */}
                    {path !== '/home' ? (
                        <CloseOutlined
                            className="crumb-close"
                            onClick={(event) => handleClose(path, event)}
                        />
                    ) : null}
                </span>
            ),
        }));
    }, [crumbPaths, navigate, location.pathname, handleClose]);

    // 渲染 Ant Design Breadcrumb 组件，展示面包屑导航
    return <Breadcrumb className="body-breadcrumb" items={items} />;
}

export default BreadcrumbNav;

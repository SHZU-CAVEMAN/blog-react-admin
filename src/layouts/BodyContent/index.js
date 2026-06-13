import { useEffect, useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import BreadcrumbNav from "../BreadcrumbNav";
import "./index.less";

function BodyContent(){
    // 获取当前路由位置和对应的渲染组件
    const location = useLocation();
    const outlet = useOutlet();
    // 维护已访问页面的缓存，每个项包含 path（路由路径）和 element（组件）
    // 目的：路由切换时保持组件挂载，避免页面 state 丢失
    const [cachedPages, setCachedPages] = useState([]);

    // 监听路由变化，自动缓存新访问的页面
    useEffect(() => {
        const path = location.pathname;
        setCachedPages((prev) => {
            // 检查该路由是否已在缓存中
            const exists = prev.some((item) => item.path === path);
            if (exists) {
                // 命中缓存时直接复用旧组件实例，避免被新 outlet 覆盖导致重新挂载和重复请求
                return prev;
            }
            // 首次访问的页面加入缓存列表（outlet是该路由对应的 React element（页面实例）
            return [...prev, { path, element: outlet }];
        });
    }, [location.pathname, outlet]);

    // 页面切换或缓存更新时，多次触发 resize 事件让 Table 等组件重新计算布局
    // 原因：display: none→block 切换时，Ant Design Table 需要信号来重新测量宽度
    // 多次触发确保在各个 rerender 阶段都能被组件捕获
    useEffect(() => {
        const timers = [0, 50, 100, 200].map(delay =>
            setTimeout(() => window.dispatchEvent(new Event('resize')), delay)
        );
        return () => timers.forEach(timer => clearTimeout(timer));
    }, [location.pathname, cachedPages.length]);

    return (
        <div className="body-content-wrap">
            <BreadcrumbNav />
            <div className="body-content-page">
                {cachedPages.map((item) => (
                    <div
                        key={item.path}
                        // 根据是否为当前路由添加 active 类以控制显示/隐藏
                        // 隐藏的页面仍保持在 DOM 中以维持内部 state（keep-alive 效果）
                        className={`keep-alive-page ${item.path === location.pathname ? 'active' : ''}`}
                    >
                        {item.element}
                    </div>
                ))}
            </div>
        </div>
    )
}
export default BodyContent
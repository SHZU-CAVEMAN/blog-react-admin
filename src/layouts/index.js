
import HeadBar  from "./HeadBar";
import LeftMenu  from "./LeftMenu";
import BodyContent  from "./BodyContent";
import "./index.less";
import { useState } from 'react';

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = () => {
        setCollapsed(!collapsed);
  };
  return (

    <div className="app-layout">

      {/* 左侧菜单栏 */}
      <aside className={`app-sider ${collapsed ? 'collapsed' : ''}`}>
        <LeftMenu collapsed={collapsed}  />
      </aside>
      {/* 右侧 顶部栏 + 主体内容区 */}
      <div className="app-main">
        <header className="app-header">
          <HeadBar         
            collapsed={collapsed}
            onToggle={toggleCollapsed} 
        />
        </header>
        <main className="app-content">
          <BodyContent />
        </main>
      </div>
    </div>
  );
}

export default Layout
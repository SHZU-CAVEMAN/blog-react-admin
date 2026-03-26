import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
}from '@ant-design/icons';
import { Button } from 'antd';
import "./index.less"

function HeadBar({collapsed,onToggle}){
  
    return(
        <div className='head-bar'>
            {/* 一个折叠左侧菜单栏的按钮 */}
            <Button type="dashed" onClick={onToggle}>
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </Button>
        </div>
    )
}

export default HeadBar
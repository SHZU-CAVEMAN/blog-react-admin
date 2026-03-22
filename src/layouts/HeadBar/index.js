import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
}from '@ant-design/icons';
import { Button } from 'antd';
import "./index.less"

function HeadBar({collapsed,onToggle}){
  
    return(
        <div className='head-bar'>
            <Button
                type="dashed"
                onClick={onToggle}
            >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </Button>
        </div>
    )
}

export default HeadBar
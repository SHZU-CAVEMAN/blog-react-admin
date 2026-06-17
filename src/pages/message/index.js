import { Tabs } from 'antd';
import PushChannelConfigTab from './tabs/PushChannelConfigTab';
import PushMessageTab from './tabs/PushMessageTab';

const Message = () => {
  return (
    <Tabs
      defaultActiveKey="push-content"
      items={[
        {
          key: 'push-content',
          label: '推送内容',
          children: <PushMessageTab />,
        },
        {
          key: 'channel-config',
          label: '渠道配置',
          children: <PushChannelConfigTab />,
        },
      ]}
    />
  );
};

export default Message;
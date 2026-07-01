import { Tabs } from 'antd';
import PushChannelConfigTab from './tabs/PushChannelConfigTab';
import PushMessageTab from './tabs/PushMessageTab';
import SiteNotificationTab from './tabs/SiteNotificationTab';

const Message = () => {
  return (
    <Tabs
      defaultActiveKey="site-notification"
      items={[
        {
          key: 'site-notification',
          label: '站内通知',
          children: <SiteNotificationTab />,
        },
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
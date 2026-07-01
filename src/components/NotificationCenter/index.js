import { BellOutlined } from '@ant-design/icons';
import { Badge, Button, Dropdown, Empty, Space, Tag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNotificationList,
  getNotificationUnreadCount,
  readAllNotifications,
  readNotification,
} from '@/api/notification';
import {
  getNotificationTargetPath,
  normalizeNotificationList,
  normalizeNotificationUnreadCount,
  NOTIFICATION_TYPE_COLOR_MAP,
  NOTIFICATION_TYPE_LABEL_MAP,
} from '@/config/notification';
import './index.less';

const HeadNotificationCenter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notificationList, setNotificationList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 头部下拉只展示最近几条，完整列表放消息中心页
  const topNotifications = useMemo(() => notificationList.slice(0, 6), [notificationList]);

  // 首次加载 + 轮询复用的拉取函数
  const loadNotifications = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const [countRes, listRes] = await Promise.all([
        getNotificationUnreadCount(),
        getNotificationList({ page: 1, pageSize: 10 }),
      ]);
      setUnreadCount(normalizeNotificationUnreadCount(countRes));
      setNotificationList(
        normalizeNotificationList(listRes).map((item) => ({
          ...item,
          status: item.status || 'unread',
          title: item.title || '系统通知',
          content: item.content || '',
        }))
      );
    } catch (error) {
      message.error(error?.message || error?.msg || '获取消息失败');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // 每 30s 轮询一次，保持头部未读数接近实时
  useEffect(() => {
    loadNotifications();
    const timer = setInterval(() => {
      loadNotifications(true);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleReadOne = async (id) => {
    setNotificationList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'read' } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await readNotification(id);
    } catch (error) {
      message.error(error?.message || error?.msg || '标记已读失败');
      loadNotifications(true);
    }
  };

  const handleReadAll = async () => {
    setNotificationList((prev) => prev.map((item) => ({ ...item, status: 'read' })));
    setUnreadCount(0);

    try {
      await readAllNotifications();
      message.success('已全部标记为已读');
    } catch (error) {
      message.error(error?.message || error?.msg || '全部已读失败');
      loadNotifications(true);
    }
  };

  const handleOpenByType = (item) => {
    navigate(getNotificationTargetPath(item));
  };

  const menu = {
    items: [
      {
        key: 'panel',
        label: (
          <div className="notification-center-panel">
            <div className="notification-center-header">
              <Typography.Text strong>消息中心</Typography.Text>
              <Space size={4}>
                <Button type="link" size="small" onClick={handleReadAll}>
                  全部已读
                </Button>
                <Button type="link" size="small" onClick={() => navigate('/message')}>
                  查看全部
                </Button>
              </Space>
            </div>

            {topNotifications.length ? (
              <div className="notification-center-list">
                {topNotifications.map((item) => {
                  const isUnread = item.status === 'unread';
                  return (
                    <div
                      key={item.id}
                      className={`notification-center-item ${isUnread ? 'is-unread' : ''}`}
                    >
                      <div className="item-body" onClick={() => handleOpenByType(item)}>
                        <Space size={8} wrap>
                          <Tag color={NOTIFICATION_TYPE_COLOR_MAP[item.type] || 'default'}>
                            {NOTIFICATION_TYPE_LABEL_MAP[item.type] || item.type || '通知'}
                          </Tag>
                          <Typography.Text strong>{item.title}</Typography.Text>
                        </Space>
                        <Typography.Paragraph ellipsis={{ rows: 1 }} className="item-content">
                          {item.content || '无内容'}
                        </Typography.Paragraph>
                      </div>
                      <Button
                        type="link"
                        size="small"
                        disabled={!isUnread}
                        onClick={() => handleReadOne(item.id)}
                      >
                        {isUnread ? '标记已读' : '已读'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="notification-center-empty">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无消息" />
              </div>
            )}
          </div>
        ),
      },
    ],
  };

  return (
    <Dropdown trigger={['click']} menu={menu} overlayClassName="notification-center-dropdown">
      <Button type="default" loading={loading}>
        <Badge count={unreadCount} size="small" overflowCount={99}>
          <BellOutlined />
        </Badge>
      </Button>
    </Dropdown>
  );
};

export default HeadNotificationCenter;

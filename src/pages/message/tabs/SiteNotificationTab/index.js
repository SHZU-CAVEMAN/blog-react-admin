import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Segmented, Space, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import {
  getNotificationList,
  getNotificationUnreadCount,
  readAllNotifications,
  readNotification,
} from '@/api/notification';
import {
  normalizeNotificationList,
  normalizeNotificationUnreadCount,
  NOTIFICATION_TYPE_COLOR_MAP,
  NOTIFICATION_TYPE_LABEL_MAP,
} from '@/config/notification';
import './index.less';

const SiteNotificationTab = () => {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);

  // 统计未读数量，直接驱动筛选按钮和操作状态
  const unreadCount = useMemo(
    () => list.filter((item) => String(item.status) === 'unread').length,
    [list]
  );

  const filteredList = useMemo(() => {
    if (filter === 'unread') {
      return list.filter((item) => String(item.status) === 'unread');
    }
    return list;
  }, [filter, list]);

  const loadList = async () => {
    try {
      setLoading(true);
      const [listRes, unreadRes] = await Promise.all([
        getNotificationList({ page: 1, pageSize: 50 }),
        getNotificationUnreadCount(),
      ]);
      const apiList = normalizeNotificationList(listRes);
      const apiUnreadCount = normalizeNotificationUnreadCount(unreadRes);
      setList(
        apiList.map((item) => ({
          ...item,
          status: item.status || 'unread',
          title: item.title || '系统通知',
          content: item.content || '',
        }))
      );
      // 当后端返回列表为空时，未读数仍由后端 authoritative 数据决定
      if (!apiList.length && apiUnreadCount > 0) {
        message.warning('检测到未读数大于 0，但列表为空，请检查分页或接口过滤条件');
      }
    } catch (_) {
      message.error('获取通知列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleReadOne = async (id) => {
    const prev = list;
    setList((current) =>
      current.map((item) => (item.id === id ? { ...item, status: 'read', readAt: new Date() } : item))
    );

    try {
      await readNotification(id);
    } catch (error) {
      setList(prev);
      message.error(error?.message || error?.msg || '标记已读失败');
    }
  };

  const handleReadAll = async () => {
    const prev = list;
    setList((current) => current.map((item) => ({ ...item, status: 'read', readAt: item.readAt || new Date() })));

    try {
      await readAllNotifications();
      message.success('已全部标记为已读');
    } catch (error) {
      setList(prev);
      message.error(error?.message || error?.msg || '全部已读失败');
    }
  };

  return (
    <div className="site-notification-tab">
      <Card
        title="站内通知"
        extra={
          <Space size={8}>
            <Segmented
              size="small"
              value={filter}
              onChange={setFilter}
              options={[
                { label: `全部 (${list.length})`, value: 'all' },
                { label: `未读 (${unreadCount})`, value: 'unread' },
              ]}
            />
            <Button size="small" onClick={handleReadAll} disabled={!unreadCount}>
              全部已读
            </Button>
            <Button size="small" onClick={loadList} loading={loading}>
              刷新
            </Button>
          </Space>
        }
      >
        {filteredList.length ? (
          <div className="notification-list">
            {filteredList.map((item) => {
              const isUnread = String(item.status) === 'unread';
              return (
                <div
                  key={item.id}
                  className={`notification-item ${isUnread ? 'is-unread' : 'is-read'}`}
                >
                  <div className="item-main">
                    <Space size={8} wrap>
                      <Tag color={NOTIFICATION_TYPE_COLOR_MAP[item.type] || 'default'}>
                        {NOTIFICATION_TYPE_LABEL_MAP[item.type] || item.type || '通知'}
                      </Tag>
                      <Typography.Text strong>{item.title}</Typography.Text>
                    </Space>

                    <Typography.Paragraph className="item-content" ellipsis={{ rows: 2 }}>
                      {item.content || '无内容'}
                    </Typography.Paragraph>

                    <Typography.Text type="secondary">
                      {dayjs(item.createdAt || item.createTime || Date.now()).format('YYYY-MM-DD HH:mm:ss')}
                    </Typography.Text>
                  </div>

                  <div className="item-actions">
                    <Button
                      type="link"
                      onClick={() => handleReadOne(item.id)}
                      disabled={!isUnread}
                    >
                      {isUnread ? '标记已读' : '已读'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty description="暂无通知" />
        )}
      </Card>
    </div>
  );
};

export default SiteNotificationTab;

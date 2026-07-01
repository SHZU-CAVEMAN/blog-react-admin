// 通知类型文案映射，用于前端统一展示
export const NOTIFICATION_TYPE_LABEL_MAP = {
  comment_new: '新评论',
  friendlink_apply: '友链申请',
};

// 通知类型颜色映射，用于 Tag 样式统一
export const NOTIFICATION_TYPE_COLOR_MAP = {
  comment_new: 'blue',
  friendlink_apply: 'gold',
};

// 兼容后端可能返回 data=[] 或 data.list=[] 两种结构
export const normalizeNotificationList = (res) => {
  const data = res?.data;
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.list)) {
    return data.list;
  }
  return [];
};

// 兼容后端可能返回 data={count} / data={unreadCount} / data=number
export const normalizeNotificationUnreadCount = (res) => {
  const raw = res?.data;
  const count = Number(raw?.count ?? raw?.unreadCount ?? raw ?? 0);
  return Number.isFinite(count) ? count : 0;
};

// 根据消息类型跳转到对应处理页
export const getNotificationTargetPath = (item) => {
  if (item?.sourceType === 'friendlink' || item?.type === 'friendlink_apply') {
    return '/friendLink';
  }
  return '/comment';
};

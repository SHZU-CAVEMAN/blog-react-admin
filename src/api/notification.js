import request from './request';

// 获取未读消息数量
export const getNotificationUnreadCount = () => {
  return request.get('/notifications/unread-count');
};
// 获取消息列表
export const getNotificationList = (params) => {
  return request.get('/notifications', { params });
};
// 标记消息为已读
export const readNotification = (id) => {
  return request.patch(`/notifications/${id}/read`);
};
// 标记所有消息为已读
export const readAllNotifications = () => {
  return request.patch('/notifications/read-all');
};

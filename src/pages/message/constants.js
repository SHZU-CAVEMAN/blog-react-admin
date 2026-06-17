export const CHANNEL_LABEL_MAP = {
  wechat: '微信',
  qq: 'QQ',
  email: '邮件',
};

export const CHANNEL_INITIAL_CONFIG = {
  wechat: {
    enabled: true,
    sendType: 'work-wechat-bot',
    endpoint: '',
    appId: '',
    secret: '',
  },
  qq: {
    enabled: false,
    sendType: 'group-bot',
    endpoint: '',
    appId: '',
    secret: '',
  },
  email: {
    enabled: true,
    sendType: 'smtp',
    endpoint: '',
    account: '',
    secret: '',
  },
};

export const CHANNEL_SEND_TYPE_OPTIONS = {
  wechat: [
    { label: 'Webhook 机器人', value: 'work-wechat-bot' },
    { label: '应用消息', value: 'app-message' },
  ],
  qq: [
    { label: '群机器人', value: 'group-bot' },
    { label: 'Webhook 网关', value: 'webhook-gateway' },
  ],
  email: [
    { label: 'SMTP', value: 'smtp' },
    { label: 'API 邮件网关', value: 'api-gateway' },
  ],
};

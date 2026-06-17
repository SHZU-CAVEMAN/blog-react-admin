import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import {
  CHANNEL_INITIAL_CONFIG,
  CHANNEL_LABEL_MAP,
  CHANNEL_SEND_TYPE_OPTIONS,
} from '../../constants';
import './index.less';

const getRequiredFields = (channelKey) => {
  if (channelKey === 'email') {
    return ['sendType', 'endpoint', 'account', 'secret'];
  }
  return ['sendType', 'endpoint', 'appId', 'secret'];
};

const getConfigProgress = (channelKey, config) => {
  const required = getRequiredFields(channelKey);
  const completed = required.filter((field) => String(config?.[field] || '').trim()).length;
  const percent = Math.round((completed / required.length) * 100);
  return {
    completed,
    total: required.length,
    percent,
  };
};

const PushChannelConfigTab = () => {
  const [channelForm] = Form.useForm();
  const [testForm] = Form.useForm();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingChannelKey, setEditingChannelKey] = useState('wechat');
  const [channelConfigs, setChannelConfigs] = useState(CHANNEL_INITIAL_CONFIG);

  const enabledCount = useMemo(
    () => Object.values(channelConfigs).filter((config) => config.enabled).length,
    [channelConfigs]
  );

  const completedCount = useMemo(
    () =>
      Object.entries(channelConfigs).filter(([channelKey, config]) => {
        const progress = getConfigProgress(channelKey, config);
        return progress.completed === progress.total;
      }).length,
    [channelConfigs]
  );

  const openConfigModal = (channelKey) => {
    const channelConfig = channelConfigs[channelKey] || {};
    setEditingChannelKey(channelKey);
    channelForm.setFieldsValue({
      sendType: channelConfig.sendType || '',
      endpoint: channelConfig.endpoint || '',
      appId: channelConfig.appId || '',
      account: channelConfig.account || '',
      secret: channelConfig.secret || '',
    });
    setConfigModalOpen(true);
  };

  const handleSaveChannelConfig = async () => {
    try {
      const values = await channelForm.validateFields();
      setChannelConfigs((prev) => ({
        ...prev,
        [editingChannelKey]: {
          ...prev[editingChannelKey],
          ...values,
        },
      }));
      setConfigModalOpen(false);
      message.success(`${CHANNEL_LABEL_MAP[editingChannelKey]}渠道配置已保存`);
    } catch (_) {
      // 表单校验失败时保持弹窗，不需要额外提示
    }
  };

  const handleToggleChannel = (channelKey, enabled) => {
    setChannelConfigs((prev) => ({
      ...prev,
      [channelKey]: {
        ...prev[channelKey],
        enabled,
      },
    }));
  };

  const handleTestSend = async () => {
    try {
      const values = await testForm.validateFields();
      if (!channelConfigs[values.channel]?.enabled) {
        message.warning(`当前${CHANNEL_LABEL_MAP[values.channel]}渠道未启用，请先启用后再测试`);
        return;
      }
      const progress = getConfigProgress(values.channel, channelConfigs[values.channel]);
      if (progress.completed < progress.total) {
        message.warning(`当前${CHANNEL_LABEL_MAP[values.channel]}配置不完整，请先完善渠道配置`);
        return;
      }
      message.success(`测试消息已投递到${CHANNEL_LABEL_MAP[values.channel]}（模拟）`);
      testForm.resetFields(['title', 'content', 'receiver']);
    } catch (_) {
      // 表单校验失败不额外提示
    }
  };

  const channelDataSource = useMemo(
    () =>
      Object.keys(channelConfigs).map((channelKey) => {
        const config = channelConfigs[channelKey] || {};
        const progress = getConfigProgress(channelKey, config);
        return {
          key: channelKey,
          channel: channelKey,
          enabled: config.enabled,
          sendType: config.sendType,
          endpoint: config.endpoint,
          progress,
        };
      }),
    [channelConfigs]
  );

  const channelColumns = [
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (value) => CHANNEL_LABEL_MAP[value],
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 120,
      render: (value, record) => (
        <Switch
          checked={value}
          checkedChildren="启用"
          unCheckedChildren="停用"
          onChange={(checked) => handleToggleChannel(record.channel, checked)}
        />
      ),
    },
    {
      title: '发送方式',
      dataIndex: 'sendType',
      key: 'sendType',
      width: 180,
      render: (value) => <Tag color="blue">{value || '未配置'}</Tag>,
    },
    {
      title: '配置完成度',
      dataIndex: 'progress',
      key: 'progress',
      width: 220,
      render: (value) => (
        <Progress
          percent={value.percent}
          size="small"
          format={() => `${value.completed}/${value.total}`}
        />
      ),
    },
    {
      title: '接口地址',
      dataIndex: 'endpoint',
      key: 'endpoint',
      render: (value) => value || '未配置',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => openConfigModal(record.channel)}>
          配置
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="push-channel-config-tab">
      <Alert
        showIcon
        type="info"
        message="前端配置页已支持渠道开关、配置完成度与测试发送，后续可直接对接后端接口。"
      />

      <Space size={12} wrap className="summary-row">
        <Tag color="green">已启用渠道：{enabledCount}/3</Tag>
        <Tag color="gold">已完成配置：{completedCount}/3</Tag>
      </Space>

      <Card title="推送渠道配置">
        <Table
          rowKey="key"
          dataSource={channelDataSource}
          columns={channelColumns}
          pagination={false}
        />
      </Card>

      <Card title="测试发送">
        <Form form={testForm} layout="vertical">
          <Space align="start" size={16} wrap className="test-top-fields">
            <Form.Item
              label="测试渠道"
              name="channel"
              rules={[{ required: true, message: '请选择测试渠道' }]}
              style={{ minWidth: 180 }}
            >
              <Select
                placeholder="请选择渠道"
                options={Object.keys(CHANNEL_LABEL_MAP).map((key) => ({
                  label: CHANNEL_LABEL_MAP[key],
                  value: key,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="接收人"
              name="receiver"
              rules={[{ required: true, message: '请输入接收人' }]}
              style={{ minWidth: 240 }}
            >
              <Input placeholder="如：openid / 群ID / 邮箱" />
            </Form.Item>
            <Form.Item
              label="标题"
              name="title"
              rules={[{ required: true, message: '请输入标题' }]}
              style={{ minWidth: 240 }}
            >
              <Input placeholder="请输入标题" />
            </Form.Item>
          </Space>

          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: '请输入消息内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入测试消息内容" />
          </Form.Item>

          <Button type="primary" onClick={handleTestSend}>
            发送测试
          </Button>
        </Form>
      </Card>

      <Modal
        title={`${CHANNEL_LABEL_MAP[editingChannelKey]}渠道配置`}
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        onOk={handleSaveChannelConfig}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={channelForm} layout="vertical">
          <Form.Item
            label="发送方式"
            name="sendType"
            rules={[{ required: true, message: '请选择发送方式' }]}
          >
            <Select
              placeholder="请选择发送方式"
              options={CHANNEL_SEND_TYPE_OPTIONS[editingChannelKey] || []}
            />
          </Form.Item>

          <Form.Item
            label="接口地址"
            name="endpoint"
            rules={[
              { required: true, message: '请输入接口地址' },
              { type: 'url', message: '请输入正确的 URL 地址' },
            ]}
          >
            <Input placeholder="请输入 Webhook 或网关地址" />
          </Form.Item>

          {editingChannelKey === 'email' ? (
            <Form.Item
              label="邮箱账号"
              name="account"
              rules={[{ required: true, message: '请输入邮箱账号' }]}
            >
              <Input placeholder="请输入邮箱账号" />
            </Form.Item>
          ) : (
            <Form.Item
              label="应用 ID"
              name="appId"
              rules={[{ required: true, message: '请输入应用 ID' }]}
            >
              <Input placeholder="请输入应用 ID" />
            </Form.Item>
          )}

          <Form.Item
            label={editingChannelKey === 'email' ? '授权码' : '密钥'}
            name="secret"
            rules={[{ required: true, message: '请输入密钥信息' }]}
          >
            <Input.Password placeholder="请输入密钥信息" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default PushChannelConfigTab;

import { useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import './index.less';

const { Text, Paragraph } = Typography;

const STATUS_OPTIONS = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '垃圾评论', value: 'spam' },
  { label: '已删除', value: 'deleted' },
];

const STATUS_COLOR_MAP = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  spam: 'default',
  deleted: 'default',
};

const MOCK_COMMENTS = [
  {
    id: 1,
    articleTitle: 'React 管理后台工程化实践',
    nickname: '前端小周',
    email: 'zhou@example.com',
    content: '文章很实用，尤其是目录组织部分。',
    status: 'pending',
    ip: '192.168.1.20',
    reply: '',
    createdAt: '2026-06-14 10:21:00',
  },
  {
    id: 2,
    articleTitle: 'Node.js 日志系统设计',
    nickname: 'Leo',
    email: 'leo@example.com',
    content: '建议补充一下日志切割策略。',
    status: 'approved',
    ip: '192.168.1.36',
    reply: '已收到，后续会补充。',
    createdAt: '2026-06-13 18:00:12',
  },
  {
    id: 3,
    articleTitle: '博客系统权限模型',
    nickname: '匿名用户',
    email: 'anonymous@demo.com',
    content: '这个方案太复杂了吧？？？',
    status: 'rejected',
    ip: '10.10.8.21',
    reply: '',
    createdAt: '2026-06-12 09:10:48',
  },
  {
    id: 4,
    articleTitle: 'React 管理后台工程化实践',
    nickname: '广告号',
    email: 'spam@spam.com',
    content: '点击链接领取大奖 http://spam.demo',
    status: 'spam',
    ip: '172.16.2.9',
    reply: '',
    createdAt: '2026-06-11 15:32:00',
  },
];

const Comment = () => {
  const [filterForm] = Form.useForm();
  const [dataSource, setDataSource] = useState(MOCK_COMMENTS);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [articleFilter, setArticleFilter] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const filteredData = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const normalizedArticle = articleFilter.trim().toLowerCase();

    return dataSource.filter((item) => {
      const keywordMatched =
        !normalizedKeyword ||
        [item.content, item.nickname, item.email]
          .some((field) => String(field || '').toLowerCase().includes(normalizedKeyword));

      const statusMatched = !statusFilter || item.status === statusFilter;

      const articleMatched =
        !normalizedArticle ||
        String(item.articleTitle || '').toLowerCase().includes(normalizedArticle);

      return keywordMatched && statusMatched && articleMatched;
    });
  }, [articleFilter, dataSource, keyword, statusFilter]);

  const resetFilters = () => {
    filterForm.resetFields();
    setKeyword('');
    setStatusFilter(undefined);
    setArticleFilter('');
  };

  const updateStatus = (ids, status) => {
    setDataSource((prev) =>
      prev.map((item) => (ids.includes(item.id) ? { ...item, status } : item))
    );
  };

  const handleDelete = (id) => {
    updateStatus([id], 'deleted');
    setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
    message.success('评论已软删除');
  };

  const handleBatchDelete = () => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择评论');
      return;
    }
    updateStatus(selectedRowKeys, 'deleted');
    setSelectedRowKeys([]);
    message.success('已软删除选中评论');
  };

  const columns = [
    {
      title: '文章标题',
      dataIndex: 'articleTitle',
      key: 'articleTitle',
      width: 140,
      render: (value) => (
        <Tooltip title={value}>
          <Text ellipsis style={{ maxWidth: '100%', display: 'inline-block' }}>
            {value}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '评论人',
      key: 'nickname',
      width: 130,
      render: (_, record) => (
        <div>
          <Tooltip title={record.nickname}>
            <Text ellipsis style={{ maxWidth: '100%', display: 'inline-block' }}>
              {record.nickname}
            </Text>
          </Tooltip>
          <div>
            <Tooltip title={record.email}>
              <Text type="secondary" ellipsis style={{ maxWidth: '100%', display: 'inline-block' }}>
                {record.email}
              </Text>
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      key: 'content',
      width: 220,
      render: (value) => (
        <Tooltip title={value}>
          <Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 2 }}>
            {value}
          </Paragraph>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (value) => {
        const option = STATUS_OPTIONS.find((item) => item.value === value);
        return <Tag color={STATUS_COLOR_MAP[value]}>{option?.label || value}</Tag>;
      },
    },
    {
      title: '评论时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size={0} direction="vertical">
          <Popconfirm
            title="确定软删除该评论吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDelete(record.id)}
            disabled={record.status === 'deleted'}
          >
            <Button type="link" danger disabled={record.status === 'deleted'}>
              {record.status === 'deleted' ? '已删除' : '删除'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="comment-page">
      <Form form={filterForm} layout="vertical">
        <Space align="start" size={16} wrap className="filter-row">
          <Form.Item label="关键词" name="keyword" style={{ minWidth: 220 }}>
            <Input
              allowClear
              placeholder="评论内容 / 评论人 / 邮箱"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </Form.Item>

          <Form.Item label="文章标题" name="articleTitle" style={{ minWidth: 220 }}>
            <Input
              allowClear
              placeholder="按文章标题筛选"
              onChange={(event) => setArticleFilter(event.target.value)}
            />
          </Form.Item>

          <Form.Item label="审核状态" name="status" style={{ minWidth: 180 }}>
            <Select
              allowClear
              placeholder="全部状态"
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
            />
          </Form.Item>

          <Form.Item label=" " style={{ minWidth: 120 }}>
            <Button onClick={resetFilters}>重置</Button>
          </Form.Item>
        </Space>
      </Form>

      <Space wrap className="batch-row">
        <Button danger onClick={handleBatchDelete}>
          批量软删除
        </Button>
        <Text type="secondary">当前选中 {selectedRowKeys.length} 条</Text>
      </Space>

      <Table
        rowKey="id"
        bordered
        className="comment-table"
        dataSource={filteredData}
        columns={columns}
        tableLayout="fixed"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          columnWidth: 36,
        }}
        pagination={{
          pageSize: 8,
          showQuickJumper: true,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条评论`,
        }}
      />

    </div>
  );
};

export default Comment;
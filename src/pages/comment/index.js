import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { getAllCommentList } from '@/api/comment';
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

const Comment = () => {
  const [filterForm] = Form.useForm();
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [articleFilter, setArticleFilter] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const normalizeStatus = useCallback((status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (!normalized) {
      return 'pending';
    }
    if (['enable', 'enabled', 'approved', 'pass', 'passed'].includes(normalized)) {
      return 'approved';
    }
    if (['disable', 'disabled', 'deleted', 'delete', 'removed'].includes(normalized)) {
      return 'deleted';
    }
    if (['reject', 'rejected', 'refused'].includes(normalized)) {
      return 'rejected';
    }
    if (['spam', 'garbage', 'junk'].includes(normalized)) {
      return 'spam';
    }
    if (['pending', 'wait', 'waiting', 'review'].includes(normalized)) {
      return 'pending';
    }
    return normalized;
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllCommentList();
      const items = Array.isArray(res?.data) ? res.data : [];
      const normalized = items
        .map((item) => ({
          id: item.id,
          articleTitle: item.articleTitle || item.article_title || item.title || '-',
          nickname: item.nickname || item.name || '匿名用户',
          email: item.email || '-',
          content: item.content || item.comment_content || '',
          status: normalizeStatus(item.status),
          createdAt:
            item.createdAt ||
            item.comment_time ||
            item.commentTime ||
            item.create_time ||
            item.created_at ||
            '',
        }))
        .filter((item) => item.id !== undefined && item.id !== null)
        .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
      setDataSource(normalized);
    } catch (error) {
      message.error(error?.message || error?.msg || '获取评论列表失败，请稍后重试');
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  }, [normalizeStatus]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

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
      <Form form={filterForm} layout="inline">
        <Space align="center" size={16} className="filter-row">
          <Form.Item name="keyword" style={{ minWidth: 220 }}>
            <Input
              allowClear
              placeholder="评论内容 / 评论人 / 邮箱"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </Form.Item>

          <Form.Item name="articleTitle" style={{ minWidth: 220 }}>
            <Input
              allowClear
              placeholder="按文章标题筛选"
              onChange={(event) => setArticleFilter(event.target.value)}
            />
          </Form.Item>

          <Form.Item name="status" style={{ minWidth: 180 }}>
            <Select
              allowClear
              placeholder="全部状态"
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
            />
          </Form.Item>

          <Form.Item style={{ minWidth: 88 }}>
            <Button onClick={resetFilters}>重置</Button>
          </Form.Item>

          <Form.Item style={{ minWidth: 108 }}>
            <Button danger onClick={handleBatchDelete}>
              批量软删除
            </Button>
          </Form.Item>
        </Space>
      </Form>

      <Space wrap className="batch-row">
        <Text type="secondary">当前选中 {selectedRowKeys.length} 条</Text>
      </Space>

      <Table
        rowKey="id"
        bordered
        loading={loading}
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
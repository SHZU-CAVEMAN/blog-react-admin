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
import { deleteCommentById, getAllCommentList } from '@/api/comment';
import './index.less';

const { Text, Paragraph } = Typography;


const Comment = () => {
  const [filterForm] = Form.useForm();
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [articleFilter, setArticleFilter] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // 获取评论列表
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllCommentList();
      const items = Array.isArray(res?.data) ? res.data : [];
      // 规范化数据，过滤掉没有id的脏数据，并按评论时间降序排序
      const normalized = items
        .map((item) => ({
          id: item.id,
          articleTitle: item.title,
          nickname: item.nickname,
          email: item.email,
          content: item.content,
          status: String(item.status || '').trim().toLowerCase() === 'enable' ? 'enable' : 'disable',
          createdAt: item.comment_time || '',
        }))
        .filter((item) => item.id !== undefined && item.id !== null)
        .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
      // 赋值给 dataSource  
      setDataSource(normalized);
    } catch (error) {
      message.error(error?.message || error?.msg || '获取评论列表失败，请稍后重试');
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 根据筛选条件过滤数据
  const filteredData = useMemo(() => {

    const normalizedKeyword = keyword.trim().toLowerCase(); // 关键词
    const normalizedArticle = articleFilter.trim().toLowerCase(); // 文章标题

    return dataSource.filter((item) => {
      // 关键词匹配：评论内容、评论人昵称、评论人邮箱
      const keywordMatched =
        !normalizedKeyword ||
        [item.content, item.nickname, item.email]
          .some((field) => String(field || '').toLowerCase().includes(normalizedKeyword));
      // 状态匹配：启用/禁用
      const statusMatched = !statusFilter || item.status === statusFilter;
      // 文章标题匹配
      const articleMatched =
        !normalizedArticle ||
        String(item.articleTitle || '').toLowerCase().includes(normalizedArticle);

      return keywordMatched && statusMatched && articleMatched;
    });
  }, [articleFilter, dataSource, keyword, statusFilter]);

  // 重置筛选条件
  const resetFilters = () => {
    filterForm.resetFields();
    setKeyword('');
    setStatusFilter(undefined);
    setArticleFilter('');
  };
  // 单个删除
  const handleDelete = async (id) => {
    try {
      await deleteCommentById(id);
      // 更新 dataSource，移除已删除的评论（只是软删除）
      setDataSource((prev) => prev.filter((item) => item.id !== id));
      setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
      message.success('评论已删除');
    } catch (error) {
      message.error(error?.message || error?.msg || '删除评论失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择评论');
      return;
    }

    try {
      await Promise.all(selectedRowKeys.map((id) => deleteCommentById(id)));
      // 更新 dataSource，移除已删除的评论（只是软删除）
      setDataSource((prev) => prev.filter((item) => !selectedRowKeys.includes(item.id)));
      setSelectedRowKeys([]);
      message.success('已删除选中评论');
    } catch (error) {
      message.error(error?.message || error?.msg || '批量删除评论失败');
    }
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
        const isEnabled = String(value || '').trim().toLowerCase() === 'enable';
        return <Tag color={isEnabled ? 'green' : 'default'}>{isEnabled ? '启用' : '禁用'}</Tag>;
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
            title="确定删除该评论吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDelete(record.id)}
            disabled={record.status === 'disable'}
          >
            <Button type="link" danger>
              删除
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
              options={[
                { label: '启用', value: 'enable' },
                { label: '禁用', value: 'disable' },
              ]}
              onChange={setStatusFilter}
            />
          </Form.Item>

          <Form.Item style={{ minWidth: 88 }}>
            <Button onClick={resetFilters}>重置</Button>
          </Form.Item>

          <Form.Item style={{ minWidth: 108 }}>
            <Button danger onClick={handleBatchDelete}>
              批量删除
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
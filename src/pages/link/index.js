import { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Input, Popconfirm, Row, Select, Space, Table, Tag, message } from 'antd';
import {
  createFriendlink,
  deleteFriendlink,
  getFriendlinkList,
  updateFriendlink,
} from '@/api/friendlink';
import { getFriendlinkCategoryList } from '@/api/friendlinkCategory';

const Link = () => {
  const [form] = Form.useForm();
  const [keyword, setKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState(undefined);
  const [dataSource, setDataSource] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    fetchCategoryList();
    fetchFriendlinkList();
  }, []);//  keep-alive 让组件不卸载，从而 [] 的 effect 不会重新跑，不会再请求。

  // 请求友链分类
  // 仅首次加载时请求，后续切回复用缓存，避免重复请求
  const fetchCategoryList = async () => {
    try {
      const res = await getFriendlinkCategoryList();
      const list = Array.isArray(res?.data) ? res.data : [];
      const options = list
        .filter((item) => String(item.status || '').toLowerCase() !== 'disabled')
        .map((item) => ({
          label: item.name,
          value: Number(item.id),
        }));
      setCategoryOptions(options);
    } catch (error) {
      message.error(error?.message || error?.msg || '获取友链分类失败');
      setCategoryOptions([]);
    }
  };
  // 请求友链数据
  // 每次增删改后刷新列表，保持数据最新
  const fetchFriendlinkList = async () => {
    try {
      setListLoading(true);
      const res = await getFriendlinkList();
      const list = Array.isArray(res?.data) ? res.data : [];
      setDataSource(
        list.map((item) => ({
          ...item,
          id: Number(item.id),
          friendlink_category_id: Number(item.friendlink_category_id),
          category_name: item.category_name || '',
          status: item.status || 'enabled',
        }))
      );
    } catch (error) {
      message.error(error?.message || error?.msg || '获取友链列表失败');
      setDataSource([]);
    } finally {
      setListLoading(false);
    }
  };
  // 判断是否为生成的变体图片（如缩略图、不同尺寸等），通过文件名规则判断是否存在原图
  const filteredData = useMemo(() => {
    const nextKeyword = keyword.trim().toLowerCase();
    return dataSource.filter((item) => {
      const keywordMatched = !nextKeyword || [item.name, item.category_name, item.url, item.description]
        .some((field) => String(field || '').toLowerCase().includes(nextKeyword));
      const categoryMatched = !filterCategory || Number(item.friendlink_category_id) === Number(filterCategory);
      return keywordMatched && categoryMatched;
    });
  }, [dataSource, filterCategory, keyword]);

  // 规范化状态值，兼容接口返回的状态值不规范的情况
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        name: values.name,
        friendlinkCategoryId: Number(values.friendlinkCategoryId),
        url: values.url,
        description: values.description,
        status: values.status,
      };

      if (editingId) {
        await updateFriendlink(editingId, payload);
        message.success('友链已更新');
      } else {
        await createFriendlink(payload);
        message.success('友链已新增');
      }

      form.resetFields();
      form.setFieldValue('status', 'enabled');
      setEditingId(null);
      await fetchFriendlinkList();
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || error?.msg || '提交失败');
      }
    } finally {
      setSubmitting(false);
    }
  };
  // 编辑友链：将数据填入表单，切换到编辑模式
  const handleEdit = (record) => {
    form.setFieldsValue({
      name: record.name,
      friendlinkCategoryId: Number(record.friendlink_category_id),
      url: record.url,
      description: record.description,
      status: record.status || 'enabled',
    });
    setEditingId(record.id);
  };
  // 删除友链
  const handleDelete = async (record) => {
    try {
      await deleteFriendlink(record.id);
      message.success('友链已删除');
      if (editingId === record.id) {
        form.resetFields();
        form.setFieldValue('status', 'enabled');
        setEditingId(null);
      }
      await fetchFriendlinkList();
    } catch (error) {
      message.error(error?.message || error?.msg || '删除失败');
    }
  };

  // 重置表单 
  const handleReset = () => {
    form.resetFields();
    form.setFieldValue('status', 'enabled');
    setEditingId(null);
  };

  useEffect(() => {
    form.setFieldValue('status', 'enabled');
  }, [form]);

  return (
    <div>
      <Form form={form} layout="vertical" style={{ marginBottom: 12 }}>
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} lg={6}>
            <Form.Item
              name="name"
              label="友链名称"
              rules={[{ required: true, message: '请输入友链名称' }]}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="请输入友链名称" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={5}>
            <Form.Item
              name="friendlinkCategoryId"
              label="分类"
              rules={[{ required: true, message: '请选择分类' }]}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={categoryOptions}
                placeholder="请选择分类"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={24} lg={9}>
            <Form.Item
              name="url"
              label="友链地址"
              rules={[
                { required: true, message: '请输入友链地址' },
                { type: 'url', message: '请输入正确的 URL 地址' },
              ]}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="https://example.com" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <Form.Item
              name="status"
              label="状态"
              initialValue="enabled"
              rules={[{ required: true, message: '请选择状态' }]}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={[
                  { label: 'enabled', value: 'enabled' },
                  { label: 'disabled', value: 'disabled' },
                ]}
                placeholder="请选择状态"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="description"
              label="说明"
              rules={[{ required: true, message: '请输入说明' }]}
              style={{ marginBottom: 0 }}
            >
              <Input.TextArea
                placeholder="请输入友链说明"
                rows={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Space style={{ marginTop: 12, marginBottom: 6 }} wrap>
          <Button type="primary" onClick={handleSubmit}>
            {submitting ? '提交中...' : (editingId ? '更新' : '新增')}
          </Button>
          <Button onClick={handleReset}>清空</Button>
          <Select
            allowClear
            value={filterCategory}
            onChange={setFilterCategory}
            placeholder="按分类查询"
            options={categoryOptions}
            style={{ width: 180 }}
          />
          <Input
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="按名称、分类、地址、说明查询"
            style={{ width: 260 }}
          />
        </Space>
      </Form>

      <Table
        rowKey="id"
        dataSource={filteredData}
        loading={listLoading}
        bordered
        pagination={{
          pageSize: 8,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      >
        <Table.Column title="友链名称" dataIndex="name" key="name" width={180} />
        <Table.Column title="分类" dataIndex="category_name" key="category_name" width={140} />
        <Table.Column
          title="友链地址"
          dataIndex="url"
          key="url"
          render={(value) => (
            <a href={value} target="_blank" rel="noreferrer">{value}</a>
          )}
        />
        <Table.Column title="说明" dataIndex="description" key="description" />
        <Table.Column
          title="状态"
          dataIndex="status"
          key="status"
          width={120}
          render={(value) => (
            <Tag color={value === 'enabled' ? 'green' : 'default'}>{value}</Tag>
          )}
        />
        <Table.Column
          title="操作"
          key="action"
          width={160}
          render={(_, record) => (
            <Space>
              <Button type="link" onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确定删除这条友链吗？"
                okText="确定"
                cancelText="取消"
                onConfirm={() => handleDelete(record)}
              >
                <Button type="link" danger>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          )}
        />
      </Table>
    </div>
  );
};

export default Link;
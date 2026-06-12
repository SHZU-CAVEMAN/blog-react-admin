import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, InputNumber, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import {
  createFriendlinkCategory,
  deleteFriendlinkCategory,
  getFriendlinkCategoryList,
  updateFriendlinkCategory,
} from '@/api/friendlinkCategory';

const LinkCategory = () => {
    const normalizeStatus = (value) => (String(value || '').toLowerCase() === 'disabled' ? 'disabled' : 'enabled');

  const [form] = Form.useForm();
  const [keyword, setKeyword] = useState('');
  const [dataSource, setDataSource] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategoryList = useCallback(async () => {
    try {
      setListLoading(true);
      const res = await getFriendlinkCategoryList();
      const list = Array.isArray(res?.data) ? res.data : [];
      setDataSource(
        list.map((item) => ({
          ...item,
          id: Number(item.id),
          sort_order: Number(item.sort_order ?? 100),
          status: normalizeStatus(item.status),
        }))
      );
    } catch (error) {
      message.error(error?.message || error?.msg || '获取友链分类失败');
      setDataSource([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoryList();
  }, [fetchCategoryList]);

  const filteredData = useMemo(() => {
    const nextKeyword = keyword.trim().toLowerCase();
    return dataSource.filter((item) => {
      if (!nextKeyword) {
        return true;
      }
      return [item.name, item.slug, item.sort_order, item.status]
        .some((field) => String(field || '').toLowerCase().includes(nextKeyword));
    });
  }, [dataSource, keyword]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        name: values.name,
        slug: values.slug,
        sortOrder: Number(values.sortOrder ?? 100),
        status: normalizeStatus(values.status),
      };

      if (editingId) {
        await updateFriendlinkCategory(editingId, payload);
        message.success('友链分类已更新');
      } else {
        await createFriendlinkCategory(payload);
        message.success('友链分类已新增');
      }

      form.resetFields();
      form.setFieldValue('status', 'enabled');
      form.setFieldValue('sortOrder', 100);
      setEditingId(null);
      await fetchCategoryList();
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || error?.msg || '提交失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record) => {
    form.setFieldsValue({
      name: record.name,
      slug: record.slug,
      sortOrder: Number(record.sort_order ?? 100),
      status: normalizeStatus(record.status),
    });
    setEditingId(record.id);
  };

  const handleDelete = async (record) => {
    try {
      await deleteFriendlinkCategory(record.id);
      message.success('友链分类已删除');
      if (editingId === record.id) {
        form.resetFields();
        form.setFieldValue('status', 'enabled');
        form.setFieldValue('sortOrder', 100);
        setEditingId(null);
      }
      await fetchCategoryList();
    } catch (error) {
      message.error(error?.message || error?.msg || '删除失败');
    }
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldValue('status', 'enabled');
    form.setFieldValue('sortOrder', 100);
    setEditingId(null);
  };

  useEffect(() => {
    form.setFieldValue('status', 'enabled');
    form.setFieldValue('sortOrder', 100);
  }, [form]);

  return (
    <div>
      <Form form={form} layout="vertical">
        <Space align="start" style={{ display: 'flex', marginBottom: 16 }} size={16} wrap>
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
            style={{ minWidth: 220 }}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="slug"
            rules={[{ required: true, message: '请输入 slug' }]}
            style={{ minWidth: 220 }}
          >
            <Input placeholder="例如：dev-tools" />
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label="排序"
            rules={[{ required: true, message: '请输入排序值' }]}
            initialValue={100}
            style={{ width: 140 }}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            initialValue="enabled"
            rules={[{ required: true, message: '请选择状态' }]}
            style={{ width: 140 }}
          >
            <Select
              options={[
                { label: 'enabled', value: 'enabled' },
                { label: 'disabled', value: 'disabled' },
              ]}
            />
          </Form.Item>
        </Space>

        <Space style={{ marginBottom: 16 }} wrap>
          <Button type="primary" onClick={handleSubmit}>
            {submitting ? '提交中...' : (editingId ? '更新' : '新增')}
          </Button>
          <Button onClick={handleReset}>清空</Button>
          <Input
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="按分类名称、slug、状态查询"
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
        <Table.Column title="分类名称" dataIndex="name" key="name" width={180} />
        <Table.Column title="slug" dataIndex="slug" key="slug" />
        <Table.Column title="排序" dataIndex="sort_order" key="sort_order" width={120} />
        <Table.Column
          title="状态"
          dataIndex="status"
          key="status"
          width={120}
          render={(value) => (
            <Tag color={normalizeStatus(value) === 'enabled' ? 'green' : 'default'}>{normalizeStatus(value)}</Tag>
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
                title="确定删除这条分类吗？"
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

export default LinkCategory;
import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Popconfirm, Select, Space, Table, Tag, message } from 'antd';

const STORAGE_KEY = 'friendLinkList';

const DEFAULT_LINKS = [
  {
    id: 1,
    name: 'GitHub',
    category: '开发',
    url: 'https://github.com',
    description: '开源代码托管平台',
    status: 'enabled',
  },
  {
    id: 2,
    name: '掘金',
    category: '社区',
    url: 'https://juejin.cn',
    description: '开发者内容社区',
    status: 'enabled',
  },
];

const Link = () => {
  const [form] = Form.useForm();
  const [keyword, setKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState(undefined);
  const [dataSource, setDataSource] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LINKS));
      setDataSource(DEFAULT_LINKS);
      return;
    }

    try {
      const parsed = JSON.parse(cached);
      setDataSource(Array.isArray(parsed) ? parsed : DEFAULT_LINKS);
    } catch (error) {
      setDataSource(DEFAULT_LINKS);
    }
  }, []);

  const persistLinks = (list) => {
    setDataSource(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(
      dataSource
        .map((item) => String(item.category || '').trim())
        .filter(Boolean)
    ));
    return categories.map((item) => ({ label: item, value: item }));
  }, [dataSource]);

  const filteredData = useMemo(() => {
    const nextKeyword = keyword.trim().toLowerCase();
    return dataSource.filter((item) => {
      const keywordMatched = !nextKeyword || [item.name, item.category, item.url, item.description]
        .some((field) => String(field || '').toLowerCase().includes(nextKeyword));
      const categoryMatched = !filterCategory || item.category === filterCategory;
      return keywordMatched && categoryMatched;
    });
  }, [dataSource, filterCategory, keyword]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const nextItem = {
        name: values.name,
        category: values.category,
        url: values.url,
        description: values.description,
        status: values.status,
      };

      if (editingId) {
        const nextList = dataSource.map((item) => (
          item.id === editingId ? { ...item, ...nextItem } : item
        ));
        persistLinks(nextList);
        message.success('友链已更新');
      } else {
        const nextList = [
          ...dataSource,
          {
            id: Date.now(),
            ...nextItem,
          },
        ];
        persistLinks(nextList);
        message.success('友链已新增');
      }

      form.resetFields();
      form.setFieldValue('category', undefined);
      form.setFieldValue('status', 'enabled');
      setEditingId(null);
    } catch (error) {
      // 表单校验失败时不额外处理
    }
  };

  const handleEdit = (record) => {
    form.setFieldsValue(record);
    setEditingId(record.id);
  };

  const handleDelete = (record) => {
    const nextList = dataSource.filter((item) => item.id !== record.id);
    persistLinks(nextList);
    if (editingId === record.id) {
      form.resetFields();
      form.setFieldValue('category', undefined);
      form.setFieldValue('status', 'enabled');
      setEditingId(null);
    }
    message.success('友链已删除');
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldValue('category', undefined);
    form.setFieldValue('status', 'enabled');
    setEditingId(null);
  };

  useEffect(() => {
    form.setFieldValue('status', 'enabled');
  }, [form]);

  return (
    <div>
      <Form form={form} layout="vertical">
        <Space align="start" style={{ display: 'flex', marginBottom: 16 }} size={16} wrap>
          <Form.Item
            name="name"
            label="友链名称"
            rules={[{ required: true, message: '请输入友链名称' }]}
            style={{ minWidth: 220 }}
          >
            <Input placeholder="请输入友链名称" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请输入分类' }]}
            style={{ minWidth: 180 }}
          >
            <Input placeholder="例如：开发 / 社区" />
          </Form.Item>
          <Form.Item
            name="url"
            label="友链地址"
            rules={[
              { required: true, message: '请输入友链地址' },
              { type: 'url', message: '请输入正确的 URL 地址' },
            ]}
            style={{ minWidth: 320 }}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            initialValue="enabled"
            rules={[{ required: true, message: '请选择状态' }]}
            style={{ minWidth: 160 }}
          >
            <Input placeholder="enabled / disabled" />
          </Form.Item>
        </Space>

        <Form.Item
          name="description"
          label="说明"
          rules={[{ required: true, message: '请输入说明' }]}
        >
          <Input.TextArea placeholder="请输入友链说明" rows={3} />
        </Form.Item>

        <Space style={{ marginBottom: 16 }} wrap>
          <Button type="primary" onClick={handleSubmit}>
            {editingId ? '更新' : '新增'}
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
        bordered
        pagination={{
          pageSize: 8,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      >
        <Table.Column title="友链名称" dataIndex="name" key="name" width={180} />
        <Table.Column title="分类" dataIndex="category" key="category" width={120} />
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
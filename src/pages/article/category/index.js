import { Space, Table, Tag, Button, Form, Input,Popconfirm} from 'antd';
import { useState,useEffect } from 'react';
import { 
  getCategoryList,
  addCategory,
  updateCategory,
  deleteCategory
} from '@/api/category'
const { Column } = Table;

const ArticleCategory = () => {
  const [dataSource, setDataSource] = useState([]);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);  //  当前是否在编辑

  useEffect(() => {
    fetchList();
  }, []); //空数组表示 只在第一次加载时执行一次
  
  const fetchList = async () => {
    const res = await getCategoryList();
    //console.log(res)
    const list = res.data.map(item =>({
      ...item,
      //key:item.id, // ?
    }))
    setDataSource(list);
  };
  
  // 提交（新增 + 编辑）
  const handleSubmit = () => {
    form.validateFields().then(values => {
      // 处理 tags
      const newValues = {
        ...values,
        tags: values.tags ? values.tags.split(',') : [],
      };

      if (editingKey) {
        // 编辑
        setDataSource(prev =>
          prev.map(item =>
            item.key === editingKey ? { ...item, ...newValues } : item
          )
        );
      } else {
        // 新增
        setDataSource(prev => [
          ...prev,
          {
            key: Date.now().toString(),
            ...newValues,
          },
        ]);
      }
      // 清空
      form.resetFields();
      setEditingKey(null);
    });
  };

  //  编辑（回填核心）
  const handleEdit = (record) => {
    form.setFieldsValue({
      ...record,
    });
    setEditingKey(record.key);
  };

  //  删除
  const handleDelete = (key) => {
    setDataSource(prev => prev.filter(item => item.key !== key));
  };

  return (
    <>
      {/*  上方表单（一行两个） */}
      <Form form={form} layout="inline">
        <Form.Item
          name="name"
          label="分类"
          rules={[{ required: true, message: '请输入分类' }]}
        >
          <Input placeholder="请输入分类" />
        </Form.Item>

        <Form.Item
          name="number"
          label="数量"
          rules={[{ required: true, message: '请输入数量' }]}
        >
          <Input placeholder="请输入数量" disabled/>
        </Form.Item>

        <Form.Item
          name="intro"
          label="说明"
          rules={[{ required: true, message: '请输入说明' }]}
        >
          <Input placeholder="请输入说明" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" onClick={handleSubmit}>
            {editingKey ? '更新' : '新增'}
          </Button>
        </Form.Item>
      </Form>

      {/*  表格 */}
      <Table 
        dataSource={dataSource} 
        bordered 
        size="small" 
        style={{ marginTop: 8 }}
        pagination={{
          pageSize: 8,          // 每页条数
          showSizeChanger: false, // 不允许用户修改每页数量
          showQuickJumper: true, // 可输入页码跳转
        }}
      >
        <Column title="分类" dataIndex="name" key="name" />
        <Column title="数量" dataIndex="number" key="number" />
        <Column title="说明" dataIndex="intro" key="intro" />
        <Column
          title="操作"
          key="action"
          render={(_, record) => (
            <Space>
              <Button type="link" onClick={() => handleEdit(record)}>
                编辑
              </Button>

              <Popconfirm
                title="确定删除这条数据吗？"
                onConfirm={() => handleDelete(record.key)}
                okText="确定"
                cancelText="取消"
              >
                  <Button type="link" danger>
                    删除
                  </Button>
              </Popconfirm>
           
            </Space>
          )}
        />
      </Table>
    </>
  );
};

export default ArticleCategory;
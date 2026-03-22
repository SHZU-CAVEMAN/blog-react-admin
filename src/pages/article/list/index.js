import { Space, Table, Button, Form, Input,Popconfirm,DatePicker,Row,Col} from 'antd';
import { useState,useEffect } from 'react';
import dayjs from 'dayjs';
import { 
  getArticleList,
} from '@/api/article'
const { Column } = Table;

const ArticleList = () => {
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState([]);
  const [editingKey, setEditingKey] = useState(null);  //  当前是否在编辑

  useEffect(() => {
    fetchList();
  }, []); //空数组表示 只在第一次加载时执行一次
  
  const fetchList = async () => {
    const res = await getArticleList();
    console.log(res)
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
        publish_time: values.publish_time
          ? values.publish_time.format('YYYY/MM/DD')
          : '',
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
      publish_time: record.publish_time
        ? dayjs(record.publish_time)
        : null,
    });
    setEditingKey(record.key);
  };

  //  删除
  const handleDelete = (key) => {
    setDataSource(prev => prev.filter(item => item.key !== key));
  };

  return (
    <div data-color-mode="light">
      {/*  上方表单（一行两个） */}
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="文章名"
              rules={[{ required: true, message: '请输入文章名' }]}
            >
              <Input placeholder="请输入文章名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="category_name"
              label="分类名"
              rules={[{ required: true, message: '请输入分类' }]}
            >
              <Input placeholder="请输入分类名"/>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="intro"
              label="说明"
              rules={[{ required: true, message: '请输入说明' }]}
            >
              <Input placeholder="请输入说明" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
                name="publish_time"
                label="发表时间"
              >
                <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

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
        <Column title="文章名" dataIndex="name" key="name" />
        <Column title="分类名" dataIndex="category_name" key="category_name" />
        <Column title="说明" dataIndex="intro" key="intro" />
        <Column title="发表时间" dataIndex="publish_time" key="publish_time" />
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
    </div>
  );
};

export default ArticleList;

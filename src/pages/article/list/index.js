import { Space, Table, Button, Form, Popconfirm, Collapse } from 'antd';
import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getArticleList} from '@/api/article'
import { getCategoryList} from '@/api/category'
import ArticleBaseFields from '@/components/ArticleBaseFields';
const { Column } = Table;

const ArticleList = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState([]); // 文章列表
  const [editingKey, setEditingKey] = useState(null);  //  当前是否在编辑
  const [categoryData, setCategoryData] = useState([]); // 分类 options

  useEffect(() => {
    fetchList();
  }, []); //空数组表示 只在第一次加载时执行一次
  
  const fetchList = async () => {
    const category = await getCategoryList();
    const categoryData = category.data.map(item => ({
      value: String(item.id),
      label: item.name,
    }));

    setCategoryData(categoryData)
    const res = await getArticleList();
    const list = res.data.map(item =>({
      ...item,
      key: item.id,
    }));
    setDataSource(list);
  };
  
  // 提交（新增 + 编辑）
  const handleSubmit = () => {
    form.validateFields().then(values => {
      const categoryLabel = categoryData.find(item => item.value === values.category_id)?.label || '';
      const newValues = {
        ...values,
        category_name: categoryLabel,
        publish_time: values.publish_time
          ? values.publish_time.format('YYYY/MM/DD')
          : '',
      };
      setDataSource(prev =>
        prev.map(item =>
          item.key === editingKey ? { ...item, ...newValues } : item
        )
      );
      // 清空
      form.resetFields();
      setEditingKey(null);
    });
  };

  //  编辑（回填核心）
  const handleEdit = (record) => {
    console.log('编辑文章：', record);

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

  // 跳转到正文编辑页面
  const handleEditContent = (record) => {
    const articleId = record.id || record.key;
    navigate(`/article/create?mode=edit&id=${articleId}`);
  };

  return (
    <div data-color-mode="light">
      <Collapse
        defaultActiveKey={['1']}
        items={[
          {
            key: '1',
            label: '文章列表 操作说明',
            children: <p>本页面可修改文章的基本信息，并且可以删除不需要的文章记录。</p>,
          },
        ]}
        style={{ marginBottom: 16 }}
      />
      {/*  上方表单（一行两个） */}
      <Form form={form} layout="vertical">
        <ArticleBaseFields categoryOptions={categoryData} />

        <Form.Item style={{ marginTop: 16, marginBottom: 16, textAlign: 'right' }}>
          <Button 
            type="primary" 
            onClick={handleSubmit}
          >
                更新
          </Button>
        </Form.Item>
      </Form>
      
      {/*  表格——文章列表 */}
      <Table 
        dataSource={dataSource} 
        bordered 
        size="small" 
        pagination={{
          pageSize: 8,          // 每页条数
          showSizeChanger: false, // 不允许用户修改每页数量
          showQuickJumper: true, // 可输入页码跳转
        }}
      >
        <Column title="文章名" dataIndex="name" key="name" width={200} />
        <Column title="分类名" dataIndex="category_name" key="category_name" width={80} />
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

              <Button type="link" onClick={() => handleEditContent(record)}>
                修改正文
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

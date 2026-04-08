import { Space, Table, Button, Form, Popconfirm, message } from 'antd';
import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getArticleList,updateArticle} from '@/api/article'
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
    try {
      // 分类信息
      const category = await getCategoryList();
      const categoryItems = Array.isArray(category?.data) ? category.data : [];
      const categoryData = categoryItems.map(item => ({
        value: String(item.id),
        label: item.name,
      }));
      setCategoryData(categoryData);

      // 文章信息
      const res = await getArticleList();
      const articleItems = Array.isArray(res?.data) ? res.data : [];
      
      const list = articleItems
        .map(item => ({
          ...item,
          title: item.title || item.name || '',
          categoryId: item.categoryId || item.category_id ? String(item.categoryId || item.category_id) : undefined,
          categoryName: item.categoryName || item.category_name || '',
          summary: item.summary || item.intro || '',
          publishTime: item.publishTime || item.publish_time || '',
          key: item.id,
        }))
        .sort((a, b) => Number(b.id || b.key || 0) - Number(a.id || a.key || 0));
      console.log("文章信息：", res);
      setDataSource(list);
    } catch (error) {
      message.error(error?.msg || '获取文章列表失败，请稍后重试');
      setDataSource([]);
    }
  };
  
  // 提交（新增 + 编辑）
  const handleSubmit = () => {
    form.validateFields().then(async values => {
      const categoryLabel = categoryData.find(item => item.value === values.categoryId)?.label || '';
      const newValues = {
        ...values,
        categoryName: categoryLabel,
        publishTime: values.publishTime
          ? values.publishTime.format('YYYY/MM/DD')
          : '',
      };
      await updateArticle({
        ...newValues,
        id: editingKey,
      });
       message.success('文章信息已更新');
      // 更新 table
      setDataSource(prev =>
        prev.map(item =>
          item.key === editingKey ? { ...item, ...newValues } : item
        )
      );
      // 清空 表单
      form.resetFields();
      setEditingKey(null);
    });
  };

  //  编辑（回填核心）
  const handleEdit = (record) => {
    console.log('编辑文章：', record);

    form.setFieldsValue({
      ...record,
      publishTime: record.publishTime
        ? dayjs(record.publishTime)
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
        <Column title="文章名" dataIndex="title" key="title" width={200} />
        <Column title="分类名" dataIndex="categoryName" key="categoryName" width={80} />
        <Column title="说明" dataIndex="summary" key="summary" />
        <Column title="发表时间" dataIndex="publishTime" key="publishTime" />
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

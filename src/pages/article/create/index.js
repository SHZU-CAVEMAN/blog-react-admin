import React from "react";
import MDEditor from "@uiw/react-md-editor";
import dayjs from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Button } from "antd";
import { message } from 'antd';
import { getCategoryList } from '@/api/category';
import { addArticle, updateArticle,getArticleById } from '@/api/article';
import ArticleBaseFields from '@/components/ArticleBaseFields';
import ArticleList from '@/components/ArticleList';

const ArticleCreate = () => {
  const [content, setContent] = React.useState("**Hello Markdown**");
  const [categoryOptions, setCategoryOptions] = React.useState([]);
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode');
  const articleId = searchParams.get('id');  // 别的页面传过来的文章id
  const isEditMode = mode === 'edit' && !!articleId;

  React.useEffect(() => {
    const initPage = async () => {
      try {
        const categoryRes = await getCategoryList();
        const options = (categoryRes.data || []).map(item => ({
          value: String(item.id),
          label: item.name,
        }));
        setCategoryOptions(options);

        if (!isEditMode) {
          return;
        }
        // 根据 id 获取文章信息
        const { data: currenArticle } = await getArticleById(articleId);
        if (!currenArticle) {
          message.error('未找到要编辑的文章');
          return;
        }
        form.setFieldsValue({
          ...currenArticle,
          picture: currenArticle.picture || currenArticle.cover || '',
          publish_time: currenArticle.publish_time ? dayjs(currenArticle.publish_time) : null,
        });
        setContent(currenArticle.content || '');
      } catch (error) {
        message.error(error?.msg || '初始化页面失败');
      }
    };

    initPage();
  }, [articleId, isEditMode, form]);
  
  const handleSave = async (values) => {
    const payload = {
      name: values.name,
      picture: values.picture,
      category_id: values.category_id,
      intro: values.intro,
      publish_time: values.publish_time ? values.publish_time.format('YYYY/MM/DD') : '',
      content,
    };

    try {
      if (isEditMode) {
        await updateArticle({
          ...payload,
          id: Number(articleId),
        });
        message.success('文章正文已更新');
      } else {
        await addArticle(payload);
        message.success('文章已创建');
      }
      navigate('/article/list');
    } catch (error) {
      message.error(error?.msg || '保存失败，请重试');
    }
  };

  return (
    <div data-color-mode="light">
        {/* <Collapse
          defaultActiveKey={['1']}
          items={[
            {
              key: '1',
              label: isEditMode ? '编辑文章 使用说明' : '新增文章 使用说明',
              children: <p>暂无</p>,
            },
          ]}
          style={{ marginBottom: 16 }}
        /> */}

       <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
          <ArticleBaseFields categoryOptions={categoryOptions} />
        </div>

        <Form.Item label="文章内容">
          <MDEditor
            value={content}
            onChange={setContent}
            height={400}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {isEditMode ? '保存修改' : '保存文章'}
          </Button>
        </Form.Item>

      </Form>
  
    </div>
  );
};

export default ArticleCreate;
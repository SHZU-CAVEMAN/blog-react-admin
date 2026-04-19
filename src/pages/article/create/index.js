import {useState,useEffect}  from "react";
import MDEditor from "@uiw/react-md-editor";
import dayjs from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Button } from "antd";
import { message } from 'antd';
import { getCategoryList } from '@/api/category';
import { addArticle, updateArticle,getArticleById ,publishArticle} from '@/api/article';
import ArticleBaseFields from '@/components/ArticleBaseFields';
import './index.less';


const ArticleCreate = () => {
  const [content, setContent] = useState("**Hello Markdown**");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [submittingAction, setSubmittingAction] = useState('');
  const [form] = Form.useForm();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const routeArticleId = searchParams.get('id');  // 别的页面传过来的文章id
  const [currentArticleId, setCurrentArticleId] = useState(routeArticleId || '');
  const isEditMode = mode === 'edit' && !!(currentArticleId || routeArticleId);

  useEffect(() => {
    setCurrentArticleId(routeArticleId || '');
  }, [routeArticleId]);

  useEffect(() => {
    const initPage = async () => {
      try {
        // 1 请求分类数据并保存
        const categoryRes = await getCategoryList();
        const options = (categoryRes.data || []).map(item => ({
          value: String(item.id),
          label: item.name,
        }));
        setCategoryOptions(options);  
        if (!isEditMode) {
          return;
        }
        // 2 根据 id 获取文章信息
        const { data: currenArticle } = await getArticleById(currentArticleId);
        if (!currenArticle) {
          message.error('未找到要编辑的文章');
          return;
        }
        //console.log("当前文章信息：", currenArticle);
        // 3 初始化表单
        form.setFieldsValue({
          title: currenArticle.title || currenArticle.name || '',
          picture: currenArticle.picture || currenArticle.cover || '',
          categoryId: currenArticle.categoryId || currenArticle.category_id ? String(currenArticle.categoryId || currenArticle.category_id) : undefined,
          publishTime: currenArticle.publishTime || currenArticle.publish_time
            ? dayjs(currenArticle.publishTime || currenArticle.publish_time)
            : null,
          summary: currenArticle.summary || currenArticle.intro || '',
          status: currenArticle.status || '',
        });
        // 4 初始化 md 内容
        setContent(currenArticle.content || '');
      } catch (error) {
        message.error(error?.message || error?.msg || '初始化页面失败');
      }
    };

    initPage();
  }, [currentArticleId, isEditMode, form]);

  const buildPayload = (values, action) => {
    const finalPublishTime =
      action === 'publish'
        ? (values.publishTime || dayjs())
        : values.publishTime;
    return {
      title: values.title,
      picture: values.picture,
      categoryId: values.categoryId,
      summary: values.summary,
      publishTime: finalPublishTime ? finalPublishTime.format('YYYY/MM/DD') : '',
      content,
    };
  };

  
  // 新建文章：调用新增接口，保存表单和 Markdown 正文
  const handleCreateNew = async () => {
    try {
      const values = await form.validateFields(['title', 'categoryId', 'summary', 'picture', 'publishTime']);
      const payload = buildPayload(values, 'create');
      setSubmittingAction('create');

      // 先清空旧 id，避免从编辑态进入新建时误用旧文章 id
      setCurrentArticleId('');
      navigate('/article/create', { replace: true });

      const response = await addArticle(payload);
      if (response?.status !== 0) {
        throw new Error(response?.message || '新建失败，请重试');
      }
      const createdId = response?.id;
      debugger
      if (createdId) {
        const nextId = String(createdId);
        setCurrentArticleId(nextId);
        navigate(`/article/create?mode=edit&id=${nextId}`, { replace: true });
      } else {
        message.warning('新建成功，但接口未返回文章ID，后续请从列表页重新进入编辑');
      }
      message.success(response?.message || '文章新建成功');
    } catch (error) {
      if (error?.errorFields) {
        message.warning('请先填写文章名、分类和说明');
        return;
      }
      message.error(error?.message || error?.msg || '新建失败，请重试');
    } finally {
      setSubmittingAction('');
    }
  };
  // 修改已有文章
  const handleSubmitByAction = async (action) => {
    try {
      const values = await form.validateFields();
      const payload = buildPayload(values, action);
      setSubmittingAction(action);
      if (!currentArticleId) {
        message.warning('请先点击新建生成文章，再进行保存或发布');
        return;
      }
  
      // 修改已有文章
      if(action==="save"){
        await updateArticle({
          ...payload,
          id: Number(currentArticleId),
        });
      }
      if(action==="publish"){
        await publishArticle({
          ...payload,
          id: Number(currentArticleId),
        });
      }

      message.success(action === 'publish' ? '文章已发布' : '文章已保存');
    } catch (error) {
      if (error?.errorFields) {
        message.warning('请先完善文章信息后再提交');
        return;
      }
      message.error(error?.message || error?.msg || '操作失败，请重试');
    } finally {
      setSubmittingAction('');
    }
  };

  return (
    <div data-color-mode="light">

      <Form
        form={form}
        layout="vertical"
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
          <ArticleBaseFields categoryOptions={categoryOptions} />
        </div>
        <Form.Item style={{ marginTop: 16, marginBottom: 16, textAlign: 'right' }}>
          <Button
            style={{ marginRight: 8 }}
            onClick={handleCreateNew}
            loading={submittingAction === 'create'}
          >
            新建
          </Button>
          <Button
            style={{ marginRight: 8 }}
            onClick={() => handleSubmitByAction('save')}
            loading={submittingAction === 'save'}
          >
            保存
          </Button>
          <Button
            onClick={() => handleSubmitByAction('publish')}
            loading={submittingAction === 'publish'}
          >
            发布
          </Button>
        </Form.Item>
        <Form.Item >
          <MDEditor
            className="article-md-editor"
            value={content}
            onChange={setContent}
            height={600}
          />
        </Form.Item>


      </Form>
  
    </div>
  );
};

export default ArticleCreate;
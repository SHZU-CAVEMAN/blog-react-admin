import { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import dayjs from 'dayjs';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Button } from 'antd';
import { message } from 'antd';
import { getCategoryList } from '@/api/category';
import { addArticle, updateArticle, getArticleById, publishArticle } from '@/api/article';
import { uploadSingleFile } from '@/api/upload';
import ArticleBaseFields from '@/components/ArticleBaseFields';
import './index.less';

const ArticleCreate = () => {
  // 文件服务地址：上传接口返回 content_key，前端在这里拼成可访问图片 URL
  const FILE_BASE_URL = 'http://127.0.0.1:81/uploadFiles/';
  const [content, setContent] = useState('**Hello Markdown**');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedPictureFile, setSelectedPictureFile] = useState(null);
  const [submittingAction, setSubmittingAction] = useState('');
  const [form] = Form.useForm();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const routeArticleId = searchParams.get('id');
  const [currentArticleId, setCurrentArticleId] = useState(routeArticleId || '');
  const isEditMode = mode === 'edit' && !!(currentArticleId || routeArticleId);

  useEffect(() => {
    // keep-alive 下切走时组件不会卸载；仅在当前激活页是 /article/create 时才同步 id
    if (location.pathname !== '/article/create') {
      return;
    }
    setCurrentArticleId(routeArticleId || '');
  }, [routeArticleId, location.pathname]);

  useEffect(() => {
    const initPage = async () => {
      try {
        // 路由切换会触发 effect；若当前不是编辑发布页则立即退出，避免隐藏状态误请求
        if (location.pathname !== '/article/create') {
          return;
        }

        // 1 分类数据仅首次加载，后续面包屑切回时复用缓存，避免重复请求
        if (categoryOptions.length === 0) {
          const categoryRes = await getCategoryList();
          const options = (categoryRes.data || []).map(item => ({
            value: String(item.id),
            label: item.name,
          }));
          setCategoryOptions(options);
        }

        if (!isEditMode) {
          return;
        }
        // 2 根据文章id获取文章详情并初始化表单
        const { data: currenArticle } = await getArticleById(currentArticleId);
        if (!currenArticle) {
          message.error('未找到要编辑的文章');
          return;
        }

        form.setFieldsValue({
          title: currenArticle.title || currenArticle.name || '',
          picture: normalizePictureUrl(currenArticle.picture || currenArticle.cover || ''),
          categoryId: currenArticle.categoryId || currenArticle.category_id
            ? String(currenArticle.categoryId || currenArticle.category_id)
            : undefined,
          publishTime: currenArticle.publishTime || currenArticle.publish_time
            ? dayjs(currenArticle.publishTime || currenArticle.publish_time)
            : null,
          summary: currenArticle.summary || currenArticle.intro || '',
          status: currenArticle.status || '',
        });
        // 3 初始化 content 和 selectedPictureFile 的状态
        setSelectedPictureFile(null);
        setContent(currenArticle.content || '');
      } catch (error) {
        message.error(error?.message || error?.msg || '初始化页面失败');
      }
    };

    initPage();
  }, [currentArticleId, isEditMode, form, location.pathname, categoryOptions.length]);

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

  const normalizePictureUrl = (value) => {
    const raw = String(value || '').trim();
    if (!raw) {
      return '';
    }
    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }
    const cleaned = raw.replace(/^\/+/, '').replace(/^uploadFiles\//i, '');
    const hasExt = /\.[a-z0-9]+$/i.test(cleaned);
    return `${FILE_BASE_URL}${hasExt ? cleaned : `${cleaned}.jpg`}`;
  };

  // 上传图片
  const uploadPicture = async (file, articleId) => {
    const res = await uploadSingleFile(file, articleId);
    if (res?.status !== 0) {
      throw new Error(res?.message || '上传失败');
    } else {
      message.success(res?.message || '上传成功');
    }
    return normalizePictureUrl(res.content_key);
  };

  // 新建文章
  const handleCreateNew = async () => {
    try {
      setSubmittingAction('create');
      const values = await form.validateFields(['title', 'categoryId', 'summary', 'picture', 'publishTime']);
      const payload = buildPayload(values, 'create');

      const response = await addArticle(payload);
      if (response?.status !== 0) {
        throw new Error(response?.message || '新建失败，请重试');
      }
      const createdId = response?.id;
      if (createdId) {
        const nextId = String(createdId);
        setCurrentArticleId(nextId);
        navigate(`/article/create?mode=edit&id=${nextId}`, { replace: true });

        if (selectedPictureFile) {
          const pictureUrl = await uploadPicture(selectedPictureFile, nextId);
          form.setFieldValue('picture', pictureUrl);
        }
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

  // 修改文章
  const handleSubmitByAction = async (action) => {
    try {
      setSubmittingAction(action);
      const values = await form.validateFields();
      const payload = buildPayload(values, action);
      if (!currentArticleId) {
        message.warning('请先点击新建生成文章，再进行保存或发布');
        return;
      }

      if (action === 'save') {
        await updateArticle({
          ...payload,
          id: Number(currentArticleId),
        });
      }
      if (action === 'publish') {
        await publishArticle({
          ...payload,
          id: Number(currentArticleId),
        });
      }

      if (selectedPictureFile) {
        const pictureUrl = await uploadPicture(selectedPictureFile, currentArticleId);
        form.setFieldValue('picture', pictureUrl);
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

  // 清空当前编辑发布页的所有输入与编辑上下文，回到新建态
  const handleClearAll = () => {
    form.resetFields();
    setContent('');
    setSelectedPictureFile(null);
    setCurrentArticleId('');
    setSubmittingAction('');
    navigate('/article/create', { replace: true });
    message.success('已清空当前内容，可新建文章');
  };

  return (
    <div data-color-mode="light">
      <Form form={form} layout="vertical">
        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
          <ArticleBaseFields
            categoryOptions={categoryOptions}
            selectedPictureFile={selectedPictureFile}
            onSelectedPictureFileChange={setSelectedPictureFile}
          />
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
            style={{ marginRight: 8 }}
            onClick={handleClearAll}
          >
            清空
          </Button>

          {/* <Button
            onClick={() => handleSubmitByAction('publish')}
            loading={submittingAction === 'publish'}
          >
            发布
          </Button> */}
        </Form.Item>
        <Form.Item>
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

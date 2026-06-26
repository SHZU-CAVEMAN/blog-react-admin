import { useState, useEffect, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import dayjs from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Button ,Drawer} from 'antd';
import { message } from 'antd';
import { getCategoryList } from '@/api/category';
import { addArticle, updateArticle, getArticleById, publishArticle } from '@/api/article';
import { uploadSingleFile } from '@/api/upload';
import ArticleBaseFields from '@/components/ArticleBaseFields';
import { FILE_BASE_URL } from '@/config/env';
import './index.less';

const ArticleCreate = () => {
  const [content, setContent] = useState('**Hello Markdown**');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedPictureFile, setSelectedPictureFile] = useState(null);
  const [submittingAction, setSubmittingAction] = useState('');
  const [form] = Form.useForm();
  // 记录最近一次已成功加载详情的文章 id。
  // 目的：面包屑切走再切回同一篇文章时，跳过重复详情请求。
  const lastLoadedArticleIdRef = useRef('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  // 路由参数里的文章 id（来源：/article/create?mode=edit&id=xxx）
  const routeArticleId = searchParams.get('id');
  const isEditMode = mode === 'edit' && !!routeArticleId;
  const [formDrawerOpen, setFormDrawerOpen] = useState(false); // 抽屉的显示状态

  // 组件销毁时统一清理抽屉状态
  useEffect(() => {
    return () => {
      setFormDrawerOpen(false);
    };
  }, [routeArticleId]);

  // 分类数据仅首次加载，避免重复请求
  useEffect(() => {
    let cancelled = false; // 用于标记请求是否被取消
    const loadCategoryOptions = async () => {
      try {
        const categoryRes = await getCategoryList();
        if (cancelled) {
          return;
        }
        const options = (categoryRes.data || []).map(item => ({
          value: String(item.id),
          label: item.name,
        }));
        setCategoryOptions(options);
      } catch (error) {
        if (!cancelled) {
          message.error(error?.message || error?.msg || '加载分类失败');
        }
      }
    };
    loadCategoryOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  // 编辑态下根据文章 id 加载详情并初始化表单
  useEffect(() => {
    if (!isEditMode || !routeArticleId) {
      return;
    }

    const articleId = String(routeArticleId);
    // 同一篇文章已加载过时不重复请求，直接复用当前页面状态。
    if (lastLoadedArticleIdRef.current === articleId) {
      setFormDrawerOpen(true);
      return;
    }

    let cancelled = false;
    const initEditArticle = async () => {
      try {
        const { data: currenArticle } = await getArticleById(articleId);
        if (cancelled) {
          return;
        }
        if (!currenArticle) {
          message.error('未找到要编辑的文章');
          return;
        }
        // 初始化表单字段值
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
        // 4 打开抽屉显示文章信息表单
        setFormDrawerOpen(true);
        // 5 记录已成功加载的文章 id，避免重复请求
        lastLoadedArticleIdRef.current = articleId;
      } catch (error) {
        if (!cancelled) {
          message.error(error?.message || error?.msg || '初始化页面失败');
        }
      }
    };

    initEditArticle();

    return () => {
      cancelled = true;
    };
  }, [routeArticleId, form, isEditMode]);

  // 构建提交接口的 payload
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
  // 处理图片 URL，若是相对路径则拼接 FILE_BASE_URL
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

  // 上传文章封面图片
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
      if (!routeArticleId) {
        message.warning('请先点击新建生成文章，再进行保存或发布');
        return;
      }

      if (action === 'save') {
        await updateArticle({
          ...payload,
          id: Number(routeArticleId),
        });
      }
      if (action === 'publish') {
        await publishArticle({
          ...payload,
          id: Number(routeArticleId),
        });
      }

      if (selectedPictureFile) {
        const pictureUrl = await uploadPicture(selectedPictureFile, routeArticleId);
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
    lastLoadedArticleIdRef.current = '';
    setSubmittingAction('');
    navigate('/article/create', { replace: true });
    message.success('已清空当前内容，可新建文章');
  };

  return (
    <div data-color-mode="light">
      <Form form={form} layout="vertical">
        {/* <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
          <ArticleBaseFields
            categoryOptions={categoryOptions}
            selectedPictureFile={selectedPictureFile}
            onSelectedPictureFileChange={setSelectedPictureFile}
          />
        </div> */}

        {/*  */}
              <Drawer
                title={routeArticleId ? `编辑文章 #${routeArticleId}` : '文章信息表'}
                placement="right"
                width="320"
                mask={false}
                open={formDrawerOpen}
                onClose={() => setFormDrawerOpen(false)}
                className="article-form-floating-drawer"
                classNames={{
                  body: 'article-form-floating-drawer-body',
                }}
                styles={{
                  body: {
                    padding: 0,
                    overflowY: 'auto',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                  },
                }}
        
              >
                <Form form={form} layout="vertical" size="small" className="article-edit-form-compact">
                  <ArticleBaseFields
                    categoryOptions={categoryOptions}
                    selectedPictureFile={selectedPictureFile}
                    onSelectedPictureFileChange={setSelectedPictureFile}
                    compact
                  />
                </Form>
              </Drawer>
        <Form.Item style={{ marginTop: 0, marginBottom: 5, textAlign: 'left' }}>
          <Button
            style={{ marginRight: 8 }}
            onClick={handleCreateNew}
            loading={submittingAction === 'create'}
          >
            新建文章
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
            清空信息
          </Button>
          <Button
            style={{ marginRight: 8 }}
            onClick={() => setFormDrawerOpen(!formDrawerOpen)}
          >
            文章信息
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
            height={400}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default ArticleCreate;

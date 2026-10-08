import { memo, useState, useEffect, useRef, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Button ,Drawer, message } from 'antd';
import { getCategoryList } from '@/api/category';
import { addArticle, updateArticle, getArticleById, publishArticle } from '@/api/article';
import ArticleBaseFields from '@/components/ArticleBaseFields';
import './index.less';

const ARTICLE_CACHE_PREFIX = 'article:create:cache:'; // 后端文章缓存 key 前缀
const ARTICLE_DRAFT_PREFIX = 'article:create:draft:'; // 未保存到后端的草稿 key 前缀
const ARTICLE_FORM_KEYS = ['title', 'picture', 'categoryId', 'publishTime', 'summary', 'status'];
const EMPTY_ARTICLE = { title: '', picture: '', categoryId: '', publishTime: '', summary: '', status: '', content: '**Hello Markdown**' };

// 正文不变时跳过 Markdown 编辑器的高成本重渲染。
const ArticleMarkdownEditor = memo(({ value, onChange }) => (
  <MDEditor
    className="article-md-editor"
    value={value}
    onChange={onChange}
    height={400}
  />
));

// 路由监听组件（避免路由变化时重渲染整个文章编辑器）。
const ArticleRouteObserver = memo(({ onChange }) => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    onChange(pathname, search);
  }, [pathname, search, onChange]);

  return null;
});

// 读取路由参数中的文章 ID，不在当前组件中直接使用URLSearchParams
const getArticleIdFromSearch = (search) => new URLSearchParams(search).get('id');

// 读取本地文章数据，损坏的数据直接删除。
const readLocalArticle = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    localStorage.removeItem(key);
    return null;
  }
};

// 比较固定文章字段，避免在页面切换时序列化整篇正文。
const isArticleChanged = (current, baseline) => (
  current.title !== baseline.title
  || current.picture !== baseline.picture
  || current.categoryId !== baseline.categoryId
  || current.publishTime !== baseline.publishTime
  || current.summary !== baseline.summary
  || current.status !== baseline.status
  || current.content !== baseline.content
);

const ArticleCreate = () => {
  const [content, setContent] = useState('**Hello Markdown**');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [submittingAction, setSubmittingAction] = useState(''); // 当前提交动作：'add' | 'update' | 'publish'
  const [form] = Form.useForm();
  const contentRef = useRef(content); // 始终保存最新正文，供离开页面时读取
  const activeArticleRef = useRef(null); // 记住离开页面前正在编辑的文章及其本地 key

  const navigate = useNavigate();
  const [editorRoute, setEditorRoute] = useState(() => ({
    key: `${window.location.pathname}${window.location.search}`,
    id: getArticleIdFromSearch(window.location.search),
  }));
  const routeArticleId = editorRoute.id;
  const cacheKey = routeArticleId ? `${ARTICLE_CACHE_PREFIX}${routeArticleId}` : '';
  const draftKey = `${ARTICLE_DRAFT_PREFIX}${routeArticleId || 'new'}`;
  const [formDrawerOpen, setFormDrawerOpen] = useState(false); // 抽屉的显示状态

  // 同步 contentRef 的值，确保快照恢复时能拿到最新的编辑器内容。
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // 读取当前表单和正文，缓存与草稿都使用同一固定结构。
  const getCurrentArticle = useCallback(() => {
    const values = form.getFieldsValue(ARTICLE_FORM_KEYS);
    return {
      title: values.title || '',
      picture: values.picture || '',
      categoryId: values.categoryId || '',
      publishTime: values.publishTime ? values.publishTime.toISOString() : '',
      summary: values.summary || '',
      status: values.status || '',
      content: contentRef.current,
    };
  }, [form]);

  // 将缓存或草稿回填到表单和正文编辑器。
  const applyArticle = useCallback((article) => {
    form.setFieldsValue({
      title: article.title,
      picture: article.picture,
      categoryId: article.categoryId || undefined,
      publishTime: article.publishTime ? dayjs(article.publishTime) : null,
      summary: article.summary,
      status: article.status,
    });
    setContent(article.content || '');
  }, [form]);

  // 路由参数变化 清理抽屉状态（把抽屉收起来）
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

  // 路由变化时，进入编辑页才更新父组件；离开时只在后台保存草稿。
  const handleRouteChange = useCallback((pathname, search) => {
    if (pathname === '/article/create') {
      // 进入编辑页
      const nextRoute = { key: `${pathname}${search}`, id: getArticleIdFromSearch(search) };
      setEditorRoute((current) => (
        current.key === nextRoute.key && activeArticleRef.current ? current : nextRoute
      ));
      return;
    }
    // 离开编辑页
    setFormDrawerOpen(false);
    const activeArticle = activeArticleRef.current; //最近一次加载或保存成功的文章内容
    if (!activeArticle) {
      return;
    }
    const currentArticle = getCurrentArticle();
    activeArticleRef.current = null;
    // 导航先完成，再执行同步的 localStorage 写入，避免阻塞点击反馈。
    setTimeout(() => {
      // 比较当前表单和正文 与 后台文章数据，有变化则保存本地草稿，无变化则移除草稿key。
      if (isArticleChanged(currentArticle, activeArticle.baseline)) {
        localStorage.setItem(activeArticle.draftKey, JSON.stringify(currentArticle));
      } else {
        localStorage.removeItem(activeArticle.draftKey);
      }
    }, 0);
  }, [getCurrentArticle]);

  // 新建文章时恢复本地草稿。
  useEffect(() => {
    if (routeArticleId) {
      return;
    }
    activeArticleRef.current = { draftKey, baseline: EMPTY_ARTICLE };
    const draftArticle = readLocalArticle(draftKey);
    applyArticle(draftArticle || EMPTY_ARTICLE);
  }, [editorRoute.key, routeArticleId, draftKey, applyArticle]);

  // 加载文章信息 （先读缓存；没有缓存才请求后端，然后恢复本地草稿）
  useEffect(() => {
    if (!routeArticleId) {
      return;
    }
    // 读本地缓存
    const cachedArticle = readLocalArticle(cacheKey);
    if (cachedArticle) {
      activeArticleRef.current = { draftKey, baseline: cachedArticle };
      applyArticle(readLocalArticle(draftKey) || cachedArticle);
      setFormDrawerOpen(true);
      return;
    }
    // 请求后台文章
    let cancelled = false;
    const loadArticle = async () => {
      try {
        const { data: article } = await getArticleById(routeArticleId);
        if (cancelled || !article) {
          return;
        }
        const serverArticle = {
          title: article.title || '',
          picture: article.picture || '',
          categoryId: article.categoryId ? String(article.categoryId) : '',
          publishTime: article.publishTime ? dayjs(article.publishTime).toISOString() : '',
          summary: article.summary || '',
          status: article.status || '',
          content: article.content || '',
        };
        localStorage.setItem(cacheKey, JSON.stringify(serverArticle)); //缓存到本地浏览器
        activeArticleRef.current = { draftKey, baseline: serverArticle }; // 记住当前文章的草稿key和基线数据
        applyArticle(readLocalArticle(draftKey) || serverArticle); // 恢复草稿或服务器数据
        setFormDrawerOpen(true);
      } catch (error) {
        if (!cancelled) {
          message.error(error?.message || error?.msg || '初始化页面失败');
        }
      }
    };
    loadArticle();
    return () => {
      cancelled = true;
    };
  }, [editorRoute.key, routeArticleId, cacheKey, draftKey, applyArticle]);

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

  // 新建文章
  const handleCreateNew = async () => {
    try {
      setSubmittingAction('create');
      const values = await form.validateFields(['title', 'categoryId', 'summary', 'picture', 'publishTime']);
      const payload = buildPayload(values, 'create');

      const response = await addArticle(payload);
      const createdId = response?.data?.id;
      if (createdId) {
        const nextId = String(createdId);
        // 新建成功后，当前内容成为该文章的本地缓存，并删除新建草稿。
        localStorage.setItem(`${ARTICLE_CACHE_PREFIX}${nextId}`, JSON.stringify(getCurrentArticle()));
        localStorage.removeItem(`${ARTICLE_DRAFT_PREFIX}new`);

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
      // 更新
      if (action === 'save') {
        await updateArticle({
          ...payload,
          id: Number(routeArticleId),
        });
      }
      // 发布 （更新文章状态）
      if (action === 'publish') {
        await publishArticle({
          ...payload,
          id: Number(routeArticleId),
        });
      }
      // 保存成功后更新本地缓存，当前内容已不再属于草稿。
      const savedArticle = getCurrentArticle();
      localStorage.setItem(cacheKey, JSON.stringify(savedArticle));
      localStorage.removeItem(draftKey);
      activeArticleRef.current = { draftKey, baseline: savedArticle };
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
    // 主动清空只删除当前草稿，已保存文章缓存仍然保留。
    localStorage.removeItem(draftKey);
    activeArticleRef.current = null;
    setSubmittingAction('');
    navigate('/article/create', { replace: true });
    message.success('已清空当前内容，可新建文章');
  };

  return (
    <div data-color-mode="light">
      <ArticleRouteObserver onChange={handleRouteChange} />
      <Form form={form} layout="vertical">
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
        </Form.Item>
        <Form.Item>
          <ArticleMarkdownEditor
            value={content}
            onChange={setContent}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default ArticleCreate;

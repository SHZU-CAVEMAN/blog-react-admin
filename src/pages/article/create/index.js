import { useState, useEffect, useRef, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import dayjs from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Button ,Drawer, message } from 'antd';
import { getCategoryList } from '@/api/category';
import { addArticle, updateArticle, getArticleById, publishArticle } from '@/api/article';
import { uploadSingleFile } from '@/api/upload';
import ArticleBaseFields from '@/components/ArticleBaseFields';
import { FILE_BASE_URL } from '@/config/env';
import './index.less';

const SNAPSHOT_INTERVAL_MS = 30000; // 快照间隔：30s
const SNAPSHOT_PREFIX = 'article:create:snapshot:'; // 快照存储的 localStorage key 前缀
const SNAPSHOT_FORM_KEYS = ['title', 'picture', 'categoryId', 'publishTime', 'summary', 'status']; // 需要保存快照的表单字段名

const ArticleCreate = () => {
  const [content, setContent] = useState('**Hello Markdown**');
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedPictureFile, setSelectedPictureFile] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(''); // 当前提交动作：'add' | 'update' | 'publish'
  const [form] = Form.useForm();
  // 记录最近一次已成功加载详情的文章 id。
  // 目的：面包屑切走再切回同一篇文章时，跳过重复详情请求。
  const lastLoadedArticleIdRef = useRef('');

  const contentRef = useRef(content); // 编辑器内容引用，用于快照恢复

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode'); // 路由参数里的模式：'add' | 'edit'
  const routeArticleId = searchParams.get('id'); // 路由参数里的文章 id（来源：/article/create?mode=edit&id=xxx）
  const snapshotKey = `${SNAPSHOT_PREFIX}${routeArticleId ? `id:${routeArticleId}` : 'draft'}`; // 当前快照的 localStorage key
  const isEditMode = mode === 'edit' && !!routeArticleId;
  const [formDrawerOpen, setFormDrawerOpen] = useState(false); // 抽屉的显示状态

  // 清理指定快照。
  const clearSnapshot = useCallback((key) => {
    localStorage.removeItem(key);
  }, []);

  // 同步 contentRef 的值，确保快照恢复时能拿到最新的编辑器内容。
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // 读取当前编辑内容并生成可持久化快照。
  const getSnapshotPayload = useCallback(() => {
    const values = form.getFieldsValue(SNAPSHOT_FORM_KEYS);
    return {
      formValues: {
        ...values,
        publishTime: values.publishTime
          ? (dayjs.isDayjs(values.publishTime) ? values.publishTime.toISOString() : String(values.publishTime))
          : '',
      },
      content: contentRef.current,
      updatedAt: Date.now(),
    };
  }, [form]);

  // 从 localStorage 恢复快照到表单与编辑器。
  const restoreSnapshot = useCallback((key, silent = false) => {
    // silent 入参控制要不要弹出提示 “已恢复本地快照”，编辑态不提示，新建时提示。
    const raw = localStorage.getItem(key);
    if (!raw) {
      return;
    }
    try {
      const snapshot = JSON.parse(raw);
      const formValues = snapshot?.formValues || {};
      const publishTime = formValues.publishTime ? dayjs(formValues.publishTime) : null;
      form.setFieldsValue({
        ...formValues,
        publishTime: publishTime && publishTime.isValid() ? publishTime : null,
      });
      setContent(String(snapshot?.content || ''));
      if (!silent) {
        message.info('已恢复本地快照');
      }
    } catch (error) {
      localStorage.removeItem(key);
    }
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

  // 新建态尝试恢复本地快照
  useEffect(() => {
    if (isEditMode) {
      return;
    }
    restoreSnapshot(snapshotKey);
  }, [isEditMode, snapshotKey, restoreSnapshot]);

  // 初始化文章信息
  // 组件会被缓存，避免重复请求，但路由参数变化需重新加载文章。
  useEffect(() => {
    // 仅在编辑态下才请求文章详情
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
        // 编辑态优先恢复该文章对应的本地快照 ，避免本地草稿丢失。
        // 2026.06.28 
        restoreSnapshot(snapshotKey, true);
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
  }, [routeArticleId, form, isEditMode, snapshotKey, restoreSnapshot]);

  // 定时保存快照：仅本地保存（不云端保存，避免在用户不知情时覆盖数据库）。
  useEffect(() => {
    const timer = setInterval(async () => {
      // 避免重复提交快照
      if (submittingAction) {
        return;
      }
      // 保存本地快照
      const snapshot = getSnapshotPayload();
      const snapshotStr = JSON.stringify(snapshot);
      localStorage.setItem(snapshotKey, snapshotStr);

    }, SNAPSHOT_INTERVAL_MS);
    // 组件卸载时清理定时器
    return () => {
      clearInterval(timer);
    };
  }, [snapshotKey, submittingAction, getSnapshotPayload]); 

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
    if (!res?.content_key) {
      throw new Error(res?.message || '上传失败');
    }
    message.success(res?.message || '上传成功');
    return normalizePictureUrl(res.content_key);
  };

  // 新建文章
  const handleCreateNew = async () => {
    try {
      setSubmittingAction('create');
      const values = await form.validateFields(['title', 'categoryId', 'summary', 'picture', 'publishTime']);
      const payload = buildPayload(values, 'create');

      const response = await addArticle(payload);
      const createdId = response?.id;
      if (createdId) {
        const nextId = String(createdId);
        // 新建成功后清理新建草稿快照。
        clearSnapshot(`${SNAPSHOT_PREFIX}draft`);

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

      // 手动保存后，清理当前快照。
      clearSnapshot(snapshotKey);

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
    // 主动清空时同步删除快照。
    clearSnapshot(snapshotKey);
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

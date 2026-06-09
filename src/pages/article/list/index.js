import { Space, Table, Button, Form, Popconfirm, message, Input, Select } from 'antd';
import { useState,useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getArticleList,updateArticle,deleteArticle} from '@/api/article'
import { getCategoryList} from '@/api/category'
import ArticleBaseFields from '@/components/ArticleBaseFields';
import './index.less';
const { Column } = Table;

const ArticleList = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState([]); // 文章列表
  const [editingKey, setEditingKey] = useState(null);  //  当前是否在编辑
  const [categoryData, setCategoryData] = useState([]); // 分类 options
  const [keyword, setKeyword] = useState('');  // 标题搜索关键词
  const [filterCategoryId, setFilterCategoryId] = useState(undefined); // 分类筛选
  const [filterCategoryLabel, setFilterCategoryLabel] = useState(''); // 分类筛选标签
  const [filterStatus, setFilterStatus] = useState(undefined); // 状态筛选

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
      //console.log("文章信息：", res);
      setDataSource(list);
    } catch (error) {
      message.error(error?.msg || '获取文章列表失败，请稍后重试');
      setDataSource([]);
    }
  };
  
  // 更新 （按钮）
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
      // 更新 table （不发新请求）
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

  //  编辑（回填到表单）
  const handleEdit = (record) => {
    const normalizedStatus = normalizeStatus(record.status);
    form.setFieldsValue({
      ...record,
      status: ['active', 'disabled', 'draft'].includes(normalizedStatus)
        ? normalizedStatus
        : undefined,
      publishTime: record.publishTime
        ? dayjs(record.publishTime)
        : null,
    });
    setEditingKey(record.key);
  };

  //  删除
  const handleDelete = async (record) => {
    const articleId = record.id || record.key;
    if (!articleId) {
      message.error('删除失败：未获取到文章ID');
      return;
    }
    await deleteArticle(articleId);
    message.success('文章已删除');
    // 本地乐观更新状态为 disabled（不发新请求）
    setDataSource(prev =>
      prev.map(item =>
        item.key === articleId ? { ...item, status: 'disabled' } : item
      )
    );
  };

  // 跳转到正文编辑页面
  const handleEditContent = (record) => {
    const articleId = record.id || record.key;
    navigate(`/article/create?mode=edit&id=${articleId}`);
  };

  // 状态值归一化，兼容接口返回的状态值不规范的情况
  const normalizeStatus = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'disabled' || normalized === 'diabled' || normalized === 'disbled') {
      return 'disabled';
    }
    if (normalized === 'active' || normalized === 'actice') {
      return 'active';
    }
    if (normalized === 'draft') {
      return 'draft';
    }
    return 'unknown';
  };

  // 状态展示元信息，兼容接口返回的状态值不规范的情况
  const getStatusMeta = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'disabled') {
      return { key: 'disabled', label: 'disabled' };
    }
    if (normalized === 'active') {
      return { key: 'active', label: 'active' };
    }
    if (normalized === 'draft') {
      return { key: 'draft', label: 'draft' };
    }
    return { key: 'unknown', label: status || '-' };
  };

  // 基于表单值构建接口负载，
  const filteredDataSource = useMemo(() => {
    return dataSource.filter((item) => {
      const title = String(item.title || '').toLowerCase();
      const categoryId = item.categoryId ? String(item.categoryId) : undefined;
      const categoryName = String(item.categoryName || '').trim().toLowerCase();
      const statusKey = normalizeStatus(item.status);
      const keywordMatched = !keyword || title.includes(keyword.trim().toLowerCase());
      const categoryMatched = (() => {
        // 未选择分类时，所有都匹配
        if (!filterCategoryId) {
          return true;
        }
        // 选择了分类时，既要支持通过 id 匹配，也要支持通过 label 匹配（兼容接口返回的分类 id 不规范的情况）
        if (String(filterCategoryId).startsWith('name:')) {
          return categoryName === String(filterCategoryId).slice(5).toLowerCase();
        }
        // 通过 id 匹配，兼容接口返回的分类 id 不规范的情况
        const byIdMatched = categoryId === filterCategoryId;
        // 通过 label 匹配，兼容接口返回的分类 id 不规范的情况，同时支持用户通过 label 过滤（当接口返回的分类 id 不规范时，用户选择过滤后会自动切换成通过 label 过滤）
        const byLabelMatched =
          !!filterCategoryLabel && categoryName === String(filterCategoryLabel).trim().toLowerCase();
        return byIdMatched || byLabelMatched;
      })();
      // 状态匹配，兼容接口返回的状态值不规范的情况
      const statusMatched = !filterStatus || statusKey === filterStatus;
      // 只有同时满足关键词、分类和状态的过滤条件时才显示
      return keywordMatched && categoryMatched && statusMatched;
    });
  }, [dataSource, keyword, filterCategoryId, filterCategoryLabel, filterStatus]);
  
  // 分类过滤选项：基于接口返回的分类列表，同时兼容文章中可能存在但分类列表里没有的分类（通过 name: 前缀区分）
  const categoryFilterOptions = useMemo(() => {
    const options = [...categoryData];
    const existedLabelSet = new Set(categoryData.map((item) => String(item.label || '').trim()));
    dataSource.forEach((item) => {
      const name = String(item.categoryName || '').trim();
      if (!name || existedLabelSet.has(name)) {
        return;
      }
      existedLabelSet.add(name);
      options.push({ value: `name:${name}`, label: name });
    });
    return options;
  }, [categoryData, dataSource]);

  // 统计不同状态的数量，展示在界面上
  const statusStats = useMemo(() => {
    return dataSource.reduce(
      (acc, item) => {
        const key = normalizeStatus(item.status);
        if (key === 'disabled' || key === 'active' || key === 'draft') {
          acc[key] += 1;
        }
        return acc;
      },
      { disabled: 0, active: 0, draft: 0 }
    );
  }, [dataSource]);

  return (
    <div data-color-mode="light">
      {/*  上方表单（一行两个） */}
      <Form form={form} layout="vertical">
        <ArticleBaseFields categoryOptions={categoryData} />

        <Form.Item style={{ marginTop: 16, marginBottom: 16 }}>
          <div className="article-list-toolbar">
            <Space wrap>
              <Input
                allowClear
                placeholder="按文章名模糊查询"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ width: 220 }}
              />
              <Select
                allowClear
                placeholder="按分类过滤"
                value={filterCategoryId}
                onChange={(value, option) => {
                  setFilterCategoryId(value);
                  setFilterCategoryLabel(option?.label || '');
                }}
                options={categoryFilterOptions}
                style={{ width: 160 }}
              />
              <Select
                allowClear
                placeholder="按状态过滤"
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: 'active', label: 'active' },
                  { value: 'disabled', label: 'disabled' },
                  { value: 'draft', label: 'draft' },
                ]}
                style={{ width: 160 }}
              />
            </Space>

            <Space wrap>
              <span className="status-pill status-active">active: {statusStats.active}</span>
              <span className="status-pill status-disabled">disabled: {statusStats.disabled}</span>
              <span className="status-pill status-draft">draft: {statusStats.draft}</span>
              <Button 
                type="primary" 
                onClick={handleSubmit}
              >
                    更新
              </Button>
            </Space>
          </div>
        </Form.Item>
      </Form>
      
      {/*  表格——文章列表 */}
      <Table 
        dataSource={filteredDataSource} 
        bordered 
        size="small" 
        rowClassName={(record) => (
          record.key === editingKey ? 'article-list-row article-list-row-active' : 'article-list-row'
        )}
        onRow={(record) => ({
          onClick: () => handleEdit(record),
        })}
        pagination={{
          pageSize: 8,          // 每页条数
          showSizeChanger: false, // 不允许用户修改每页数量
          showQuickJumper: true, // 可输入页码跳转
          showTotal: (total) => `共 ${total} 条`,
        }}
      >
        <Column title="文章名" dataIndex="title" key="title" width={200} />
        <Column title="分类名" dataIndex="categoryName" key="categoryName" width={80} />
        <Column title="说明" dataIndex="summary" key="summary" />
        <Column
          title="状态"
          dataIndex="status"
          key="status"
          render={(status) => {
            const meta = getStatusMeta(status);
            return <span className={`status-pill status-${meta.key}`}>{meta.label}</span>;
          }}
        />
        <Column title="发表时间" dataIndex="publishTime" key="publishTime" />
        <Column
          title="操作"
          key="action"
          render={(_, record) => (
            <Space>
              {/* <Button type="link" onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>
                编辑
              </Button> */}

              <Button type="link" onClick={(e) => { e.stopPropagation(); handleEditContent(record); }}>
                修改正文
              </Button>

              <Popconfirm
                title="删除这之后文章状态为disabled"
                onConfirm={() => handleDelete(record)}
                okText="确定"
                cancelText="取消"
              >
                  <Button type="link" danger onClick={(e) => e.stopPropagation()}>
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

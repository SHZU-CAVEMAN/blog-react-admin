import { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, StopOutlined, EditOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getArticleList } from '@/api/article';
import { getCategoryList } from '@/api/category';

// 规范化状态值，兼容接口返回的状态值不规范的情况
const normalizeStatus = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'disabled' || s === 'diabled' || s === 'disbled') return 'disabled';
  if (s === 'active' || s === 'actice') return 'active';
  if (s === 'draft') return 'draft';
  return 'unknown';
};


const Home = () => {
  const [articles, setArticles] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        const [articleRes, categoryRes] = await Promise.all([
          getArticleList(),
          getCategoryList(),
        ]); // 并行请求，全部要成功，否则进入 catch 块
        const articleItems = Array.isArray(articleRes?.data) ? articleRes.data : [];
        setArticles(articleItems.map(item => ({
          ...item,
          status: item.status || '',
          categoryName: item.categoryName || item.category_name || '',
          publishTime: item.publishTime || item.publish_time || '',
        })));
        const categoryItems = Array.isArray(categoryRes?.data) ? categoryRes.data : [];
        const map = {};
        categoryItems.forEach(item => { map[String(item.id)] = item.name; });
        setCategoryMap(map);
      } catch (error) {
        // 加载失败时图表显示空数据，不阻断页面
      }
    };
    init();
  }, []);

  // 状态各数量的统计
  const stats = useMemo(() => {
    const result = { total: articles.length, active: 0, disabled: 0, draft: 0 };
    articles.forEach(item => {
      const s = normalizeStatus(item.status);
      if (s === 'active' || s === 'disabled' || s === 'draft') result[s]++;
    });
    return result;
  }, [articles]);

  // 1 饼图：状态分布
  const pieOption = useMemo(() => ({
    title: { text: '文章状态分布', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: {c} 篇 ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      data: [
        { value: stats.active,   name: 'active',   itemStyle: { color: '#52c41a' } },
        { value: stats.disabled, name: 'disabled', itemStyle: { color: '#ff4d4f' } },
        { value: stats.draft,    name: 'draft',    itemStyle: { color: '#faad14' } },
      ],
    }],
  }), [stats]);

  // 2 柱状图：分类文章数
  const barOption = useMemo(() => {
    const countMap = {};
    articles.forEach(item => {
      const name = item.categoryName
        || categoryMap[String(item.categoryId || item.category_id || '')]
        || '未分类';
      countMap[name] = (countMap[name] || 0) + 1;
    });
    const entries = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
    return {
      title: { text: '各分类文章数', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: entries.map(e => e[0]), axisLabel: { rotate: 20 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        type: 'bar',
        data: entries.map(e => e[1]),
        itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top' },
      }],
    };
  }, [articles, categoryMap]);

  // 3 折线图：近12个月发布趋势
  const lineOption = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const countMap = {};
    months.forEach(m => { countMap[m] = 0; });
    articles.forEach(item => {
      if (!item.publishTime) return;
      const parts = String(item.publishTime).replace(/-/g, '/').split('/');
      if (parts.length < 2) return;
      const key = `${parts[0]}/${parts[1].padStart(2, '0')}`;
      if (key in countMap) countMap[key]++;
    });
    return {
      title: { text: '近12个月发布趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: months.map(m => m.slice(5)), boundaryGap: false },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        type: 'line',
        data: months.map(m => countMap[m]),
        smooth: true,
        areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#1677ff' },
        symbol: 'circle',
        symbolSize: 6,
      }],
    };
  }, [articles]);

  return (
    <div style={{ padding: 4 }}>
      {/* 顶部统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="全部文章" value={stats.total} prefix={<FileTextOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="已发布" value={stats.active} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="已禁用" value={stats.disabled} prefix={<StopOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="草稿" value={stats.draft} prefix={<EditOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* 图表区 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card>
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card>
            <ReactECharts option={barOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24}>
          <Card>
            <ReactECharts option={lineOption} style={{ height: 260 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
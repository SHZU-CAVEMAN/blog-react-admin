import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOutlined,
  EditOutlined,
  FolderOpenOutlined,
  MessageOutlined,
  NotificationOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Steps, Tag, Typography } from 'antd';
import './index.less';

const { Paragraph, Text, Title } = Typography;

const Guide = () => {
  const navigate = useNavigate();

  const featureCards = useMemo(() => ([
    {
      key: 'article-list',
      title: '文章管理',
      description: '查看全部文章、修改状态、快速筛选和回填编辑内容。',
      icon: <BookOutlined />,
      actionText: '进入文章列表',
      path: '/article/list',
      tone: 'guide-feature-card article',
    },
    {
      key: 'article-create',
      title: '内容发布',
      description: '新建文章、撰写 Markdown 内容，并补充封面与摘要信息。',
      icon: <EditOutlined />,
      actionText: '开始写文章',
      path: '/article/create',
      tone: 'guide-feature-card create',
    },
    {
      key: 'category',
      title: '分类维护',
      description: '统一管理分类，保持文章内容结构清晰，方便后续统计分析。',
      icon: <FolderOpenOutlined />,
      actionText: '查看分类',
      path: '/article/category',
      tone: 'guide-feature-card category',
    },
    {
      key: 'comment',
      title: '互动管理',
      description: '集中处理评论、留言与友情链接，保持站点内容和互动质量。',
      icon: <MessageOutlined />,
      actionText: '查看评论',
      path: '/comment',
      tone: 'guide-feature-card comment',
    },
  ]), []);

  const quickActions = useMemo(() => ([
    { label: '文章列表', path: '/article/list' },
    { label: '写文章', path: '/article/create' },
    { label: '分类管理', path: '/article/category' },
    { label: '留言管理', path: '/message' },
    { label: '友情链接', path: '/friendLink' },
  ]), []);

  const usageSteps = useMemo(() => ([
    {
      title: '建立内容结构',
      description: '先维护分类，再开始录入文章，后续筛选和统计会更准确。',
    },
    {
      title: '撰写并发布文章',
      description: '进入文章创建页填写标题、摘要、封面和 Markdown 正文。',
    },
    {
      title: '检查文章状态',
      description: '在文章列表中查看 active、draft、disabled 状态并及时调整。',
    },
    {
      title: '处理站点互动',
      description: '定期检查评论、留言和友情链接，保持后台内容整洁。',
    },
  ]), []);

  return (
    <div className="guide-page">
      <Card className="guide-hero" bordered={false}>
        <div className="guide-hero__content">
          <Space size={12} wrap>
            <Tag color="blue">Guide</Tag>
            <Tag color="gold">Blog Admin</Tag>
          </Space>
          <Title level={2}>博客后台使用引导</Title>
          <Paragraph>
            这个页面的作用不是展示数据，而是告诉你这个后台主要能做什么、常用操作顺序是什么，以及下一步该去哪个页面继续工作。
          </Paragraph>
          <div className="guide-hero__tips">
            <span>
              <NotificationOutlined /> 先建分类，再写文章，最后回到列表确认状态。
            </span>
          </div>
          <Space wrap>
            <Button type="primary" size="large" onClick={() => navigate('/article/create')}>
              立即写文章
            </Button>
            <Button size="large" onClick={() => navigate('/article/list')}>
              查看文章列表
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {featureCards.map(item => (
          <Col xs={24} sm={12} xl={6} key={item.key}>
            <Card className={item.tone} hoverable>
              <div className="guide-feature-card__header">
                <div className="guide-feature-card__icon">{item.icon}</div>
                <Title level={4}>{item.title}</Title>
              </div>
              <Paragraph>{item.description}</Paragraph>
              <Button type="link" onClick={() => navigate(item.path)}>
                {item.actionText}
                <RightOutlined />
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} className="guide-content-row">
        <Col xs={24} lg={14}>
          <Card title="推荐使用步骤" className="guide-panel">
            <Steps
              direction="vertical"
              current={1}
              items={usageSteps}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="快捷入口" className="guide-panel quick-actions-card">
            <Space direction="vertical" size={12} className="guide-quick-actions">
              {quickActions.map(action => (
                <Button
                  key={action.path}
                  block
                  size="large"
                  onClick={() => navigate(action.path)}
                >
                  {action.label}
                </Button>
              ))}
            </Space>
            <div className="guide-note-box">
              <Text strong>使用建议</Text>
              <Paragraph>
                如果你是第一次进后台，优先进入分类管理和文章发布两个模块，这样后面的文章列表、首页统计和互动管理都会更顺手。
              </Paragraph>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Guide;
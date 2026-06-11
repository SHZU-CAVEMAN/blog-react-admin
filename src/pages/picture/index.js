import { Empty, Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const Picture = () => {
  return (
    <Card>
      <Title level={3}>图片管理</Title>
      <Paragraph type="secondary">
        这里用于后续管理文章图片、封面图或站点素材。
      </Paragraph>
      <Empty description="图片管理功能开发中" />
    </Card>
  );
};

export default Picture;
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Empty, Image, Input, Popconfirm, Row, Segmented, Space, Table, Typography, Upload, message } from 'antd';
import { DeleteOutlined, ReloadOutlined, UnorderedListOutlined, UploadOutlined, AppstoreOutlined } from '@ant-design/icons';
import { deletePictureFile, getPictureList, uploadSingleFile } from '@/api/upload';

const { Title, Paragraph, Text } = Typography;

const Picture = () => {
  const [pictureList, setPictureList] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showScope, setShowScope] = useState('original');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [deletingName, setDeletingName] = useState('');

  const isGeneratedVariant = (name, allNamesSet) => {
    const normalized = String(name || '').trim();
    if (!normalized) {
      return false;
    }
    if (/^zipped_/i.test(normalized) || /_origin\.[^.]+$/i.test(normalized)) {
      return true;
    }

    if (/\.(webp|avif)$/i.test(normalized)) {
      const stem = normalized.replace(/\.(webp|avif)$/i, '');
      const hasOriginalSibling = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'].some((ext) =>
        allNamesSet.has(`${stem}${ext}`)
      );
      return hasOriginalSibling;
    }

    return false;
  };

  const fetchPictures = async () => {
    try {
      setLoading(true);
      const list = await getPictureList();
      setPictureList(list);
    } catch (error) {
      message.error(error?.message || error?.msg || '获取图片列表失败');
      setPictureList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPictures();
  }, []);

  const filteredPictures = useMemo(() => {
    const allNamesSet = new Set(pictureList.map((item) => String(item.name || '').trim()));
    const visibleList = showScope === 'all'
      ? pictureList
      : pictureList.filter((item) => !isGeneratedVariant(item.name, allNamesSet));

    const nextKeyword = keyword.trim().toLowerCase();
    if (!nextKeyword) {
      return visibleList;
    }
    return visibleList.filter((item) => {
      return [item.name, item.url]
        .some((field) => String(field || '').toLowerCase().includes(nextKeyword));
    });
  }, [keyword, pictureList, showScope]);

  const handleUpload = async () => {
    if (!selectedFile) {
      message.warning('请先选择图片');
      return;
    }
    try {
      setUploading(true);
      const res = await uploadSingleFile(selectedFile);
      // 新返回格式已在公共 request 层判定成功/失败，这里直接使用成功结果
      message.success(res?.message || '图片上传成功');
      setSelectedFile(null);
      await fetchPictures();
    } catch (error) {
      message.error(error?.message || error?.msg || '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      setDeletingName(record.name);
      await deletePictureFile(record.name);
      message.success('图片已删除');
      await fetchPictures();
    } catch (error) {
      message.error(error?.message || error?.msg || '后台未提供图片删除接口');
    } finally {
      setDeletingName('');
    }
  };

  const renderGrid = () => {
    if (!filteredPictures.length) {
      return <Empty description="暂无图片" />;
    }

    return (
      <Row gutter={[16, 16]}>
        {filteredPictures.map((item) => (
          <Col xs={24} sm={12} md={8} xl={6} key={item.id}>
            <Card
              hoverable
              style={{ height: 420, display: 'flex', flexDirection: 'column' }}
              bodyStyle={{ height: 140, display: 'flex', alignItems: 'stretch' }}
              cover={(
                <div style={{ height: 220, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                  <Image src={item.url} alt={item.name} style={{ maxHeight: 220, objectFit: 'contain' }} />
                </div>
              )}
              actions={[
                <Popconfirm
                  key="delete"
                  title="确定删除这张图片吗？"
                  okText="确定"
                  cancelText="取消"
                  onConfirm={() => handleDelete(item)}
                >
                  <Button type="link" danger icon={<DeleteOutlined />} loading={deletingName === item.name}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <Space direction="vertical" size={6} style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text strong>
                  {item.name}
                </Text>
                <Paragraph copyable={{ text: item.url }} style={{ marginBottom: 0 }}>
                  {item.url}
                </Paragraph>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderList = () => {
    return (
      <Table
        rowKey="id"
        dataSource={filteredPictures}
        loading={loading}
        bordered
        pagination={{
          pageSize: 8,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      >
        <Table.Column
          title="预览"
          key="preview"
          width={120}
          render={(_, record) => <Image src={record.url} alt={record.name} width={80} height={80} style={{ objectFit: 'cover' }} />}
        />
        <Table.Column title="图片名称" dataIndex="name" key="name" width={180} />
        <Table.Column
          title="图片链接"
          dataIndex="url"
          key="url"
          render={(value) => <Paragraph copyable={{ text: value }} style={{ marginBottom: 0 }}>{value}</Paragraph>}
        />
        <Table.Column
          title="操作"
          key="action"
          width={120}
          render={(_, record) => (
            <Popconfirm
              title="确定删除这张图片吗？"
              okText="确定"
              cancelText="取消"
              onConfirm={() => handleDelete(record)}
            >
              <Button type="link" danger loading={deletingName === record.name}>
                删除
              </Button>
            </Popconfirm>
          )}
        />
      </Table>
    );
  };

  return (
    <Card>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Title level={3}>图片管理</Title>
          <Paragraph type="secondary">
            支持上传图片、删除图片，并查看后台 uploadFiles 下的全部图片，同时显示图片链接地址。
          </Paragraph>
        </div>

        <Space wrap>
          <Upload
            accept="image/*"
            beforeUpload={(file) => {
              if (!file.type || !file.type.startsWith('image/')) {
                message.warning('只能上传图片文件');
                return Upload.LIST_IGNORE;
              }
              setSelectedFile(file);
              return false;
            }}
            maxCount={1}
            showUploadList={selectedFile ? [{ uid: selectedFile.uid || selectedFile.name, name: selectedFile.name, status: 'done' }] : false}
            onRemove={() => {
              setSelectedFile(null);
            }}
          >
            <Button icon={<UploadOutlined />}>选择图片</Button>
          </Upload>
          <Button type="primary" onClick={handleUpload} loading={uploading}>
            上传
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchPictures} loading={loading}>
            刷新
          </Button>
          <Input
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="按图片名或链接查询"
            style={{ width: 260 }}
          />
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              { label: '网格', value: 'grid', icon: <AppstoreOutlined /> },
              { label: '列表', value: 'list', icon: <UnorderedListOutlined /> },
            ]}
          />
          <Segmented
            value={showScope}
            onChange={setShowScope}
            options={[
              { label: '原图', value: 'original' },
              { label: '全部', value: 'all' },
            ]}
          />
        </Space>

        {viewMode === 'grid' ? renderGrid() : renderList()}
      </Space>
    </Card>
  );
};

export default Picture;
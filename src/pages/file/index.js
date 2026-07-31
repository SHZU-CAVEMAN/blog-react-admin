import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Empty, Image, Input, List, Popconfirm, Row, Space, Tree, Typography, Upload, message } from 'antd';
import { DeleteOutlined, FolderAddOutlined, FolderOpenOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import {
  createFileDirectory,
  deleteDirectoryPicture,
  deleteFileDirectory,
  getDirectoryPictures,
  getFileDirectoryTree,
  uploadFileToDirectory,
} from '@/api/fileUpload';
import './index.less';

const { Paragraph, Text } = Typography;
const ROOT_KEY = '__root__';

const nodePathToKey = (pathValue) => (pathValue ? pathValue : ROOT_KEY);
const nodeKeyToPath = (keyValue) => (keyValue === ROOT_KEY ? '' : keyValue);

const toTreeData = (node) => {
  const children = Array.isArray(node?.children) ? node.children : [];
  return {
    title: node?.name || 'uploadFiles',
    key: nodePathToKey(node?.path || ''),
    children: children.map((child) => toTreeData(child)),
  };
};

const buildExpandedKeys = (node, acc = []) => {
  if (!node) {
    return acc;
  }
  const key = nodePathToKey(node.path || '');
  acc.push(key);
  const children = Array.isArray(node.children) ? node.children : [];
  children.forEach((child) => buildExpandedKeys(child, acc));
  return acc;
};

const toPathLabel = (pathValue) => {
  if (!pathValue) {
    return 'uploadFiles';
  }
  return `uploadFiles/${pathValue}`;
};

const formatFileSize = (size) => {
  if (size === undefined || size === null || size === '') {
    return '未知';
  }

  const num = Number(size);
  if (!Number.isFinite(num)) {
    return '未知';
  }

  if (num < 1024) {
    return `${num} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = num / 1024;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const FilePage = () => {
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([ROOT_KEY]);
  const [selectedKey, setSelectedKey] = useState(ROOT_KEY);
  const [files, setFiles] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [newDirName, setNewDirName] = useState('');
  const [recursiveDelete, setRecursiveDelete] = useState(false);

  const [treeLoading, setTreeLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingFileName, setDeletingFileName] = useState('');
  const [creatingDir, setCreatingDir] = useState(false);
  const [deletingDir, setDeletingDir] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const selectedPath = useMemo(() => nodeKeyToPath(selectedKey), [selectedKey]);

  const filteredFiles = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) {
      return files;
    }
    return files.filter((item) => [item.name, item.url, item.relativePath]
      .some((v) => String(v || '').toLowerCase().includes(k)));
  }, [files, keyword]);

  const fetchTree = async () => {
    try {
      setTreeLoading(true);
      const tree = await getFileDirectoryTree();
      const data = [toTreeData(tree)];
      setTreeData(data);
      setExpandedKeys(Array.from(new Set(buildExpandedKeys(tree))));
    } catch (error) {
      message.error(error?.message || error?.msg || '获取目录树失败');
      setTreeData([]);
    } finally {
      setTreeLoading(false);
    }
  };

  // 获取当前目录下的图片列表
  const fetchFiles = async (dirPath) => {
    try {
      setFilesLoading(true);
      const res = await getDirectoryPictures(dirPath);
      setFiles(Array.isArray(res?.files) ? res.files : []);
    } catch (error) {
      message.error(error?.message || error?.msg || '获取目录图片失败');
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  useEffect(() => {
    fetchFiles(selectedPath);
  }, [selectedPath]);

  const refreshAll = async () => {
    await fetchTree();
    await fetchFiles(selectedPath);
  };

  const handleCreateDir = async () => {
    const name = String(newDirName || '').trim();
    if (!name) {
      message.warning('请输入目录名');
      return;
    }

    try {
      setCreatingDir(true);
      await createFileDirectory({
        parentPath: selectedPath,
        name,
      });
      message.success('目录创建成功');
      setNewDirName('');
      await fetchTree();
    } catch (error) {
      message.error(error?.message || error?.msg || '目录创建失败');
    } finally {
      setCreatingDir(false);
    }
  };

  const handleDeleteDir = async () => {
    if (!selectedPath) {
      message.warning('根目录不允许删除');
      return;
    }

    try {
      setDeletingDir(true);
      await deleteFileDirectory({
        dirPath: selectedPath,
        recursive: recursiveDelete,
      });
      message.success('目录删除成功');
      setSelectedKey(ROOT_KEY);
      await fetchTree();
      await fetchFiles('');
    } catch (error) {
      message.error(error?.message || error?.msg || '目录删除失败');
    } finally {
      setDeletingDir(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      message.warning('请先选择图片');
      return;
    }

    try {
      setUploading(true);
      const res = await uploadFileToDirectory(selectedFile, selectedPath);
      message.success(res?.message || '上传成功');
      setSelectedFile(null);
      await fetchFiles(selectedPath);
    } catch (error) {
      message.error(error?.message || error?.msg || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (record) => {
    try {
      setDeletingFileName(record.name);
      await deleteDirectoryPicture({
        dirPath: selectedPath,
        fileName: record.name,
      });
      message.success('图片删除成功');
      await fetchFiles(selectedPath);
    } catch (error) {
      message.error(error?.message || error?.msg || '图片删除失败');
    } finally {
      setDeletingFileName('');
    }
  };

  return (
    <Card bodyStyle={{ padding: 8 }} className="file-page-card">
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Row gutter={8} className="file-page-layout">
          <Col xs={24} md={8} lg={7} xl={6}>
            <div className="file-page-sidebar">
              <Card
                title="目录树"
                size="small"
                bodyStyle={{ padding: 10, height: '100%' }}
                extra={<Button size="small" icon={<ReloadOutlined />} onClick={fetchTree} loading={treeLoading}>刷新</Button>}
                className="file-page-sidebar-card"
              >
                <div className="file-page-panel">
                  <Text type="secondary">当前目录：{toPathLabel(selectedPath)}</Text>

                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      value={newDirName}
                      onChange={(e) => setNewDirName(e.target.value)}
                      placeholder="在当前目录下新建子目录"
                    />
                    <Button type="primary" icon={<FolderAddOutlined />} onClick={handleCreateDir} loading={creatingDir}>
                      新建
                    </Button>
                  </Space.Compact>

                  <Space>
                    <Popconfirm
                      title={`确定删除目录 ${toPathLabel(selectedPath)} 吗？`}
                      description={recursiveDelete ? '将递归删除目录及全部内容' : '仅删除空目录'}
                      onConfirm={handleDeleteDir}
                      okText="删除"
                      cancelText="取消"
                      disabled={!selectedPath}
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        disabled={!selectedPath}
                        loading={deletingDir}
                      >
                        删除目录
                      </Button>
                    </Popconfirm>
                    <Button
                      icon={<FolderOpenOutlined />}
                      type={recursiveDelete ? 'primary' : 'default'}
                      onClick={() => setRecursiveDelete((v) => !v)}
                    >
                      {recursiveDelete ? '递归删除:开' : '递归删除:关'}
                    </Button>
                  </Space>

                  <div className="file-page-scroll-panel">
                    <Tree
                      showLine={{ showLeafIcon: false }}
                      blockNode
                      treeData={treeData}
                      selectedKeys={[selectedKey]}
                      expandedKeys={expandedKeys}
                      onExpand={(keys) => setExpandedKeys(keys)}
                      onSelect={(keys) => {
                        const nextKey = keys?.[0] || ROOT_KEY;
                        setSelectedKey(nextKey);
                      }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          </Col>

          <Col xs={24} md={16} lg={17} xl={18}>
            <Card title="目录图片" size="small" bodyStyle={{ padding: 10 }}>
              <div className="file-page-panel file-page-panel--right">
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
                    onRemove={() => setSelectedFile(null)}
                  >
                    <Button icon={<UploadOutlined />}>选择图片</Button>
                  </Upload>

                  <Button type="primary" onClick={handleUpload} loading={uploading}>上传到当前目录</Button>
                  <Button icon={<ReloadOutlined />} onClick={refreshAll} loading={filesLoading || treeLoading}>刷新</Button>
                  <Input
                    allowClear
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="按名称或路径搜索"
                    style={{ width: 260 }}
                  />
                </Space>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text type="secondary" className="file-page-meta-text">当前目录：{toPathLabel(selectedPath)}</Text>
                  <Text type="secondary" className="file-page-meta-text">共 {filteredFiles.length} 项</Text>
                </div>

                <div className="file-page-scroll-panel">
                  {filteredFiles.length > 0 ? (
                    <List
                      grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
                      dataSource={filteredFiles}
                      loading={filesLoading}
                      renderItem={(record) => (
                        <List.Item>
                          <Card
                            size="small"
                            style={{ height: '100%' }}
                            bodyStyle={{ padding: 12 }}
                            extra={
                              <Popconfirm
                                title="确定删除这张图片吗？"
                                okText="确定"
                                cancelText="取消"
                                onConfirm={() => handleDeleteFile(record)}
                              >
                                <Button type="link" danger size="small" loading={deletingFileName === record.name}>删除</Button>
                              </Popconfirm>
                            }
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fafafa', borderRadius: 6, padding: 8 }}>
                                <Image
                                  src={record.url}
                                  alt={record.name}
                                  width="100%"
                                  height={140}
                                  style={{ objectFit: 'cover', borderRadius: 6 }}
                                />
                              </div>
                              <Text strong ellipsis>{record.name}</Text>
                              <Text type="secondary" className="file-page-meta-text">
                                {record.relativePath || '-'}
                              </Text>
                              <Text type="secondary" className="file-page-meta-text">
                                {formatFileSize(record.size)}
                              </Text>
                              <Paragraph copyable={{ text: record.url }} className="file-page-meta-text" style={{ marginBottom: 0 }}>
                                {record.url}
                              </Paragraph>
                            </div>
                          </Card>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="当前目录下暂无图片" />
                  )}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Space>
    </Card>
  );
};

export default FilePage;

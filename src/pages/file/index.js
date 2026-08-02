import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Col, Empty, Image, Input, List, Modal, Popconfirm, Row, Space, Tree, Typography, Upload, message } from 'antd';
import { DeleteOutlined, FolderAddOutlined, FolderOpenOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import {
  createFileDirectory,
  deleteDirectoryPicture,
  deleteFileDirectory,
  getDirectoryPictures,
  getFileDirectoryTree,
  moveFileDirectories,
  uploadFileToDirectory,
} from '@/api/fileUpload';
import './index.less';

const { Paragraph, Text } = Typography;
const ROOT_KEY = '__root__';

// 将目录路径转换为树节点的唯一 key，根节点使用固定占位值。
const nodePathToKey = (pathValue) => (pathValue ? pathValue : ROOT_KEY);
// 将树节点的 key 还原为实际目录路径。
const nodeKeyToPath = (keyValue) => (keyValue === ROOT_KEY ? '' : keyValue);

// 把接口返回的目录结构转换为 Ant Design Tree 可识别的数据格式。
const toTreeData = (node) => {
  const children = Array.isArray(node?.children) ? node.children : [];
  return {
    title: node?.name || 'uploadFiles',
    key: nodePathToKey(node?.path || ''),
    children: children.map((child) => toTreeData(child)),
  };
};

// 递归收集所有节点的 key，用于默认展开整棵目录树。
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

// 将文件大小转换为更易读的展示格式，例如 1.5 MB。
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

// 把图片卡片单独抽成组件，让它只在自己的 props 变化时重渲染
const FileImageCard = memo(({
  record,
  selected,
  deletingFileName,
  onDelete,
  onToggleSelect,
}) => {
  return (
    <Card
      size="small"
      style={{ height: '100%' }}
      bodyStyle={{ padding: 12 }}
      extra={
        <Space size="small">
          <Popconfirm
            title="确定删除这张图片吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => onDelete(record)}
          >
            <Button type="link" danger size="small" loading={deletingFileName === record.name}>删除</Button>
          </Popconfirm>
          <Checkbox checked={selected} onChange={() => onToggleSelect(record.name)} />
        </Space>
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
  );
});

const FilePage = () => {
  // 目录树相关状态。
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([ROOT_KEY]);
  const [selectedKey, setSelectedKey] = useState(ROOT_KEY);
  const [files, setFiles] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [newDirName, setNewDirName] = useState('');
  const [recursiveDelete, setRecursiveDelete] = useState(false);
  const [selectedImageNames, setSelectedImageNames] = useState([]);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [moveTargetKey, setMoveTargetKey] = useState(ROOT_KEY);

  const [treeLoading, setTreeLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingFileName, setDeletingFileName] = useState('');
  const [creatingDir, setCreatingDir] = useState(false);
  const [deletingDir, setDeletingDir] = useState(false);
  const [movingFiles, setMovingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // 当前选中的目录路径，用于请求对应目录下的图片列表。
  const selectedPath = useMemo(() => nodeKeyToPath(selectedKey), [selectedKey]);
  const moveTargetPath = useMemo(() => nodeKeyToPath(moveTargetKey), [moveTargetKey]);

  const filteredFiles = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) {
      return files;
    }
    return files.filter((item) => [item.name, item.url, item.relativePath]
      .some((v) => String(v || '').toLowerCase().includes(k)));
  }, [files, keyword]);

  // 拉取目录树，并同步展开所有节点。
  const fetchTree = useCallback(async () => {
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
  }, []);

  // 获取当前目录下的图片列表。
  const fetchFiles = useCallback(async (dirPath) => {
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
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  useEffect(() => {
    fetchFiles(selectedPath);
  }, [fetchFiles, selectedPath]);

  // 一键刷新目录树和当前目录文件列表。
  const refreshAll = async () => {
    await fetchTree();
    await fetchFiles(selectedPath);
  };

  // 新建子目录。
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

  // 删除当前选中的目录。
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
  // 切换图片的选中状态。
  const toggleSelectedImage = useCallback((name) => {
    setSelectedImageNames((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  }, []);

  // 移动图片到指定目录
  const handleMoveFiles = async () => {
    if (!selectedImageNames.length) {
      message.warning('请先选择要移动的图片');
      return;
    }

    if (!moveTargetPath) {
      message.warning('请选择目标目录');
      return;
    }

    if (selectedPath === moveTargetPath) {
      message.warning('目标目录不能与当前目录相同');
      return;
    }

    try {
      setMovingFiles(true);
      await moveFileDirectories({
        fromPaths: selectedImageNames,
        toPath: moveTargetPath,
      });
      message.success('图片移动成功');
      setSelectedImageNames([]);
      setMoveTargetKey(ROOT_KEY);
      setMoveModalVisible(false);
      await fetchFiles(selectedPath);
    } catch (error) {
      message.error(error?.message || error?.msg || '图片移动失败');
    } finally {
      setMovingFiles(false);
    }
  };

  // 上传图片到当前目录。
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

  // 删除当前目录下的单张图片。
  const handleDeleteFile = useCallback(async (record) => {
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
  }, [fetchFiles, selectedPath]);

  return (
    // 页面整体容器，左侧为目录树，右侧为图片列表。
    <Card bodyStyle={{ padding: 8 }} className="file-page-card">
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Row gutter={8} className="file-page-layout">
          <Col xs={24} md={8} lg={7} xl={6}>
            {/* 左侧目录管理区域 */}
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
            {/* 右侧图片管理区域 */}
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
                  <Button
                    type="primary"
                    disabled={!selectedImageNames.length}
                    onClick={() => setMoveModalVisible(true)}
                  >
                    移动到新目录
                  </Button>
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
                  <Text type="secondary" className="file-page-meta-text">共 {filteredFiles.length} 项 / 已选 {selectedImageNames.length} 张</Text>
                </div>

                <div className="file-page-scroll-panel">
                  {filteredFiles.length > 0 ? (
                    <List
                      grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
                      dataSource={filteredFiles}
                      loading={filesLoading}
                      renderItem={(record) => (
                        <List.Item key={record.name}>
                          <FileImageCard
                            record={record}
                            selected={selectedImageNames.includes(record.name)}
                            deletingFileName={deletingFileName}
                            onDelete={handleDeleteFile}
                            onToggleSelect={toggleSelectedImage}
                          />
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
      <Modal
        title="选择目标目录"
        open={moveModalVisible}
        onCancel={() => setMoveModalVisible(false)}
        confirmLoading={movingFiles}
        onOk={handleMoveFiles}
        okText="确认移动"
        cancelText="取消"
      >
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">请选择要移动到的目录：</Text>
          <Tree
            style={{ marginTop: 8 }}
            showLine={{ showLeafIcon: false }}
            blockNode
            treeData={treeData}
            selectedKeys={[moveTargetKey]}
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys)}
            onSelect={(keys) => {
              const nextKey = keys?.[0] || ROOT_KEY;
              setMoveTargetKey(nextKey);
            }}
          />
        </div>
      </Modal>
    </Card>
  );
};

export default FilePage;

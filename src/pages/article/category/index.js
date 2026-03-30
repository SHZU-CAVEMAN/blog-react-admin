import { Space, Table, Button, Form, Input, Popconfirm, Collapse, Col, Row, message, Modal } from 'antd';
import { useState, useEffect } from 'react';
import { getCategoryList,mergeCategory } from '@/api/category'
const { Column } = Table;
const { Panel } = Collapse;

const ArticleCategory = () => {
  const [dataSource, setDataSource] = useState([]);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState(null);  //  当前是否在编辑
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 多选
  const [mergeModal, setMergeModal] = useState(false);
  const [mergeForm] = Form.useForm(); // 新的表单控制器（合并的modal上的）
  useEffect(() => {
    fetchList();
  }, []); //空数组表示 只在第一次加载时执行一次

  const fetchList = async () => {
    const res = await getCategoryList();
    //console.log(res)
    const list = res.data.map(item => ({
      ...item,
      key: item.id,
    }))
    setDataSource(list);
  };

  // 提交（新增 + 编辑）
  const handleSubmit = () => {
    form.validateFields().then(values => {
      // 处理 tags
      const newValues = {
        ...values,
        tags: values.tags ? values.tags.split(',') : [],
      };

      if (editingKey) {
        // 编辑
        setDataSource(prev =>
          prev.map(item =>
            item.key === editingKey ? { ...item, ...newValues } : item
          )
        );
      } else {
        // 新增
        setDataSource(prev => [
          ...prev,
          {
            key: Date.now().toString(),
            ...newValues,
          },
        ]);
      }
      // 清空
      form.resetFields();
      setEditingKey(null);
    });
  };

  //  编辑（回填核心）
  const handleEdit = (record) => {
    form.setFieldsValue({
      ...record,
    });
    setEditingKey(record.key);
  };

  //  删除
  const handleDelete = (key) => {
    setDataSource(prev => prev.filter(item => item.key !== key));
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys
  };
  const showMergeModal = () => {
    if (selectedRowKeys.length < 2) {
      message.warning('至少选择 2 个分类才能合并');
      return;
    }
    setMergeModal(true);
  };

  // 执行合并
  const handleMerge = async () => {
    const { newName } = await mergeForm.validateFields();
    // 选中的分类
    const selected = dataSource.filter(item => selectedRowKeys.includes(item.key)); //数组
    const mergeFormdata = mergeForm.getFieldsValue() //对象，属性为form的name名
  
    // 合并分类 接口
    const result = await mergeCategory({
      sourceIds: selected.map(s => s.id),
      name: mergeFormdata.newName,
      alias: mergeFormdata.newcategory_otherName,
      description: mergeFormdata.newIntro
    });
    if(result.status===200){
      message.success(`分类已合并为：${newName}`);
      setMergeModal(false);
      mergeForm.resetFields(); 
      setSelectedRowKeys([]);
    }else{
      message.error(result.msg);
      return;
    }

    
  };
  return (
    <>
      <Collapse
        defaultActiveKey={['1']}
        style={{ marginBottom: 16 }}
      >
        <Panel
          header="分类管理 使用说明"
          key="1"
        >
          <p>1. 分类名称：用于文章封面图自动归类存放，上传图片时会自动创建对应文件夹。</p>
          <p>2. 数量：系统自动统计当前分类下的图片/文章数量，不可手动修改。</p>
          <p>3. 说明：用于备注分类用途，方便后期管理维护。</p>
          <p>4. 合并分类：可将多个旧分类合并为新分类，文件会自动移动，路径自动更新。</p>
        </Panel>
      </Collapse>
      {/*  上方表单（一行两个） */}
      <Form form={form} layout="horizontal">
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="name"
              label="分类名"
              rules={[{ required: true, message: '请输入分类' }]}
            >
              <Input placeholder="请输入分类" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="category_otherName"
              label="别名"
              rules={[{ required: true, message: '请输入别名' }]}
            >
              <Input placeholder="请输入别名" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="number"
              label="数量"
              rules={[{ required: true, message: '请输入数量' }]}
            >
              <Input placeholder="请输入数量" disabled />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item>
              <Button type="primary" onClick={handleSubmit}>
                {editingKey ? '更新' : '新增'}
              </Button>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="intro"
              label="说明"
              rules={[{ required: true, message: '请输入说明' }]}
            >
              <Input placeholder="请输入说明" />
            </Form.Item>
          </Col>
          <Col span={6}></Col>
          <Col span={6}></Col>
          <Col span={6}>
            <Form.Item>
              <Button type="primary"
                onClick={showMergeModal}
                disabled={selectedRowKeys.length < 2}
              >
                合并
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {/*  表格 */}
      <Table
        rowSelection={rowSelection}
        dataSource={dataSource}
        bordered
        size="small"
        style={{ marginTop: 8 }}
        pagination={{
          pageSize: 8,          // 每页条数
          showSizeChanger: false, // 不允许用户修改每页数量
          showQuickJumper: true, // 可输入页码跳转
        }}
      >
        <Column title="分类名" dataIndex="name" key="name" />
        <Column title="别名" dataIndex="category_otherName" key="category_otherName" />
        <Column title="数量" dataIndex="number" key="number" />
        <Column title="说明" dataIndex="intro" key="intro" />
        <Column
          title="操作"
          key="action"
          render={(_, record) => (
            <Space>
              <Button type="link" onClick={() => handleEdit(record)}>
                编辑
              </Button>

              <Popconfirm
                title="确定删除这条数据吗？"
                onConfirm={() => handleDelete(record.key)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger>
                  删除
                </Button>
              </Popconfirm>

            </Space>
          )}
        />
      </Table>
      {/* 合并弹窗 */}
      <Modal
        title="合并分类"
        open={mergeModal}
        onOk={handleMerge}
        onCancel={() => setMergeModal(false)}
      >
        <Form form={mergeForm} layout="vertical">
          <Form.Item
            name="newName"
            label="新分类-名称"
            rules={[{ required: true, message: '请输入新分类名' }]}
          >
            <Input placeholder="例如：综合分类" />
          </Form.Item>
          <Form.Item
            name="newcategory_otherName"
            label="新分类-别名"
            rules={[{ required: true, message: '请输入新分类别名' }]}
          >
            <Input placeholder="例如：综合分类" />
          </Form.Item>
          <Form.Item
            name="newIntro"
            label="新分类-说明"
            rules={[{ required: true, message: '请输入新分类说明' }]}
          >
            <Input placeholder="例如：综合分类" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ArticleCategory;
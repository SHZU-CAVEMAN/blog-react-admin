import { useEffect, useState } from 'react';
import { Button, Card, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { createUser, getUserList, updateUser } from '@/api/user';
import './index.less';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'admin' },
  { value: 'user', label: 'user' },
];

const Permission = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editingValues, setEditingValues] = useState({
    account: '',
    email: '',
    role: 'user',
  });
  const [createValues, setCreateValues] = useState({
    account: '',
    password: '',
    email: '',
    role: 'user',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUserList();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const normalized = list.map((item, index) => ({
        id: item.id ?? item.userId ?? index,
        account: item.account || '',
        email: item.email || '',
        role: item.role === 'admin' ? 'admin' : 'user',
        telephone: item.telephone || '',
      }));
      setUsers(normalized);
    } catch (_) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isEditing = (record) => record.id === editingKey;

  const handleFieldChange = (field, value) => {
    setEditingValues((prev) => ({ ...prev, [field]: value }));
  };


  const startEdit = (record) => {
    setEditingKey(record.id);
    setEditingValues({
      account: record.account,
      email: record.email,
      role: record.role,
      telephone: record.telephone,
    });
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingKey(null);
    setEditingValues({
      account: '',
      email: '',
      role: 'user',
      telephone: '',
    });
  };
  
  // 保存编辑（修改用户信息）
  const saveEdit = (record) => {
    const { account, email, role, telephone } = editingValues;
    if (!account || !email || !role ) {
      message.warning('请完整填写用户信息');
      return;
    }

    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(email)) {
      message.warning('邮箱格式不正确');
      return;
    }

    const run = async () => {
      try {
        await updateUser({ id: record.id, account, email, role, telephone });
        const nextUsers = users.map((item) =>
          item.id === record.id ? { ...item, ...editingValues } : item
        );
        setUsers(nextUsers);
        message.success('用户信息已更新');
        cancelEdit();
      } catch (_) {
        message.error('更新用户失败');
      }
    };

    run();
  };

  const handleCreateFieldChange = (field, value) => {
    setCreateValues((prev) => ({ ...prev, [field]: value }));
  };

  const openCreateModal = () => {
    setCreateValues({
      account: '',
      password: '',
      email: '',
      role: 'user',
    });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateValues({
      account: '',
      password: '',
      email: '',
      role: 'user',
      telephone: '',
    });
  };
  // 新增用户
  const handleCreateUser = async () => {
    const { account, password, email, role, telephone } = createValues;
    if (!account || !password  || !role || !email ) {
      message.warning('请完整填写新增用户信息');
      return;
    }
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(email)) {
      message.warning('邮箱格式不正确');
      return;
    }

    try {
      setCreating(true);
      await createUser({ account, password, email, role, telephone });
      message.success('新增用户成功');
      closeCreateModal();
      fetchUsers();
    } catch (_) {
      message.error('新增用户失败');
    } finally {
      setCreating(false);
    }
  };

  const userColumns = [
    {
      title: '账号',
      dataIndex: 'account',
      key: 'account',
      render: (_, record) => {
        if (!isEditing(record)) return record.account;
        return (
          <Input
            value={editingValues.account}
            onChange={(e) => handleFieldChange('account', e.target.value)}
            placeholder="请输入账号"
          />
        );
      },
    },
    {
      title: '电话',
      dataIndex: 'telephone',
      key: 'telephone',
      render: (_, record) => {
        if (!isEditing(record)) return record.telephone;
        return (
          <Input
            value={editingValues.telephone}
            onChange={(e) => handleFieldChange('telephone', e.target.value)}
            placeholder="请输入电话"
          />
        );
      }
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (_, record) => {
        if (!isEditing(record)) return record.email;
        return (
          <Input
            value={editingValues.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="请输入邮箱"
          />
        );
      },
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => {
        if (!isEditing(record)) {
          return <Tag color={role === 'admin' ? 'gold' : 'blue'}>{role}</Tag>;
        }
        return (
          <Select
            value={editingValues.role}
            onChange={(value) => handleFieldChange('role', value)}
            options={ROLE_OPTIONS}
            style={{ width: 120 }}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        isEditing(record) ? (
          <Space size={8}>
            <Button type="link" size="small" onClick={() => saveEdit(record)}>
              保存
            </Button>
            <Button type="link" size="small" onClick={cancelEdit}>
              取消
            </Button>
          </Space>
        ) : (
          <Space size={8}>
            <Button
              type="link"
              size="small"
              onClick={() => startEdit(record)}
              disabled={editingKey !== null}
            >
              编辑
            </Button>
          </Space>
        )
      ),
    },
  ];

  return (
    <div className="permission-page">
        <Card
          title="用户表"
          className="permission-card"
          extra={(
            <Space>
              <Button onClick={fetchUsers} loading={loading}>刷新</Button>
              <Button type="primary" onClick={openCreateModal} disabled={editingKey !== null}>新增用户</Button>
            </Space>
          )}
        >
          <Table columns={userColumns} dataSource={users} rowKey="id" pagination={false} loading={loading} />
      </Card>

        <Modal
          title="新增用户"
          open={isCreateModalOpen}
          onCancel={closeCreateModal}
          footer={(
            <Space>
              <Button onClick={closeCreateModal}>取消</Button>
              <Button type="primary" onClick={handleCreateUser} loading={creating}>保存</Button>
            </Space>
          )}
          destroyOnClose
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Input
              value={createValues.account}
              onChange={(e) => handleCreateFieldChange('account', e.target.value)}
              placeholder="请输入账号"
            />
            <Input.Password
              value={createValues.password}
              onChange={(e) => handleCreateFieldChange('password', e.target.value)}
              placeholder="请输入密码"
            />
            <Input
              value={createValues.telephone}
              onChange={(e) => handleCreateFieldChange('telephone', e.target.value)}
              placeholder="请输入电话"
            />
            <Input
              value={createValues.email}
              onChange={(e) => handleCreateFieldChange('email', e.target.value)}
              placeholder="请输入邮箱"
            />
            <Select
              value={createValues.role}
              onChange={(value) => handleCreateFieldChange('role', value)}
              options={ROLE_OPTIONS}
            />
          </Space>
        </Modal>
    </div>
  );
};

export default Permission;
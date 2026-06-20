import { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Select, Input, DatePicker, message, Row, Col, Statistic, Tabs, Typography, Divider, Avatar, Popconfirm } from 'antd'
import { PlusOutlined, UserOutlined, TeamOutlined, LockOutlined, EditOutlined, DeleteOutlined, KeyOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { i18n } from '../i18n/uz'

const { Title, Text } = Typography

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  branch_id: string
  branch_name: string
  status: 'active' | 'inactive'
  last_login: string
  created_at: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  users_count: number
}

export function UserManagementPage() {
  const [activeTab, setActiveTab] = useState('users')
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [form] = Form.useForm()
  const [roleForm] = Form.useForm()

  // Demo users
  const [users, setUsers] = useState<User[]>([
    { id: 'U001', email: 'admin@amis-clinic.uz', first_name: 'Anvar', last_name: 'Karimov', role: 'super_admin', branch_id: 'B001', branch_name: 'Bosh filial', status: 'active', last_login: '2024-06-15 14:30', created_at: '2024-01-01' },
    { id: 'U002', email: 'doctor@amis-clinic.uz', first_name: 'Nodira', last_name: 'Karimova', role: 'doctor', branch_id: 'B001', branch_name: 'Bosh filial', status: 'active', last_login: '2024-06-15 12:00', created_at: '2024-01-15' },
    { id: 'U003', email: 'cashier@amis-clinic.uz', first_name: 'Bahodir', last_name: 'Rahimov', role: 'cashier', branch_id: 'B001', branch_name: 'Bosh filial', status: 'active', last_login: '2024-06-15 09:00', created_at: '2024-02-01' },
    { id: 'U004', email: 'nurse@amis-clinic.uz', first_name: 'Gulnora', last_name: 'Saidova', role: 'nurse', branch_id: 'B002', branch_name: 'Yunusobod filiali', status: 'active', last_login: '2024-06-14 18:00', created_at: '2024-02-15' },
    { id: 'U005', email: 'pharmacist@amis-clinic.uz', first_name: 'Jasur', last_name: 'Aliyev', role: 'pharmacist', branch_id: 'B001', branch_name: 'Bosh filial', status: 'inactive', last_login: '2024-06-01 10:00', created_at: '2024-03-01' },
    { id: 'U006', email: 'lab@amis-clinic.uz', first_name: 'Dilshod', last_name: 'Tojiyev', role: 'lab_technician', branch_id: 'B003', branch_name: 'Sergeli filiali', status: 'active', last_login: '2024-06-15 08:00', created_at: '2024-03-15' },
  ])

  // Demo roles
  const [roles, setRoles] = useState<Role[]>([
    { id: 'R001', name: 'super_admin', description: 'Barcha huquqlarga ega', permissions: ['*'], users_count: 1 },
    { id: 'R002', name: 'admin', description: 'Administrator', permissions: ['users:read', 'users:write', 'patients:*', 'appointments:*', 'reports:*'], users_count: 2 },
    { id: 'R003', name: 'doctor', description: 'Shifokor', permissions: ['patients:read', 'patients:write', 'appointments:*', 'diagnoses:*', 'prescriptions:*'], users_count: 15 },
    { id: 'R004', name: 'cashier', description: 'Kassir', permissions: ['patients:read', 'payments:*', 'invoices:read'], users_count: 5 },
    { id: 'R005', name: 'nurse', description: 'Hamshira', permissions: ['patients:read', 'vitals:write', 'appointments:read'], users_count: 10 },
    { id: 'R006', name: 'pharmacist', description: 'Farmatsevt', permissions: ['drugs:read', 'drugs:write', 'prescriptions:read', 'prescriptions:dispense'], users_count: 3 },
    { id: 'R007', name: 'lab_technician', description: 'Laborant', permissions: ['lab:read', 'lab:write', 'samples:*'], users_count: 4 },
  ])

  const roleColors: Record<string, string> = {
    super_admin: 'red',
    admin: 'orange',
    doctor: 'blue',
    cashier: 'green',
    nurse: 'cyan',
    pharmacist: 'purple',
    lab_technician: 'geekblue',
  }

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrator',
    doctor: 'Shifokor',
    cashier: 'Kassir',
    nurse: 'Hamshira',
    pharmacist: 'Farmatsevt',
    lab_technician: 'Laborant',
  }

  const allPermissions = [
    'patients:read', 'patients:write', 'patients:delete',
    'appointments:read', 'appointments:write', 'appointments:delete',
    'diagnoses:read', 'diagnoses:write', 'prescriptions:*',
    'payments:*', 'invoices:read', 'invoices:write',
    'users:read', 'users:write', 'users:delete',
    'reports:*', 'lab:*', 'radiology:*', 'drugs:*',
    'vitals:write', 'samples:*',
  ]

  const usersColumns = [
    { title: 'Foydalanuvchi', key: 'user', render: (_: any, r: User) => (
      <Space>
        <Avatar icon={<UserOutlined />} style={{ backgroundColor: roleColors[r.role] }} />
        <div>
          <div>{r.first_name} {r.last_name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text>
        </div>
      </Space>
    )},
    { title: 'Rol', dataIndex: 'role', key: 'role', render: (r: string) => <Tag color={roleColors[r]}>{roleLabels[r]}</Tag> },
    { title: 'Filial', dataIndex: 'branch_name', key: 'branch_name' },
    { title: 'Oxirgi kirish', dataIndex: 'last_login', key: 'last_login' },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'success' : 'default'}>{s === 'active' ? 'Faol' : 'Nofaol'}</Tag> },
    {
      title: 'Amal',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditUser(record)} />
          <Button size="small" icon={<KeyOutlined />} onClick={() => openResetPassword(record)} />
          <Popconfirm
            title="Foydalanuvchini o'chirish?"
            onConfirm={() => handleDeleteUser(record)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const rolesColumns = [
    { title: 'Rol nomi', dataIndex: 'name', key: 'name', render: (n: string) => <Tag color={roleColors[n]}>{roleLabels[n]}</Tag> },
    { title: 'Tavsif', dataIndex: 'description', key: 'description' },
    { title: 'Huquqlar', dataIndex: 'permissions', key: 'permissions', render: (p: string[]) => <Text type="secondary">{p.length} ta</Text> },
    { title: 'Foydalanuvchilar', dataIndex: 'users_count', key: 'users_count', render: (v: number) => <Tag>{v} ta</Tag> },
    {
      title: 'Amal',
      key: 'action',
      render: (_: any, record: Role) => (
        <Space>
          <Button size="small" onClick={() => openPermissions(record)}>Huquqlar</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditRole(record)} />
          {record.name !== 'super_admin' && (
            <Popconfirm
              title="Rulni o'chirish?"
              onConfirm={() => handleDeleteRole(record)}
              okText="Ha"
              cancelText="Yo'q"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const openEditUser = (user: User) => {
    setSelectedUser(user)
    form.setFieldsValue({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      branch_id: user.branch_id,
      status: user.status,
    })
    setUserModalOpen(true)
  }

  const openResetPassword = (user: User) => {
    Modal.confirm({
      title: 'Parolni tiklash',
      content: `${user.first_name} ${user.last_name} uchun parol tiklansinmi?`,
      okText: 'Tiklash',
      cancelText: 'Bekor',
      onOk: () => {
        message.success('Parol tiklandi. Yangi parol emailga yuborildi.')
      },
    })
  }

  const handleDeleteUser = (user: User) => {
    setUsers(users.filter(u => u.id !== user.id))
    message.success('Foydalanuvchi o\'chirildi')
  }

  const openPermissions = (role: Role) => {
    setSelectedRole(role)
    setPermissionsModalOpen(true)
  }

  const openEditRole = (role: Role) => {
    setSelectedRole(role)
    roleForm.setFieldsValue({
      name: role.name,
      description: role.description,
    })
    setRoleModalOpen(true)
  }

  const handleDeleteRole = (role: Role) => {
    setRoles(roles.filter(r => r.id !== role.id))
    message.success('Rol o\'chirildi')
  }

  const handleSubmitUser = (values: any) => {
    if (selectedUser) {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...values } : u))
      message.success('Foydalanuvchi yangilandi')
    } else {
      setUsers([...users, { ...values, id: 'U' + Date.now(), branch_name: 'Bosh filial', last_login: '-', created_at: new Date().toISOString().split('T')[0] }])
      message.success('Yangi foydalanuvchi qo\'shildi')
    }
    setUserModalOpen(false)
    form.resetFields()
    setSelectedUser(null)
  }

  const handleSubmitRole = (values: any) => {
    if (selectedRole) {
      setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, ...values } : r))
      message.success('Rol yangilandi')
    } else {
      setRoles([...roles, { ...values, id: 'R' + Date.now(), permissions: [], users_count: 0 }])
      message.success('Yangi rol qo\'shildi')
    }
    setRoleModalOpen(false)
    roleForm.resetFields()
    setSelectedRole(null)
  }

  const activeUsers = users.filter(u => u.status === 'active').length
  const doctorsCount = users.filter(u => u.role === 'doctor').length

  const tabItems = [
    {
      key: 'users',
      label: <span><UserOutlined /> Foydalanuvchilar</span>,
      children: (
        <Card>
          <Table columns={usersColumns} dataSource={users} rowKey="id" pagination={{ pageSize: 10 }} />
        </Card>
      ),
    },
    {
      key: 'roles',
      label: <span><TeamOutlined /> Rollar</span>,
      children: (
        <Card>
          <Table columns={rolesColumns} dataSource={roles} rowKey="id" pagination={false} />
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Foydalanuvchilar boshqaruvi</Title>
        </Col>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setSelectedUser(null); setUserModalOpen(true) }}>
              Foydalanuvchi qo'shish
            </Button>
            <Button icon={<TeamOutlined />} onClick={() => { roleForm.resetFields(); setSelectedRole(null); setRoleModalOpen(true) }}>
              Rol yaratish
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Jami foydalanuvchilar"
              value={users.length}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Faol foydalanuvchilar"
              value={activeUsers}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Shifokorlar"
              value={doctorsCount}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* User Modal */}
      <Modal
        title={selectedUser ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
        open={userModalOpen}
        onCancel={() => { setUserModalOpen(false); setSelectedUser(null); form.resetFields() }}
        onOk={() => form.submit()}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitUser}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ism" name="first_name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Familiya" name="last_name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Rol" name="role" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="admin">Administrator</Select.Option>
                  <Select.Option value="doctor">Shifokor</Select.Option>
                  <Select.Option value="cashier">Kassir</Select.Option>
                  <Select.Option value="nurse">Hamshira</Select.Option>
                  <Select.Option value="pharmacist">Farmatsevt</Select.Option>
                  <Select.Option value="lab_technician">Laborant</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Filial" name="branch_id" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="B001">Bosh filial</Select.Option>
                  <Select.Option value="B002">Yunusobod filiali</Select.Option>
                  <Select.Option value="B003">Sergeli filiali</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Holat" name="status" initialValue="active">
            <Select>
              <Select.Option value="active">Faol</Select.Option>
              <Select.Option value="inactive">Nofaol</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Role Modal */}
      <Modal
        title={selectedRole ? 'Roli tahrirlash' : 'Yangi rol'}
        open={roleModalOpen}
        onCancel={() => { setRoleModalOpen(false); setSelectedRole(null); roleForm.resetFields() }}
        onOk={() => roleForm.submit()}
        width={500}
      >
        <Form form={roleForm} layout="vertical" onFinish={handleSubmitRole}>
          <Form.Item label="Rol nomi" name="name" rules={[{ required: true }]}>
            <Input placeholder="masalan: lab_admin" />
          </Form.Item>
          <Form.Item label="Tavsif" name="description" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        title={`${selectedRole?.name} - Huquqlar`}
        open={permissionsModalOpen}
        onCancel={() => setPermissionsModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedRole && (
          <div>
            <Text type="secondary">{selectedRole.description}</Text>
            <Divider />
            <Row gutter={8}>
              {allPermissions.map(p => (
                <Col key={p} span={8} style={{ marginBottom: 8 }}>
                  <Tag color={selectedRole.permissions.includes(p) || selectedRole.permissions.includes('*') ? 'success' : 'default'}>
                    {p}
                  </Tag>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}
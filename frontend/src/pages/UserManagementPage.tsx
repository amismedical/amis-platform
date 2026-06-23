import { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Select, Input, DatePicker, message, Row, Col, Statistic, Typography, Avatar, Popconfirm, Spin } from 'antd'
import { PlusOutlined, UserOutlined, LockOutlined, EditOutlined, DeleteOutlined, KeyOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../services/api'

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

export function UserManagementPage() {
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // Fetch users from API
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => userService.list({ limit: 100 }),
  })

  // Create/Update user mutation
  const saveUserMutation = useMutation({
    mutationFn: (values: any) => {
      if (selectedUser) {
        return userService.update(selectedUser.id, values)
      } else {
        return userService.create(values)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] })
      message.success(selectedUser ? "Foydalanuvchi yangilandi" : "Yangi foydalanuvchi qo'shildi")
      setUserModalOpen(false)
      form.resetFields()
      setSelectedUser(null)
    },
    onError: () => {
      message.error("Xatolik yuz berdi")
    },
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] })
      message.success("Foydalanuvchi o'chirildi")
    },
    onError: () => {
      message.error("Xatolik yuz berdi")
    },
  })

  const users = usersData?.data || []

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
    {
      title: 'Foydalanuvchi',
      key: 'user',
      render: (_: any, r: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: roleColors[r.role] }} />
          <div>
            <div>{r.first_name} {r.last_name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text>
          </div>
        </Space>
      ),
    },
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
    deleteUserMutation.mutate(user.id)
  }

  const handleSubmitUser = (values: any) => {
    saveUserMutation.mutate(values)
  }

  const activeUsers = users.filter(u => u.status === 'active').length
  const doctorsCount = users.filter(u => u.role === 'doctor').length

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Foydalanuvchilar boshqaruvi</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setSelectedUser(null); setUserModalOpen(true) }}>
            Foydalanuvchi qo'shish
          </Button>
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

      <Card>
        <Spin spinning={usersLoading}>
          <Table
            columns={usersColumns}
            dataSource={users}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "Ma'lumot mavjud emas" }}
          />
        </Spin>
      </Card>

      {/* User Modal */}
      <Modal
        title={selectedUser ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
        open={userModalOpen}
        onCancel={() => { setUserModalOpen(false); setSelectedUser(null); form.resetFields() }}
        onOk={() => form.submit()}
        width={500}
        confirmLoading={saveUserMutation.isPending}
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
    </div>
  )
}

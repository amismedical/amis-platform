import { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, Row, Col, Typography, message, Popconfirm, Avatar, Statistic } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { staffService } from '../services/api'

const { Title, Text } = Typography

export function StaffManagementPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [searchText, setSearchText] = useState('')

  // Fetch staff list
  const { data: staffData, isLoading, refetch } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => staffService.list({ limit: 100 }),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return staffService.create({
        clinic_id: 'default-clinic-id', // Will be set by backend from auth context
        first_name: values.first_name,
        last_name: values.last_name,
        patronymic: values.patronymic || '',
        specialty: values.specialty || '',
        position: values.position,
        phone: values.phone,
        cabinet: values.cabinet || '',
        schedule: values.schedule || '',
        qualification: values.qualification || '',
      })
    },
    onSuccess: () => {
      message.success("Xodim muvaffaqiyatli qo'shildi!")
      setModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['staff-list'] })
      refetch()
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || "Xatolik yuz berdi")
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return staffService.update(id, data)
    },
    onSuccess: () => {
      message.success("Xodim ma'lumotlari yangilandi!")
      setModalOpen(false)
      form.resetFields()
      setSelectedStaff(null)
      queryClient.invalidateQueries({ queryKey: ['staff-list'] })
      refetch()
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || "Xatolik yuz berdi")
    },
  })

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      return staffService.deactivate(id)
    },
    onSuccess: () => {
      message.success("Xodim faolsizlantirildi!")
      queryClient.invalidateQueries({ queryKey: ['staff-list'] })
      refetch()
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || "Xatolik yuz berdi")
    },
  })

  const handleOpenCreate = () => {
    setSelectedStaff(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleOpenEdit = (staff: any) => {
    setSelectedStaff(staff)
    form.setFieldsValue({
      first_name: staff.first_name,
      last_name: staff.last_name,
      patronymic: staff.patronymic,
      specialty: staff.specialty,
      position: staff.position,
      phone: staff.phone,
      cabinet: staff.cabinet,
      schedule: staff.schedule,
      qualification: staff.qualification,
    })
    setModalOpen(true)
  }

  const handleSubmit = (values: any) => {
    if (selectedStaff) {
      updateMutation.mutate({ id: selectedStaff.id, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const columns = [
    {
      title: 'Xodim',
      key: 'name',
      render: (_: any, record: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#722ed1' }} />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.last_name} {record.first_name}
              {record.patronymic ? ' ' + record.patronymic : ''}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Lavozim',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => (
        <Tag color={getPositionColor(position)}>{position || 'Kiritilmagan'}</Tag>
      ),
    },
    {
      title: 'Mutaxassislik',
      dataIndex: 'specialty',
      key: 'specialty',
      render: (specialty: string) => specialty || '-',
    },
    {
      title: 'Kabinet',
      dataIndex: 'cabinet',
      key: 'cabinet',
      render: (cabinet: string) => cabinet ? `Kabinet ${cabinet}` : '-',
    },
    {
      title: 'Holat',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (is_active: boolean) => (
        <Tag color={is_active ? 'success' : 'default'}>
          {is_active ? 'Faol' : 'Nofaol'}
        </Tag>
      ),
    },
    {
      title: 'Amal',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          />
          <Popconfirm
            title="Xodimni faolsizlantirishni tasdiqlaysizmi?"
            description="Xodim tizimga kirish huquqini yo'qotadi."
            onConfirm={() => deactivateMutation.mutate(record.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const filteredData = staffData?.data?.filter((s: any) => {
    if (!searchText) return true
    const search = searchText.toLowerCase()
    return (
      s.first_name?.toLowerCase().includes(search) ||
      s.last_name?.toLowerCase().includes(search) ||
      s.patronymic?.toLowerCase().includes(search) ||
      s.phone?.includes(search) ||
      s.specialty?.toLowerCase().includes(search) ||
      s.position?.toLowerCase().includes(search)
    )
  }) || []

  const activeCount = staffData?.data?.filter((s: any) => s.is_active).length || 0
  const doctorCount = staffData?.data?.filter((s: any) => s.position?.toLowerCase().includes('shifokor') || s.specialty).length || 0

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Xodimlar boshqaruvi</Title>
          <Text type="secondary">Klinika xodimlarini boshqarish</Text>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            Xodim qo'shish
          </Button>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Jami xodimlar"
              value={staffData?.total || 0}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Faol xodimlar"
              value={activeCount}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Shifokorlar"
              value={doctorCount}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Input
          placeholder="Qidirish... (ism, familiya, telefon, mutaxassislik)"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300, marginBottom: 16 }}
        />
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={selectedStaff ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); setSelectedStaff(null) }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Familiya"
                name="last_name"
                rules={[{ required: true, message: "Familiyani kiriting" }]}
              >
                <Input placeholder="Familiya" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Ism"
                name="first_name"
                rules={[{ required: true, message: "Ismni kiriting" }]}
              >
                <Input placeholder="Ism" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Otchestvo" name="patronymic">
                <Input placeholder="Otchestvo (ixtiyoriy)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Telefon"
                name="phone"
                rules={[{ required: true, message: "Telefonni kiriting" }]}
              >
                <Input placeholder="+998 XX XXX XX XX" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Lavozim"
                name="position"
                rules={[{ required: true, message: "Lavozimni tanlang" }]}
              >
                <Select placeholder="Lavozimni tanlang">
                  <Select.Option value="shifokor">Shifokor</Select.Option>
                  <Select.Option value="hamshira">Hamshira</Select.Option>
                  <Select.Option value="kassir">Kassir</Select.Option>
                  <Select.Option value="administrator">Administrator</Select.Option>
                  <Select.Option value="laborant">Laborant</Select.Option>
                  <Select.Option value="farmatsevt">Farmatsevt</Select.Option>
                  <Select.Option value="boshqa">Boshqa</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mutaxassislik" name="specialty">
                <Input placeholder="Mutaxassislik (masalan: Kardiolog)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Kabinet" name="cabinet">
                <Select placeholder="Kabinetni tanlang" allowClear>
                  <Select.Option value="101">101</Select.Option>
                  <Select.Option value="102">102</Select.Option>
                  <Select.Option value="103">103</Select.Option>
                  <Select.Option value="104">104</Select.Option>
                  <Select.Option value="201">201</Select.Option>
                  <Select.Option value="202">202</Select.Option>
                  <Select.Option value="203">203</Select.Option>
                  <Select.Option value="204">204</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Malaka" name="qualification">
                <Input placeholder="Malaka darajasi" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Ish jadvali" name="schedule">
            <Input placeholder="Masalan: Dush-Shan 9:00-18:00" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setModalOpen(false); form.resetFields(); setSelectedStaff(null) }}>
                Bekor qilish
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {selectedStaff ? "Yangilash" : "Qo'shish"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function getPositionColor(position: string): string {
  const colors: Record<string, string> = {
    shifokor: 'blue',
    hamshira: 'cyan',
    kassir: 'green',
    administrator: 'orange',
    laborant: 'purple',
    farmatsevt: 'magenta',
  }
  return colors[position?.toLowerCase()] || 'default'
}

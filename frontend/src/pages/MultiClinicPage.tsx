import { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Select, Input, DatePicker, message, Row, Col, Statistic, Tabs, Typography, Divider, Steps, Descriptions, Badge, Spin } from 'antd'
import { PlusOutlined, HomeOutlined, AppstoreOutlined, TeamOutlined, SettingOutlined, GlobalOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { i18n, formatDate } from '../i18n/uz'
import { clinicService, branchService } from '../services/api'

const { Title, Text } = Typography

export function MultiClinicPage() {
  const [activeTab, setActiveTab] = useState('clinics')
  const [clinicModalOpen, setClinicModalOpen] = useState(false)
  const [branchModalOpen, setBranchModalOpen] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState<any>(null)
  const [form] = Form.useForm()
  const [branchForm] = Form.useForm()
  const queryClient = useQueryClient()

  // Fetch clinics from API
  const { data: clinicsData, isLoading: clinicsLoading } = useQuery({
    queryKey: ['clinics-list'],
    queryFn: () => clinicService.list(),
  })

  // Fetch branches from API
  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches-list'],
    queryFn: () => branchService.list(),
  })

  const clinics = clinicsData?.data || []
  const branches = branchesData?.data || []

  const statusColors: Record<string, string> = {
    active: 'success',
    inactive: 'default',
    suspended: 'error',
  }

  const statusLabels: Record<string, string> = {
    active: 'Faol',
    inactive: 'Nofaol',
    suspended: "To'xtatilgan",
  }

  const roleColors: Record<string, string> = {
    admin: 'red',
    doctor: 'blue',
    nurse: 'green',
    cashier: 'purple',
  }

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    doctor: 'Shifokor',
    nurse: 'Hamshira',
    cashier: 'Kassir',
  }

  const clinicsColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: (id: string) => <Tag color="blue">{id}</Tag> },
    { title: 'Nomi', dataIndex: 'name', key: 'name' },
    { title: 'Manzil', dataIndex: 'address', key: 'address' },
    { title: 'Telefon', dataIndex: 'phone', key: 'phone' },
    { title: 'Filiallar', dataIndex: 'branches', key: 'branches', render: (v: number) => <Tag color="processing">{v} ta</Tag> },
    { title: 'Bemorlar', dataIndex: 'patients', key: 'patients' },
    { title: 'Shifokorlar', dataIndex: 'doctors', key: 'doctors' },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Badge status={s === 'active' ? 'success' : 'default'} text={statusLabels[s] || s} /> },
    {
      title: 'Amal',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => viewClinicDetails(record)}>Tafsilotlar</Button>
          <Button size="small" type="primary" onClick={() => { setSelectedClinic(record); setBranchModalOpen(true); branchForm.resetFields() }}>Filial qo'shish</Button>
        </Space>
      ),
    },
  ]

  const branchesColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: (id: string) => <Tag color="blue">{id}</Tag> },
    { title: 'Filial nomi', dataIndex: 'name', key: 'name' },
    { title: 'Klinika', dataIndex: 'clinic_id', key: 'clinic_id', render: (id: string) => clinics.find(c => c.id === id)?.name || id },
    { title: 'Manzil', dataIndex: 'address', key: 'address' },
    { title: 'Menejer', dataIndex: 'manager', key: 'manager' },
    { title: 'Telefon', dataIndex: 'phone', key: 'phone' },
    { title: 'Shifokorlar', dataIndex: 'doctors', key: 'doctors' },
    { title: 'Xodimlar', dataIndex: 'staff', key: 'staff' },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Badge status={s === 'active' ? 'success' : 'default'} text={statusLabels[s] || s} /> },
    {
      title: 'Amal',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => viewBranchDetails(record)}>Tafsilotlar</Button>
        </Space>
      ),
    },
  ]

  const viewClinicDetails = (clinic: any) => {
    const clinicBranches = branches.filter(b => b.clinic_id === clinic.id)
    Modal.info({
      title: clinic.name,
      width: 700,
      content: (
        <div>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="ID">{clinic.id}</Descriptions.Item>
            <Descriptions.Item label="Telefon">{clinic.phone}</Descriptions.Item>
            <Descriptions.Item label="Email">{clinic.email}</Descriptions.Item>
            <Descriptions.Item label="Manzil" span={2}>{clinic.address}</Descriptions.Item>
            <Descriptions.Item label="Bemorlar">{clinic.patients}</Descriptions.Item>
            <Descriptions.Item label="Shifokorlar">{clinic.doctors}</Descriptions.Item>
          </Descriptions>
          <Divider>Filiallar ({clinicBranches.length} ta)</Divider>
          {clinicBranches.map(b => (
            <Card key={b.id} size="small" style={{ marginBottom: 8 }}>
              <Row justify="space-between">
                <Col>
                  <Text strong>{b.name}</Text>
                  <div><Text type="secondary">{b.address}</Text></div>
                </Col>
                <Col>
                  <Badge status={b.status === 'active' ? 'success' : 'default'} text={statusLabels[b.status] || b.status} />
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      ),
    })
  }

  const viewBranchDetails = (branch: any) => {
    const clinic = clinics.find(c => c.id === branch.clinic_id)
    Modal.info({
      title: branch.name,
      width: 600,
      content: (
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="ID">{branch.id}</Descriptions.Item>
          <Descriptions.Item label="Klinika">{clinic?.name}</Descriptions.Item>
          <Descriptions.Item label="Manzil">{branch.address}</Descriptions.Item>
          <Descriptions.Item label="Telefon">{branch.phone}</Descriptions.Item>
          <Descriptions.Item label="Menejer">{branch.manager}</Descriptions.Item>
          <Descriptions.Item label="Shifokorlar">{branch.doctors} ta</Descriptions.Item>
          <Descriptions.Item label="Xodimlar">{branch.staff} ta</Descriptions.Item>
          <Descriptions.Item label="Holat"><Badge status={branch.status === 'active' ? 'success' : 'default'} text={statusLabels[branch.status] || branch.status} /></Descriptions.Item>
        </Descriptions>
      ),
    })
  }

  // Create clinic mutation
  const createClinicMutation = useMutation({
    mutationFn: (data: any) => clinicService.create(data),
    onSuccess: () => {
      message.success("Yangi klinika qo'shildi")
      queryClient.invalidateQueries({ queryKey: ['clinics-list'] })
      setClinicModalOpen(false)
      form.resetFields()
    },
    onError: () => {
      message.error("Xatolik yuz berdi")
    },
  })

  // Create branch mutation
  const createBranchMutation = useMutation({
    mutationFn: (data: any) => branchService.create(data),
    onSuccess: () => {
      message.success("Yangi filial qo'shildi")
      queryClient.invalidateQueries({ queryKey: ['branches-list'] })
      queryClient.invalidateQueries({ queryKey: ['clinics-list'] })
      setBranchModalOpen(false)
      branchForm.resetFields()
    },
    onError: () => {
      message.error("Xatolik yuz berdi")
    },
  })

  const handleSubmitClinic = (values: any) => {
    createClinicMutation.mutate(values)
  }

  const handleSubmitBranch = (values: any) => {
    createBranchMutation.mutate({
      clinic_id: selectedClinic?.id,
      ...values,
    })
  }

  const activeClinics = clinics.filter(c => c.is_active === true || c.status === 'active').length
  const totalBranches = branches.length
  const totalPatients = clinics.reduce((sum, c) => sum + (c.patients || 0), 0)
  const totalDoctors = clinics.reduce((sum, c) => sum + (c.doctors || 0), 0)

  const tabItems = [
    {
      key: 'clinics',
      label: <span><HomeOutlined /> Klinikalar</span>,
      children: (
        <Card>
          <Spin spinning={clinicsLoading}>
            <Table
              columns={clinicsColumns}
              dataSource={clinics}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: "Ma'lumot mavjud emas" }}
            />
          </Spin>
        </Card>
      ),
    },
    {
      key: 'branches',
      label: <span><AppstoreOutlined /> Filiallar</span>,
      children: (
        <Card>
          <Spin spinning={branchesLoading}>
            <Table
              columns={branchesColumns}
              dataSource={branches}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: "Ma'lumot mavjud emas" }}
            />
          </Spin>
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Klinikalar boshqaruvi</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setClinicModalOpen(true) }}>
            Yangi klinika
          </Button>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Faol klinikalar"
              value={activeClinics}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Jami filiallar"
              value={totalBranches}
              prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Jami bemorlar"
              value={totalPatients}
              prefix={<TeamOutlined style={{ color: '#00d4aa' }} />}
              valueStyle={{ color: '#00d4aa' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Jami shifokorlar"
              value={totalDoctors}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* New Clinic Modal */}
      <Modal
        title="Yangi klinika qo'shish"
        open={clinicModalOpen}
        onCancel={() => setClinicModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitClinic}>
          <Form.Item label="Klinika nomi" name="name" rules={[{ required: true }]}>
            <Input placeholder="Klinika nomi" />
          </Form.Item>
          <Form.Item label="Manzil" name="address" rules={[{ required: true }]}>
            <Input placeholder="To'liq manzil" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Telefon" name="phone" rules={[{ required: true }]}>
                <Input placeholder="+998..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="email@clinics.uz" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* New Branch Modal */}
      <Modal
        title={`${selectedClinic?.name} - Yangi filial`}
        open={branchModalOpen}
        onCancel={() => setBranchModalOpen(false)}
        onOk={() => branchForm.submit()}
        width={500}
      >
        <Form form={branchForm} layout="vertical" onFinish={handleSubmitBranch}>
          <Form.Item label="Filial nomi" name="name" rules={[{ required: true }]}>
            <Input placeholder="Filial nomi" />
          </Form.Item>
          <Form.Item label="Manzil" name="address" rules={[{ required: true }]}>
            <Input placeholder="To'liq manzil" />
          </Form.Item>
          <Form.Item label="Telefon" name="phone" rules={[{ required: true }]}>
            <Input placeholder="+998..." />
          </Form.Item>
          <Form.Item label="Menejer" name="manager" rules={[{ required: true }]}>
            <Input placeholder="Menejer FIO" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
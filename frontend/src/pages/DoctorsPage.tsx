import { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, Row, Col, Typography, message, Avatar, Statistic } from 'antd'
import { PlusOutlined, EditOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { staffService } from '../services/api'

const { Title, Text } = Typography

export function DoctorsPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [searchText, setSearchText] = useState('')

  // Fetch doctors (filtered by specialty or position containing doctor)
  const { data: doctorsData, isLoading, refetch } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => staffService.list({ limit: 100 }),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return staffService.create({
        clinic_id: 'default-clinic-id',
        first_name: values.first_name,
        last_name: values.last_name,
        patronymic: values.patronymic || '',
        specialty: values.specialty,
        position: 'shifokor',
        phone: values.phone,
        cabinet: values.cabinet || '',
        schedule: values.schedule || '',
        qualification: values.qualification || '',
      })
    },
    onSuccess: () => {
      message.success("Shifokor muvaffaqiyatli qo'shildi!")
      setModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['doctors-list'] })
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
      message.success("Shifokor ma'lumotlari yangilandi!")
      setModalOpen(false)
      form.resetFields()
      setSelectedDoctor(null)
      queryClient.invalidateQueries({ queryKey: ['doctors-list'] })
      queryClient.invalidateQueries({ queryKey: ['staff-list'] })
      refetch()
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || "Xatolik yuz berdi")
    },
  })

  const handleOpenCreate = () => {
    setSelectedDoctor(null)
    form.resetFields()
    form.setFieldValue('position', 'shifokor')
    setModalOpen(true)
  }

  const handleOpenEdit = (doctor: any) => {
    setSelectedDoctor(doctor)
    form.setFieldsValue({
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      patronymic: doctor.patronymic,
      specialty: doctor.specialty,
      position: doctor.position || 'shifokor',
      phone: doctor.phone,
      cabinet: doctor.cabinet,
      schedule: doctor.schedule,
      qualification: doctor.qualification,
    })
    setModalOpen(true)
  }

  const handleSubmit = (values: any) => {
    if (selectedDoctor) {
      updateMutation.mutate({ id: selectedDoctor.id, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const columns = [
    {
      title: 'Shifokor',
      key: 'name',
      render: (_: any, record: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
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
      title: 'Mutaxassislik',
      dataIndex: 'specialty',
      key: 'specialty',
      render: (specialty: string) => (
        <Tag color="blue">{specialty || 'Umumiy shifokor'}</Tag>
      ),
    },
    {
      title: 'Kabinet',
      dataIndex: 'cabinet',
      key: 'cabinet',
      render: (cabinet: string) => cabinet ? `Kabinet ${cabinet}` : '-',
    },
    {
      title: 'Malaka',
      dataIndex: 'qualification',
      key: 'qualification',
      render: (qualification: string) => qualification || '-',
    },
    {
      title: 'Ish jadvali',
      dataIndex: 'schedule',
      key: 'schedule',
      render: (schedule: string) => schedule || '-',
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
        </Space>
      ),
    },
  ]

  // Filter to show only doctors (those with specialty or position containing doctor-related terms)
  const filteredData = doctorsData?.data?.filter((d: any) => {
    const isDoctor = d.position?.toLowerCase().includes('shifokor') ||
                     d.position?.toLowerCase().includes('doctor') ||
                     d.specialty

    if (!isDoctor) return false

    if (!searchText) return true
    const search = searchText.toLowerCase()
    return (
      d.first_name?.toLowerCase().includes(search) ||
      d.last_name?.toLowerCase().includes(search) ||
      d.patronymic?.toLowerCase().includes(search) ||
      d.phone?.includes(search) ||
      d.specialty?.toLowerCase().includes(search)
    )
  }) || []

  const activeCount = filteredData.filter((d: any) => d.is_active).length

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Shifokorlar ro'yxati</Title>
          <Text type="secondary">Klinika shifokorlarini boshqarish</Text>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            Shifokor qo'shish
          </Button>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Jami shifokorlar"
              value={filteredData.length}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Faol shifokorlar"
              value={activeCount}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
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
        title={selectedDoctor ? "Shifokorni tahrirlash" : "Yangi shifokor qo'shish"}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); setSelectedDoctor(null) }}
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
                label="Mutaxassislik"
                name="specialty"
                rules={[{ required: true, message: "Mutaxassislikni tanlang" }]}
              >
                <Select placeholder="Mutaxassislikni tanlang">
                  <Select.Option value="Kardiolog">Kardiolog</Select.Option>
                  <Select.Option value="Nevrolog">Nevrolog</Select.Option>
                  <Select.Option value="Travmatolog">Travmatolog</Select.Option>
                  <Select.Option value="Pediatr">Pediatr</Select.Option>
                  <Select.Option value="Ginekolog">Ginekolog</Select.Option>
                  <Select.Option value="Urolog">Urolog</Select.Option>
                  <Select.Option value="Oftalmolog">Oftalmolog</Select.Option>
                  <Select.Option value="LOR">LOR (Otolaringolog)</Select.Option>
                  <Select.Option value="Dermatolog">Dermatolog</Select.Option>
                  <Select.Option value="Endokrinolog">Endokrinolog</Select.Option>
                  <Select.Option value="Gastroenterolog">Gastroenterolog</Select.Option>
                  <Select.Option value="Pulmonolog">Pulmonolog</Select.Option>
                  <Select.Option value="Onkolog">Onkolog</Select.Option>
                  <Select.Option value="Rentgenolog">Rentgenolog</Select.Option>
                  <Select.Option value="Terapevt">Terapevt</Select.Option>
                  <Select.Option value="Chirurg">Chirurg</Select.Option>
                  <Select.Option value="Anestiziolog">Anestiziolog</Select.Option>
                  <Select.Option value="Stomatolog">Stomatolog</Select.Option>
                  <Select.Option value="Psixiatr">Psixiatr</Select.Option>
                  <Select.Option value="Allergolog">Allergolog</Select.Option>
                </Select>
              </Form.Item>
            </Col>
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
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Malaka" name="qualification">
                <Input placeholder="Masalan: Oliy, Birinchi daraja" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Lavozim" name="position">
                <Input defaultValue="shifokor" disabled />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Ish jadvali" name="schedule">
            <Input placeholder="Masalan: Dush-Shan 9:00-18:00" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setModalOpen(false); form.resetFields(); setSelectedDoctor(null) }}>
                Bekor qilish
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {selectedDoctor ? "Yangilash" : "Qo'shish"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

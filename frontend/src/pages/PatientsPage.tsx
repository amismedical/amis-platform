import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Typography, Input, Button, Space, Tag, Card, Row, Col, Modal, Form, Select, DatePicker, message } from 'antd'
import { UserAddOutlined, SearchOutlined, UserOutlined, MedicineBoxOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { patientService } from '../services/api'
import { i18n, formatDate } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title } = Typography

export function PatientsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['patients', searchValue],
    queryFn: () => patientService.list({ limit: 50, search: searchValue }),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        ...values,
        birth_date: values.birth_date?.format('YYYY-MM-DD') || values.birth_date,
      }
      return patientService.create(payload)
    },
    onSuccess: () => {
      message.success('Bemor muvaffaqiyatli yaratildi')
      setCreateModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Bemor yaratishda xatolik yuz berdi')
    },
  })

  const handleCreatePatient = (values: any) => {
    createMutation.mutate(values)
  }

  const columns = [
    {
      title: 'MED-ID',
      key: 'med_id',
      width: 160,
      render: (_: any, record: any) => (
        <span style={{ fontFamily: 'monospace', color: '#d4af37', fontWeight: 600 }}>
          {record.med_id || <span style={{ color: '#8c8c8c' }}>—</span>}
        </span>
      ),
    },
    {
      title: i18n.patients.fullName,
      key: 'name',
      render: (_: any, record: any) =>
        `${record.last_name} ${record.first_name} ${record.patronymic || ''}`,
    },
    {
      title: i18n.patients.birthDate,
      dataIndex: 'birth_date',
      key: 'birth_date',
      render: (date: string) => formatDate(date),
    },
    {
      title: i18n.patients.gender,
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => (gender === 'male' ? i18n.patients.male : i18n.patients.female),
    },
    {
      title: i18n.patients.phone,
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Viloyat',
      key: 'region',
      width: 130,
      render: (_: any, record: any) => record.passport_region_code ? (
        <Tag color="blue">{record.passport_region_code}</Tag>
      ) : <span style={{ color: '#8c8c8c' }}>—</span>,
    },
    {
      title: i18n.patients.citizenship,
      dataIndex: 'citizenship',
      key: 'citizenship',
    },
    {
      title: i18n.patients.balance,
      dataIndex: 'deposit_balance',
      key: 'deposit_balance',
      render: (balance: number) => `${balance.toLocaleString()} UZS`,
    },
    {
      title: i18n.patients.status,
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? i18n.patients.active : i18n.patients.inactive}
        </Tag>
      ),
    },
    {
      title: i18n.patients.actions,
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<UserOutlined />}
            onClick={() => navigate(`/patients/${record.id}`)}
            style={{ color: '#d4af37' }}
          >
            Profil
          </Button>
          <Button
            type="link"
            icon={<MedicineBoxOutlined />}
            onClick={() => navigate(`/patients/${record.id}/medical-card`)}
            style={{ color: '#52c41a' }}
          >
            Tibbiy karta
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>{i18n.patients.title}</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => setCreateModalOpen(true)}>
            {i18n.patients.addPatient}
          </Button>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder={i18n.patients.searchPlaceholder}
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
          />
        </Space>

        <Table
          columns={columns}
          dataSource={data?.data}
          loading={isLoading}
          pagination={{
            total: data?.total,
            pageSize: data?.limit,
            current: data?.page,
          }}
          rowKey="id"
        />
      </Card>

      {/* Create Patient Modal */}
      <Modal
        title={i18n.patients.addPatient}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePatient}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="last_name"
                label="Familiya"
                rules={[{ required: true, message: 'Familiya kiritish majburiy' }]}
              >
                <Input placeholder="Familiyani kiriting" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="first_name"
                label="Ism"
                rules={[{ required: true, message: 'Ism kiritish majburiy' }]}
              >
                <Input placeholder="Ismni kiriting" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patronymic" label="Sharifi">
                <Input placeholder="Sharif (ixtiyoriy)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="birth_date"
                label="Tug'ilgan sana"
                rules={[{ required: true, message: "Tug'ilgan sanani tanlash majburiy" }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Sanani tanlang" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="Jins"
                rules={[{ required: true, message: 'Jinsni tanlash majburiy' }]}
              >
                <Select placeholder="Jinsni tanlang">
                  <Select.Option value="male">Erkak</Select.Option>
                  <Select.Option value="female">Ayol</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Telefon"
                rules={[{ required: true, message: 'Telefon raqamini kiritish majburiy' }]}
              >
                <Input placeholder="+998901234567" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone_2" label="Qo'shimcha telefon">
                <Input placeholder="+998901234568" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Elektron pochta">
                <Input placeholder="email@example.com" type="email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="passport_region_code" label="Viloyat kodi">
                <Select placeholder="Viloyatni tanlang">
                  <Select.Option value="QRQ">QRQ — Qoraqalpog'iston</Select.Option>
                  <Select.Option value="AND">AND — Andijon</Select.Option>
                  <Select.Option value="BUX">BUX — Buxoro</Select.Option>
                  <Select.Option value="FAR">FAR — Farg'ona</Select.Option>
                  <Select.Option value="JIZ">JIZ — Jizzax</Select.Option>
                  <Select.Option value="XOR">XOR — Xorazm</Select.Option>
                  <Select.Option value="NAM">NAM — Namangan</Select.Option>
                  <Select.Option value="NAV">NAV — Navoiy</Select.Option>
                  <Select.Option value="QAS">QAS — Qashqadaryo</Select.Option>
                  <Select.Option value="SAM">SAM — Samarqand</Select.Option>
                  <Select.Option value="SIR">SIR — Sirdaryo</Select.Option>
                  <Select.Option value="SUR">SUR — Surxondaryo</Select.Option>
                  <Select.Option value="TAS">TAS — Toshkent viloyati</Select.Option>
                  <Select.Option value="TSH">TSH — Toshkent shahri</Select.Option>
                  <Select.Option value="FRN">FRN — Chet el fuqaroligi</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="passport" label="Pasport">
                <Input placeholder="AA1234567" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="citizenship" label="Fuqarolik">
                <Input placeholder="O'zbekiston" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Manzil">
            <Input.TextArea rows={2} placeholder="Toshkent, Yunusobod tumani, ..." />
          </Form.Item>

          <Form.Item name="notes" label="Izoh">
            <Input.TextArea rows={2} placeholder="Bemor haqida qo'shimcha ma'lumot" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCreateModalOpen(false)
                form.resetFields()
              }}>
                Bekor qilish
              </Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                Bemor yaratish
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
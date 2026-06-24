/**
 * AMIS - Patient Registration (Search-First Workflow)
 * Module 2: Search → Results → Select existing OR Create new
 * No page reload, toast notifications, duplicate warning
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Typography, Card, Row, Col, Form, Input, Select, DatePicker,
  Button, Space, message, Divider, Table, Tag, Alert, Modal,
  Spin, Badge
} from 'antd'
import {
  ArrowLeftOutlined, UserAddOutlined, SearchOutlined,
  WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  PhoneOutlined, IdcardOutlined, UserOutlined
} from '@ant-design/icons'
import { patientService } from '../services/api'
import { i18n } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// Duplicate detection threshold
const DUPLICATE_THRESHOLD = 2 // minimum characters for duplicate search

export function PatientRegistrationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [mode, setMode] = useState<'search' | 'register'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  // Search patients
  const { data: searchResults, isLoading: searchLoadingQuery } = useQuery({
    queryKey: ['patient-search', searchQuery],
    queryFn: () => {
      if (searchQuery.length < DUPLICATE_THRESHOLD) return Promise.resolve({ data: [] })
      return patientService.list({ search: searchQuery, limit: 20 })
    },
    enabled: searchQuery.length >= DUPLICATE_THRESHOLD,
  })

  // Check for duplicates when typing
  useEffect(() => {
    if (searchQuery.length >= DUPLICATE_THRESHOLD && searchResults?.data?.length > 0) {
      setDuplicateWarning(true)
    } else {
      setDuplicateWarning(false)
    }
  }, [searchQuery, searchResults])

  // Create patient mutation
  const createMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        ...values,
        birth_date: values.birth_date?.format('YYYY-MM-DD') || values.birth_date,
      }
      return patientService.create(payload)
    },
    onSuccess: (data) => {
      message.success({ content: 'Bemor muvaffaqiyatli ro\'yxatga olindi!', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> })
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      if (data?.id) {
        navigate(`/patients/${data.id}`)
      } else {
        navigate('/patients')
      }
    },
    onError: (error: any) => {
      message.error({
        content: error?.response?.data?.message || 'Bemor yaratishda xatolik yuz berdi',
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      })
    },
  })

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setSelectedPatient(null)
    setDuplicateWarning(false)
  }

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient)
    Modal.confirm({
      title: 'Bemor tanlandi',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: (
        <div>
          <p><strong>{patient.last_name} {patient.first_name} {patient.patronymic || ''}</strong></p>
          <p>Telefon: {patient.phone}</p>
          <p>Tug'ilgan sana: {patient.birth_date}</p>
        </div>
      ),
      okText: 'Medkartaga o\'tish',
      cancelText: 'Boshqa bemor qidirish',
      onOk: () => {
        navigate(`/patients/${patient.id}`)
      },
      onCancel: () => {
        setSelectedPatient(null)
      },
    })
  }

  const handleCreatePatient = (values: any) => {
    createMutation.mutate(values)
  }

  const startRegistration = () => {
    setMode('register')
    form.setFieldsValue({ citizenship: "O'zbekiston" })
  }

  const searchResultsData = searchResults?.data || []

  const patientColumns = [
    {
      title: 'FIO',
      key: 'name',
      render: (_: any, record: any) => (
        <Space>
          <UserOutlined style={{ color: '#d4af37' }} />
          <Text strong style={{ color: '#fff' }}>
            {record.last_name} {record.first_name} {record.patronymic || ''}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => <Text style={{ color: '#8c8c8c' }}>{phone}</Text>,
    },
    {
      title: 'Tug\'ilgan sana',
      dataIndex: 'birth_date',
      key: 'birth_date',
      render: (date: string) => date ? dayjs(date).format('DD.MM.YYYY') : '-',
    },
    {
      title: 'Jins',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => (
        <Tag color={gender === 'male' ? 'blue' : 'pink'}>
          {gender === 'male' ? 'Erkak' : 'Ayol'}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleSelectPatient(record)}
        >
          Tanlash
        </Button>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <Row align="middle" style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/patients')}
          style={{ marginRight: 16, color: '#d4af37' }}
        >
          Bemorlar ro'yxatiga qaytish
        </Button>
      </Row>

      {/* Search Mode */}
      {mode === 'search' && (
        <Card
          style={{
            background: 'rgba(13,26,48,0.8)',
            border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 12,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <UserAddOutlined style={{ fontSize: 64, color: '#d4af37', marginBottom: 16 }} />
            <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
              Bemor ro'yxatga olish
            </Title>
            <Text style={{ color: '#8c8c8c', fontSize: 14 }}>
              Telefon, FISH yoki pasport raqami bilan qidirish orqali mavjud bemorni tanlang<br />
              yoki yangi bemor yarating
            </Text>
          </div>

          {/* Search Input */}
          <div style={{ maxWidth: 600, margin: '0 auto 24px' }}>
            <Input.Search
              placeholder="Telefon, FISH yoki pasport raqami bilan qidiring..."
              prefix={<SearchOutlined style={{ color: '#d4af37' }} />}
              size="large"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              loading={searchLoadingQuery}
              enterButton={
                <Button type="primary" style={{ background: '#d4af37', borderColor: '#d4af37' }}>
                  Qidirish
                </Button>
              }
              style={{ borderRadius: 8 }}
            />
          </div>

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <Alert
              message="Mavjud bemor topildi!"
              description="Siz kiritgan ma'lumotga o'xshash bemorlar mavjud. Iltimos, ro'yxatdan tanlang yoki yangi bemor yaratishda davom eting."
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{
                maxWidth: 600,
                margin: '0 auto 24px',
                background: 'rgba(250,173,20,0.1)',
                border: '1px solid rgba(250,173,20,0.3)',
              }}
            />
          )}

          {/* Search Results */}
          {searchQuery.length >= DUPLICATE_THRESHOLD && (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Text style={{ color: '#8c8c8c' }}>
                  {searchResultsData.length > 0
                    ? `${searchResultsData.length} ta bemor topildi`
                    : 'Bemorlar topilmadi'}
                </Text>
              </Row>

              {searchResultsData.length > 0 ? (
                <Table
                  columns={patientColumns}
                  dataSource={searchResultsData}
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  style={{
                    background: 'rgba(26,42,74,0.5)',
                    borderRadius: 8,
                  }}
                />
              ) : (
                !searchLoadingQuery && searchQuery.length >= DUPLICATE_THRESHOLD && (
                  <div style={{ textAlign: 'center', padding: 32 }}>
                    <ExclamationCircleOutlined style={{ fontSize: 48, color: '#8c8c8c', marginBottom: 16 }} />
                    <Text style={{ color: '#8c8c8c', display: 'block' }}>
                      Bu bemor ro'yxatda yo'q
                    </Text>
                  </div>
                )
              )}
            </div>
          )}

          {/* Create New Button */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Button
              type="primary"
              size="large"
              icon={<UserAddOutlined />}
              onClick={startRegistration}
              style={{
                background: '#d4af37',
                borderColor: '#d4af37',
                color: '#000',
                height: 48,
                paddingLeft: 32,
                paddingRight: 32,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Yangi bemor yaratish
            </Button>
          </div>
        </Card>
      )}

      {/* Register Mode */}
      {mode === 'register' && (
        <Card
          style={{
            background: 'rgba(13,26,48,0.8)',
            border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 12,
          }}
        >
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <div>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>
                <UserAddOutlined style={{ marginRight: 8, color: '#d4af37' }} />
                Yangi bemor ma'lumotlari
              </Title>
            </div>
            <Button onClick={() => setMode('search')} style={{ color: '#d4af37' }}>
              Qidirishga qaytish
            </Button>
          </Row>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreatePatient}
            initialValues={{
              citizenship: "O'zbekiston",
            }}
          >
            {/* Full Name Section */}
            <Text strong style={{ display: 'block', marginBottom: 8, color: '#d4af37' }}>
              Shaxsiy ma'lumotlar
            </Text>
            <Divider style={{ marginTop: 8, marginBottom: 16, borderColor: 'rgba(212,175,55,0.2)' }} />

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="last_name"
                  label={<span style={{ color: '#8c8c8c' }}>Familiya *</span>}
                  rules={[{ required: true, message: 'Familiya kiritish majburiy' }]}
                >
                  <Input
                    placeholder="Familiyani kiriting"
                    size="large"
                    style={{ background: 'rgba(26,42,74,0.5)', borderColor: 'rgba(212,175,55,0.3)' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="first_name"
                  label={<span style={{ color: '#8c8c8c' }}>Ism *</span>}
                  rules={[{ required: true, message: 'Ism kiritish majburiy' }]}
                >
                  <Input
                    placeholder="Ismni kiriting"
                    size="large"
                    style={{ background: 'rgba(26,42,74,0.5)', borderColor: 'rgba(212,175,55,0.3)' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="patronymic" label={<span style={{ color: '#8c8c8c' }}>Sharifi</span>}>
                  <Input
                    placeholder="Sharif (ixtiyoriy)"
                    size="large"
                    style={{ background: 'rgba(26,42,74,0.5)', borderColor: 'rgba(212,175,55,0.3)' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Birth Info */}
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="birth_date"
                  label={<span style={{ color: '#8c8c8c' }}>Tug'ilgan sana *</span>}
                  rules={[{ required: true, message: "Tug'ilgan sanani tanlash majburiy" }]}
                >
                  <DatePicker
                    style={{ width: '100%', background: 'rgba(26,42,74,0.5)', borderColor: 'rgba(212,175,55,0.3)' }}
                    format="YYYY-MM-DD"
                    placeholder="Sanani tanlang"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="gender"
                  label={<span style={{ color: '#8c8c8c' }}>Jins *</span>}
                  rules={[{ required: true, message: 'Jinsni tanlash majburiy' }]}
                >
                  <Select
                    placeholder="Jinsni tanlang"
                    size="large"
                    style={{ background: 'rgba(26,42,74,0.5)' }}
                    options={[
                      { value: 'male', label: 'Erkak' },
                      { value: 'female', label: 'Ayol' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="citizenship" label={<span style={{ color: '#8c8c8c' }}>Fuqarolik</span>}>
                  <Input
                    placeholder="O'zbekiston"
                    size="large"
                    style={{ background: 'rgba(26,42,74,0.5)', borderColor: 'rgba(212,175,55,0.3)' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Contact Info */}
            <Text strong style={{ display: 'block', marginBottom: 8, marginTop: 24, color: '#d4af37' }}>
              Bog'lanish ma'lumotlari
            </Text>
            <Divider style={{ marginTop: 8, marginBottom: 16, borderColor: 'rgba(212,175,55,0.2)' }} />

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="phone"
                  label={<span style={{ color: '#8c8c8c' }}>Telefon *</span>}
                  rules={[
                    { required: true, message: 'Telefon raqamini kiritish majburiy' },
                    { pattern: /^\+?[0-9]{9,15}$/, message: 'Telefon raqam noto\'g\'ri' }
                  ]}
                >
                  <Input
                    placeholder="+998901234567"
                    prefix={<PhoneOutlined style={{ color: '#d4af37' }} />}
                    size="large"
                    style={{ background: 'rgba(26,42,74,0.5)', borderColor: 'rgba(212,175,55,0.3)' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="phone_2" label={<span style={{ color: '#8c8c8c' }}>Qo'shimcha telefon</span>}>
                  <Input
                    placeholder="+998901234568"
                    prefix={<PhoneOutlined style={{ color: '#8c8c8c' }} />}
                    size="large"
                    style={{ background: 'rgba(26,42,74,0.5)', borderColor: 'rgba(212,175,55,0.3)' }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="email" label={<span style={{ color: '#8c8c8c' }}>Elektron pochta</span>}>
                  <Input
                    placeholder="email@example.com"
                    type="email"
                    size="large"
                    style={{ background: 'rgba(26,42,74,0.5)', borderColor: 'rgba(212,175,55,0.3)' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Document Info */}
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="passport" label={<span style={{ color: '#8c8c8c' }}>Pasport (AA1234567)</span>}>
                  <Input
                    placeholder="AA1234567"
                    prefix={<IdcardOutlined style={{ color: '#d4af37' }} />}
                    size="large"
                    style={{ background: 'rgba(26,42,74,0.5)', borderColor: 'rgba(212,175,55,0.3)' }}
                  />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item name="address" label={<span style={{ color: '#8c8c8c' }}>Manzil</span>}>
                  <Input.TextArea
                    rows={1}
                    placeholder="Toshkent, Yunusobod tumani, ..."
                    size="large"
                    style={{ background: 'rgba(26,42,74,0.5)', borderColor: 'rgba(212,175,55,0.3)' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Notes */}
            <Form.Item name="notes" label={<span style={{ color: '#8c8c8c' }}>Izoh</span>}>
              <Input.TextArea
                rows={2}
                placeholder="Bemor haqida qo'shimcha ma'lumot"
                style={{ background: 'rgba(26,42,74,0.5)', borderColor: 'rgba(212,175,55,0.3)' }}
              />
            </Form.Item>

            {/* Actions */}
            <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
              <Space>
                <Button
                  onClick={() => setMode('search')}
                  size="large"
                >
                  Bekor qilish
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createMutation.isPending}
                  size="large"
                  style={{
                    minWidth: 150,
                    background: '#d4af37',
                    borderColor: '#d4af37',
                    color: '#000',
                  }}
                >
                  Ro'yxatga olish
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  )
}

/**
 * AMIS - Patient Registration with 3-Step Wizard
 * Search-first workflow → 3-step compact wizard with passport_region_code
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Typography, Card, Row, Col, Form, Input, Select, DatePicker,
  Button, Space, message, Divider, Table, Tag, Alert, Modal,
  Steps, Badge
} from 'antd'
import {
  ArrowLeftOutlined, UserAddOutlined, SearchOutlined,
  WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  PhoneOutlined, IdcardOutlined, UserOutlined,
  SolutionOutlined, FileTextOutlined, SafetyCertificateOutlined
} from '@ant-design/icons'
import { patientService } from '../services/api'
import { i18n } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const DUPLICATE_THRESHOLD = 2

// Uzbekistan regions for MED-ID
const REGION_OPTIONS = [
  { value: 'QRQ', label: 'QRQ — Qoraqalpog\'iston Respublikasi' },
  { value: 'AND', label: 'AND — Andijon' },
  { value: 'BUX', label: 'BUX — Buxoro' },
  { value: 'FAR', label: 'FAR — Farg\'ona' },
  { value: 'JIZ', label: 'JIZ — Jizzax' },
  { value: 'XOR', label: 'XOR — Xorazm' },
  { value: 'NAM', label: 'NAM — Namangan' },
  { value: 'NAV', label: 'NAV — Navoiy' },
  { value: 'QAS', label: 'QAS — Qashqadaryo' },
  { value: 'SAM', label: 'SAM — Samarqand' },
  { value: 'SIR', label: 'SIR — Sirdaryo' },
  { value: 'SUR', label: 'SUR — Surxondaryo' },
  { value: 'TAS', label: 'TAS — Toshkent viloyati' },
  { value: 'TSH', label: 'TSH — Toshkent shahri' },
  { value: 'FRN', label: 'FRN — Chet el fuqaroligi' },
]

export function PatientRegistrationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [mode, setMode] = useState<'search' | 'register'>('search')
  const [currentStep, setCurrentStep] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [duplicateWarning, setDuplicateWarning] = useState(false)

  // Search patients
  const { data: searchResults, isLoading: searchLoadingQuery } = useQuery({
    queryKey: ['patient-search', searchQuery],
    queryFn: () => {
      if (searchQuery.length < DUPLICATE_THRESHOLD) return Promise.resolve({ data: [] })
      return patientService.list({ search: searchQuery, limit: 20 })
    },
    enabled: searchQuery.length >= DUPLICATE_THRESHOLD,
  })

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
      message.success({ content: `Bemor muvaffaqiyatli ro'yxatga olindi! MED-ID: ${data.med_id || ''}`, icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> })
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

  const handleSelectPatient = (patient: any) => {
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
      onOk: () => navigate(`/patients/${patient.id}`),
      onCancel: () => setSelectedPatient(null),
    })
  }

  const startRegistration = () => {
    setMode('register')
    setCurrentStep(0)
    form.setFieldsValue({ citizenship: "O'zbekiston" })
  }

  const handleNextStep = () => {
    form.validateFields(['last_name', 'first_name', 'birth_date', 'gender', 'phone'])
      .then(() => setCurrentStep(1))
      .catch(() => {})
  }

  const handlePrevStep = () => setCurrentStep(0)

  const handleSubmit = (values: any) => {
    createMutation.mutate(values)
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
      title: 'MED-ID',
      key: 'med_id',
      render: (_: any, record: any) => (
        <Text style={{ color: '#d4af37', fontFamily: 'monospace' }}>{record.med_id || '-'}</Text>
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
        <Button type="primary" size="small" onClick={() => handleSelectPatient(record)}>
          Tanlash
        </Button>
      ),
    },
  ]

  const stepItems = [
    {
      title: 'Shaxsiy',
      icon: <UserOutlined />,
    },
    {
      title: 'Hujjatlar',
      icon: <IdcardOutlined />,
    },
    {
      title: 'Tasdiqlash',
      icon: <SafetyCertificateOutlined />,
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
              Mavjud bemorni qidiring yoki yangi bemor yarating
            </Text>
          </div>

          <div style={{ maxWidth: 600, margin: '0 auto 24px' }}>
            <Input.Search
              placeholder="Telefon, FISH yoki pasport raqami bilan qidiring..."
              prefix={<SearchOutlined style={{ color: '#d4af37' }} />}
              size="large"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setDuplicateWarning(false)
              }}
              loading={searchLoadingQuery}
              enterButton={
                <Button type="primary" style={{ background: '#d4af37', borderColor: '#d4af37' }}>
                  Qidirish
                </Button>
              }
            />
          </div>

          {duplicateWarning && (
            <Alert
              message="Mavjud bemor topildi!"
              description="Siz kiritgan ma'lumotga o'xshash bemorlar mavjud."
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

          {searchQuery.length >= DUPLICATE_THRESHOLD && (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Text style={{ color: '#8c8c8c' }}>
                  {searchResultsData.length > 0 ? `${searchResultsData.length} ta bemor topildi` : 'Bemorlar topilmadi'}
                </Text>
              </Row>

              {searchResultsData.length > 0 ? (
                <Table
                  columns={patientColumns}
                  dataSource={searchResultsData}
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  style={{ background: 'rgba(26,42,74,0.5)', borderRadius: 8 }}
                />
              ) : (
                !searchLoadingQuery && (
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

      {/* Register Mode — 3-Step Wizard */}
      {mode === 'register' && (
        <Card
          style={{
            background: 'rgba(13,26,48,0.8)',
            border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 12,
          }}
          bodyStyle={{ padding: '24px 32px' }}
        >
          {/* Step Header */}
          <Steps
            current={currentStep}
            items={stepItems}
            style={{ marginBottom: 32 }}
          />

          <Form
            form={form}
            layout="vertical"
            initialValues={{ citizenship: "O'zbekiston", passport_region_code: 'TSH' }}
          >
            {/* STEP 1: Personal Info */}
            {currentStep === 0 && (
              <div>
                <Title level={5} style={{ color: '#d4af37', marginBottom: 16 }}>
                  1-qadam — Shaxsiy ma'lumotlar
                </Title>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="last_name"
                      label="Familiya *"
                      rules={[{ required: true, message: 'Familiya kiritish majburiy' }]}
                    >
                      <Input placeholder="Familiyani kiriting" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="first_name"
                      label="Ism *"
                      rules={[{ required: true, message: 'Ism kiritish majburiy' }]}
                    >
                      <Input placeholder="Ismni kiriting" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="patronymic" label="Sharifi">
                      <Input placeholder="Sharif (ixtiyoriy)" size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="birth_date"
                      label="Tug'ilgan sana *"
                      rules={[{ required: true, message: "Tug'ilgan sanani tanlash majburiy" }]}
                    >
                      <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Sanani tanlang" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="gender"
                      label="Jins *"
                      rules={[{ required: true, message: 'Jinsni tanlash majburiy' }]}
                    >
                      <Select placeholder="Jinsni tanlang" size="large">
                        <Select.Option value="male">Erkak</Select.Option>
                        <Select.Option value="female">Ayol</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="phone"
                      label="Telefon *"
                      rules={[
                        { required: true, message: 'Telefon raqamini kiritish majburiy' },
                        { pattern: /^\+?[0-9]{9,15}$/, message: 'Telefon raqam noto\'g\'ri' }
                      ]}
                    >
                      <Input placeholder="+998901234567" prefix={<PhoneOutlined />} size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="phone_2" label="Qo'shimcha telefon">
                      <Input placeholder="+998901234568" prefix={<PhoneOutlined />} size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ textAlign: 'right', marginTop: 16 }}>
                  <Button onClick={() => { setMode('search'); setCurrentStep(0) }} style={{ marginRight: 8 }}>
                    Bekor qilish
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleNextStep}
                    style={{ background: '#d4af37', borderColor: '#d4af37', color: '#000' }}
                    icon={<SolutionOutlined />}
                  >
                    Keyingi qadam
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Documents */}
            {currentStep === 1 && (
              <div>
                <Title level={5} style={{ color: '#d4af37', marginBottom: 16 }}>
                  2-qadam — Hujjatlar va manzil
                </Title>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="passport_region_code"
                      label="Viloyat kodi (MED-ID uchun) *"
                      rules={[{ required: true, message: 'Viloyat kodini tanlash majburiy' }]}
                    >
                      <Select
                        placeholder="Viloyatni tanlang"
                        size="large"
                        showSearch
                        options={REGION_OPTIONS}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="passport" label="Pasport raqami">
                      <Input placeholder="AA1234567" prefix={<IdcardOutlined />} size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="citizenship" label="Fuqaroligi">
                      <Input placeholder="O'zbekiston" size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="email" label="Email">
                      <Input placeholder="email@example.com" type="email" size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="address" label="Manzil">
                  <Input.TextArea rows={2} placeholder="Toshkent, Yunusobod tumani, ..." size="large" />
                </Form.Item>

                <Form.Item name="notes" label="Izoh (ixtiyoriy)">
                  <Input.TextArea rows={2} placeholder="Bemor haqida qo'shimcha ma'lumot..." size="large" />
                </Form.Item>

                <div style={{ textAlign: 'right', marginTop: 16 }}>
                  <Button onClick={handlePrevStep} style={{ marginRight: 8 }}>
                    Orqaga
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => form.validateFields().then(() => setCurrentStep(2)).catch(() => {})}
                    style={{ background: '#d4af37', borderColor: '#d4af37', color: '#000' }}
                    icon={<FileTextOutlined />}
                  >
                    Keyingi qadam
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Confirm */}
            {currentStep === 2 && (
              <div>
                <Title level={5} style={{ color: '#d4af37', marginBottom: 16 }}>
                  3-qadam — Ma'lumotlarni tasdiqlash
                </Title>

                <Form.Item noStyle shouldUpdate>
                  {() => {
                    const values = form.getFieldsValue()
                    return (
                      <Card
                        style={{
                          background: 'rgba(26,42,74,0.5)',
                          border: '1px solid rgba(212,175,55,0.2)',
                          borderRadius: 8,
                          marginBottom: 24,
                        }}
                        bodyStyle={{ padding: 16 }}
                      >
                        <Row gutter={[24, 8]}>
                          <Col span={12}>
                            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>Familiya</Text>
                            <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{values.last_name || '-'}</div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>Ism</Text>
                            <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{values.first_name || '-'}</div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>Tug'ilgan sana</Text>
                            <div style={{ color: '#fff', fontSize: 15 }}>{values.birth_date?.format('DD.MM.YYYY') || '-'}</div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>Jinsi</Text>
                            <div style={{ color: '#fff', fontSize: 15 }}>{values.gender === 'male' ? 'Erkak' : values.gender === 'female' ? 'Ayol' : '-'}</div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>Telefon</Text>
                            <div style={{ color: '#d4af37', fontSize: 15, fontWeight: 600 }}>{values.phone || '-'}</div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>Viloyat kodi (MED-ID)</Text>
                            <div style={{ color: '#d4af37', fontSize: 15, fontFamily: 'monospace' }}>
                              MED-{values.passport_region_code || '?'}-{dayjs().year()}-XXXXXX
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>Pasport</Text>
                            <div style={{ color: '#fff', fontSize: 15 }}>{values.passport || '-'}</div>
                          </Col>
                          <Col span={12}>
                            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>Manzil</Text>
                            <div style={{ color: '#fff', fontSize: 15 }}>{values.address || '-'}</div>
                          </Col>
                        </Row>
                      </Card>
                    )
                  }}
                </Form.Item>

                <Alert
                  message="Tasdiqlashdan oldin ma'lumotlarni tekshiring. MED-ID avtomatik yaratiladi."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24, background: 'rgba(24,144,255,0.1)', border: '1px solid rgba(24,144,255,0.3)' }}
                />

                <div style={{ textAlign: 'right', marginTop: 16 }}>
                  <Button onClick={() => setCurrentStep(1)} style={{ marginRight: 8 }}>
                    Orqaga
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={createMutation.isPending}
                    onClick={() => {
                      const values = form.getFieldsValue()
                      const payload = {
                        ...values,
                        birth_date: values.birth_date?.format ? values.birth_date.format('YYYY-MM-DD') : values.birth_date,
                      }
                      createMutation.mutate(payload)
                    }}
                    style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
                    icon={<CheckCircleOutlined />}
                  >
                    Ro'yxatga olish
                  </Button>
                </div>
              </div>
            )}
          </Form>
        </Card>
      )}
    </div>
  )
}

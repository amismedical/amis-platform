/**
 * AMIS - Patient Registration — TANA CRM Single-Page Form
 * All fields visible at all times. No step state. No confirmation step.
 * Backend field mapping: first_name, last_name, birth_date, gender, phone (required)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Typography, Card, Row, Col, Form, Input, Select, DatePicker,
  Button, Space, message, Divider, Collapse, Tag, Checkbox,
  CollapseProps
} from 'antd'
import {
  ArrowLeftOutlined, UserAddOutlined, IdcardOutlined,
  EnvironmentOutlined, PhoneOutlined, HeartOutlined,
  ContactsOutlined, SafetyOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, InfoCircleOutlined, TeamOutlined
} from '@ant-design/icons'
import { patientService } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// Uzbekistan regions for MED-ID passport_region_code
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

const BLOOD_TYPES = [
  { value: 'O(I)', label: 'O(I)' },
  { value: 'A(II)', label: 'A(II)' },
  { value: 'B(III)', label: 'B(III)' },
  { value: 'AB(IV)', label: 'AB(IV)' },
]

const RH_FACTORS = [
  { value: 'Rh+', label: 'Rh musbat (Rh+)' },
  { value: 'Rh-', label: 'Rh manfiy (Rh-)' },
]

const EDUCATION_OPTIONS = [
  { value: 'primary', label: 'Boshlang\'ich' },
  { value: 'secondary', label: 'O\'rta' },
  { value: 'higher', label: 'Oliy' },
]

const MARITAL_OPTIONS = [
  { value: 'single', label: 'Nikahlanmagan' },
  { value: 'married', label: 'Nikahlangan' },
  { value: 'divorced', label: 'Ajrashgan' },
  { value: 'widowed', label: 'Beva' },
]

export function PatientRegistrationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [sameAddress, setSameAddress] = useState(true)

  // Create patient — sends snake_case payload matching backend binding tags
  const createMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      // Build exact payload with backend field names
      const payload: Record<string, unknown> = {
        // Required fields
        first_name: values.first_name,
        last_name: values.last_name,
        birth_date: typeof values.birth_date === 'string'
          ? values.birth_date
          : (values.birth_date as dayjs.Dayjs)?.format('YYYY-MM-DD'),
        gender: values.gender,
        phone: values.phone,
        // Passport region code for MED-ID
        passport_region_code: values.passport_region_code || 'TSH',
        // Optional fields
        patronymic: values.patronymic || '',
        citizenship: values.citizenship || "O'zbekiston",
        address: values.address || '',
        notes: values.notes || '',
        // Passport: combine series + number if both provided
        passport: [
          values.passport_series || '',
          values.passport_number || '',
        ].filter(Boolean).join(' ') || '',
        // PINFL if provided
        pinfl: values.pinfl || '',
        // phone_2
        phone_2: values.phone_2 || '',
        // email
        email: values.email || '',
      }
      // Remove empty strings to avoid sending blank optional fields
      Object.keys(payload).forEach(k => {
        if (payload[k] === '') payload[k] = undefined
      })
      return patientService.create(payload as Parameters<typeof patientService.create>[0])
    },
    onSuccess: (data: any) => {
      message.success({
        content: `Bemor muvaffaqiyatli ro'yxatga olindi! MED-ID: ${data?.med_id || ''}`,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      })
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      if (data?.id) {
        navigate(`/patients/${data.id}`)
      } else {
        navigate('/patients')
      }
    },
    onError: (error: any) => {
      message.error({
        content: error?.response?.data?.error || error?.response?.data?.message || "Bemor yaratishda xatolik yuz berdi",
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      })
    },
  })

  const handleSubmit = (values: Record<string, unknown>) => {
    createMutation.mutate(values)
  }

  const handleSameAddressChange = (checked: boolean) => {
    setSameAddress(checked)
    if (checked) {
      // Copy registered address to living address
      form.setFieldsValue({
        living_city: values => values.city,
        living_district: values => values.district,
        living_address: values => values.address,
      })
    }
  }

  // Collapse panels — all open by default
  const defaultActiveKeys = ['main', 'documents', 'registered-address', 'actual-address', 'social', 'medical', 'contacts']

  const collapseItems: CollapseProps['items'] = [
    // ===== SECTION A: Main Information =====
    {
      key: 'main',
      label: (
        <Space>
          <TeamOutlined style={{ color: '#d4af37' }} />
          <Text strong style={{ color: '#d4af37' }}>A. Asosiy ma'lumotlar *</Text>
        </Space>
      ),
      children: (
        <>
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
              <Form.Item name="patronymic" label="Sharifi (otasining ismi)">
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
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD.MM.YYYY"
                  placeholder="Sanani tanlang"
                  size="large"
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
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
                  { pattern: /^\+?[0-9]{7,15}$/, message: "Telefon raqam noto'g'ri" }
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
            <Col span={8}>
              <Form.Item name="citizenship" label="Fuqaroligi" initialValue="O'zbekiston">
                <Input placeholder="O'zbekiston" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Bemor haqida izoh (ixtiyoriy)">
            <Input.TextArea rows={2} placeholder="Bemor haqida qo'shimcha ma'lumot..." size="large" />
          </Form.Item>
        </>
      ),
    },

    // ===== SECTION B: Identification Documents =====
    {
      key: 'documents',
      label: (
        <Space>
          <IdcardOutlined style={{ color: '#d4af37' }} />
          <Text strong style={{ color: '#d4af37' }}>B. Hujjatlar</Text>
        </Space>
      ),
      children: (
        <>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="passport_region_code"
                label="Viloyat kodi (MED-ID uchun) *"
                rules={[{ required: true, message: 'Viloyat kodini tanlash majburiy' }]}
                tooltip="Bu kod bemorning MED-ID raqamini yaratish uchun ishlatiladi"
              >
                <Select
                  placeholder="Viloyatni tanlang"
                  size="large"
                  showSearch
                  optionFilterProp="children"
                  options={REGION_OPTIONS}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="passport_series"
                label="Passport seriya"
                tooltip="Passport yoki ID kartaning harfli qismi (2 ta harf)"
              >
                <Input placeholder="AA" size="large" maxLength={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="passport_number"
                label="Passport raqami"
                tooltip="Passport yoki ID kartaning raqamli qismi"
              >
                <Input placeholder="1234567" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="pinfl"
                label="PINFL"
                tooltip="Shaxsiy identifikatsion raqam — 14 xonali"
              >
                <Input placeholder="12345678901234" size="large" maxLength={14} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="email" label="Email">
                <Input placeholder="email@example.com" type="email" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ background: 'rgba(24,144,255,0.08)', border: '1px solid rgba(24,144,255,0.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
            <Space>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Passport ma'lumotlari bemorning MED-ID raqamini yaratish uchun ishlatiladi.
                Keyinchalik to'liq hujjat boshqaruvi qo'shiladi.
              </Text>
            </Space>
          </div>
        </>
      ),
    },

    // ===== SECTION C: Registered Address =====
    {
      key: 'registered-address',
      label: (
        <Space>
          <EnvironmentOutlined style={{ color: '#d4af37' }} />
          <Text strong style={{ color: '#d4af37' }}>C. Ro'yxatdagi manzil</Text>
        </Space>
      ),
      children: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="city" label="Shahar / Viloyat">
                <Input placeholder="Toshkent shahri" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="district" label="Tuman / Tumanlar">
                <Input placeholder="Yunusobod tumani" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="To'liq manzil">
            <Input.TextArea rows={2} placeholder="Ko'cha, uy raqami, xonadon..." size="large" />
          </Form.Item>
        </>
      ),
    },

    // ===== SECTION D: Actual Living Address =====
    {
      key: 'actual-address',
      label: (
        <Space>
          <EnvironmentOutlined style={{ color: '#d4af37' }} />
          <Text strong style={{ color: '#d4af37' }}>D. Amaldagi yashash manzili</Text>
        </Space>
      ),
      children: (
        <>
          <Form.Item name="same_as_registered" style={{ marginBottom: 8 }}>
            <Checkbox
              checked={sameAddress}
              onChange={(e) => {
                setSameAddress(e.target.checked)
                if (e.target.checked) {
                  const regValues = form.getFieldsValue(['city', 'district', 'address'])
                  form.setFieldsValue({
                    living_city: regValues.city || '',
                    living_district: regValues.district || '',
                    living_address: regValues.address || '',
                  })
                }
              }}
            >
              Amaldagi manzil ro'yxatdagi manzil bilan bir xil
            </Checkbox>
          </Form.Item>

          {!sameAddress && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="living_city" label="Shahar / Viloyat">
                    <Input placeholder="Toshkent shahri" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="living_district" label="Tuman / Tumanlar">
                    <Input placeholder="Yunusobod tumani" size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="living_address" label="To'liq manzil">
                <Input.TextArea rows={2} placeholder="Ko'cha, uy raqami, xonadon..." size="large" />
              </Form.Item>
            </>
          )}

          {sameAddress && (
            <div style={{ background: 'rgba(82,196,26,0.08)', border: '1px solid rgba(82,196,26,0.2)', borderRadius: 6, padding: '8px 12px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <SafetyOutlined style={{ color: '#52c41a', marginRight: 6 }} />
                Amaldagi manzil ro'yxatdagi manzil bilan bir xil deb belgilangan
              </Text>
            </div>
          )}
        </>
      ),
    },

    // ===== SECTION E: Social Information =====
    {
      key: 'social',
      label: (
        <Space>
          <ContactsOutlined style={{ color: '#d4af37' }} />
          <Text strong style={{ color: '#d4af37' }}>E. Ijtimoiy ma'lumotlar</Text>
          <Tag color="default" style={{ fontSize: 11 }}>Keyinchalik</Tag>
        </Space>
      ),
      children: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="workplace" label="Ish joyi">
                <Input placeholder="Korxona, tashkilot nomi..." size="large" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="education" label="Ma'lumoti">
                <Select placeholder="Tanlang" size="large" allowClear>
                  {EDUCATION_OPTIONS.map(o => (
                    <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="marital_status" label="Oilaviy holati">
                <Select placeholder="Tanlang" size="large" allowClear>
                  {MARITAL_OPTIONS.map(o => (
                    <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <div style={{ background: 'rgba(250,173,20,0.08)', border: '1px solid rgba(250,173,20,0.2)', borderRadius: 6, padding: '8px 12px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <InfoCircleOutlined style={{ color: '#faad14', marginRight: 6 }} />
              Ijtimoiy ma'lumotlar bemor profili tizimida keyinchalik qo'shimcha yangilanishda saqlanadi.
            </Text>
          </div>
        </>
      ),
    },

    // ===== SECTION F: Basic Medical Information =====
    {
      key: 'medical',
      label: (
        <Space>
          <HeartOutlined style={{ color: '#d4af37' }} />
          <Text strong style={{ color: '#d4af37' }}>F. Tibbiy ma'lumotlar</Text>
          <Tag color="default" style={{ fontSize: 11 }}>Keyinchalik</Tag>
        </Space>
      ),
      children: (
        <>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="blood_type" label="Qon guruhi">
                <Select placeholder="Tanlang" size="large" allowClear>
                  {BLOOD_TYPES.map(o => (
                    <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="rh_factor" label="Rh omil">
                <Select placeholder="Tanlang" size="large" allowClear>
                  {RH_FACTORS.map(o => (
                    <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="health_group" label="Sog'lom guruhi">
                <Input placeholder="I, II, III..." size="large" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="d_registration" label="D-ro'yxat">
                <Select placeholder="Tanlang" size="large" allowClear>
                  <Select.Option value="registered">Ro'yxatda bor</Select.Option>
                  <Select.Option value="not_registered">Ro'yxatda yo'q</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="disability" label="Nogironligi">
                <Select placeholder="Tanlang" size="large" allowClear>
                  <Select.Option value="none">Yo'q</Select.Option>
                  <Select.Option value="group_1">1-guruh</Select.Option>
                  <Select.Option value="group_2">2-guruh</Select.Option>
                  <Select.Option value="group_3">3-guruh</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="attached_polyclinic" label="Biriktirilgan poliklinika">
                <Input placeholder="Poliklinika nomi..." size="large" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ background: 'rgba(250,173,20,0.08)', border: '1px solid rgba(250,173,20,0.2)', borderRadius: 6, padding: '8px 12px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <InfoCircleOutlined style={{ color: '#faad14', marginRight: 6 }} />
              Tibbiy ma'lumotlar bemor tibbiy kartasi orqali alohida saqlanadi. Ro'yxatga olishda ixtiyoriy.
            </Text>
          </div>
        </>
      ),
    },

    // ===== SECTION G: Contact Information =====
    {
      key: 'contacts',
      label: (
        <Space>
          <PhoneOutlined style={{ color: '#d4af37' }} />
          <Text strong style={{ color: '#d4af37' }}>G. Aloqa ma'lumotlari</Text>
          <Tag color="default" style={{ fontSize: 11 }}>Keyinchalik</Tag>
        </Space>
      ),
      children: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="telegram" label="Telegram">
                <Input placeholder="@username yoki telefon raqam" prefix={<span style={{ fontSize: 16 }}>✈</span>} size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contact_person" label="Aloqa uchun shaxs">
                <Input placeholder="Ism, telefon" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ background: 'rgba(250,173,20,0.08)', border: '1px solid rgba(250,173,20,0.2)', borderRadius: 6, padding: '8px 12px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <InfoCircleOutlined style={{ color: '#faad14', marginRight: 6 }} />
              Aloqa ma'lumotlari bemor profili tizimida keyinchalik qo'shimcha yangilanishda saqlanadi.
            </Text>
          </div>
        </>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <Row align="middle" style={{ marginBottom: 20 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/patients')}
          style={{ marginRight: 16, color: '#d4af37' }}
        >
          Bemorlar ro'yxatiga qaytish
        </Button>
      </Row>

      {/* Page Title */}
      <Card
        style={{
          background: 'rgba(13,26,48,0.8)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: 12,
          marginBottom: 16,
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Space>
          <UserAddOutlined style={{ fontSize: 28, color: '#d4af37' }} />
          <div>
            <Title level={4} style={{ color: '#fff', margin: 0 }}>
              Yangi bemor ro'yxatga olish
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Barcha majburiy maydonlar (*) to'ldirilishi kerak
            </Text>
          </div>
        </Space>
      </Card>

      {/* Main Form */}
      <Card
        style={{
          background: 'rgba(13,26,48,0.8)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: 12,
        }}
        bodyStyle={{ padding: '16px 24px 8px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            citizenship: "O'zbekiston",
            passport_region_code: 'TSH',
          }}
          requiredMark="optional"
          style={{ marginBottom: 8 }}
        >
          {/* All 7 sections always visible — no step state, no conditional hiding */}
          <Collapse
            defaultActiveKey={defaultActiveKeys}
            items={collapseItems}
            bordered={false}
            style={{ background: 'transparent' }}
            expandIconPosition="end"
          />

          <Divider style={{ margin: '16px 0 20px', borderColor: 'rgba(212,175,55,0.15)' }} />

          {/* Submit Row */}
          <Row justify="space-between" align="middle">
            <Col>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                Ro'yxatga olish tugmasini bosishdan oldin barcha majburiy maydonlarni to'ldiring.
              </Text>
            </Col>
            <Col>
              <Space>
                <Button
                  onClick={() => navigate('/patients')}
                  size="large"
                >
                  Bekor qilish
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createMutation.isPending}
                  size="large"
                  icon={<CheckCircleOutlined />}
                  style={{
                    background: '#52c41a',
                    borderColor: '#52c41a',
                    color: '#fff',
                  }}
                >
                  Ro'yxatga olish
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Select, Input, DatePicker, message, Row, Col, Statistic, Tabs, Typography, Divider, Switch, Timeline, Badge } from 'antd'
import { PlusOutlined, BellOutlined, MailOutlined, MessageOutlined, SendOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, SettingOutlined } from '@ant-design/icons'
import { i18n, formatDate, formatFullDate } from '../i18n/uz'

const { Title, Text } = Typography
const { TextArea } = Input

interface Notification {
  id: string
  type: 'sms' | 'email' | 'telegram'
  recipient: string
  template: string
  message: string
  status: 'sent' | 'pending' | 'failed'
  sent_at: string
  error?: string
}

interface Template {
  id: string
  name: string
  type: 'sms' | 'email' | 'telegram'
  subject?: string
  content: string
  variables: string[]
  is_active: boolean
}

interface Settings {
  sms_enabled: boolean
  email_enabled: boolean
  telegram_enabled: boolean
  sms_provider: string
  email_provider: string
  telegram_token: string
}

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('history')
  const [composeModalOpen, setComposeModalOpen] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [templateForm] = Form.useForm()
  const [settingsForm] = Form.useForm()

  // Demo notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'N001', type: 'sms', recipient: '+998901234567', template: 'appointment_reminder', message: 'Hurmatli bemor, 15.06.2024 kuni soat 10:00 da qabulga rowillardasiz.', status: 'sent', sent_at: '2024-06-15 08:00' },
    { id: 'N002', type: 'email', recipient: 'rahimov@email.uz', template: 'lab_results', message: 'Sizning tahlil natijalaringiz tayyor.', status: 'sent', sent_at: '2024-06-14 14:30' },
    { id: 'N003', type: 'telegram', recipient: '@alisher_rahimov', template: 'payment_reminder', message: 'Hisobingizda qoldiq: 150,000 so\'m', status: 'sent', sent_at: '2024-06-14 09:00' },
    { id: 'N004', type: 'sms', recipient: '+998901234568', template: 'custom', message: 'AMIS Klinikasi bilan bog\'laning.', status: 'failed', sent_at: '2024-06-13 16:00', error: 'Raqam noto\'g\'ri' },
    { id: 'N005', type: 'email', recipient: 'doctor@amis-clinic.uz', template: 'shift_reminder', message: 'Ertaga sizning navbatingiz.', status: 'pending', sent_at: '2024-06-15 10:00' },
  ])

  // Demo templates
  const [templates, setTemplates] = useState<Template[]>([
    { id: 'T001', name: 'Qabul eslatmasi', type: 'sms', content: 'Hurmatli {patient_name}, {date} kuni soat {time} da qabulga rowillardasiz.', variables: ['patient_name', 'date', 'time'], is_active: true },
    { id: 'T002', name: 'Tahlil natijalari', type: 'email', subject: 'Tahlil natijalaringiz tayyor', content: 'Hurmatli bemor, {doctor_name} tomonidan buyurilgan tahlillar tayyor.\n\nNatija: {results}\n\nSavollar bo\'lsa: +998712345678', variables: ['patient_name', 'doctor_name', 'results'], is_active: true },
    { id: 'T003', name: 'To\'lov eslatmasi', type: 'telegram', content: 'Hurmatli {patient_name}, hisobingizda qoldiq: {amount} so\'m. Iltimos, to\'ldiring.', variables: ['patient_name', 'amount'], is_active: true },
    { id: 'T004', name: 'Receptura tayyor', type: 'sms', content: 'Sizning recepturangiz tayyor. Dorixonadan olishingiz mumkin.', variables: ['patient_name'], is_active: false },
    { id: 'T005', name: 'Shifokor eslatmasi', type: 'email', subject: 'Ertangi navbat', content: 'Hurmatli doctor {doctor_name}, ertangi navbat:\n{appointments}', variables: ['doctor_name', 'appointments'], is_active: true },
  ])

  // Demo settings
  const [settings, setSettings] = useState<Settings>({
    sms_enabled: true,
    email_enabled: true,
    telegram_enabled: true,
    sms_provider: 'esputnik',
    email_provider: 'smtp',
    telegram_token: '***',
  })

  const typeIcons: Record<string, JSX.Element> = {
    sms: <MessageOutlined style={{ color: '#52c41a' }} />,
    email: <MailOutlined style={{ color: '#1890ff' }} />,
    telegram: <SendOutlined style={{ color: '#722ed1' }} />,
  }

  const statusColors: Record<string, string> = {
    sent: 'success',
    pending: 'warning',
    failed: 'error',
  }

  const statusLabels: Record<string, string> = {
    sent: 'Yuborildi',
    pending: 'Kutilmoqda',
    failed: 'Xatolik',
  }

  const notificationsColumns = [
    { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Space>{typeIcons[t]} <Tag>{t.toUpperCase()}</Tag></Space> },
    { title: 'Qabul qiluvchi', dataIndex: 'recipient', key: 'recipient' },
    { title: 'Shablon', dataIndex: 'template', key: 'template', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Xabar', dataIndex: 'message', key: 'message', ellipsis: true },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Badge status={s === 'sent' ? 'success' : s === 'pending' ? 'processing' : 'error'} text={statusLabels[s]} /> },
    { title: 'Yuborilgan vaqt', dataIndex: 'sent_at', key: 'sent_at' },
    { title: 'Amal', key: 'action', render: (_: any, record: Notification) => (
      <Space>
        <Button size="small" onClick={() => viewNotification(record)}>Ko'rish</Button>
        {record.status === 'failed' && <Button size="small" type="primary" onClick={() => retryNotification(record)}>Qayta</Button>}
      </Space>
    )},
  ]

  const templatesColumns = [
    { title: 'Nomi', dataIndex: 'name', key: 'name' },
    { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={t === 'sms' ? 'green' : t === 'email' ? 'blue' : 'purple'}>{t.toUpperCase()}</Tag> },
    { title: 'Mavzu', dataIndex: 'subject', key: 'subject', render: (s: string) => s || '-' },
    { title: 'O\'zgaruvchilar', dataIndex: 'variables', key: 'variables', render: (v: string[]) => v.map((variable, i) => <Tag key={i}>{'{' + variable + '}'}</Tag>) },
    { title: 'Holat', dataIndex: 'is_active', key: 'is_active', render: (a: boolean) => <Tag color={a ? 'success' : 'default'}>{a ? 'Faol' : 'Nofaol'}</Tag> },
    { title: 'Amal', key: 'action', render: (_: any, record: Template) => (
      <Space>
        <Button size="small" onClick={() => openEditTemplate(record)}>Tahrirlash</Button>
        <Switch size="small" checked={record.is_active} onChange={(checked) => toggleTemplateStatus(record, checked)} />
      </Space>
    )},
  ]

  const viewNotification = (notification: Notification) => {
    Modal.info({
      title: 'Xabar tafsilotlari',
      width: 500,
      content: (
        <div>
          <Row gutter={16}>
            <Col span={12}><Text type="secondary">Turi:</Text></Col>
            <Col span={12}>{notification.type.toUpperCase()}</Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Text type="secondary">Qabul qiluvchi:</Text></Col>
            <Col span={12}>{notification.recipient}</Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Text type="secondary">Shablon:</Text></Col>
            <Col span={12}><Tag>{notification.template}</Tag></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Text type="secondary">Holat:</Text></Col>
            <Col span={12}><Badge status={statusColors[notification.status] as any} text={statusLabels[notification.status]} /></Col>
          </Row>
          <Divider />
          <Text strong>Xabar matni:</Text>
          <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>{notification.message}</div>
          {notification.error && <><Divider /><Text type="danger">Xatolik: {notification.error}</Text></>}
        </div>
      ),
    })
  }

  const retryNotification = (notification: Notification) => {
    setNotifications(notifications.map(n => n.id === notification.id ? { ...n, status: 'pending' } : n))
    setTimeout(() => {
      setNotifications(notifications.map(n => n.id === notification.id ? { ...n, status: 'sent' } : n))
    }, 2000)
    message.success('Xabar qayta yuborilmoqda...')
  }

  const toggleTemplateStatus = (template: Template, checked: boolean) => {
    setTemplates(templates.map(t => t.id === template.id ? { ...t, is_active: checked } : t))
    message.success(`Shablon ${checked ? 'faollashtirildi' : 'to\'xtatildi'}`)
  }

  const openEditTemplate = (template: Template) => {
    templateForm.setFieldsValue(template)
    setTemplateModalOpen(true)
  }

  const handleSubmitCompose = (values: any) => {
    const newNotification: Notification = {
      id: 'N' + Date.now(),
      type: values.type,
      recipient: values.recipient,
      template: values.template || 'custom',
      message: values.message,
      status: 'pending',
      sent_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    setNotifications([newNotification, ...notifications])
    setTimeout(() => {
      setNotifications(notifications.map(n => n.id === newNotification.id ? { ...n, status: 'sent' } : n))
    }, 2000)
    message.success('Xabar yuborilmoqda...')
    setComposeModalOpen(false)
    form.resetFields()
  }

  const handleSubmitTemplate = (values: any) => {
    setTemplates([...templates, { ...values, id: 'T' + Date.now(), is_active: true }])
    message.success('Shablon qo\'shildi')
    setTemplateModalOpen(false)
    templateForm.resetFields()
  }

  const handleSaveSettings = (values: any) => {
    setSettings(values)
    message.success('Sozlamalar saqlandi')
    setSettingsModalOpen(false)
  }

  const sentCount = notifications.filter(n => n.status === 'sent').length
  const pendingCount = notifications.filter(n => n.status === 'pending').length
  const failedCount = notifications.filter(n => n.status === 'failed').length
  const activeTemplates = templates.filter(t => t.is_active).length

  const tabItems = [
    {
      key: 'history',
      label: <span><BellOutlined /> Tarix</span>,
      children: (
        <Card>
          <Table columns={notificationsColumns} dataSource={notifications} rowKey="id" pagination={{ pageSize: 10 }} />
        </Card>
      ),
    },
    {
      key: 'templates',
      label: <span><MailOutlined /> Shablonlar</span>,
      children: (
        <Card>
          <Table columns={templatesColumns} dataSource={templates} rowKey="id" pagination={{ pageSize: 10 }} />
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Bildirishnomalar</Title>
        </Col>
        <Col>
          <Space>
            <Button type="primary" icon={<SendOutlined />} onClick={() => { form.resetFields(); setComposeModalOpen(true) }}>
              Xabar yuborish
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => { settingsForm.setFieldsValue(settings); setSettingsModalOpen(true) }}>
              Sozlamalar
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Yuborilgan"
              value={sentCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Kutilmoqda"
              value={pendingCount}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Xatolik"
              value={failedCount}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Faol shablonlar"
              value={activeTemplates}
              prefix={<MailOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Compose Modal */}
      <Modal
        title="Xabar yuborish"
        open={composeModalOpen}
        onCancel={() => setComposeModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitCompose}>
          <Form.Item label="Turi" name="type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="sms">SMS</Select.Option>
              <Select.Option value="email">Email</Select.Option>
              <Select.Option value="telegram">Telegram</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Qabul qiluvchi" name="recipient" rules={[{ required: true }]}>
            <Input placeholder="+998... yoki email@email.uz" />
          </Form.Item>
          <Form.Item label="Shablon" name="template">
            <Select allowClear placeholder="Shablon tanlang">
              {templates.filter(t => t.is_active).map(t => (
                <Select.Option key={t.id} value={t.name}>{t.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Xabar matni" name="message" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Xabar matnini kiriting..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Template Modal */}
      <Modal
        title="Yangi shablon"
        open={templateModalOpen}
        onCancel={() => setTemplateModalOpen(false)}
        onOk={() => templateForm.submit()}
        width={600}
      >
        <Form form={templateForm} layout="vertical" onFinish={handleSubmitTemplate}>
          <Form.Item label="Nomi" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Turi" name="type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="sms">SMS</Select.Option>
              <Select.Option value="email">Email</Select.Option>
              <Select.Option value="telegram">Telegram</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Mavzu (email uchun)" name="subject">
            <Input />
          </Form.Item>
          <Form.Item label="Matn" name="content" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Matn. O'zgaruvchilar: {variable_name}" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Settings Modal */}
      <Modal
        title="Bildirishnoma sozlamalari"
        open={settingsModalOpen}
        onCancel={() => setSettingsModalOpen(false)}
        onOk={() => settingsForm.submit()}
        width={500}
      >
        <Form form={settingsForm} layout="vertical" onFinish={handleSaveSettings} initialValues={settings}>
          <Divider>Kanallar</Divider>
          <Form.Item label="SMS" name="sms_enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Email" name="email_enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Telegram" name="telegram_enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Divider>Sozlamalar</Divider>
          <Form.Item label="SMS provayder" name="sms_provider">
            <Select>
              <Select.Option value="esputnik">eSputnik</Select.Option>
              <Select.Option value="smsc">SMSC</Select.Option>
              <Select.Option value="click">Click</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Email provayder" name="email_provider">
            <Select>
              <Select.Option value="smtp">SMTP</Select.Option>
              <Select.Option value="sendgrid">SendGrid</Select.Option>
              <Select.Option value="mailgun">Mailgun</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Telegram Token" name="telegram_token">
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
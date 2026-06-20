import { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, message, Row, Col, Statistic, Tabs, Typography, Divider, Switch, Steps, Descriptions, Badge, Alert } from 'antd'
import { ApiOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, LinkOutlined, ThunderboltOutlined, DatabaseOutlined, GlobalOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { i18n } from '../i18n/uz'

const { Title, Text } = Typography

interface Integration {
  id: string
  name: string
  type: 'life_id' | 'dmed' | 'fhir' | 'his'
  status: 'connected' | 'disconnected' | 'error' | 'syncing'
  last_sync: string
  records_synced: number
  config: Record<string, string>
  description: string
}

export function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [form] = Form.useForm()

  // Demo integrations
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'LIFE001',
      name: 'LIFE-ID',
      type: 'life_id',
      status: 'connected',
      last_sync: '2024-06-15 14:30:00',
      records_synced: 15420,
      description: 'Davlat fuqarolarni tasdiqlash tizimi (LIFE-ID). Bemor shaxsini tasdiqlash.',
      config: { api_url: 'https://life-id.uz/api/v2', api_key: '***', org_id: 'ORG001' }
    },
    {
      id: 'DMED001',
      name: 'DMED (Soliq)',
      type: 'dmed',
      status: 'connected',
      last_sync: '2024-06-15 14:00:00',
      records_synced: 8750,
      description: 'Soliq organlariga dorixona va receptura ma\'lumotlarini yuborish.',
      config: { api_url: 'https://dmed.soliq.uz/api', certificate: '***', tin: '123456789' }
    },
    {
      id: 'FHIR001',
      name: 'FHIR Server',
      type: 'fhir',
      status: 'disconnected',
      last_sync: '-',
      records_synced: 0,
      description: 'HL7 FHIR standarti bo\'yicha sog\'liqni saqlash ma\'lumotlar almashish.',
      config: { base_url: 'https://fhir.example.uz', client_id: '', client_secret: '' }
    },
    {
      id: 'HIS001',
      name: 'HIS Uzum',
      type: 'his',
      status: 'error',
      last_sync: '2024-06-14 10:00:00',
      records_synced: 3200,
      description: 'Uzum bank hisob-kitoblari integratsiyasi.',
      config: { merchant_id: 'UZM***', secret_key: '***' }
    },
  ])

  const statusColors: Record<string, string> = {
    connected: 'success',
    disconnected: 'default',
    error: 'error',
    syncing: 'processing',
  }

  const statusLabels: Record<string, string> = {
    connected: 'Bog\'langan',
    disconnected: 'Ulanmagan',
    error: 'Xatolik',
    syncing: 'Sinxronlanmoqda',
  }

  const typeLabels: Record<string, string> = {
    life_id: 'LIFE-ID',
    dmed: 'DMED',
    fhir: 'FHIR',
    his: 'HIS',
  }

  const typeIcons: Record<string, JSX.Element> = {
    life_id: <SafetyCertificateOutlined style={{ color: '#1890ff' }} />,
    dmed: <DatabaseOutlined style={{ color: '#52c41a' }} />,
    fhir: <GlobalOutlined style={{ color: '#722ed1' }} />,
    his: <ApiOutlined style={{ color: '#f43f5e' }} />,
  }

  const columns = [
    { title: 'Integratsiya', key: 'name', render: (_: any, r: Integration) => (
      <Space>
        {typeIcons[r.type]}
        <div>
          <Text strong>{r.name}</Text>
          <div><Text type="secondary" style={{ fontSize: 12 }}>{typeLabels[r.type]}</Text></div>
        </div>
      </Space>
    )},
    { title: 'Tavsif', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Badge status={statusColors[s] as any} text={statusLabels[s]} /> },
    { title: 'Oxirgi sinxron', dataIndex: 'last_sync', key: 'last_sync' },
    { title: 'Sinxronlangan', dataIndex: 'records_synced', key: 'records_synced', render: (v: number) => `${v.toLocaleString()} ta` },
    { title: 'Amal', key: 'action', render: (_: any, r: Integration) => (
      <Space>
        <Button size="small" onClick={() => openConfig(r)}>Sozlamalar</Button>
        {r.status === 'connected' && (
          <Button size="small" onClick={() => syncNow(r)}>Sinxronlash</Button>
        )}
        {r.status === 'error' && (
          <Button size="small" type="primary" onClick={() => reconnect(r)}>Qayta ulash</Button>
        )}
        {r.status === 'disconnected' && (
          <Button size="small" type="primary" onClick={() => connect(r)}>Ulash</Button>
        )}
      </Space>
    )},
  ]

  const openConfig = (integration: Integration) => {
    setSelectedIntegration(integration)
    form.setFieldsValue(integration.config)
    setConfigModalOpen(true)
  }

  const syncNow = (integration: Integration) => {
    setIntegrations(integrations.map(i => i.id === integration.id ? { ...i, status: 'syncing' } : i))
    setTimeout(() => {
      setIntegrations(integrations.map(i => i.id === integration.id ? { ...i, status: 'connected', last_sync: new Date().toISOString().replace('T', ' ').slice(0, 19), records_synced: i.records_synced + Math.floor(Math.random() * 50) } : i))
      message.success(`${integration.name} sinxronlandi`)
    }, 3000)
    message.info('Sinxronizatsiya boshlandi...')
  }

  const reconnect = (integration: Integration) => {
    setIntegrations(integrations.map(i => i.id === integration.id ? { ...i, status: 'syncing' } : i))
    setTimeout(() => {
      setIntegrations(integrations.map(i => i.id === integration.id ? { ...i, status: 'connected' } : i))
      message.success(`${integration.name} ulandi`)
    }, 2000)
  }

  const connect = (integration: Integration) => {
    openConfig(integration)
  }

  const handleSaveConfig = (values: any) => {
    if (selectedIntegration) {
      setIntegrations(integrations.map(i => i.id === selectedIntegration.id ? { ...i, config: values, status: 'connected' } : i))
      message.success('Sozlamalar saqlandi')
      setConfigModalOpen(false)
    }
  }

  const handleDisconnect = () => {
    if (selectedIntegration) {
      setIntegrations(integrations.map(i => i.id === selectedIntegration.id ? { ...i, status: 'disconnected' } : i))
      message.success('Integratsiya uzildi')
      setConfigModalOpen(false)
    }
  }

  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const totalSynced = integrations.reduce((sum, i) => sum + i.records_synced, 0)
  const errorCount = integrations.filter(i => i.status === 'error').length

  const tabItems = [
    {
      key: 'all',
      label: <span><ApiOutlined /> Barchasi</span>,
      children: (
        <Card>
          <Table columns={columns} dataSource={integrations} rowKey="id" pagination={{ pageSize: 10 }} />
        </Card>
      ),
    },
    {
      key: 'life_id',
      label: <span><SafetyCertificateOutlined /> LIFE-ID</span>,
      children: (
        <Card>
          <Alert
            message="LIFE-ID Integratsiyasi"
            description="Bu integratsiya bemorlarning shaxsini tasdiqlash uchun ishlatiladi. Pasport ma'lumotlari Davlat xizmatlari markazi bilan almashiladi."
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Table columns={columns} dataSource={integrations.filter(i => i.type === 'life_id')} rowKey="id" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'dmed',
      label: <span><DatabaseOutlined /> DMED</span>,
      children: (
        <Card>
          <Alert
            message="DMED Soliq Integratsiyasi"
            description="Bu integratsiya orqali dorixona va receptura ma'lumotlari Soliq organlariga yuboriladi. Qonuniy talab."
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Table columns={columns} dataSource={integrations.filter(i => i.type === 'dmed')} rowKey="id" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'fhir',
      label: <span><GlobalOutlined /> FHIR</span>,
      children: (
        <Card>
          <Alert
            message="HL7 FHIR Standarti"
            description="FHIR - sog'liqni saqlash ma'lumotlarini almashish uchun xalqaro standart. Boshqa tizimlar bilan ma'lumot almashish imkonini beradi."
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Table columns={columns} dataSource={integrations.filter(i => i.type === 'fhir')} rowKey="id" pagination={false} />
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Integratsiyalar</Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<LinkOutlined />} onClick={() => message.info('Yangi integratsiya qo\'shish tez orada qo\'shiladi')}>
              Yangi integratsiya
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Bog'langan"
              value={connectedCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Jami sinxronlangan"
              value={totalSynced}
              prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              suffix="ta"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Xatoliklar"
              value={errorCount}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Integratsiyalar"
              value={integrations.length}
              prefix={<ApiOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Config Modal */}
      <Modal
        title={`${selectedIntegration?.name} - Sozlamalar`}
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedIntegration && (
          <div>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Holat"><Badge status={statusColors[selectedIntegration.status] as any} text={statusLabels[selectedIntegration.status]} /></Descriptions.Item>
              <Descriptions.Item label="Tavsif">{selectedIntegration.description}</Descriptions.Item>
              <Descriptions.Item label="Oxirgi sinxron">{selectedIntegration.last_sync}</Descriptions.Item>
              <Descriptions.Item label="Sinxronlangan">{selectedIntegration.records_synced.toLocaleString()} ta</Descriptions.Item>
            </Descriptions>
            <Divider>Konfiguratsiya</Divider>
            <Form form={form} layout="vertical" onFinish={handleSaveConfig}>
              {Object.entries(selectedIntegration.config).map(([key, value]) => (
                <Form.Item key={key} label={key.replace('_', ' ').toUpperCase()} name={key} initialValue={value}>
                  <Input.Password defaultValue={value} />
                </Form.Item>
              ))}
              <Space>
                <Button type="primary" htmlType="submit">Saqlash</Button>
                {selectedIntegration.status === 'connected' && (
                  <Button danger onClick={handleDisconnect}>Uzatish</Button>
                )}
              </Space>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}
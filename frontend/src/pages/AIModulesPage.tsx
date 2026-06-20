import { useState } from 'react'
import { Card, Tag, Button, Space, Modal, Form, Select, Input, message, Row, Col, Statistic, Tabs, Typography, Divider, List, Avatar, Switch, Progress, Timeline, Alert } from 'antd'
import { RobotOutlined, FileTextOutlined, StarOutlined, BulbOutlined, MedicineBoxOutlined, LoadingOutlined, CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, CopyOutlined, EditOutlined, HistoryOutlined } from '@ant-design/icons'
import { i18n } from '../i18n/uz'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface AISession {
  id: string
  type: 'scribe' | 'summary' | 'recommendations'
  patient?: string
  content: string
  result?: string
  status: 'pending' | 'processing' | 'completed'
  created_at: string
  duration?: string
}

interface AIConfig {
  scribe_enabled: boolean
  summary_enabled: boolean
  recommendations_enabled: boolean
  auto_scribe: boolean
  language: string
  model: string
}

export function AIModulesPage() {
  const [activeTab, setActiveTab] = useState('scribe')
  const [scribeModalOpen, setScribeModalOpen] = useState(false)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [scribeForm] = Form.useForm()
  const [configForm] = Form.useForm()

  // Demo AI sessions
  const [sessions, setSessions] = useState<AISession[]>([
    { id: 'AI001', type: 'scribe', patient: 'Rahimov Alisher', content: 'Bemor shikoyati: Oshqozon og\'rig\'i, 2 hafta davom etmoqda...', result: 'Tashxis: Oshqozon yallig\'lanishi (K29.5)\n\nTavsiya: Dieta, paracetamol 500mg kuniga 2 marta...', status: 'completed', created_at: '2024-06-15 14:30', duration: '3.2 soniya' },
    { id: 'AI002', type: 'summary', patient: 'Tursunova Dilshoda', content: 'Uzoq davom etgan bemor tarixi: 2020-yil - birinchi tashrif...', result: 'Xulosa: Surunkali gastrit, H.pylori musbat.\n\nDavolash tarixi: 6 oy davomida PPI...', status: 'completed', created_at: '2024-06-15 12:00', duration: '5.1 soniya' },
    { id: 'AI003', type: 'recommendations', patient: 'Abdullayev Jasur', content: 'Diagnoz: 2-tur diabet (E11.9), qon bosimi 140/90...', result: '1. Metformin 500mg kuniga 2 marta\n2. Diet - qandli ovqatlar cheklanadi\n3. Jismoniy mashq - kuniga 30 daqiqa...', status: 'completed', created_at: '2024-06-14 16:30', duration: '2.8 soniya' },
    { id: 'AI004', type: 'scribe', patient: 'Nazarova Sevara', content: 'Bemor: 45 yoshli ayol. Shikoyat: Bosh og\'rig\'i...', status: 'processing', created_at: '2024-06-15 15:00' },
  ])

  // Demo config
  const [config, setConfig] = useState<AIConfig>({
    scribe_enabled: true,
    summary_enabled: true,
    recommendations_enabled: true,
    auto_scribe: false,
    language: 'uz',
    model: 'gpt-4-turbo',
  })

  const typeIcons: Record<string, JSX.Element> = {
    scribe: <FileTextOutlined style={{ color: '#1890ff' }} />,
    summary: <HistoryOutlined style={{ color: '#722ed1' }} />,
    recommendations: <BulbOutlined style={{ color: '#f43f5e' }} />,
  }

  const typeLabels: Record<string, string> = {
    scribe: 'AI Scribe',
    summary: 'AI Xulosa',
    recommendations: 'AI Tavsiyalar',
  }

  const handleStartScribe = (values: any) => {
    const newSession: AISession = {
      id: 'AI' + Date.now(),
      type: 'scribe',
      patient: values.patient,
      content: values.content,
      status: 'processing',
      created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    setSessions([newSession, ...sessions])
    setScribeModalOpen(false)
    scribeForm.resetFields()

    // Simulate AI processing
    setTimeout(() => {
      setSessions(sessions.map(s => s.id === newSession.id ? {
        ...s,
        status: 'completed',
        result: `Tashxis: ${values.content.includes('oshqozon') ? 'Oshqozon yallig\'lanishi (K29.5)' : 'Bosh og\'rig\'i (G44.1)'}\n\nTavsiya: ${values.content.includes('oshqozon') ? 'Diet, omeprazole 20mg' : 'Paracetamol 500mg, ko\'p suv ichish'}\n\nEslatma: Kerakli bo\'lsa qon tahlili topshiring.`,
        duration: (Math.random() * 3 + 2).toFixed(1) + ' soniya'
      } : s))
      message.success('AI Scribe yakunlandi')
    }, 3000)
  }

  const handleStartSummary = (patient: string) => {
    const newSession: AISession = {
      id: 'AI' + Date.now(),
      type: 'summary',
      patient,
      content: 'Bemor tarixi vaqlda avtomatik yuklanadi...',
      status: 'processing',
      created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    setSessions([newSession, ...sessions])

    setTimeout(() => {
      setSessions(sessions.map(s => s.id === newSession.id ? {
        ...s,
        status: 'completed',
        result: `Bemor: ${patient}\n\nAsosiy tashxislar:\n1. Oshqozon yallig\'lanishi (K29.5) - 2024-01-15 dan\n2. Yuqori qon bosimi (I10) - 2023-06-20 dan\n\nDavolash tarixi:\n- 2024-01-15: Omeprazole 20mg buyurilgan\n- 2024-03-10: Kontrol, yaxshilanish\n- 2024-06-01: Davolash yakunlangan\n\nJoriy holat: Barqaror`,
        duration: (Math.random() * 5 + 3).toFixed(1) + ' soniya'
      } : s))
      message.success('AI Xulosa yakunlandi')
    }, 4000)
  }

  const handleStartRecommendations = (values: any) => {
    const newSession: AISession = {
      id: 'AI' + Date.now(),
      type: 'recommendations',
      patient: values.patient,
      content: `Diagnoz: ${values.diagnosis}\nYoshi: ${values.age}\nJinsi: ${values.gender}\nQon bosimi: ${values.bp}\nVazn: ${values.weight}kg`,
      status: 'processing',
      created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    setSessions([newSession, ...sessions])

    setTimeout(() => {
      setSessions(sessions.map(s => s.id === newSession.id ? {
        ...s,
        status: 'completed',
        result: `Shaxsiy tavsiyalar:\n\n1. Dori-darmon:\n   - ${values.diagnosis.includes('diabet') ? 'Metformin 500mg kuniga 2 marta' : 'Asosiy dori-darmon' }\n\n2. Parhez:\n   - Kuniga 4-5 marta kam miqdorda ovqatlanish\n   - Fast food va gazli ichimliklardan saqlanish\n   - Ko\'proq sabzavot va meva iste\'mol qilish\n\n3. Jismoniy faollik:\n   - Kuniga 30 daqiqa o\'rta intensivlikli mashq\n   - Yurish, yengil yugurish\n\n4. Kunderlik kuzatuv:\n   - Har oyda qon bosimini o\'lchash\n   - ${values.diagnosis.includes('diabet') ? 'Haftada 2 marta qon qandini tekshirish' : '6 oyda bir tekshiruv' }\n\n5. Qachon shifokorga murojaat qilish kerak:\n   - Bosh og\'rig\'i kuchayganda\n   - Qon bosimi 160/100 dan yuqori bo\'lganda\n   - Ko\'rikcha yomon bo\'lganda`,
        duration: (Math.random() * 3 + 2).toFixed(1) + ' soniya'
      } : s))
      message.success('AI Tavsiyalar yakunlandi')
    }, 3500)
  }

  const handleSaveConfig = (values: any) => {
    setConfig(values)
    message.success('AI sozlamalari saqlandi')
    setConfigModalOpen(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('Nusxalandi')
  }

  const scribeSessions = sessions.filter(s => s.type === 'scribe')
  const summarySessions = sessions.filter(s => s.type === 'summary')
  const recommendationSessions = sessions.filter(s => s.type === 'recommendations')

  const completedCount = sessions.filter(s => s.status === 'completed').length
  const processingCount = sessions.filter(s => s.status === 'processing').length
  const avgDuration = sessions.filter(s => s.duration).reduce((sum, s) => sum + parseFloat(s.duration!), 0) / sessions.filter(s => s.duration).length

  const tabItems = [
    {
      key: 'scribe',
      label: <span><FileTextOutlined /> AI Scribe</span>,
      children: (
        <div>
          <Alert
            message="AI Scribe - Avtomatik hujjat yaratish"
            description="Shifokor suhbatidan avtomatik tarzda tashxis, receptura va tavsiyalar yaratadi. Audio yozuv yoki matnli kiritish orqali ishlaydi."
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Yangi hujjat yaratish">
                <Form form={scribeForm} layout="vertical" onFinish={handleStartScribe}>
                  <Form.Item label="Bemor" name="patient" rules={[{ required: true }]}>
                    <Select placeholder="Bemor tanlang">
                      <Select.Option value="Rahimov Alisher">Rahimov Alisher</Select.Option>
                      <Select.Option value="Tursunova Dilshoda">Tursunova Dilshoda</Select.Option>
                      <Select.Option value="Abdullayev Jasur">Abdullayev Jasur</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Suhbat matni yoki audio transkriptsiyasi" name="content" rules={[{ required: true }]}>
                    <TextArea rows={6} placeholder="Bemor shikoyatini, ko'rik natijalarini va boshqa ma'lumotlarni kiriting..." />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" icon={<StarOutlined />} size="large" block>
                    AI bilan hujjat yaratish
                  </Button>
                </Form>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="So'nggi hujjatlar">
                <List
                  dataSource={scribeSessions.slice(0, 5)}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={item.status === 'processing' ? <LoadingOutlined /> : <FileTextOutlined />} style={{ backgroundColor: item.status === 'processing' ? '#1890ff' : '#52c41a' }} />}
                        title={<Space>{typeIcons.scribe} {item.patient} {item.status === 'processing' && <Tag color="processing">Ishlanmoqda...</Tag>}</Space>}
                        description={<Text type="secondary">{item.created_at}</Text>}
                      />
                      {item.status === 'completed' && <Button size="small" onClick={() => Modal.info({ title: 'AI Scribe natijasi', width: 700, content: <pre style={{ whiteSpace: 'pre-wrap' }}>{item.result}</pre> })}>Ko'rish</Button>}
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'summary',
      label: <span><HistoryOutlined /> AI Xulosa</span>,
      children: (
        <div>
          <Alert
            message="AI Xulosa - Bemor tarixini xulosa qilish"
            description="Uzun bemor tarixlarini qisqa va tushunarli xulosaga aylantiradi. Tekshiruvlar, tashxislar va davolash tarixini umumlashtiradi."
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={5}>Tezkor xulosa yaratish</Title>
              <Space>
                <Select placeholder="Bemor tanlang" style={{ width: 250 }} onChange={(value) => handleStartSummary(value)}>
                  <Select.Option value="Rahimov Alisher">Rahimov Alisher</Select.Option>
                  <Select.Option value="Tursunova Dilshoda">Tursunova Dilshoda</Select.Option>
                  <Select.Option value="Abdullayev Jasur">Abdullayev Jasur</Select.Option>
                </Select>
                <Button type="primary" icon={<StarOutlined />} onClick={() => message.info('Bemor tanlang')}>Xulosa yaratish</Button>
              </Space>
            </Space>
          </Card>
          <Card title="Tarix" style={{ marginTop: 16 }}>
            <List
              dataSource={summarySessions}
              renderItem={(item) => (
                <List.Item
                  actions={item.status === 'completed' ? [
                    <Button key="view" size="small" onClick={() => Modal.info({ title: 'AI Xulosa', width: 700, content: <pre style={{ whiteSpace: 'pre-wrap' }}>{item.result}</pre> })}>Ko'rish</Button>,
                    <Button key="copy" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(item.result!)}>Nusxalash</Button>
                  ] : [<Tag key="status" color="processing">Ishlanmoqda...</Tag>]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={typeIcons.summary} style={{ backgroundColor: '#722ed1' }} />}
                    title={item.patient}
                    description={<Text type="secondary">{item.created_at} {item.duration && `• ${item.duration}`}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'recommendations',
      label: <span><BulbOutlined /> AI Tavsiyalar</span>,
      children: (
        <div>
          <Alert
            message="AI Tavsiyalar - Shaxsiy davolash rejasi"
            description="Bemor ma'lumotlari asosida personalizatsiyalangan davolash tavsiyalari, parhez va jismoniy faollik bo'yicha maslahatlar beradi."
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Card title="Yangi tavsiyalar yaratish">
            <Form layout="vertical" onFinish={handleStartRecommendations}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Bemor" name="patient" rules={[{ required: true }]}>
                    <Select placeholder="Bemor tanlang">
                      <Select.Option value="Rahimov Alisher">Rahimov Alisher</Select.Option>
                      <Select.Option value="Tursunova Dilshoda">Tursunova Dilshoda</Select.Option>
                      <Select.Option value="Abdullayev Jasur">Abdullayev Jasur</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Yoshi" name="age" rules={[{ required: true }]}>
                    <Input type="number" placeholder="Masalan: 45" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Jinsi" name="gender" rules={[{ required: true }]}>
                    <Select>
                      <Select.Option value="Erkak">Erkak</Select.Option>
                      <Select.Option value="Ayol">Ayol</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Qon bosimi" name="bp" rules={[{ required: true }]}>
                    <Input placeholder="Masalan: 140/90" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Vazn (kg)" name="weight" rules={[{ required: true }]}>
                    <Input type="number" placeholder="Masalan: 75" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Diagnoz" name="diagnosis" rules={[{ required: true }]}>
                    <Select>
                      <Select.Option value="Oshqozon yalliglanishi">Oshqozon yallig'lanishi</Select.Option>
                      <Select.Option value="2-tur diabet (E11.9)">2-tur diabet (E11.9)</Select.Option>
                      <Select.Option value="Yuqori qon bosimi (I10)">Yuqori qon bosimi (I10)</Select.Option>
                      <Select.Option value="Bronxit">Bronxit</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit" icon={<StarOutlined />} size="large">
                AI Tavsiyalar olish
              </Button>
            </Form>
          </Card>
          <Card title="Tarix" style={{ marginTop: 16 }}>
            <List
              dataSource={recommendationSessions}
              renderItem={(item) => (
                <List.Item
                  actions={item.status === 'completed' ? [
                    <Button key="view" size="small" onClick={() => Modal.info({ title: 'AI Tavsiyalar', width: 700, content: <pre style={{ whiteSpace: 'pre-wrap' }}>{item.result}</pre> })}>Ko'rish</Button>,
                    <Button key="copy" size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(item.result!)}>Nusxalash</Button>
                  ] : [<Tag key="status" color="processing">Ishlanmoqda...</Tag>]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={typeIcons.recommendations} style={{ backgroundColor: '#f43f5e' }} />}
                    title={item.patient}
                    description={<Text type="secondary">{item.created_at} {item.duration && `• ${item.duration}`}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>AI Modullar</Title>
        </Col>
        <Col>
          <Button icon={<RobotOutlined />} onClick={() => { configForm.setFieldsValue(config); setConfigModalOpen(true) }}>
            Sozlamalar
          </Button>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tugallangan"
              value={completedCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Jaryonda"
              value={processingCount}
              prefix={<LoadingOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="O'rtacha vaqt"
              value={avgDuration.toFixed(1)}
              suffix="soniya"
              prefix={<ThunderboltOutlined style={{ color: '#f43f5e' }} />}
              valueStyle={{ color: '#f43f5e' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Faol modullar"
              value={Object.values(config).filter(v => typeof v === 'boolean' && v).length}
              prefix={<RobotOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Config Modal */}
      <Modal
        title="AI Modullar sozlamalari"
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        onOk={() => configForm.submit()}
        width={500}
      >
        <Form form={configForm} layout="vertical" onFinish={handleSaveConfig} initialValues={config}>
          <Divider>Modullar</Divider>
          <Form.Item label="AI Scribe" name="scribe_enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="AI Xulosa" name="summary_enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="AI Tavsiyalar" name="recommendations_enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Divider>Sozlamalar</Divider>
          <Form.Item label="Avtomatik scribe" name="auto_scribe" valuePropName="checked" extra="Qabul oxirida avtomatik hujjat yaratish">
            <Switch />
          </Form.Item>
          <Form.Item label="Til" name="language">
            <Select>
              <Select.Option value="uz">O'zbek</Select.Option>
              <Select.Option value="ru">Rus</Select.Option>
              <Select.Option value="en">Ingliz</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="AI Model" name="model">
            <Select>
              <Select.Option value="gpt-4-turbo">GPT-4 Turbo</Select.Option>
              <Select.Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Select.Option>
              <Select.Option value="claude-3">Claude 3</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Card, Tabs, Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, message, Row, Col, Descriptions, Divider } from 'antd'
import { ArrowLeftOutlined, HeartOutlined, MedicineBoxOutlined, ExperimentOutlined, FileTextOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { i18n, formatDate } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input

export function MedicalCardPage() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('episodes')
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false)
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false)
  const [encounterModalOpen, setEncounterModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [diagnosisForm] = Form.useForm()
  const [encounterForm] = Form.useForm()

  // Demo patient data
  const patient = {
    id: patientId,
    first_name: 'Alisher',
    last_name: 'Rahimov',
    patronymic: 'Hasanovich',
    birth_date: '1990-05-15',
  }

  // Demo episodes data
  const [episodes, setEpisodes] = useState([
    {
      id: 'EP001',
      date: '2024-06-10',
      title: 'Oshqozon shikoyati',
      doctor: 'Karimova Nodira',
      status: 'active',
      type: 'examination',
      complaints: 'Og\'iz og\'rig\'i, ko\'ngil aynishi',
      diagnosis: 'Oshqozon-ichak yallig\'lanishi (K29.5)',
    },
    {
      id: 'EP002',
      date: '2024-03-15',
      title: 'Davolash kursi',
      doctor: 'Ahmedov Botir',
      status: 'completed',
      type: 'treatment',
      complaints: '-',
      diagnosis: '2-tur diabet (E11.9)',
    },
  ])

  // Demo vitals data
  const [vitals, setVitals] = useState([
    { id: 'V001', date: '2024-06-10', bp_systolic: 120, bp_diastolic: 80, pulse: 72, temp: 36.6, weight: 78, height: 175, spo2: 98 },
    { id: 'V002', date: '2024-05-20', bp_systolic: 125, bp_diastolic: 85, pulse: 75, temp: 36.8, weight: 79, height: 175, spo2: 97 },
  ])

  // Demo diagnoses data
  const [diagnoses, setDiagnoses] = useState([
    { id: 'D001', date: '2024-06-10', code: 'K29.5', name: 'Oshqozon-ichak yallig\'lanishi', type: 'main', status: 'active', doctor: 'Karimova Nodira' },
    { id: 'D002', date: '2024-03-15', code: 'E11.9', name: '2-tur diabetes mellitus', type: 'secondary', status: 'chronic', doctor: 'Ahmedov Botir' },
  ])

  // Demo prescriptions data
  const [prescriptions, setPrescriptions] = useState([
    { id: 'PR001', date: '2024-06-10', drug: 'Omeprazol 20mg', dosage: '1x2', duration: '14 kun', instructions: 'Nonushtadan oldin', status: 'active' },
    { id: 'PR002', date: '2024-03-15', drug: 'Metformin 500mg', dosage: '2x1', duration: 'Doimiy', instructions: 'Ovqat bilan', status: 'active' },
  ])

  const episodesColumns = [
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Sarlavha', dataIndex: 'title', key: 'title' },
    { title: 'Shifokor', dataIndex: 'doctor', key: 'doctor' },
    { title: 'Tashxis', dataIndex: 'diagnosis', key: 'diagnosis' },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'processing' : 'success'}>{s}</Tag> },
    {
      title: 'Amal',
      key: 'action',
      render: () => (
        <Space>
          <Button size="small" icon={<EditOutlined />}>Tahrirlash</Button>
          <Button size="small" icon={<FileTextOutlined />}>Hujjatlar</Button>
        </Space>
      ),
    },
  ]

  const vitalsColumns = [
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Qon bosimi', key: 'bp', render: (_: any, r: any) => `${r.bp_systolic}/${r.bp_diastolic} mmHg` },
    { title: 'Puls', dataIndex: 'pulse', key: 'pulse', render: (v: number) => `${v} /daq` },
    { title: 'Harorat', dataIndex: 'temp', key: 'temp', render: (v: number) => `${v}°C` },
    { title: 'SpO2', dataIndex: 'spo2', key: 'spo2', render: (v: number) => `${v}%` },
    { title: 'Vazn', dataIndex: 'weight', key: 'weight', render: (v: number) => `${v} kg` },
    { title: 'Bo\'y', dataIndex: 'height', key: 'height', render: (v: number) => `${v} sm` },
    { title: 'BMI', key: 'bmi', render: (_: any, r: any) => (r.weight / ((r.height / 100) ** 2)).toFixed(1) },
  ]

  const diagnosisColumns = [
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'ICD-10', dataIndex: 'code', key: 'code', render: (c: string) => <Tag color="blue">{c}</Tag> },
    { title: 'Tashxis', dataIndex: 'name', key: 'name' },
    { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={t === 'main' ? 'red' : 'orange'}>{t === 'main' ? 'Asosiy' : 'Qo\'shimcha'}</Tag> },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'success' : 'default'}>{s}</Tag> },
    { title: 'Shifokor', dataIndex: 'doctor', key: 'doctor' },
    { title: 'Amal', key: 'action', render: () => <Button size="small" icon={<DeleteOutlined />}>Olib tashlash</Button> },
  ]

  const prescriptionColumns = [
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Dori', dataIndex: 'drug', key: 'drug' },
    { title: 'Dozasi', dataIndex: 'dosage', key: 'dosage' },
    { title: 'Davomiyligi', dataIndex: 'duration', key: 'duration' },
    { title: 'Ko\'rsatma', dataIndex: 'instructions', key: 'instructions' },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'success' : 'default'}>{s}</Tag> },
    {
      title: 'Amal',
      key: 'action',
      render: () => (
        <Space>
          <Button size="small" type="primary">Chop etish</Button>
          <Button size="small">Bekor qilish</Button>
        </Space>
      ),
    },
  ]

  const handleAddVitals = (values: any) => {
    const newVitals = {
      id: 'V' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      ...values,
    }
    setVitals([newVitals, ...vitals])
    message.success('Vitals muvaffaqiyatli qo\'shildi')
    setVitalsModalOpen(false)
    form.resetFields()
  }

  const handleAddDiagnosis = (values: any) => {
    const newDiagnosis = {
      id: 'D' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      doctor: 'Hozirgi shifokor',
      ...values,
    }
    setDiagnoses([newDiagnosis, ...diagnoses])
    message.success('Tashxis muvaffaqiyatli qo\'shildi')
    setDiagnosisModalOpen(false)
    diagnosisForm.resetFields()
  }

  const handleStartEncounter = (values: any) => {
    const newEpisode = {
      id: 'EP' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      status: 'active',
      type: 'examination',
      doctor: 'Hozirgi shifokor',
      ...values,
    }
    setEpisodes([newEpisode, ...episodes])
    message.success('Epizod muvaffaqiyatli boshlaldi')
    setEncounterModalOpen(false)
    encounterForm.resetFields()
  }

  const tabItems = [
    {
      key: 'episodes',
      label: <span><FileTextOutlined /> Epizodlar</span>,
      children: (
        <Card
          title="Tibbiy epizodlar"
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setEncounterModalOpen(true)}>Yangi epizod</Button>}
        >
          <Table columns={episodesColumns} dataSource={episodes} rowKey="id" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'vitals',
      label: <span><HeartOutlined /> Vitals</span>,
      children: (
        <Card
          title="Antropometrik ko'rsatkichlar"
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setVitalsModalOpen(true)}>Yangi yozuv</Button>}
        >
          <Table columns={vitalsColumns} dataSource={vitals} rowKey="id" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'diagnoses',
      label: <span><MedicineBoxOutlined /> Tashxislar</span>,
      children: (
        <Card
          title="Tashxislar tarixi (ICD-10)"
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setDiagnosisModalOpen(true)}>Yangi tashxis</Button>}
        >
          <Table columns={diagnosisColumns} dataSource={diagnoses} rowKey="id" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'prescriptions',
      label: <span><ExperimentOutlined /> Retseptlar</span>,
      children: (
        <Card title="Dori retseptlari">
          <Table columns={prescriptionColumns} dataSource={prescriptions} rowKey="id" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'documents',
      label: <span><FileTextOutlined /> Hujjatlar</span>,
      children: (
        <Card title="Tibbiy hujjatlar">
          <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
            Hujjatlar hali yuklanmagan
          </div>
        </Card>
      ),
    },
  ]

  return (
    <div>
      <div style={{
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #081423 0%, #0d1f35 100%)',
        borderBottom: '1px solid rgba(0,212,170,0.15)',
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/patients/${patientId}`)} style={{ marginRight: 16 }}>
          Orqaga
        </Button>
        <Title level={3} style={{ color: '#fff', margin: 0, display: 'inline' }}>
          Tibbiyot kartasi: {patient.last_name} {patient.first_name}
        </Title>
      </div>

      <div style={{ padding: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>

      {/* Vitals Modal */}
      <Modal
        title="Vitals kiritish"
        open={vitalsModalOpen}
        onCancel={() => setVitalsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleAddVitals}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Qon bosimi (sistolik)" name="bp_systolic" rules={[{ required: true }]}>
                <Input type="number" placeholder="120" suffix="mmHg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Qon bosimi (diastolik)" name="bp_diastolic" rules={[{ required: true }]}>
                <Input type="number" placeholder="80" suffix="mmHg" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Puls" name="pulse" rules={[{ required: true }]}>
                <Input type="number" placeholder="72" suffix="/daq" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Harorat" name="temp" rules={[{ required: true }]}>
                <Input type="number" placeholder="36.6" suffix="°C" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="SpO2" name="spo2" rules={[{ required: true }]}>
                <Input type="number" placeholder="98" suffix="%" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Vazn" name="weight" rules={[{ required: true }]}>
                <Input type="number" placeholder="78" suffix="kg" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Bo'y" name="height" rules={[{ required: true }]}>
            <Input type="number" placeholder="175" suffix="sm" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Diagnosis Modal */}
      <Modal
        title="Yangi tashxis qo'shish"
        open={diagnosisModalOpen}
        onCancel={() => setDiagnosisModalOpen(false)}
        onOk={() => diagnosisForm.submit()}
        width={600}
      >
        <Form form={diagnosisForm} layout="vertical" onFinish={handleAddDiagnosis}>
          <Form.Item label="ICD-10 kodi" name="code" rules={[{ required: true }]}>
            <Input placeholder="K29.5" />
          </Form.Item>
          <Form.Item label="Tashxis nomi" name="name" rules={[{ required: true }]}>
            <Input placeholder="Oshqozon-ichak yallig'lanishi" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tashxis turi" name="type" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="main">Asosiy tashxis</Select.Option>
                  <Select.Option value="secondary">Qo'shimcha tashxis</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Holati" name="status" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="active">Faol</Select.Option>
                  <Select.Option value="chronic">Surunkali</Select.Option>
                  <Select.Option value="recovered">Tuzalgan</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Izoh" name="notes">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Encounter Modal */}
      <Modal
        title="Yangi epizod boshlash"
        open={encounterModalOpen}
        onCancel={() => setEncounterModalOpen(false)}
        onOk={() => encounterForm.submit()}
        width={600}
      >
        <Form form={encounterForm} layout="vertical" onFinish={handleStartEncounter}>
          <Form.Item label="Epizod sarlavhasi" name="title" rules={[{ required: true }]}>
            <Input placeholder="Shikoyat nomi" />
          </Form.Item>
          <Form.Item label="Shikoyatlar" name="complaints">
            <TextArea rows={3} placeholder="Bemor shikoyatlari" />
          </Form.Item>
          <Form.Item label="Tashxis" name="diagnosis">
            <Input placeholder="Dastlabki tashxis" />
          </Form.Item>
          <Form.Item label="Izoh" name="notes">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
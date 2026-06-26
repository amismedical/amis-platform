import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Card, Tabs, Table, Tag, Button, Space, Modal, Form, Input, Select, message, Row, Col, Descriptions, Divider, Empty, Spin } from 'antd'
import { ArrowLeftOutlined, HeartOutlined, MedicineBoxOutlined, ExperimentOutlined, FileTextOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { i18n, formatDate } from '../i18n/uz'
import { patientService, medicalCardService } from '../services/api'

const { Title, Text } = Typography
const { TextArea } = Input

export function MedicalCardPage() {
  const { id: patientId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('episodes')
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false)
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false)
  const [encounterModalOpen, setEncounterModalOpen] = useState(false)
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [diagnosisForm] = Form.useForm()
  const [encounterForm] = Form.useForm()

  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientService.get(patientId!),
    enabled: !!patientId,
  })

  // Fetch medical card
  const { data: medicalCardData } = useQuery({
    queryKey: ['medicalCard', patientId],
    queryFn: () => medicalCardService.getMedicalCard(patientId!),
    enabled: !!patientId,
  })

  // Fetch episodes
  const { data: episodesData, isLoading: episodesLoading } = useQuery({
    queryKey: ['episodes', patientId],
    queryFn: () => medicalCardService.getEpisodes(patientId!),
    enabled: !!patientId,
  })

  // Fetch episode vitals if episode selected
  const { data: vitalsData } = useQuery({
    queryKey: ['episodeVitals', selectedEpisodeId],
    queryFn: () => medicalCardService.getEpisodeVitals(selectedEpisodeId!),
    enabled: !!selectedEpisodeId,
  })

  // Fetch episode diagnoses if episode selected
  const { data: diagnosesData } = useQuery({
    queryKey: ['episodeDiagnoses', selectedEpisodeId],
    queryFn: () => medicalCardService.getEpisodeDiagnoses(selectedEpisodeId!),
    enabled: !!selectedEpisodeId,
  })

  // Fetch episode recommendations if episode selected
  const { data: recommendationsData } = useQuery({
    queryKey: ['episodeRecommendations', selectedEpisodeId],
    queryFn: () => medicalCardService.getEpisodeRecommendations(selectedEpisodeId!),
    enabled: !!selectedEpisodeId,
  })

  // Create episode mutation
  const createEpisodeMutation = useMutation({
    mutationFn: (data: { title: string; doctor_id: string }) =>
      medicalCardService.createEpisode(patientId!, data),
    onSuccess: () => {
      message.success('Epizod muvaffaqiyatli yaratildi')
      setEncounterModalOpen(false)
      encounterForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['episodes', patientId] })
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  // Create diagnosis mutation
  const createDiagnosisMutation = useMutation({
    mutationFn: (data: { icd_code: string; icd_name: string; type: string; status?: string; notes?: string }) =>
      medicalCardService.createDiagnosis(selectedEpisodeId!, data),
    onSuccess: () => {
      message.success('Tashxis muvaffaqiyatli qo\'shildi')
      setDiagnosisModalOpen(false)
      diagnosisForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['episodeDiagnoses', selectedEpisodeId] })
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  // Save vitals mutation
  const saveVitalsMutation = useMutation({
    mutationFn: (data: any) =>
      medicalCardService.saveEpisodeVitals(selectedEpisodeId!, data),
    onSuccess: () => {
      message.success('Vitals muvaffaqiyatli saqlandi')
      setVitalsModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['episodeVitals', selectedEpisodeId] })
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  const handleStartEncounter = (values: any) => {
    if (!values.doctor_id) {
      message.error('Shifokor tanlash majburiy')
      return
    }
    createEpisodeMutation.mutate(values)
  }

  const handleAddDiagnosis = (values: any) => {
    createDiagnosisMutation.mutate(values)
  }

  const handleSaveVitals = (values: any) => {
    saveVitalsMutation.mutate(values)
  }

  if (patientLoading) {
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Yuklanmoqda...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div style={{ padding: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')} style={{ marginBottom: 16 }}>
          Bemorlar ro'yxati
        </Button>
        <Card>
          <Empty description="Bemor topilmadi" />
        </Card>
      </div>
    )
  }

  const episodes = episodesData?.data || []
  const medicalCard = medicalCardData?.data
  const vitals = vitalsData?.data ? [vitalsData.data] : []
  const diagnoses = diagnosesData?.data || []
  const recommendations = recommendationsData?.data || []

  // Episodes columns
  const episodesColumns = [
    { title: 'Sana', dataIndex: 'started_at', key: 'started_at', render: (d: string) => formatDate(d) },
    { title: 'Sarlavha', dataIndex: 'title', key: 'title' },
    { title: 'Shifokor', key: 'doctor', render: (_: any, r: any) => r.doctor ? `${r.doctor.last_name} ${r.doctor.first_name}` : '-' },
    { title: 'Tashxis', dataIndex: 'conclusion', key: 'conclusion', render: (d: string) => d || '-' },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'processing' : s === 'completed' ? 'success' : 'error'}>{s === 'active' ? 'Faol' : s === 'completed' ? 'Tugallangan' : 'Bekor'}</Tag> },
    {
      title: 'Amal',
      key: 'action',
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<FileTextOutlined />} onClick={() => setSelectedEpisodeId(r.id)}>
            Ko'rish
          </Button>
        </Space>
      ),
    },
  ]

  // Vitals columns
  const vitalsColumns = [
    { title: 'Sana', dataIndex: 'recorded_at', key: 'recorded_at', render: (d: string) => formatDate(d) },
    { title: 'Qon bosimi', key: 'bp', render: (_: any, r: any) => r.bp_systolic ? `${r.bp_systolic}/${r.bp_diastolic} mmHg` : '-' },
    { title: 'Puls', dataIndex: 'pulse', key: 'pulse', render: (v: number) => v ? `${v} /daq` : '-' },
    { title: 'Harorat', dataIndex: 'temperature', key: 'temperature', render: (v: number) => v ? `${v}°C` : '-' },
    { title: 'Vazn', dataIndex: 'weight', key: 'weight', render: (v: number) => v ? `${v} kg` : '-' },
    { title: "Bo'y", dataIndex: 'height', key: 'height', render: (v: number) => v ? `${v} sm` : '-' },
    { title: 'BMI', key: 'bmi', render: (_: any, r: any) => r.weight && r.height ? (r.weight / ((r.height / 100) ** 2)).toFixed(1) : '-' },
  ]

  // Diagnosis columns
  const diagnosisColumns = [
    { title: 'Sana', dataIndex: 'created_at', key: 'created_at', render: (d: string) => formatDate(d) },
    { title: 'ICD-10', dataIndex: 'icd_code', key: 'icd_code', render: (c: string) => <Tag color="blue">{c}</Tag> },
    { title: 'Tashxis', dataIndex: 'icd_name', key: 'icd_name' },
    { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={t === 'main' ? 'red' : 'orange'}>{t === 'main' ? 'Asosiy' : "Qo'shimcha"}</Tag> },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'preliminary' ? 'orange' : 'success'}>{s === 'preliminary' ? 'Dastlabki' : 'Tasdiqlangan'}</Tag> },
  ]

  // Recommendation columns
  const recommendationColumns = [
    { title: 'Sana', dataIndex: 'created_at', key: 'created_at', render: (d: string) => formatDate(d) },
    { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Tavsif', dataIndex: 'description', key: 'description' },
    { title: "Ko'rsatma", dataIndex: 'instructions', key: 'instructions', render: (i: string) => i || '-' },
  ]

  const tabItems = [
    {
      key: 'episodes',
      label: <span><FileTextOutlined /> Epizodlar</span>,
      children: (
        <Card
          title="Tibbiy epizodlar"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setEncounterModalOpen(true)}
            >
              Yangi epizod
            </Button>
          }
        >
          {episodesLoading ? (
            <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
          ) : episodes.length > 0 ? (
            <Table
              columns={episodesColumns}
              dataSource={episodes}
              rowKey="id"
              pagination={false}
              onRow={(record) => ({
                onClick: () => setSelectedEpisodeId(record.id),
                style: { cursor: 'pointer' },
              })}
            />
          ) : (
            <Empty description="Tibbiy epizodlar mavjud emas" />
          )}
        </Card>
      ),
    },
    {
      key: 'vitals',
      label: <span><HeartOutlined /> Vitals</span>,
      children: (
        <Card
          title="Antropometrik ko'rsatkichlar"
          extra={
            selectedEpisodeId && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setVitalsModalOpen(true)}
              >
                Yangi yozuv
              </Button>
            )
          }
        >
          {selectedEpisodeId ? (
            vitals.length > 0 ? (
              <Table columns={vitalsColumns} dataSource={vitals} rowKey="id" pagination={false} />
            ) : (
              <Empty description="Bu epizodda vitals ma'lumotlari yo'q" />
            )
          ) : (
            <Empty description="Epizod tanlang" />
          )}
        </Card>
      ),
    },
    {
      key: 'diagnoses',
      label: <span><MedicineBoxOutlined /> Tashxislar</span>,
      children: (
        <Card
          title="Tashxislar tarixi (ICD-10)"
          extra={
            selectedEpisodeId && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setDiagnosisModalOpen(true)}
              >
                Yangi tashxis
              </Button>
            )
          }
        >
          {selectedEpisodeId ? (
            diagnoses.length > 0 ? (
              <Table columns={diagnosisColumns} dataSource={diagnoses} rowKey="id" pagination={false} />
            ) : (
              <Empty description="Bu epizodda tashxislar yo'q" />
            )
          ) : (
            <Empty description="Epizod tanlang" />
          )}
        </Card>
      ),
    },
    {
      key: 'recommendations',
      label: <span><ExperimentOutlined /> Tavsiyalar</span>,
      children: (
        <Card title="Tibbiy tavsiyalar">
          {recommendations.length > 0 ? (
            <Table columns={recommendationColumns} dataSource={recommendations} rowKey="id" pagination={false} />
          ) : (
            <Empty description="Tavsiyalar mavjud emas" />
          )}
        </Card>
      ),
    },
    {
      key: 'info',
      label: <span><FileTextOutlined /> Ma'lumot</span>,
      children: (
        <Card title="Tibbiyot karta ma'lumotlari">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Bemor">{patient.last_name} {patient.first_name} {patient.patronymic || ''}</Descriptions.Item>
            <Descriptions.Item label="MED-ID">{patient.med_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="Tug'ilgan sana">{formatDate(patient.birth_date)}</Descriptions.Item>
            <Descriptions.Item label="Jinsi">{patient.gender === 'male' ? 'Erkak' : 'Ayol'}</Descriptions.Item>
            <Descriptions.Item label="Qon guruhi">{medicalCard?.blood_type || '-'}</Descriptions.Item>
            <Descriptions.Item label="Rh omil">{medicalCard?.rh_factor || '-'}</Descriptions.Item>
            <Descriptions.Item label="Allergiya" span={2}>{medicalCard?.allergies || 'Ko\'rsatilmagan'}</Descriptions.Item>
            <Descriptions.Item label="Surunkali kasalliklar" span={2}>{medicalCard?.chronic_conditions || 'Ko\'rsatilmagan'}</Descriptions.Item>
            <Descriptions.Item label="Oilaviy tarix" span={2}>{medicalCard?.family_history || 'Ko\'rsatilmagan'}</Descriptions.Item>
          </Descriptions>
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
        {patient.med_id && (
          <Tag color="blue" style={{ marginLeft: 12 }}>{patient.med_id}</Tag>
        )}
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
        confirmLoading={saveVitalsMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveVitals}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Qon bosimi (sistolik)" name="bp_systolic">
                <Input type="number" placeholder="120" suffix="mmHg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Qon bosimi (diastolik)" name="bp_diastolic">
                <Input type="number" placeholder="80" suffix="mmHg" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Puls" name="pulse">
                <Input type="number" placeholder="72" suffix="/daq" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Harorat" name="temperature">
                <Input type="number" placeholder="36.6" suffix="°C" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Vazn" name="weight">
                <Input type="number" placeholder="78" suffix="kg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Bo'y" name="height">
                <Input type="number" placeholder="175" suffix="sm" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Izoh" name="comments">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Diagnosis Modal */}
      <Modal
        title="Yangi tashxis qo'shish"
        open={diagnosisModalOpen}
        onCancel={() => setDiagnosisModalOpen(false)}
        onOk={() => diagnosisForm.submit()}
        confirmLoading={createDiagnosisMutation.isPending}
        width={600}
      >
        <Form form={diagnosisForm} layout="vertical" onFinish={handleAddDiagnosis}>
          <Form.Item label="ICD-10 kodi" name="icd_code" rules={[{ required: true, message: 'ICD-10 kodi kiritish majburiy' }]}>
            <Input placeholder="K29.5" />
          </Form.Item>
          <Form.Item label="Tashxis nomi" name="icd_name" rules={[{ required: true, message: 'Tashxis nomi kiritish majburiy' }]}>
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
                  <Select.Option value="preliminary">Dastlabki</Select.Option>
                  <Select.Option value="confirmed">Tasdiqlangan</Select.Option>
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
        confirmLoading={createEpisodeMutation.isPending}
        width={600}
      >
        <Form form={encounterForm} layout="vertical" onFinish={handleStartEncounter}>
          <Form.Item label="Epizod sarlavhasi" name="title" rules={[{ required: true, message: 'Sarlavha kiritish majburiy' }]}>
            <Input placeholder="Shikoyat nomi" />
          </Form.Item>
          <Form.Item label="Shifokor" name="doctor_id" rules={[{ required: true, message: 'Shifokor tanlash majburiy' }]}>
            <Input placeholder="Shifokor ID" />
          </Form.Item>
          <Form.Item label="Izoh" name="notes">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

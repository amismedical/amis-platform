import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Card, Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, message, Spin, Row, Col, Descriptions, Divider } from 'antd'
import { PlayCircleOutlined, PlusOutlined, HeartOutlined, MedicineBoxOutlined, FileTextOutlined } from '@ant-design/icons'
import { appointmentService, staffService } from '../services/mockApi'
import { i18n, formatFullDate, statusTranslations, roleTranslations } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title } = Typography
const { TextArea } = Input

export function DoctorPage() {
  const queryClient = useQueryClient()
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [showVitalsModal, setShowVitalsModal] = useState(false)
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false)
  const [form] = Form.useForm()
  const [diagnosisForm] = Form.useForm()

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => appointmentService.list({ date: new Date().toISOString().split('T')[0] }),
  })

  const { data: doctors } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffService.list(),
  })

  const startEncounterMutation = useMutation({
    mutationFn: (data: any) => {
      return Promise.resolve({ encounter_id: 'enc-' + Date.now() })
    },
    onSuccess: () => {
      message.success(i18n.doctor.appointmentStarted)
      setSelectedAppointment({ ...selectedAppointment, encounter_id: 'enc-' + Date.now(), status: 'in_progress' })
    },
  })

  const recordVitalsMutation = useMutation({
    mutationFn: (data: any) => {
      return Promise.resolve({ success: true })
    },
    onSuccess: () => {
      message.success(i18n.doctor.vitalsRecorded)
      setShowVitalsModal(false)
      form.resetFields()
    },
  })

  const addDiagnosisMutation = useMutation({
    mutationFn: (data: any) => {
      return Promise.resolve({ success: true })
    },
    onSuccess: () => {
      message.success(i18n.doctor.diagnosisAdded)
      setShowDiagnosisModal(false)
      diagnosisForm.resetFields()
    },
  })

  const handleStartEncounter = (appointment: any) => {
    setSelectedAppointment(appointment)
    startEncounterMutation.mutate({
      appointment_id: appointment.id,
      complaints: '',
    })
  }

  const handleRecordVitals = (values: any) => {
    if (!selectedAppointment) return
    recordVitalsMutation.mutate({
      episode_id: selectedAppointment.episode_id,
      ...values,
    })
  }

  const handleAddDiagnosis = (values: any) => {
    if (!selectedAppointment) return
    addDiagnosisMutation.mutate({
      episode_id: selectedAppointment.episode_id,
      icd_code: values.icd_code,
      icd_name: values.icd_name,
      type: values.type,
      notes: values.notes,
    })
  }

  const statusColors: Record<string, string> = {
    scheduled: 'default',
    waiting: 'warning',
    in_progress: 'processing',
    completed: 'success',
    cancelled: 'error',
  }

  const columns = [
    {
      title: i18n.appointments.time,
      dataIndex: 'start_time',
      key: 'start_time',
      width: 80,
    },
    {
      title: i18n.appointments.status,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusTranslations[status]}</Tag>
      ),
    },
    {
      title: i18n.appointments.patient,
      key: 'patient',
      render: (_: any, record: any) => (
        <span>
          {record.patient?.first_name} {record.patient?.last_name}
        </span>
      ),
    },
    {
      title: i18n.appointments.service,
      dataIndex: ['service', 'name'],
      key: 'service',
    },
    {
      title: i18n.appointments.cabinet,
      dataIndex: 'cabinet',
      key: 'cabinet',
      width: 80,
    },
    {
      title: i18n.queue.actions,
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        record.status === 'waiting' && (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStartEncounter(record)}
          >
            {i18n.doctor.startAppointment}
          </Button>
        )
      ),
    },
  ]

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Title level={3}>{i18n.doctor.title}</Title>
      <Title level={5} style={{ marginTop: 0, color: '#8c8c8c' }}>
        {formatFullDate(new Date())}
      </Title>

      <Row gutter={16}>
        <Col span={selectedAppointment ? 14 : 24}>
          <Card title={i18n.doctor.todaySchedule}>
            <Table
              columns={columns}
              dataSource={appointmentsData?.data || []}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>

        {selectedAppointment && (
          <Col span={10}>
            <Card
              title={`${i18n.doctor.startAppointment}: ${selectedAppointment.patient?.first_name} ${selectedAppointment.patient?.last_name}`}
              extra={
                <Tag color="processing">{i18n.status.in_progress}</Tag>
              }
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label={i18n.doctor.phone}>
                  {selectedAppointment.patient?.phone}
                </Descriptions.Item>
                <Descriptions.Item label={i18n.doctor.service}>
                  {selectedAppointment.service?.name}
                </Descriptions.Item>
                <Descriptions.Item label={i18n.doctor.cabinet}>
                  {selectedAppointment.cabinet}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
                  icon={<HeartOutlined />}
                  onClick={() => setShowVitalsModal(true)}
                >
                  {i18n.doctor.recordVitals}
                </Button>
                <Button
                  block
                  icon={<MedicineBoxOutlined />}
                  onClick={() => setShowDiagnosisModal(true)}
                >
                  {i18n.doctor.addDiagnosis}
                </Button>
                <Button
                  block
                  icon={<FileTextOutlined />}
                >
                  {i18n.doctor.sendToLab}
                </Button>
              </Space>
            </Card>
          </Col>
        )}
      </Row>

      <Modal
        title={i18n.doctor.vitalsData}
        open={showVitalsModal}
        onCancel={() => setShowVitalsModal(false)}
        onOk={() => form.submit()}
        confirmLoading={recordVitalsMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleRecordVitals}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="height" label={i18n.doctor.height}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="weight" label={i18n.doctor.weight}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="temperature" label={i18n.doctor.temperature}>
                <Input type="number" step="0.1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pulse" label={i18n.doctor.pulse}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bp_systolic" label={i18n.doctor.upperPressure}>
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bp_diastolic" label={i18n.doctor.lowerPressure}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="comments" label={i18n.doctor.comments}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={i18n.doctor.addDiagnosisTitle}
        open={showDiagnosisModal}
        onCancel={() => setShowDiagnosisModal(false)}
        onOk={() => diagnosisForm.submit()}
        confirmLoading={addDiagnosisMutation.isPending}
      >
        <Form form={diagnosisForm} layout="vertical" onFinish={handleAddDiagnosis}>
          <Form.Item name="icd_code" label={i18n.doctor.icdCode} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="icd_name" label={i18n.doctor.diagnosisName} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label={i18n.doctor.diagnosisType} rules={[{ required: true }]}>
            <Select>
              <Select.Option value="primary">{i18n.doctor.primary}</Select.Option>
              <Select.Option value="secondary">{i18n.doctor.secondary}</Select.Option>
              <Select.Option value="complication">{i18n.doctor.complication}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label={i18n.doctor.comments}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
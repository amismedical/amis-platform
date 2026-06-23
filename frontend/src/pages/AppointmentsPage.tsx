import { useState } from 'react'
import { Typography, Card, Table, Tag, Space, Button, Input, Select, DatePicker, Modal, Form, message, Spin, TimePicker, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { i18n, statusTranslations } from '../i18n/uz'
import { appointmentService, patientService, staffService, referenceService } from '../services/api'
import dayjs from 'dayjs'

const { Title } = Typography

export function AppointmentsPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [cancelForm] = Form.useForm()
  const [viewRecord, setViewRecord] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [doctorFilter, setDoctorFilter] = useState<string>('')
  const [searchText, setSearchText] = useState('')

  // Fetch appointments with all filters
  const { data: appointmentsData, isLoading, refetch } = useQuery({
    queryKey: ['appointments', selectedDate, statusFilter, doctorFilter, searchText],
    queryFn: () =>
      appointmentService.list({
        date_from: selectedDate,
        date_to: selectedDate,
        status: statusFilter || undefined,
        doctor_id: doctorFilter || undefined,
      }),
    enabled: true,
  })

  // Filter client-side for search text (name/phone)
  const filteredData = (appointmentsData?.data || []).filter((a: any) => {
    if (!searchText) return true
    const text = searchText.toLowerCase()
    const patient = a.patient
    const name = `${patient?.first_name || ''} ${patient?.last_name || ''}`.toLowerCase()
    const phone = (patient?.phone || '').toLowerCase()
    return name.includes(text) || phone.includes(text)
  })

  // Fetch patients for select
  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientService.list({ limit: 100 }),
  })

  // Fetch doctors/staff for select
  const { data: staffData } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => staffService.list({ limit: 100 }),
  })

  // Fetch services for service selection
  const { data: servicesData } = useQuery({
    queryKey: ['services-list'],
    queryFn: async () => {
      const res = await referenceService.list()
      if (Array.isArray(res)) return res
      return (res as any)?.data ?? []
    },
  })

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return appointmentService.create({
        patient_id: values.patient_id,
        doctor_id: values.doctor_id,
        ...(values.service_id ? { service_id: values.service_id } : {}),
        appointment_date: values.date.format('YYYY-MM-DD'),
        start_time: values.time.format('HH:mm'),
        booking_method: 'reception',
        notes: values.notes,
      })
    },
    onSuccess: () => {
      message.success("Qabul ro'yxatga olindi!")
      setModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      refetch()
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || error?.response?.data?.message || "Ro'yxatga olishda xatolik")
    },
  })

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return appointmentService.updateStatus(id, 'cancelled', reason)
    },
    onSuccess: () => {
      message.success("Qabul bekor qilindi!")
      setViewModalOpen(false)
      cancelForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      refetch()
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || "Bekor qilishda xatolik")
    },
  })

  const handleSubmit = (values: any) => {
    createMutation.mutate(values)
  }

  const handleView = (record: any) => {
    setViewRecord(record)
    setViewModalOpen(true)
  }

  const handleCancel = (values: any) => {
    if (!viewRecord) return
    cancelMutation.mutate({ id: viewRecord.id, reason: values.cancel_reason || '' })
  }

  const statusColors: Record<string, string> = {
    scheduled: 'blue',
    waiting: 'orange',
    in_progress: 'processing',
    completed: 'success',
    cancelled: 'error',
  }

  const columns = [
    {
      title: i18n.appointments.time,
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time: string) => time || '-',
    },
    {
      title: i18n.appointments.patient,
      key: 'patient',
      render: (_: any, record: any) => {
        const p = record.patient
        if (!p) return '-'
        return `${p.first_name || ''} ${p.last_name || ''}`.trim() || '-'
      },
    },
    {
      title: i18n.appointments.service,
      key: 'service',
      render: (_: any, record: any) => record.service?.name || '-',
    },
    {
      title: i18n.appointments.doctor,
      key: 'doctor',
      render: (_: any, record: any) => {
        const d = record.doctor
        if (!d) return '-'
        return `${d.last_name || ''} ${d.first_name || ''}`.trim() || '-'
      },
    },
    {
      title: i18n.appointments.status,
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusTranslations[status] || status}
        </Tag>
      ),
    },
    {
      title: i18n.appointments.cabinet,
      dataIndex: 'cabinet',
      key: 'cabinet',
      render: (cabinet: string) => cabinet || '-',
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          />
          {record.status !== 'cancelled' && record.status !== 'completed' && (
            <Popconfirm
              title="Qabulni bekor qilish"
              description="Ishonchingiz komilmi?"
              onConfirm={() => {
                cancelMutation.mutate({ id: record.id, reason: '' })
              }}
              okText="Ha"
              cancelText="Yo'q"
            >
              <Button type="text" size="small" danger>
                Bekor
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Title level={3} style={{ margin: 0 }}>{i18n.appointments.title}</Title>
      </Space>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <DatePicker
            value={dayjs(selectedDate)}
            onChange={(date) => setSelectedDate(date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'))}
          />
          <Input
            placeholder="Bemor izlash..."
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="Status"
            style={{ width: 130 }}
            allowClear
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
          >
            <Select.Option value="scheduled">Kutilmoqda</Select.Option>
            <Select.Option value="waiting">Navbatda</Select.Option>
            <Select.Option value="in_progress">Davom etmoqda</Select.Option>
            <Select.Option value="completed">Yakunlangan</Select.Option>
            <Select.Option value="cancelled">Bekor qilingan</Select.Option>
          </Select>
          <Select
            placeholder="Shifokor"
            style={{ width: 160 }}
            allowClear
            value={doctorFilter || undefined}
            onChange={(v) => setDoctorFilter(v || '')}
            showSearch
            filterOption={(input, option) =>
              (option?.children as any)?.props?.children?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {(staffData?.data || []).map((s: any) => (
              <Select.Option key={s.id} value={s.id}>
                {s.last_name} {s.first_name}
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            {i18n.appointments.register}
          </Button>
        </Space>

        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>

      {/* Create Appointment Modal */}
      <Modal
        title={i18n.appointments.register}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="patient_id"
            label={i18n.appointments.patient}
            rules={[{ required: true, message: "Bemor tanlang" }]}
          >
            <Select
              placeholder="Bemor tanlang"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as any)?.props?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {(patientsData?.data || []).map((p: any) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} — {p.phone}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="doctor_id"
            label={i18n.appointments.doctor}
            rules={[{ required: true, message: "Shifokor tanlang" }]}
          >
            <Select
              placeholder="Shifokor tanlang"
              showSearch
              filterOption={(input, option) =>
                (option?.children as any)?.props?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {!(staffData?.data?.length) && (
                <Select.Option key="no-data" value="" disabled>
                  Shifokorlar hali qo'shilmagan
                </Select.Option>
              )}
              {(staffData?.data || []).map((s: any) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.last_name} {s.first_name}{s.patronymic ? ' ' + s.patronymic : ''} — {s.specialty || s.position || 'Shifokor'}{s.cabinet ? ` — Kabinet ${s.cabinet}` : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="service_id"
            label={i18n.appointments.service}
          >
            <Select placeholder="Xizmat tanlang" allowClear>
              {(() => {
                const services = Array.isArray(servicesData) ? servicesData : []
                if (services.length === 0) {
                  return (
                    <Select.Option key="no-services" value="" disabled>
                      Xizmatlar hali qo'shilmagan
                    </Select.Option>
                  )
                }
                return services.map((svc: any) => (
                  <Select.Option key={svc.id} value={svc.id}>
                    {svc.name}{svc.base_price ? ` — ${svc.base_price.toLocaleString()} so'm` : ''}
                  </Select.Option>
                ))
              })()}
            </Select>
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="date"
              label="Sana"
              rules={[{ required: true, message: "Sana tanlang" }]}
              initialValue={dayjs()}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="time"
              label="Vaqt"
              rules={[{ required: true, message: "Vaqt tanlang" }]}
              initialValue={dayjs().hour(9).minute(0)}
            >
              <TimePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="cabinet" label={i18n.appointments.cabinet}>
            <Select placeholder="Kabinet tanlang" allowClear>
              <Select.Option value="101">101</Select.Option>
              <Select.Option value="102">102</Select.Option>
              <Select.Option value="103">103</Select.Option>
              <Select.Option value="104">104</Select.Option>
              <Select.Option value="201">201</Select.Option>
              <Select.Option value="202">202</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Izoh">
            <Input.TextArea rows={2} placeholder="Izoh..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setModalOpen(false); form.resetFields() }}>
                Bekor qilish
              </Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                Ro'yxatga olish
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View / Cancel Modal */}
      <Modal
        title="Qabul tafsilotlari"
        open={viewModalOpen}
        onCancel={() => { setViewModalOpen(false); setViewRecord(null) }}
        footer={null}
        width={480}
      >
        {viewRecord && (
          <div style={{ marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#888', padding: '4px 0' }}>Bemor:</td>
                  <td style={{ fontWeight: 500 }}>
                    {viewRecord.patient ? `${viewRecord.patient.first_name} ${viewRecord.patient.last_name}` : '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#888', padding: '4px 0' }}>Shifokor:</td>
                  <td>
                    {viewRecord.doctor
                      ? `${viewRecord.doctor.last_name} ${viewRecord.doctor.first_name}`
                      : '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#888', padding: '4px 0' }}>Xizmat:</td>
                  <td>{viewRecord.service?.name || '-'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#888', padding: '4px 0' }}>Sana:</td>
                  <td>{viewRecord.appointment_date || '-'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#888', padding: '4px 0' }}>Vaqt:</td>
                  <td>{viewRecord.start_time || '-'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#888', padding: '4px 0' }}>Status:</td>
                  <td>
                    <Tag color={statusColors[viewRecord.status] || 'default'}>
                      {statusTranslations[viewRecord.status] || viewRecord.status}
                    </Tag>
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#888', padding: '4px 0' }}>Kabinet:</td>
                  <td>{viewRecord.cabinet || '-'}</td>
                </tr>
                {viewRecord.cancel_reason && (
                  <tr>
                    <td style={{ color: '#888', padding: '4px 0' }}>Bekor sababi:</td>
                    <td>{viewRecord.cancel_reason}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {viewRecord.status !== 'cancelled' && viewRecord.status !== 'completed' && (
              <div style={{ marginTop: 20, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                <Form form={cancelForm} layout="vertical" onFinish={handleCancel}>
                  <Form.Item name="cancel_reason" label="Bekor qilish sababi (ixtiyoriy)">
                    <Input.TextArea rows={2} placeholder="Sabab..." />
                  </Form.Item>
                  <Space>
                    <Button danger htmlType="submit" loading={cancelMutation.isPending}>
                      Qabulni bekor qilish
                    </Button>
                    <Button onClick={() => { setViewModalOpen(false); setViewRecord(null) }}>
                      Yopish
                    </Button>
                  </Space>
                </Form>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

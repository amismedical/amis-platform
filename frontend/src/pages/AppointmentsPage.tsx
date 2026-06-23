import { useState } from 'react'
import { Typography, Card, Table, Tag, Space, Button, Input, Select, DatePicker, Modal, Form, message, Spin, TimePicker } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { i18n, statusTranslations } from '../i18n/uz'
import { appointmentService, patientService, staffService, queueService, referenceService } from '../services/api'
import dayjs from 'dayjs'

const { Title } = Typography

export function AppointmentsPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

  // Fetch appointments
  const { data: appointmentsData, isLoading, refetch } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: () => appointmentService.list({ date_from: selectedDate, date_to: selectedDate }),
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

  // Fetch queues for queue registration
  const { data: queuesData } = useQuery({
    queryKey: ['queues-list'],
    queryFn: () => queueService.list(),
  })

  // Fetch services for service selection
  const { data: servicesData } = useQuery({
    queryKey: ['services-list'],
    queryFn: async () => {
      // Try /references/services first (returns flat Service[])
      try {
        return await referenceService.services()
      } catch {
        // Fallback: /references/services-groups (returns ServiceGroup[])
        const groups = await referenceService.serviceGroups()
        // Flatten service groups: each group may have direct services in 'children' or 'items'
        const flat: any[] = []
        const flattenGroup = (g: any) => {
          if (g.services) flat.push(...(g.services || []))
          if (g.items) flat.push(...(g.items || []))
          if (g.children) g.children.forEach(flattenGroup)
        }
        ;((groups as any)?.data || []).forEach(flattenGroup)
        return flat
      }
    },
  })

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      // Use real service_id if available, otherwise skip it (backend accepts optional service_id)
      const appointment = await appointmentService.create({
        patient_id: values.patient_id,
        doctor_id: values.doctor_id,
        ...(values.service_id ? { service_id: values.service_id } : {}),
        appointment_date: values.date.format('YYYY-MM-DD'),
        start_time: values.time.format('HH:mm'),
        booking_method: 'reception',
        notes: values.notes,
      })

      // Auto-create queue entry with real queue_id from clinic
      try {
        const queues = queuesData?.data || []
        const firstQueue = queues[0]
        if (firstQueue) {
          await queueService.register({
            queue_id: firstQueue.id,
            patient_id: values.patient_id,
            appointment_id: appointment.id,
            cabinet: values.cabinet,
            doctor_id: values.doctor_id,
          })
        }
      } catch (e) {
        // Queue might not be set up yet, ignore error silently
      }

      return appointment
    },
    onSuccess: () => {
      message.success("Qabul ro'yxatga olindi!")
      setModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      refetch()
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "Ro'yxatga olishda xatolik")
    },
  })

  const handleSubmit = (values: any) => {
    createMutation.mutate(values)
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
      dataIndex: 'patient',
      key: 'patient',
      render: (_: any, record: any) => record.patient?.first_name + ' ' + record.patient?.last_name || '-',
    },
    {
      title: i18n.appointments.service,
      dataIndex: 'service',
      key: 'service',
      render: (_: any, record: any) => record.service?.name || '-',
    },
    {
      title: i18n.appointments.doctor,
      dataIndex: 'doctor',
      key: 'doctor',
      render: (_: any, record: any) => record.doctor ? `${record.doctor.first_name} ${record.doctor.last_name}` : '-',
    },
    {
      title: i18n.appointments.status,
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          scheduled: 'blue',
          waiting: 'orange',
          in_progress: 'processing',
          completed: 'success',
          cancelled: 'error',
        }
        return <Tag color={colors[status] || 'default'}>{statusTranslations[status] || status}</Tag>
      },
    },
    {
      title: i18n.appointments.cabinet,
      dataIndex: 'cabinet',
      key: 'cabinet',
      render: (cabinet: string) => cabinet || '-',
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
            defaultValue={dayjs()}
            onChange={(date) => setSelectedDate(date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'))}
          />
          <Input placeholder={i18n.appointments.search} prefix={<SearchOutlined />} style={{ width: 200 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            {i18n.appointments.register}
          </Button>
        </Space>

        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={appointmentsData?.data || []}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>

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
              {patientsData?.data?.map((p: any) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} - {p.phone}
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
              {!staffData?.data?.length && (
                <Select.Option key="no-data" value="" disabled>
                  Shifokorlar hali qo‘shilmagan
                </Select.Option>
              )}
              {staffData?.data?.map((s: any) => (
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
              {!servicesData?.length && (
                <Select.Option key="no-services" value="" disabled>
                  Xizmatlar hali qo'shilmagan
                </Select.Option>
              )}
              {servicesData?.map((svc: any) => (
                <Select.Option key={svc.id} value={svc.id}>
                  {svc.name}{svc.base_price ? ` — ${svc.base_price.toLocaleString()} so'm` : ''}
                </Select.Option>
              ))}
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
    </div>
  )
}

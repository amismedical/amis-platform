import { Typography, Card, Table, Tag, Space, Button, Input, Select, DatePicker } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { i18n, statusTranslations } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title } = Typography

export function AppointmentsPage() {
  const columns = [
    { title: i18n.appointments.time, dataIndex: 'start_time', key: 'start_time' },
    { title: i18n.appointments.patient, dataIndex: 'patient', key: 'patient' },
    { title: i18n.appointments.service, dataIndex: 'service', key: 'service' },
    { title: i18n.appointments.doctor, dataIndex: 'doctor', key: 'doctor' },
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
    { title: i18n.appointments.cabinet, dataIndex: 'cabinet', key: 'cabinet' },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Title level={3} style={{ margin: 0 }}>{i18n.appointments.title}</Title>
      </Space>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <DatePicker defaultValue={dayjs()} />
          <Select placeholder={i18n.appointments.allStatuses} style={{ width: 150 }} allowClear>
            <Select.Option value="scheduled">{i18n.status.scheduled}</Select.Option>
            <Select.Option value="waiting">{i18n.status.waiting}</Select.Option>
            <Select.Option value="completed">{i18n.status.completed}</Select.Option>
            <Select.Option value="cancelled">{i18n.status.cancelled}</Select.Option>
          </Select>
          <Input placeholder={i18n.appointments.search} prefix={<SearchOutlined />} style={{ width: 200 }} />
          <Button type="primary" icon={<PlusOutlined />}>{i18n.appointments.register}</Button>
        </Space>

        <Table columns={columns} dataSource={[]} rowKey="id" />
      </Card>
    </div>
  )
}
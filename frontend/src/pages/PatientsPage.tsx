import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Typography, Input, Button, Space, Tag, Card, Row, Col, Modal, Form, Select, DatePicker, message } from 'antd'
import { UserAddOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { patientService } from '../services/api'
import { i18n, formatDate } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title } = Typography

export function PatientsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['patients', searchValue],
    queryFn: () => patientService.list({ limit: 50, search: searchValue }),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        ...values,
        birth_date: values.birth_date?.format('YYYY-MM-DD') || values.birth_date,
      }
      return patientService.create(payload)
    },
    onSuccess: () => {
      message.success('Patient created successfully')
      setCreateModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to create patient')
    },
  })

  const handleCreatePatient = (values: any) => {
    createMutation.mutate(values)
  }

  const columns = [
    {
      title: i18n.patients.id,
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: string) => id.slice(0, 8),
    },
    {
      title: i18n.patients.fullName,
      key: 'name',
      render: (_: any, record: any) =>
        `${record.last_name} ${record.first_name} ${record.patronymic || ''}`,
    },
    {
      title: i18n.patients.birthDate,
      dataIndex: 'birth_date',
      key: 'birth_date',
      render: (date: string) => formatDate(date),
    },
    {
      title: i18n.patients.gender,
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => (gender === 'male' ? i18n.patients.male : i18n.patients.female),
    },
    {
      title: i18n.patients.phone,
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: i18n.patients.citizenship,
      dataIndex: 'citizenship',
      key: 'citizenship',
    },
    {
      title: i18n.patients.balance,
      dataIndex: 'deposit_balance',
      key: 'deposit_balance',
      render: (balance: number) => `${balance.toLocaleString()} UZS`,
    },
    {
      title: i18n.patients.status,
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? i18n.patients.active : i18n.patients.inactive}
        </Tag>
      ),
    },
    {
      title: i18n.patients.actions,
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          type="link"
          onClick={() => navigate(`/patients/${record.id}`)}
        >
          {i18n.patients.details}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>{i18n.patients.title}</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => setCreateModalOpen(true)}>
            {i18n.patients.addPatient}
          </Button>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder={i18n.patients.searchPlaceholder}
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
          />
        </Space>

        <Table
          columns={columns}
          dataSource={data?.data}
          loading={isLoading}
          pagination={{
            total: data?.total,
            pageSize: data?.limit,
            current: data?.page,
          }}
          rowKey="id"
        />
      </Card>

      {/* Create Patient Modal */}
      <Modal
        title={i18n.patients.addPatient}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePatient}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="last_name"
                label="Last Name"
                rules={[{ required: true, message: 'Last name is required' }]}
              >
                <Input placeholder="Family name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="first_name"
                label="First Name"
                rules={[{ required: true, message: 'First name is required' }]}
              >
                <Input placeholder="Given name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patronymic" label="Patronymic">
                <Input placeholder="Middle name (optional)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="birth_date"
                label="Birth Date"
                rules={[{ required: true, message: 'Birth date is required' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true, message: 'Gender is required' }]}
              >
                <Select placeholder="Select gender">
                  <Select.Option value="male">Male</Select.Option>
                  <Select.Option value="female">Female</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true, message: 'Phone is required' }]}
              >
                <Input placeholder="+998901234567" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone_2" label="Phone 2">
                <Input placeholder="+998901234568" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input placeholder="email@example.com" type="email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="citizenship" label="Citizenship">
                <Input placeholder="Uzbekistan" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="passport" label="Passport">
                <Input placeholder="AA1234567" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="Tashkent, Yunusobod district, ..." />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Additional notes about the patient" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCreateModalOpen(false)
                form.resetFields()
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                Create Patient
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
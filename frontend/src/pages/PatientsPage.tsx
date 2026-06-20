import { useQuery } from '@tanstack/react-query'
import { Table, Typography, Input, Button, Space, Tag, Card, Row, Col } from 'antd'
import { UserAddOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { patientService } from '../services/mockApi'
import { i18n, formatDate } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title } = Typography

export function PatientsPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientService.list({ limit: 50 }),
  })

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
          <Button type="primary" icon={<UserAddOutlined />}>
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
    </div>
  )
}
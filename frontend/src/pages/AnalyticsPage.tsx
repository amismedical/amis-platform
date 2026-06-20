import { useState } from 'react'
import { Typography, Card, Row, Col, Statistic, Table, DatePicker, Select, Space, Progress, Tag } from 'antd'
import { BarChartOutlined, PieChartOutlined, LineChartOutlined, RiseOutlined, TeamOutlined, CalendarOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { i18n, formatDate } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().startOf('month'), dayjs()])

  // Demo analytics data
  const revenueData = [
    { month: 'Yanvar', revenue: 45000000, appointments: 320 },
    { month: 'Fevral', revenue: 52000000, appointments: 380 },
    { month: 'Mart', revenue: 48000000, appointments: 350 },
    { month: 'Aprel', revenue: 61000000, appointments: 420 },
    { month: 'May', revenue: 58000000, appointments: 400 },
    { month: 'Iyun', revenue: 65000000, appointments: 450 },
  ]

  const doctorStats = [
    { doctor: 'Karimova Nodira', specialty: 'Terapevt', appointments: 145, revenue: 18500000, rating: 4.9 },
    { doctor: 'Ahmedov Botir', specialty: 'Kardiolog', appointments: 98, revenue: 22000000, rating: 4.8 },
    { doctor: 'Mahmudova Gulshan', specialty: 'Nevrolog', appointments: 87, revenue: 15800000, rating: 4.7 },
    { doctor: 'Rasulov Sardor', specialty: 'Rentgenolog', appointments: 120, revenue: 8700000, rating: 4.6 },
  ]

  const serviceStats = [
    { service: 'Maslahat', count: 450, revenue: 22500000, percentage: 35 },
    { service: 'Diagnostika', count: 280, revenue: 19600000, percentage: 30 },
    { service: 'Operatsiya', count: 45, revenue: 13500000, percentage: 21 },
    { service: 'Laboratoriya', count: 320, revenue: 9600000, percentage: 14 },
  ]

  const patientStats = [
    { status: 'Yangi', count: 180, percentage: 25, color: '#1890ff' },
    { status: 'Qaytgan', count: 360, percentage: 50, color: '#52c41a' },
    { status: 'Doimiy', count: 180, percentage: 25, color: '#722ed1' },
  ]

  const queueStats = [
    { hour: '08:00', waiting: 2, called: 1 },
    { hour: '09:00', waiting: 5, called: 3 },
    { hour: '10:00', waiting: 8, called: 6 },
    { hour: '11:00', waiting: 12, called: 8 },
    { hour: '12:00', waiting: 6, called: 10 },
    { hour: '13:00', waiting: 4, called: 5 },
    { hour: '14:00', waiting: 7, called: 6 },
    { hour: '15:00', waiting: 9, called: 7 },
    { hour: '16:00', waiting: 5, called: 8 },
    { hour: '17:00', waiting: 3, called: 5 },
  ]

  const doctorColumns = [
    { title: 'Shifokor', dataIndex: 'doctor', key: 'doctor' },
    { title: 'Mutaxassislik', dataIndex: 'specialty', key: 'specialty' },
    { title: 'Qabullar', dataIndex: 'appointments', key: 'appointments', render: (v: number) => `${v} ta` },
    { title: 'Tushum', dataIndex: 'revenue', key: 'revenue', render: (v: number) => `${(v / 1000000).toFixed(1)}M UZS` },
    { title: 'Reyting', dataIndex: 'rating', key: 'rating', render: (v: number) => <Tag color="gold">{v} ★</Tag> },
  ]

  const serviceColumns = [
    { title: 'Xizmat', dataIndex: 'service', key: 'service' },
    { title: 'Soni', dataIndex: 'count', key: 'count' },
    { title: 'Foiz', key: 'percentage', render: (_: any, r: any) => <Progress percent={r.percentage} size="small" /> },
    { title: 'Tushum', dataIndex: 'revenue', key: 'revenue', render: (v: number) => `${(v / 1000000).toFixed(1)}M UZS` },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>{i18n.analytics.title}</Title>
        </Col>
        <Col>
          <Space>
            <RangePicker value={dateRange} onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])} />
            <Select placeholder="Filial" style={{ width: 150 }}>
              <Select.Option value="all">Barcha filiallar</Select.Option>
              <Select.Option value="main">Bosh filial</Select.Option>
              <Select.Option value="branch1">Filial 1</Select.Option>
            </Select>
          </Space>
        </Col>
      </Row>

      {/* Main Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Jami tushum"
              value={65000000}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="UZS"
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <RiseOutlined style={{ color: '#52c41a' }} /> +15% o'tgan oydan
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Jami qabullar"
              value={450}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              suffix="ta"
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <RiseOutlined style={{ color: '#52c41a' }} /> +12% o'tgan oydan
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Yangi bemorlar"
              value={180}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              suffix="ta"
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8 }}>
              <RiseOutlined style={{ color: '#52c41a' }} /> +8% o'tgan oydan
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="O'rtacha kutish vaqti"
              value={12}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              suffix="daq"
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8, color: '#52c41a' }}>
              <RiseOutlined /> -3 daq yaxshilandi
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title={<><BarChartOutlined /> Oylik tushum dinamikasi</>}>
            <div style={{ height: 250, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '20px 0' }}>
              {revenueData.map((item, i) => (
                <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    height: `${(item.revenue / 70000000) * 200}px`,
                    background: 'linear-gradient(180deg, #00d4aa 0%, #0891b2 100%)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: '20px',
                    transition: 'all 0.3s',
                  }} />
                  <div style={{ marginTop: 8, fontSize: '11px', color: '#666' }}>{item.month}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{(item.revenue / 1000000).toFixed(0)}M</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<><PieChartOutlined /> Xizmatlar bo'yicha taqsimot</>}>
            <Row gutter={16}>
              <Col span={12}>
                {serviceStats.map((s, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{s.service}</span>
                      <span style={{ fontWeight: 600 }}>{s.percentage}%</span>
                    </div>
                    <Progress
                      percent={s.percentage}
                      showInfo={false}
                      strokeColor={['#00d4aa', '#1890ff', '#722ed1', '#faad14'][i]}
                    />
                  </div>
                ))}
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '48px', fontWeight: 700, color: '#00d4aa' }}>65M</div>
                  <div style={{ color: '#666' }}>Jami tushum</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Doctor Performance */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title={<><TeamOutlined /> Shifokorlar samaradorligi</>}>
            <Table columns={doctorColumns} dataSource={doctorStats} rowKey="doctor" pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Bemorlar dinamikasi">
            {patientStats.map((p, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{p.status}</span>
                  <span style={{ fontWeight: 600 }}>{p.count} ta</span>
                </div>
                <Progress percent={p.percentage} showInfo={false} strokeColor={p.color} />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Queue Analytics */}
      <Card title={<><LineChartOutlined /> Navbat analitikasi</>}>
        <Row gutter={16}>
          {queueStats.slice(0, 6).map((q, i) => (
            <Col span={4} key={i}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>{q.hour}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1890ff' }}>{q.waiting}</div>
                <div style={{ fontSize: '11px', color: '#999' }}>kutyapti</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}
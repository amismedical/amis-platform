/**
 * AMIS - Registration History (Module 7)
 * Full appointment history with filters, search, and CSV export
 */
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Typography, Card, Table, Tag, Button, Space, Row, Col,
  Select, Input, DatePicker, Statistic, Badge, Tooltip, message
} from 'antd'
import {
  FileTextOutlined, DownloadOutlined, SearchOutlined,
  ReloadOutlined, HistoryOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CloseCircleOutlined, UserOutlined,
  MedicineBoxOutlined, TeamOutlined
} from '@ant-design/icons'
import { appointmentService, staffService, patientService } from '../services/api'
import { i18n } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

// Status config
const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  scheduled: { color: 'blue', label: 'Rejalashtirilgan', icon: <ClockCircleOutlined /> },
  confirmed: { color: 'cyan', label: 'Tasdiqlangan', icon: <CheckCircleOutlined /> },
  checked_in: { color: 'purple', label: 'Qabulga keldi', icon: <UserOutlined /> },
  in_progress: { color: 'orange', label: 'Davom etmoqda', icon: <HistoryOutlined /> },
  completed: { color: 'green', label: 'Tugallangan', icon: <CheckCircleOutlined /> },
  cancelled: { color: 'red', label: 'Bekor qilingan', icon: <CloseCircleOutlined /> },
  no_show: { color: 'default', label: 'Kelmadi', icon: <CloseCircleOutlined /> },
}

export function RegistrationHistoryPage() {
  // Filters
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [doctorFilter, setDoctorFilter] = useState<string | undefined>(undefined)
  const [searchText, setSearchText] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // Build query params
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    status: statusFilter,
    doctor_id: doctorFilter,
    date_from: dateRange?.[0]?.format('YYYY-MM-DD'),
    date_to: dateRange?.[1]?.format('YYYY-MM-DD'),
  }), [page, pageSize, statusFilter, doctorFilter, dateRange])

  // Load appointments
  const { data: appointmentsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['appointments', queryParams],
    queryFn: () => appointmentService.list(queryParams),
  })

  // Load doctors for filter
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => staffService.listDoctors(),
  })
  const doctorsList = doctorsData?.data || []

  const appointments = appointmentsData?.data || []
  const pagination = appointmentsData?.pagination || { total: 0, page: 1, limit: 20 }

  // Client-side search filter — accesses nested objects returned by backend
  const filteredAppointments = useMemo(() => {
    if (!searchText) return appointments
    const q = searchText.toLowerCase()
    return appointments.filter((a: any) => {
      const p = a.Patient || {}
      const d = a.Doctor || {}
      const s = a.Service || {}
      const name = `${p.last_name || ''} ${p.first_name || ''}`.toLowerCase()
      const phone = `${p.phone || ''}`.toLowerCase()
      const docName = `${d.last_name || ''} ${d.first_name || ''}`.toLowerCase()
      const serviceName = `${s.name || ''}`.toLowerCase()
      return name.includes(q) || phone.includes(q) || docName.includes(q) || serviceName.includes(q)
    })
  }, [appointments, searchText])

  // Stats
  const stats = useMemo(() => {
    const all = appointments
    return {
      total: all.length,
      completed: all.filter((a: any) => a.status === 'completed').length,
      cancelled: all.filter((a: any) => a.status === 'cancelled').length,
      scheduled: all.filter((a: any) => ['scheduled', 'confirmed', 'checked_in'].includes(a.status)).length,
    }
  }, [appointments])

  // CSV Export
  const handleExport = () => {
    const dataToExport = selectedRowKeys.length > 0
      ? filteredAppointments.filter((a: any) => selectedRowKeys.includes(a.id))
      : filteredAppointments

    const headers = [
      'ID', 'Bemor FISH', 'Telefon', 'Shifokor', 'Xizmat',
      'Sana', 'Vaqt', 'Holat', 'Kabinet', 'Qayd'
    ]
    const rows = dataToExport.map((a: any) => {
      const p = a.Patient || {}
      const d = a.Doctor || {}
      const s = a.Service || {}
      const dateStr = a.appointment_date ? dayjs(a.appointment_date).format('YYYY-MM-DD') : ''
      return [
        a.id || '',
        `${p.last_name || ''} ${p.first_name || ''}`.trim(),
        p.phone || '',
        `${d.last_name || ''} ${d.first_name || ''}`.trim(),
        s.name || '',
        dateStr,
        a.start_time || '',
        STATUS_CONFIG[a.status]?.label || a.status || '',
        a.cabinet || '',
        a.notes || '',
      ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qabullar-tarixi_${dayjs().format('YYYY-MM-DD')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    message.success({ content: `${dataToExport.length} ta yozuv eksport qilindi`, icon: <DownloadOutlined style={{ color: '#52c41a' }} /> })
  }

  // Table columns — accesses nested Patient/Doctor/Service objects from backend
  const columns = [
    {
      title: 'Bemor',
      key: 'patient',
      width: 200,
      fixed: 'left' as const,
      render: (_: any, record: any) => {
        const p = record.Patient || {}
        return (
          <div>
            <Text strong style={{ color: '#fff', fontSize: 13 }}>
              {p.last_name} {p.first_name}
            </Text>
            <br />
            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
              {p.phone || '—'}
            </Text>
          </div>
        )
      },
    },
    {
      title: 'Shifokor',
      key: 'doctor',
      width: 150,
      render: (_: any, record: any) => {
        const d = record.Doctor || {}
        return (
          <Space>
            <MedicineBoxOutlined style={{ color: '#d4af37', fontSize: 12 }} />
            <Text style={{ color: '#8c8c8c', fontSize: 13 }}>
              {d.last_name} {d.first_name}
            </Text>
          </Space>
        )
      },
    },
    {
      title: 'Xizmat',
      key: 'service',
      width: 160,
      render: (_: any, record: any) => {
        const s = record.Service || {}
        return (
          <Text style={{ color: '#8c8c8c', fontSize: 13 }}>
            {s.name || '—'}
          </Text>
        )
      },
    },
    {
      title: 'Sana',
      key: 'date',
      width: 100,
      render: (_: any, record: any) => (
        <Text style={{ color: '#fff', fontSize: 13 }}>
          {record.appointment_date ? dayjs(record.appointment_date).format('DD.MM.YYYY') : '—'}
        </Text>
      ),
    },
    {
      title: 'Vaqt',
      key: 'time',
      width: 80,
      render: (_: any, record: any) => (
        <Text style={{ color: '#d4af37', fontSize: 13, fontWeight: 600 }}>
          {record.start_time || '—'}
        </Text>
      ),
    },
    {
      title: 'Kabinet',
      key: 'cabinet',
      width: 80,
      render: (_: any, record: any) => (
        record.cabinet
          ? <Tag style={{ background: 'rgba(212,175,55,0.15)', borderColor: '#d4af37', color: '#d4af37' }}>{record.cabinet}</Tag>
          : <Text style={{ color: '#5c5c5c' }}>—</Text>
      ),
    },
    {
      title: 'Holat',
      key: 'status',
      width: 150,
      render: (_: any, record: any) => {
        const cfg = STATUS_CONFIG[record.status] || { color: 'default', label: record.status, icon: null }
        return (
          <Tag
            color={cfg.color}
            icon={cfg.icon}
            style={{ borderRadius: 6, fontSize: 12 }}
          >
            {cfg.label}
          </Tag>
        )
      },
    },
    {
      title: 'Qayd',
      key: 'notes',
      width: 150,
      ellipsis: true,
      render: (_: any, record: any) => (
        <Tooltip title={record.notes}>
          <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
            {record.notes || '—'}
          </Text>
        </Tooltip>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HistoryOutlined style={{ fontSize: 28, color: '#d4af37' }} />
            <div>
              <Title level={3} style={{ margin: 0, color: '#fff' }}>
                Qabullar tarixi
              </Title>
              <Text style={{ color: '#8c8c8c', fontSize: 13 }}>
                Barcha qabullar ro'yxati
              </Text>
            </div>
          </div>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isFetching}
              style={{ borderColor: '#d4af37', color: '#d4af37' }}
            >
              Yangilash
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              style={{
                background: '#d4af37',
                borderColor: '#d4af37',
                color: '#000',
              }}
            >
              CSV eksport {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {[
          {
            label: 'Jami',
            value: stats.total,
            color: '#fff',
            icon: <FileTextOutlined style={{ color: '#fff' }} />
          },
          {
            label: 'Rejalashtirilgan',
            value: stats.scheduled,
            color: '#4a90d9',
            icon: <ClockCircleOutlined style={{ color: '#4a90d9' }} />
          },
          {
            label: 'Tugallangan',
            value: stats.completed,
            color: '#52c41a',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
          },
          {
            label: 'Bekor qilingan',
            value: stats.cancelled,
            color: '#ff4d4f',
            icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          },
        ].map((stat) => (
          <Col key={stat.label} span={6}>
            <Card
              bordered={false}
              style={{
                background: 'rgba(13,26,48,0.8)',
                border: '1px solid rgba(212,175,55,0.15)',
                borderRadius: 12,
              }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <Statistic
                title={
                  <Space>
                    {stat.icon}
                    <span style={{ color: '#8c8c8c', fontSize: 13 }}>{stat.label}</span>
                  </Space>
                }
                value={stat.value}
                valueStyle={{
                  color: stat.color,
                  fontSize: 28,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters Card */}
      <Card
        bordered={false}
        style={{
          background: 'rgba(13,26,48,0.8)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: 12,
          marginBottom: 16,
        }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={5}>
            <Input.Search
              placeholder="Bemor, shifokor, xizmat..."
              prefix={<SearchOutlined style={{ color: '#d4af37' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Holat"
              allowClear
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              size="large"
              options={Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
                value: key,
                label: cfg.label,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Shifokor"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
              value={doctorFilter}
              onChange={setDoctorFilter}
              size="large"
              options={doctorsList.map((d: any) => ({
                value: d.id,
                label: `${d.last_name} ${d.first_name}`,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              size="large"
              format="DD.MM.YYYY"
              placeholder={['Boshlanish', 'Tugash']}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              {(statusFilter || doctorFilter || dateRange || searchText) && (
                <Button
                  size="large"
                  onClick={() => {
                    setStatusFilter(undefined)
                    setDoctorFilter(undefined)
                    setDateRange(null)
                    setSearchText('')
                    setPage(1)
                  }}
                >
                  Tozalash
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card
        bordered={false}
        style={{
          background: 'rgba(13,26,48,0.8)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: 12,
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredAppointments}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1100 }}
          size="middle"
          rowClassName={(_record, index) =>
            index % 2 === 0 ? 'table-row-even' : 'table-row-odd'
          }
          pagination={{
            current: page,
            pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => (
              <Text style={{ color: '#8c8c8c' }}>
                {range[0]}-{range[1]} / {total} ta yozuv
              </Text>
            ),
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <FileTextOutlined style={{ fontSize: 48, color: '#5c5c5c', marginBottom: 16 }} />
                <Text style={{ color: '#8c8c8c', display: 'block', fontSize: 16 }}>
                  Qabullar topilmadi
                </Text>
                <Text style={{ color: '#5c5c5c', fontSize: 13 }}>
                  Filtrlarni o'zgartiring yoki yangi qabul yarating
                </Text>
              </div>
            ),
          }}
        />
      </Card>

      {/* Selection info */}
      {selectedRowKeys.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(13,26,48,0.95)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 12,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#d4af37' }}>
            <Text style={{ color: '#fff' }}>Tanlangan</Text>
          </Badge>
          <Button size="small" onClick={() => setSelectedRowKeys([])}>Bekor qilish</Button>
          <Button
            size="small"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            style={{ background: '#d4af37', borderColor: '#d4af37', color: '#000' }}
          >
            CSV eksport
          </Button>
        </div>
      )}

      <style>{`
        .table-row-even td {
          background: rgba(26,42,74,0.3) !important;
        }
        .table-row-odd td {
          background: rgba(13,26,48,0.5) !important;
        }
        .ant-table-thead > tr > th {
          background: rgba(13,26,48,0.95) !important;
          color: #d4af37 !important;
          border-bottom: 1px solid rgba(212,175,55,0.2) !important;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ant-table-tbody > tr:hover > td {
          background: rgba(212,175,55,0.08) !important;
        }
        .ant-pagination-item-active {
          background: #d4af37 !important;
          border-color: #d4af37 !important;
        }
        .ant-pagination-item-active a {
          color: #000 !important;
        }
        .ant-pagination-prev .ant-pagination-item-link,
        .ant-pagination-next .ant-pagination-item-link {
          border-color: rgba(212,175,55,0.3) !important;
          color: #d4af37 !important;
        }
        .ant-table-wrapper .ant-table-pagination {
          background: transparent;
          padding: 12px 16px;
          margin: 0;
        }
      `}</style>
    </div>
  )
}

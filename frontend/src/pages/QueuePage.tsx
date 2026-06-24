/**
 * AMIS - Queue Management (Module 5)
 * Full queue management with status tabs, filters, call/complete/skip/cancel actions
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Typography, Card, Table, Tag, Button, Space, Modal, message,
  Spin, Row, Col, Statistic, Select, Input, Tabs, Badge, Tooltip,
  Popconfirm, Drawer, Descriptions, Divider, Alert, Empty
} from 'antd'
import {
  PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined,
  SoundOutlined, CloseCircleOutlined, SwapOutlined, SendOutlined,
  ReloadOutlined, ExclamationCircleOutlined, DashboardOutlined,
  TeamOutlined, FastForwardOutlined, UserOutlined
} from '@ant-design/icons'
import { queueService, staffService } from '../services/api'
import { statusTranslations } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// Status config
const STATUS_TABS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'waiting', label: 'Kutmoqda' },
  { key: 'called', label: 'Chaqirildi' },
  { key: 'completed', label: 'Tugallangan' },
  { key: 'skipped', label: 'O\'tkazilgan' },
  { key: 'cancelled', label: 'Bekor' },
]

const STATUS_COLORS: Record<string, string> = {
  waiting: 'warning',
  called: 'processing',
  completed: 'success',
  skipped: 'default',
  cancelled: 'error',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  waiting: <ClockCircleOutlined />,
  called: <SoundOutlined />,
  completed: <CheckCircleOutlined />,
  skipped: <SwapOutlined />,
  cancelled: <CloseCircleOutlined />,
}

export function QueuePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Filter state
  const [activeTab, setActiveTab] = useState('all')
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null)
  const [doctorFilter, setDoctorFilter] = useState<string | undefined>(undefined)
  const [cabinetFilter, setCabinetFilter] = useState<string | undefined>(undefined)
  const [searchText, setSearchText] = useState('')

  // Detail drawer
  const [detailEntry, setDetailEntry] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Call modal
  const [callModalEntry, setCallModalEntry] = useState<any>(null)
  const [callModalOpen, setCallModalOpen] = useState(false)
  const [callCabinet, setCallCabinet] = useState('')
  const [callDoctorId, setCallDoctorId] = useState<string | undefined>(undefined)

  // Load queues
  const { data: queuesData, isLoading: loadingQueues } = useQuery({
    queryKey: ['queues'],
    queryFn: () => queueService.list(),
  })

  const queuesList = queuesData?.data || []

  // Auto-select first queue
  useEffect(() => {
    if (queuesList.length > 0 && !selectedQueue) {
      setSelectedQueue(queuesList[0].id)
    }
  }, [queuesList, selectedQueue])

  // Load doctors for filter & call modal
  const { data: doctorsData } = useQuery({
    queryKey: ['staff-doctors'],
    queryFn: () => staffService.list({ limit: 100 }),
  })
  const doctorsList = doctorsData?.data || []

  // Load all entries for the selected queue (no status filter — we filter client-side)
  const { data: queueData, isLoading: loadingEntries, refetch } = useQuery({
    queryKey: ['queue', selectedQueue],
    queryFn: () => selectedQueue ? queueService.get(selectedQueue) : Promise.resolve(null),
    enabled: !!selectedQueue,
    refetchInterval: 15000, // Real-time refresh every 15s
  })

  const allEntries = queueData?.entries || []

  // Computed stats
  const stats = useMemo(() => {
    const waiting = allEntries.filter((e: any) => e.status === 'waiting').length
    const called = allEntries.filter((e: any) => e.status === 'called').length
    const completed = allEntries.filter((e: any) => e.status === 'completed').length
    const skipped = allEntries.filter((e: any) => e.status === 'skipped').length
    const cancelled = allEntries.filter((e: any) => e.status === 'cancelled').length
    return { waiting, called, completed, skipped, cancelled, total: allEntries.length }
  }, [allEntries])

  // Count by status for tabs
  const tabCounts = useMemo(() => ({
    all: allEntries.length,
    waiting: stats.waiting,
    called: stats.called,
    completed: stats.completed,
    skipped: stats.skipped,
    cancelled: stats.cancelled,
  }), [allEntries, stats])

  // Filter entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter((e: any) => {
      // Status filter
      if (activeTab !== 'all' && e.status !== activeTab) return false

      // Doctor filter
      if (doctorFilter && e.doctor_id !== doctorFilter) return false

      // Cabinet filter
      if (cabinetFilter && e.cabinet !== cabinetFilter) return false

      // Text search
      if (searchText) {
        const q = searchText.toLowerCase()
        const name = `${e.patient_name || ''}`.toLowerCase()
        const phone = `${e.patient_phone || ''}`.toLowerCase()
        const num = `${e.queue_number || ''}`.toLowerCase()
        if (!name.includes(q) && !phone.includes(q) && !num.includes(q)) return false
      }

      return true
    })
  }, [allEntries, activeTab, doctorFilter, cabinetFilter, searchText])

  // Get unique cabinets from entries
  const cabinetOptions = useMemo(() => {
    const cabinets = [...new Set(allEntries.map((e: any) => e.cabinet).filter(Boolean))]
    return cabinets.map(c => ({ value: c, label: c }))
  }, [allEntries])

  // Mutations
  const callNextMutation = useMutation({
    mutationFn: () => queueService.callNext(selectedQueue!),
    onSuccess: (data) => {
      message.success({ content: `Raqam ${data.queue_number} chaqirildi!`, icon: <SoundOutlined style={{ color: '#1890ff' }} /> })
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    },
    onError: () => {
      message.error({ content: 'Navbatda bemorlar yo\'q', icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> })
    },
  })

  const completeMutation = useMutation({
    mutationFn: (entryId: string) => queueService.complete(entryId),
    onSuccess: () => {
      message.success({ content: 'Bemor tugallandi', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> })
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    },
    onError: () => {
      message.error({ content: 'Xatolik yuz berdi' })
    },
  })

  const skipMutation = useMutation({
    mutationFn: (entryId: string) => queueService.skip(entryId),
    onSuccess: () => {
      message.warning({ content: 'Bemor o\'tkazildi' })
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    },
    onError: () => {
      message.error({ content: 'Xatolik yuz berdi' })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (entryId: string) => queueService.cancel(entryId),
    onSuccess: () => {
      message.info({ content: 'Bemor bekor qilindi' })
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    },
    onError: () => {
      message.error({ content: 'Xatolik yuz berdi' })
    },
  })

  const callSpecificMutation = useMutation({
    mutationFn: ({ entryId, cabinet, doctorId }: { entryId: string; cabinet?: string; doctorId?: string }) =>
      queueService.callSpecific(entryId, cabinet, doctorId),
    onSuccess: () => {
      message.success({ content: 'Bemor chaqirildi!', icon: <SoundOutlined style={{ color: '#1890ff' }} /> })
      queryClient.invalidateQueries({ queryKey: ['queue'] })
      setCallModalOpen(false)
      setCallModalEntry(null)
      setCallCabinet('')
      setCallDoctorId(undefined)
    },
    onError: () => {
      message.error({ content: 'Xatolik yuz berdi' })
    },
  })

  // Handlers
  const handleCallNext = () => {
    if (selectedQueue) callNextMutation.mutate()
  }

  const handleComplete = (entryId: string) => {
    Modal.confirm({
      title: 'Qabulni tugallash',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: 'Bemor qabulni tugatdi va kabinetni tark etdi?',
      okText: 'Ha, tugallash',
      cancelText: 'Yo\'q',
      onOk: () => completeMutation.mutate(entryId),
    })
  }

  const handleSkip = (entryId: string) => {
    skipMutation.mutate(entryId)
  }

  const handleCancel = (entryId: string) => {
    cancelMutation.mutate(entryId)
  }

  const handleOpenDetail = (entry: any) => {
    setDetailEntry(entry)
    setDetailOpen(true)
  }

  const handleCallSpecific = (entry: any) => {
    setCallModalEntry(entry)
    setCallCabinet(entry.cabinet || '')
    setCallDoctorId(entry.doctor_id)
    setCallModalOpen(true)
  }

  const handleCallSpecificSubmit = () => {
    if (!callModalEntry) return
    callSpecificMutation.mutate({
      entryId: callModalEntry.id,
      cabinet: callCabinet || undefined,
      doctorId: callDoctorId,
    })
  }

  const columns = [
    {
      title: '#',
      key: 'queue_number',
      width: 70,
      render: (_: any, record: any) => (
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: record.status === 'called'
            ? 'linear-gradient(135deg, #1890ff, #096dd9)'
            : record.status === 'waiting'
            ? 'linear-gradient(135deg, #faad14, #d48806)'
            : 'rgba(26,42,74,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 14,
          color: '#fff',
        }}>
          {record.queue_number}
        </div>
      ),
    },
    {
      title: 'Bemor',
      key: 'patient',
      render: (_: any, record: any) => (
        <div>
          <Text strong style={{ color: '#fff', display: 'block' }}>
            {record.patient_name || '-'}
          </Text>
          <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
            {record.patient_phone || ''}
          </Text>
        </div>
      ),
    },
    {
      title: 'Holat',
      key: 'status',
      width: 120,
      render: (_: any, record: any) => (
        <Tag
          color={STATUS_COLORS[record.status] || 'default'}
          icon={STATUS_ICON[record.status]}
          style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}
        >
          {statusTranslations[record.status] || record.status}
        </Tag>
      ),
    },
    {
      title: 'Kabinet',
      dataIndex: 'cabinet',
      key: 'cabinet',
      width: 80,
      render: (c: string) => c ? <Tag>{c}</Tag> : '-',
    },
    {
      title: 'Shifokor',
      key: 'doctor',
      width: 140,
      render: (_: any, record: any) => {
        if (!record.doctor_id && !record.doctor_name) return <Text type="secondary">-</Text>
        return (
          <Space>
            <UserOutlined style={{ color: '#d4af37' }} />
            <Text style={{ color: '#fff' }}>{record.doctor_name || '-'}</Text>
          </Space>
        )
      },
    },
    {
      title: 'Vaqt',
      key: 'time',
      width: 140,
      render: (_: any, record: any) => (
        <div>
          <Text style={{ color: '#8c8c8c', fontSize: 12, display: 'block' }}>
            Ro'yxatdan: {dayjs(record.registered_at).format('HH:mm')}
          </Text>
          {record.called_at && (
            <Text style={{ color: '#1890ff', fontSize: 12 }}>
              Chaqirildi: {dayjs(record.called_at).format('HH:mm')}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => {
        if (record.status === 'completed' || record.status === 'cancelled' || record.status === 'skipped') {
          return (
            <Button size="small" onClick={() => handleOpenDetail(record)}>
              Batafsil
            </Button>
          )
        }

        return (
          <Space size={4}>
            {record.status === 'waiting' && (
              <>
                <Tooltip title="Chaqirish">
                  <Button
                    size="small"
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleCallSpecific(record)}
                    style={{ background: '#1890ff', borderColor: '#1890ff' }}
                  />
                </Tooltip>
                <Tooltip title="O'tkazish">
                  <Button
                    size="small"
                    icon={<SwapOutlined />}
                    onClick={() => handleSkip(record.id)}
                    loading={skipMutation.isPending}
                  />
                </Tooltip>
                <Tooltip title="Bekor qilish">
                  <Popconfirm
                    title="Bekor qilishni tasdiqlaysizmi?"
                    onConfirm={() => handleCancel(record.id)}
                    okText="Ha"
                    cancelText="Yo'q"
                  >
                    <Button
                      size="small"
                      danger
                      icon={<CloseCircleOutlined />}
                      loading={cancelMutation.isPending}
                    />
                  </Popconfirm>
                </Tooltip>
              </>
            )}
            {(record.status === 'called') && (
              <>
                <Tooltip title="Tugallash">
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleComplete(record.id)}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    loading={completeMutation.isPending}
                  />
                </Tooltip>
                <Tooltip title="O'tkazish">
                  <Button
                    size="small"
                    icon={<SwapOutlined />}
                    onClick={() => handleSkip(record.id)}
                    loading={skipMutation.isPending}
                  />
                </Tooltip>
              </>
            )}
          </Space>
        )
      },
    },
  ]

  const queue = queueData?.queue

  if (loadingQueues) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#8c8c8c' }}>Navbatlar yuklanmoqda...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <TeamOutlined style={{ fontSize: 28, color: '#d4af37' }} />
            <div>
              <Title level={3} style={{ margin: 0, color: '#fff' }}>Elektron navbat</Title>
              <Text style={{ color: '#8c8c8c', fontSize: 13 }}>{queue?.name || 'Navbatni tanlang'}</Text>
            </div>
          </div>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={loadingEntries}
              style={{ borderColor: '#d4af37', color: '#d4af37' }}
            >
              Yangilash
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleCallNext}
              loading={callNextMutation.isPending}
              disabled={!selectedQueue || stats.waiting === 0}
              style={{ background: '#d4af37', borderColor: '#d4af37', color: '#000' }}
            >
              Keyingini chaqirish ({stats.waiting})
            </Button>
          </Space>
        </Col>
      </Row>

      {/* KPI Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { label: 'Jami', value: stats.total, icon: <TeamOutlined />, color: '#d4af37' },
          { label: 'Kutmoqda', value: stats.waiting, icon: <ClockCircleOutlined />, color: '#faad14' },
          { label: 'Chaqirildi', value: stats.called, icon: <SoundOutlined />, color: '#1890ff' },
          { label: 'Tugallangan', value: stats.completed, icon: <CheckCircleOutlined />, color: '#52c41a' },
          { label: 'O\'tkazilgan', value: stats.skipped, icon: <SwapOutlined />, color: '#8c8c8c' },
          { label: 'Bekor', value: stats.cancelled, icon: <CloseCircleOutlined />, color: '#ff4d4f' },
        ].map(stat => (
          <Col xs={12} sm={8} md={4} key={stat.label}>
            <Card
              bordered={false}
              style={{
                background: 'rgba(13,26,48,0.8)',
                border: '1px solid rgba(212,175,55,0.15)',
                borderRadius: 10,
              }}
              bodyStyle={{ padding: '12px 16px' }}
            >
              <Statistic
                title={<span style={{ color: '#8c8c8c', fontSize: 11 }}>{stat.label}</span>}
                value={stat.value}
                prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                valueStyle={{ color: stat.color, fontSize: 22 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
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
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Navbatni tanlang"
              style={{ width: '100%' }}
              value={selectedQueue}
              onChange={(v) => { setSelectedQueue(v); setActiveTab('all') }}
              loading={loadingQueues}
              size="large"
            >
              {queuesList.map((q: any) => (
                <Select.Option key={q.id} value={q.id}>{q.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Input.Search
              placeholder="Bemor qidirish..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="Shifokor"
              allowClear
              style={{ width: '100%' }}
              value={doctorFilter}
              onChange={setDoctorFilter}
              size="large"
            >
              {doctorsList.map((d: any) => (
                <Select.Option key={d.id} value={d.id}>
                  {d.last_name} {d.first_name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="Kabinet"
              allowClear
              style={{ width: '100%' }}
              value={cabinetFilter}
              onChange={setCabinetFilter}
              size="large"
              options={cabinetOptions}
            />
          </Col>
          <Col xs={24} md={6}>
            <Text style={{ color: '#8c8c8c', fontSize: 13 }}>
              {filteredEntries.length} ta yozuv
              {selectedQueue && <Badge count={tabCounts.waiting} style={{ backgroundColor: '#faad14', marginLeft: 8 }} />}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Status Tabs */}
      <Card
        bordered={false}
        style={{
          background: 'rgba(13,26,48,0.8)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: 12,
        }}
        headStyle={{ borderBottom: '1px solid rgba(212,175,55,0.1)', color: '#fff' }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 16px' }}
          tabBarStyle={{ marginBottom: 0 }}
          items={STATUS_TABS.map(tab => ({
            key: tab.key,
            label: (
              <span>
                {tab.label}
                <Badge
                  count={tabCounts[tab.key as keyof typeof tabCounts]}
                  style={{
                    backgroundColor: activeTab === tab.key ? '#d4af37' : 'rgba(255,255,255,0.15)',
                    color: activeTab === tab.key ? '#000' : '#fff',
                    marginLeft: 6,
                  }}
                />
              </span>
            ),
          }))}
        />

        <Table
          columns={columns}
          dataSource={filteredEntries}
          rowKey="id"
          loading={loadingEntries}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total: number) => `${total} ta` }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: '#8c8c8c' }}>
                    {activeTab === 'all' ? 'Bu navbatda yozuvlar yo\'q' : `${STATUS_TABS.find(t => t.key === activeTab)?.label} — yozuvlar yo\'q`}
                  </span>
                }
              />
            ),
          }}
          style={{ background: 'transparent' }}
          rowClassName={(_, index) => index % 2 === 0 ? 'queue-row-even' : 'queue-row-odd'}
          onRow={(record) => ({
            style: { cursor: 'pointer' },
            onClick: () => handleOpenDetail(record),
          })}
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title={
          <Space>
            <TeamOutlined style={{ color: '#d4af37' }} />
            <span>Bemor ma'lumotlari</span>
          </Space>
        }
        placement="right"
        width={400}
        onClose={() => setDetailOpen(false)}
        open={detailOpen}
        styles={{ header: { background: 'rgba(13,26,48,0.95)', color: '#fff' }, body: { background: 'rgba(13,26,48,0.95)' } }}
      >
        {detailEntry && (
          <div>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #d4af37, #b8952b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              color: '#000',
              marginBottom: 16,
            }}>
              {detailEntry.queue_number}
            </div>

            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label={<span style={{ color: '#8c8c8c' }}>Bemor</span>}>
                <Text style={{ color: '#fff' }}>{detailEntry.patient_name || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: '#8c8c8c' }}>Telefon</span>}>
                <Text style={{ color: '#fff' }}>{detailEntry.patient_phone || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: '#8c8c8c' }}>Holat</span>}>
                <Tag color={STATUS_COLORS[detailEntry.status] || 'default'} icon={STATUS_ICON[detailEntry.status]}>
                  {statusTranslations[detailEntry.status] || detailEntry.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: '#8c8c8c' }}>Kabinet</span>}>
                <Text style={{ color: '#fff' }}>{detailEntry.cabinet || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: '#8c8c8c' }}>Shifokor</span>}>
                <Text style={{ color: '#fff' }}>{detailEntry.doctor_name || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: '#8c8c8c' }}>Ro'yxatdan vaqti</span>}>
                <Text style={{ color: '#fff' }}>{dayjs(detailEntry.registered_at).format('DD.MM.YYYY HH:mm')}</Text>
              </Descriptions.Item>
              {detailEntry.called_at && (
                <Descriptions.Item label={<span style={{ color: '#8c8c8c' }}>Chaqirilgan vaqti</span>}>
                  <Text style={{ color: '#1890ff' }}>{dayjs(detailEntry.called_at).format('DD.MM.YYYY HH:mm')}</Text>
                </Descriptions.Item>
              )}
              {detailEntry.appointment_time && (
                <Descriptions.Item label={<span style={{ color: '#8c8c8c' }}>Qabul vaqti</span>}>
                  <Text style={{ color: '#fff' }}>{detailEntry.appointment_time}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider style={{ borderColor: 'rgba(212,175,55,0.2)' }} />

            {/* Actions in drawer */}
            {detailEntry.status !== 'completed' && detailEntry.status !== 'cancelled' && detailEntry.status !== 'skipped' && (
              <Space direction="vertical" style={{ width: '100%' }}>
                {detailEntry.status === 'waiting' && (
                  <Button
                    block
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => { setDetailOpen(false); handleCallSpecific(detailEntry) }}
                    style={{ background: '#1890ff', borderColor: '#1890ff' }}
                  >
                    Chaqirish
                  </Button>
                )}
                {detailEntry.status === 'called' && (
                  <Button
                    block
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleComplete(detailEntry.id)}
                    loading={completeMutation.isPending}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Tugallash
                  </Button>
                )}
                <Button
                  block
                  icon={<SwapOutlined />}
                  onClick={() => handleSkip(detailEntry.id)}
                  loading={skipMutation.isPending}
                >
                  O'tkazish
                </Button>
                <Popconfirm
                  title="Bekor qilishni tasdiqlaysizmi?"
                  onConfirm={() => { handleCancel(detailEntry.id); setDetailOpen(false) }}
                  okText="Ha"
                  cancelText="Yo'q"
                >
                  <Button
                    block
                    danger
                    icon={<CloseCircleOutlined />}
                    loading={cancelMutation.isPending}
                  >
                    Bekor qilish
                  </Button>
                </Popconfirm>
              </Space>
            )}
          </div>
        )}
      </Drawer>

      {/* Call Specific Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined style={{ color: '#1890ff' }} />
            <span>Bemorni chaqirish</span>
          </Space>
        }
        open={callModalOpen}
        onCancel={() => { setCallModalOpen(false); setCallModalEntry(null) }}
        onOk={handleCallSpecificSubmit}
        okText="Chaqirish"
        cancelText="Bekor"
        confirmLoading={callSpecificMutation.isPending}
        okButtonProps={{ style: { background: '#1890ff', borderColor: '#1890ff' } }}
        styles={{ content: { background: 'rgba(13,26,48,0.95)' }, header: { background: 'rgba(13,26,48,0.95)', color: '#fff' } }}
      >
        {callModalEntry && (
          <div>
            <Alert
              message={
                <Space>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>Raqam: {callModalEntry.queue_number}</span>
                  <Text>- {callModalEntry.patient_name}</Text>
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16, background: 'rgba(24,144,255,0.1)', border: '1px solid rgba(24,144,255,0.3)' }}
            />

            <Row gutter={[12, 12]}>
              <Col span={12}>
                <label style={{ display: 'block', color: '#8c8c8c', marginBottom: 4 }}>Kabinet</label>
                <Input
                  value={callCabinet}
                  onChange={(e) => setCallCabinet(e.target.value)}
                  placeholder="Masalan: 101"
                  size="large"
                  style={{ background: 'rgba(26,42,74,0.5)', borderColor: 'rgba(212,175,55,0.3)' }}
                />
              </Col>
              <Col span={12}>
                <label style={{ display: 'block', color: '#8c8c8c', marginBottom: 4 }}>Shifokor</label>
                <Select
                  placeholder="Shifokorni tanlang"
                  style={{ width: '100%' }}
                  value={callDoctorId}
                  onChange={setCallDoctorId}
                  size="large"
                  allowClear
                >
                  {doctorsList.map((d: any) => (
                    <Select.Option key={d.id} value={d.id}>
                      {d.last_name} {d.first_name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

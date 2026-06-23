import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Card, Table, Tag, Button, Space, Modal, message, Spin, Row, Col, Statistic, Select } from 'antd'
import { PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, SoundOutlined } from '@ant-design/icons'
import { queueService } from '../services/api'
import { i18n, statusTranslations } from '../i18n/uz'

const { Title } = Typography

export function QueuePage() {
  const queryClient = useQueryClient()
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null)

  const { data: queues, isLoading: loadingQueues } = useQuery({
    queryKey: ['queues'],
    queryFn: () => queueService.list(),
  })

  // Safe array normalization for queues
  const queuesList = Array.isArray(queues) ? queues
    : (queues as any)?.data ? (queues as any).data
    : []

  const { data: queueData, isLoading: loadingEntries } = useQuery({
    queryKey: ['queue', selectedQueue],
    queryFn: () => selectedQueue ? queueService.get(selectedQueue) : Promise.resolve(null),
    enabled: !!selectedQueue,
  })

  const callNextMutation = useMutation({
    mutationFn: (queueId: string) => queueService.callNext(queueId),
    onSuccess: () => {
      message.success(i18n.queue.nextPatientCalled)
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    },
    onError: () => {
      message.error(i18n.queue.noPatientsInQueue)
    },
  })

  const completeMutation = useMutation({
    mutationFn: (entryId: string) => queueService.complete(entryId),
    onSuccess: () => {
      message.success(i18n.queue.patientCompleted)
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    },
  })

  const handleCallNext = () => {
    if (selectedQueue) {
      callNextMutation.mutate(selectedQueue)
    }
  }

  const handleComplete = (entryId: string) => {
    Modal.confirm({
      title: i18n.queue.finishAppointment,
      content: i18n.queue.patientFinishedVisit,
      onOk: () => completeMutation.mutate(entryId),
    })
  }

  useEffect(() => {
    if (queuesList.length > 0 && !selectedQueue) {
      setSelectedQueue(queuesList[0].id)
    }
  }, [queues, selectedQueue])

  const statusColors: Record<string, string> = {
    waiting: 'warning',
    called: 'processing',
    completed: 'success',
  }

  const columns = [
    {
      title: i18n.queue.number,
      dataIndex: 'queue_number',
      key: 'queue_number',
      width: 80,
      render: (num: number) => <strong style={{ fontSize: 18 }}>{num}</strong>,
    },
    {
      title: i18n.queue.status,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{statusTranslations[status] || status}</Tag>
      ),
    },
    {
      title: i18n.queue.patient,
      key: 'patient',
      render: (_: any, record: any) => (
        <span>
          {record.patient?.first_name || ''} {record.patient?.last_name || ''}
        </span>
      ),
    },
    {
      title: i18n.queue.phone,
      dataIndex: ['patient', 'phone'],
      key: 'phone',
    },
    {
      title: i18n.appointments.cabinet,
      dataIndex: 'cabinet',
      key: 'cabinet',
      width: 100,
    },
    {
      title: 'Shifokor',
      key: 'doctor',
      width: 140,
      render: (_: any, record: any) => {
        const d = record.doctor
        if (!d) return '-'
        return `${d.last_name || ''} ${d.first_name || ''}`.trim() || '-'
      },
    },
    {
      title: i18n.queue.actions,
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        record.status !== 'completed' ? (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleComplete(record.id)}
          >
            {i18n.queue.finish}
          </Button>
        ) : null
      ),
    },
  ]

  if (loadingQueues) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    )
  }

  const entries = queueData?.entries || []
  const waitingCount = entries.filter((e: any) => e.status === 'waiting').length
  const calledCount = entries.filter((e: any) => e.status === 'called').length

  return (
    <div>
      <Title level={3}>{i18n.queue.title}</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={i18n.queue.waitingCount}
              value={waitingCount}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={i18n.queue.calledCount}
              value={calledCount}
              prefix={<SoundOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={queueData?.queue?.name || i18n.queue.title}
        extra={
          <Space>
            <Select
              placeholder={i18n.queue.selectQueue}
              style={{ width: 200 }}
              value={selectedQueue}
              onChange={setSelectedQueue}
              loading={loadingQueues}
            >
              {queuesList.map((queue: any) => (
                <Select.Option key={queue.id} value={queue.id}>
                  {queue.name}
                </Select.Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleCallNext}
              loading={callNextMutation.isPending}
              disabled={!selectedQueue}
            >
              {i18n.queue.callNext}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={entries}
          rowKey="id"
          loading={loadingEntries}
          pagination={false}
        />
      </Card>
    </div>
  )
}
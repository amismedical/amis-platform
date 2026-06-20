import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Card, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, message, DatePicker, Row, Col, Statistic, Tabs } from 'antd'
import { DollarCircleOutlined, RiseOutlined, ArrowDownOutlined, SwapOutlined } from '@ant-design/icons'
import { cashierService } from '../services/apiService'
import { i18n, statusTranslations } from '../i18n/uz'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export function CashierPage() {
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [dateRange, setDateRange] = useState<[string, string]>([
    new Date().toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  ])

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['cashier-transactions', dateRange],
    queryFn: () => cashierService.getTransactions({ date: dateRange[0] }),
  })

  const { data: summary } = useQuery({
    queryKey: ['cashier-summary', dateRange],
    queryFn: () => cashierService.getSummary({ date: dateRange[0] }),
  })

  const paymentMutation = useMutation({
    mutationFn: (data: any) => cashierService.createPayment(data),
    onSuccess: () => {
      message.success(i18n.cashier.paymentSuccess)
      setPaymentModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['cashier-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['cashier-summary'] })
    },
    onError: () => message.error(i18n.cashier.paymentError)
  })

  const refundMutation = useMutation({
    mutationFn: (data: any) => cashierService.createRefund(data),
    onSuccess: () => {
      message.success(i18n.cashier.refundSuccess)
      setRefundModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['cashier-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['cashier-summary'] })
    },
    onError: () => message.error(i18n.cashier.refundError)
  })

  const handlePayment = (values: any) => {
    paymentMutation.mutate({
      patient_id: selectedPatient?.id,
      amount: values.amount,
      payment_method: values.payment_method,
      service_id: values.service_id,
      notes: values.notes
    })
  }

  const handleRefund = (values: any) => {
    refundMutation.mutate({
      transaction_id: values.transaction_id,
      amount: values.amount,
      reason: values.reason
    })
  }

  const openPaymentModal = (patient?: any) => {
    setSelectedPatient(patient || null)
    setPaymentModalOpen(true)
  }

  const transactionColumns = [
    {
      title: i18n.cashier.transactionTime,
      dataIndex: 'time',
      key: 'time',
      width: 100,
    },
    {
      title: i18n.cashier.patient,
      key: 'patient',
      render: (_: any, record: any) => (
        <Text>{record.patient_name || '—'}</Text>
      ),
    },
    {
      title: i18n.cashier.type,
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'payment' ? 'green' : 'red'}>
          {statusTranslations[type] || type}
        </Tag>
      ),
    },
    {
      title: i18n.cashier.amount,
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount: number) => (
        <Text strong style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f' }}>
          {amount > 0 ? '+' : ''}{amount.toLocaleString()} UZS
        </Text>
      ),
    },
    {
      title: i18n.cashier.paymentMethod,
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 120,
      render: (method: string) => statusTranslations[method] || method,
    },
    {
      title: i18n.cashier.service,
      dataIndex: 'service_name',
      key: 'service_name',
    },
    {
      title: i18n.cashier.cashier,
      dataIndex: 'cashier_name',
      key: 'cashier_name',
    },
  ]

  const summaryData = summary || {
    total_paid: 2450000,
    total_refunded: 120000,
    total_debt: 380000,
    transaction_count: 47
  }

  return (
    <div>
      <Title level={3}>{i18n.cashier.title}</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={i18n.cashier.totalPaid}
              value={summaryData.total_paid}
              prefix={<DollarCircleOutlined style={{ color: '#52c41a' }} />}
              suffix="UZS"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={i18n.cashier.refunds}
              value={summaryData.total_refunded}
              prefix={<ArrowDownOutlined style={{ color: '#ff4d4f' }} />}
              suffix="UZS"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={i18n.cashier.debt}
              value={summaryData.total_debt}
              prefix={<RiseOutlined style={{ color: '#faad14' }} />}
              suffix="UZS"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={i18n.cashier.operations}
              value={summaryData.transaction_count}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          tabBarExtraContent={
            <Space>
              <RangePicker
                value={[dateRange[0] as any, dateRange[1] as any]}
                onChange={(dates: any) => {
                  if (dates) {
                    setDateRange([
                      dates[0]?.format('YYYY-MM-DD') || '',
                      dates[1]?.format('YYYY-MM-DD') || ''
                    ])
                  }
                }}
              />
              <Button type="primary" onClick={() => openPaymentModal()}>
                {i18n.cashier.newPayment}
              </Button>
            </Space>
          }
          items={[
            {
              key: 'transactions',
              label: i18n.cashier.operations,
              children: (
                <Table
                  columns={transactionColumns}
                  dataSource={transactions?.data || []}
                  rowKey="id"
                  loading={isLoading}
                  pagination={{ pageSize: 20 }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Payment Modal */}
      <Modal
        title={i18n.cashier.processPayment}
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handlePayment}>
          <Form.Item label={i18n.cashier.amount} name="amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={1000}
              step={1000}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/,/g, '') as any}
            />
          </Form.Item>
          <Form.Item label={i18n.cashier.paymentMethod} name="payment_method" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="cash">{i18n.cashier.cash}</Select.Option>
              <Select.Option value="card">{i18n.cashier.card}</Select.Option>
              <Select.Option value="transfer">{i18n.cashier.transfer}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={i18n.cashier.comment} name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setPaymentModalOpen(false)}>{i18n.common.cancel}</Button>
              <Button type="primary" htmlType="submit" loading={paymentMutation.isPending}>
                {i18n.cashier.processPayment}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Refund Modal */}
      <Modal
        title={i18n.cashier.processRefund}
        open={refundModalOpen}
        onCancel={() => setRefundModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleRefund}>
          <Form.Item label={i18n.cashier.transactionId} name="transaction_id" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={i18n.cashier.refundAmount} name="amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={1000}
              step={1000}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/,/g, '') as any}
            />
          </Form.Item>
          <Form.Item label={i18n.cashier.refundReason} name="reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setRefundModalOpen(false)}>{i18n.common.cancel}</Button>
              <Button type="primary" danger htmlType="submit" loading={refundMutation.isPending}>
                {i18n.cashier.processRefund}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
import { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Select, Input, InputNumber, DatePicker, message, Row, Col, Statistic, Tabs, Typography, Divider, AutoComplete } from 'antd'
import { PlusOutlined, MedicineBoxOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, EyeOutlined, PrinterOutlined, DeleteOutlined, EditOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { i18n, formatDate } from '../i18n/uz'

const { Title, Text } = Typography
const { TextArea } = Input

interface Drug {
  id: string
  name: string
  generic_name: string
  category: string
  form: string
  dosage: string
  unit: string
  price: number
  stock: number
  min_stock: number
  manufacturer: string
  expiry_date: string
}

interface Prescription {
  id: string
  patient: string
  doctor: string
  drugs: { drug_id: string; drug_name: string; quantity: number; dosage: string; duration: string }[]
  status: 'pending' | 'dispensed' | 'cancelled'
  date: string
  notes: string
}

export function PharmacyPage() {
  const [activeTab, setActiveTab] = useState('catalog')
  const [drugModalOpen, setDrugModalOpen] = useState(false)
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false)
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [form] = Form.useForm()
  const [prescriptionForm] = Form.useForm()
  const [dispenseForm] = Form.useForm()

  // Demo drug catalog
  const [drugs, setDrugs] = useState<Drug[]>([
    { id: 'D001', name: 'Paracetamol 500mg', generic_name: 'Paracetamol', category: 'Analgetik', form: 'Tabletka', dosage: '500mg', unit: 'dona', price: 2000, stock: 500, min_stock: 100, manufacturer: 'Doripharm', expiry_date: '2026-12-31' },
    { id: 'D002', name: 'Amoxicillin 250mg', generic_name: 'Amoxicillin', category: 'Antibiotik', form: 'Kapsula', dosage: '250mg', unit: 'dona', price: 5000, stock: 200, min_stock: 50, manufacturer: 'BioMed', expiry_date: '2026-06-15' },
    { id: 'D003', name: 'Omeprazole 20mg', generic_name: 'Omeprazole', category: 'Gastroprotektor', form: 'Kapsula', dosage: '20mg', unit: 'dona', price: 3500, stock: 300, min_stock: 80, manufacturer: 'PharmaCo', expiry_date: '2027-01-01' },
    { id: 'D004', name: 'Metformin 500mg', generic_name: 'Metformin', category: 'Diabet', form: 'Tabletka', dosage: '500mg', unit: 'dona', price: 2500, stock: 400, min_stock: 100, manufacturer: 'Doripharm', expiry_date: '2026-08-20' },
    { id: 'D005', name: 'Ibuprofen 400mg', generic_name: 'Ibuprofen', category: 'NVSP', form: 'Tabletka', dosage: '400mg', unit: 'dona', price: 3000, stock: 250, min_stock: 60, manufacturer: 'MediPharm', expiry_date: '2026-11-30' },
    { id: 'D006', name: 'Cetirizine 10mg', generic_name: 'Cetirizine', category: 'Antigistamin', form: 'Tabletka', dosage: '10mg', unit: 'dona', price: 4000, stock: 150, min_stock: 40, manufacturer: 'AllerMed', expiry_date: '2027-03-15' },
    { id: 'D007', name: 'Salbutamol Inhaler', generic_name: 'Salbutamol', category: 'Bronxolitik', form: 'Ingalyator', dosage: '100mcg', unit: 'dona', price: 45000, stock: 30, min_stock: 10, manufacturer: 'RespiCare', expiry_date: '2025-12-01' },
    { id: 'D008', name: 'Dexamethasone 4mg', generic_name: 'Dexamethasone', category: 'Kortikosteroid', form: 'Tabletka', dosage: '4mg', unit: 'dona', price: 6000, stock: 100, min_stock: 30, manufacturer: 'CortiPharm', expiry_date: '2026-09-10' },
  ])

  // Demo prescriptions
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    { id: 'PR001', patient: 'Rahimov Alisher', doctor: 'Karimova Nodira', drugs: [{ drug_id: 'D001', drug_name: 'Paracetamol 500mg', quantity: 20, dosage: '1 tabletka kuniga 3 marta', duration: '5 kun' }], status: 'pending', date: '2024-06-15', notes: 'Ovqatdan keyin' },
    { id: 'PR002', patient: 'Tursunova Dilshoda', doctor: 'Ahmedov Botir', drugs: [{ drug_id: 'D002', drug_name: 'Amoxicillin 250mg', quantity: 30, dosage: '1 kapsula kuniga 3 marta', duration: '7 kun' }], status: 'dispensed', date: '2024-06-14', notes: 'Nonushtadan keyin' },
    { id: 'PR003', patient: 'Abdullayev Jasur', doctor: 'Mahmudova Gulshan', drugs: [{ drug_id: 'D003', drug_name: 'Omeprazole 20mg', quantity: 28, dosage: '1 kapsula ertalab', duration: '28 kun' }], status: 'pending', date: '2024-06-15', notes: '' },
  ])

  const statusColors: Record<string, string> = {
    pending: 'warning',
    dispensed: 'success',
    cancelled: 'error',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Kutilmoqda',
    dispensed: 'Berildi',
    cancelled: 'Bekor qilingan',
  }

  const drugsColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: (id: string) => <Tag color="blue">{id}</Tag> },
    { title: 'Nomi', dataIndex: 'name', key: 'name' },
    { title: 'Umumiy nom', dataIndex: 'generic_name', key: 'generic_name' },
    { title: 'Kategoriya', dataIndex: 'category', key: 'category', render: (c: string) => <Tag>{c}</Tag> },
    { title: 'Forma', dataIndex: 'form', key: 'form' },
    { title: 'Doz', dataIndex: 'dosage', key: 'dosage' },
    { title: 'Narxi', dataIndex: 'price', key: 'price', render: (v: number) => `${v.toLocaleString()} so'm` },
    { title: 'Ombor', dataIndex: 'stock', key: 'stock', render: (v: number, r: Drug) => <Text type={v < r.min_stock ? 'danger' : 'secondary'}>{v}</Text> },
    { title: 'Yaroqlilik', dataIndex: 'expiry_date', key: 'expiry_date', render: (d: string) => <Tag color={new Date(d) < new Date('2026-01-01') ? 'warning' : 'success'}>{formatDate(d)}</Tag> },
    {
      title: 'Amal',
      key: 'action',
      render: (_: any, record: Drug) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openDrugEdit(record)} />
          <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteDrug(record)} />
        </Space>
      ),
    },
  ]

  const prescriptionsColumns = [
    { title: 'Receptura ID', dataIndex: 'id', key: 'id', render: (id: string) => <Tag color="blue">{id}</Tag> },
    { title: 'Bemor', dataIndex: 'patient', key: 'patient' },
    { title: 'Shifokor', dataIndex: 'doctor', key: 'doctor' },
    { title: 'Dorilar', dataIndex: 'drugs', key: 'drugs', render: (d: any[]) => d.map((drug, i) => <Tag key={i}>{drug.drug_name}</Tag>) },
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    {
      title: 'Amal',
      key: 'action',
      render: (_: any, record: Prescription) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openViewPrescription(record)} />
          {record.status === 'pending' && (
            <Button size="small" type="primary" icon={<ShoppingCartOutlined />} onClick={() => openDispenseModal(record)}>
              Berish
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const openDrugEdit = (drug: Drug) => {
    form.setFieldsValue(drug)
    setDrugModalOpen(true)
  }

  const handleDeleteDrug = (drug: Drug) => {
    Modal.confirm({
      title: 'Dori o\'chirilsinmi?',
      content: `${drug.name} - ombor: ${drug.stock} dona`,
      okText: 'Ha',
      cancelText: 'Yo\'q',
      onOk: () => {
        setDrugs(drugs.filter(d => d.id !== drug.id))
        message.success('Dori o\'chirildi')
      },
    })
  }

  const openViewPrescription = (prescription: Prescription) => {
    Modal.info({
      title: `Receptura ${prescription.id}`,
      width: 600,
      content: (
        <div>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Bemor:</Text>
              <div>{prescription.patient}</div>
            </Col>
            <Col span={12}>
              <Text strong>Shifokor:</Text>
              <div>{prescription.doctor}</div>
            </Col>
          </Row>
          <Divider>Dorilar</Divider>
          {prescription.drugs.map((drug, i) => (
            <Card size="small" key={i} style={{ marginBottom: 8 }}>
              <Text strong>{drug.drug_name}</Text>
              <div>Miqdor: {drug.quantity} dona</div>
              <div>Qabul qilish: {drug.dosage}</div>
              <div>Muddati: {drug.duration}</div>
            </Card>
          ))}
          {prescription.notes && <><Divider /><Text type="secondary">{prescription.notes}</Text></>}
        </div>
      ),
    })
  }

  const openDispenseModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setDispenseModalOpen(true)
  }

  const handleDispense = (values: any) => {
    if (selectedPrescription) {
      setPrescriptions(prescriptions.map(p => p.id === selectedPrescription.id ? { ...p, status: 'dispensed' } : p))

      // Update stock
      selectedPrescription.drugs.forEach(drug => {
        const drugItem = drugs.find(d => d.id === drug.drug_id)
        if (drugItem) {
          setDrugs(drugs.map(d => d.id === drug.drug_id ? { ...d, stock: d.stock - drug.quantity } : d))
        }
      })

      message.success('Dorilar muvaffaqiyatli berildi')
      setDispenseModalOpen(false)
      dispenseForm.resetFields()
    }
  }

  const handleSubmitDrug = (values: any) => {
    const existingDrug = drugs.find(d => d.id === values.id)
    if (existingDrug) {
      setDrugs(drugs.map(d => d.id === existingDrug.id ? { ...d, ...values } : d))
      message.success('Dori yangilandi')
    } else {
      setDrugs([...drugs, { ...values, id: 'D' + Date.now() }])
      message.success('Yangi dori qo\'shildi')
    }
    setDrugModalOpen(false)
    form.resetFields()
  }

  const lowStockCount = drugs.filter(d => d.stock < d.min_stock).length
  const expiringCount = drugs.filter(d => new Date(d.expiry_date) < new Date('2026-01-01')).length
  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending').length
  const totalStockValue = drugs.reduce((sum, d) => sum + d.price * d.stock, 0)

  const tabItems = [
    {
      key: 'catalog',
      label: <span><MedicineBoxOutlined /> Dorilar katalogi</span>,
      children: (
        <Card>
          <Table columns={drugsColumns} dataSource={drugs} rowKey="id" pagination={{ pageSize: 10 }} />
        </Card>
      ),
    },
    {
      key: 'prescriptions',
      label: <span><ShoppingCartOutlined /> Recepturalar</span>,
      children: (
        <Card>
          <Table columns={prescriptionsColumns} dataSource={prescriptions} rowKey="id" pagination={{ pageSize: 10 }} />
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Dorixona</Title>
        </Col>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setDrugModalOpen(true) }}>
              Dor qo'shish
            </Button>
            <Button icon={<ShoppingCartOutlined />} onClick={() => { prescriptionForm.resetFields(); setPrescriptionModalOpen(true) }}>
              Receptura yaratish
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Kam qolgan"
              value={lowStockCount}
              prefix={<ClockCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: lowStockCount > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Yakunlangan"
              value={expiringCount}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Kutilayotgan"
              value={pendingPrescriptions}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Umumiy qiymat"
              value={totalStockValue}
              precision={0}
              prefix="UZS "
              valueStyle={{ color: '#00d4aa' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Drug Edit Modal */}
      <Modal
        title="Dorini tahrirlash"
        open={drugModalOpen}
        onCancel={() => setDrugModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitDrug}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Nomi" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Umumiy nom" name="generic_name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Kategoriya" name="category" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="Analgetik">Analgetik</Select.Option>
                  <Select.Option value="Antibiotik">Antibiotik</Select.Option>
                  <Select.Option value="NVSP">NVSP</Select.Option>
                  <Select.Option value="Antigistamin">Antigistamin</Select.Option>
                  <Select.Option value="Gastroprotektor">Gastroprotektor</Select.Option>
                  <Select.Option value="Diabet">Diabet</Select.Option>
                  <Select.Option value="Bronxolitik">Bronxolitik</Select.Option>
                  <Select.Option value="Kortikosteroid">Kortikosteroid</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Forma" name="form" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="Tabletka">Tabletka</Select.Option>
                  <Select.Option value="Kapsula">Kapsula</Select.Option>
                  <Select.Option value="Ingalyator">Ingalyator</Select.Option>
                  <Select.Option value="Inyektsiya">Inyektsiya</Select.Option>
                  <Select.Option value="Syrop">Syrop</Select.Option>
                  <Select.Option value="Malham">Malham</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Doz" name="dosage" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Narxi (so'm)" name="price" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Omborda" name="stock" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Min ombor" name="min_stock" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ishlab chiqaruvchi" name="manufacturer">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Yaroqlilik" name="expiry_date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Dispense Modal */}
      <Modal
        title="Dorilarni berish"
        open={dispenseModalOpen}
        onCancel={() => setDispenseModalOpen(false)}
        onOk={() => dispenseForm.submit()}
        width={500}
      >
        {selectedPrescription && (
          <div>
            <Text strong>Bemor:</Text> {selectedPrescription.patient}
            <Divider />
            {selectedPrescription.drugs.map((drug, i) => (
              <Card key={i} size="small" style={{ marginBottom: 8 }}>
                <Text>{drug.drug_name}</Text>
                <div>Miqdor: {drug.quantity} dona</div>
                <div>Qabul: {drug.dosage}</div>
              </Card>
            ))}
            <Divider />
            <Form form={dispenseForm} layout="vertical" onFinish={handleDispense}>
              <Form.Item label="Tasdiqlash" name="confirm" rules={[{ required: true }]}>
                <Select placeholder="Tasdiqlang">
                  <Select.Option value="yes">Tasdiqlayman</Select.Option>
                </Select>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}
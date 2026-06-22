import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Card, Row, Col, Form, Input, Select, DatePicker, Button, Space, message, Divider } from 'antd'
import { ArrowLeftOutlined, UserAddOutlined } from '@ant-design/icons'
import { patientService } from '../services/api'
import { i18n } from '../i18n/uz'

const { Title, Text } = Typography

export function PatientRegistrationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()

  const createMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        ...values,
        birth_date: values.birth_date?.format('YYYY-MM-DD') || values.birth_date,
      }
      return patientService.create(payload)
    },
    onSuccess: (data) => {
      message.success('Bemor muvaffaqiyatli ro\'yxatga olindi!')
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      // Navigate to the new patient's detail page
      if (data?.id) {
        navigate(`/patients/${data.id}`)
      } else {
        navigate('/patients')
      }
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Bemor yaratishda xatolik yuz berdi')
    },
  })

  const handleCreatePatient = (values: any) => {
    createMutation.mutate(values)
  }

  return (
    <div>
      {/* Header */}
      <Row align="middle" style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/patients')}
          style={{ marginRight: 16 }}
        >
          Bemorlar ro'yxatiga qaytish
        </Button>
      </Row>

      <Card>
        <Title level={4} style={{ marginBottom: 24 }}>
          <UserAddOutlined style={{ marginRight: 8 }} />
          Yangi bemor ro'yxatga olish
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreatePatient}
          initialValues={{
            citizenship: "O'zbekiston",
          }}
        >
          {/* Full Name Section */}
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Shaxsiy ma'lumotlar</Text>
          <Divider style={{ marginTop: 8, marginBottom: 16 }} />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="last_name"
                label="Familiya"
                rules={[{ required: true, message: 'Familiya kiritish majburiy' }]}
              >
                <Input placeholder="Familiyani kiriting" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="first_name"
                label="Ism"
                rules={[{ required: true, message: 'Ism kiritish majburiy' }]}
              >
                <Input placeholder="Ismni kiriting" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="patronymic" label="Sharifi">
                <Input placeholder="Sharif (ixtiyoriy)" size="large" />
              </Form.Item>
            </Col>
          </Row>

          {/* Birth Info */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="birth_date"
                label="Tug'ilgan sana"
                rules={[{ required: true, message: "Tug'ilgan sanani tanlash majburiy" }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Sanani tanlang" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="gender"
                label="Jins"
                rules={[{ required: true, message: 'Jinsni tanlash majburiy' }]}
              >
                <Select placeholder="Jinsni tanlang" size="large">
                  <Select.Option value="male">Erkak</Select.Option>
                  <Select.Option value="female">Ayol</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="citizenship" label="Fuqarolik">
                <Input placeholder="O'zbekiston" size="large" />
              </Form.Item>
            </Col>
          </Row>

          {/* Contact Info */}
          <Text strong style={{ display: 'block', marginBottom: 8, marginTop: 16 }}>Bog'lanish ma'lumotlari</Text>
          <Divider style={{ marginTop: 8, marginBottom: 16 }} />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="phone"
                label="Telefon"
                rules={[{ required: true, message: 'Telefon raqamini kiritish majburiy' }]}
              >
                <Input placeholder="+998901234567" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="phone_2" label="Qo'shimcha telefon">
                <Input placeholder="+998901234568" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="email" label="Elektron pochta">
                <Input placeholder="email@example.com" type="email" size="large" />
              </Form.Item>
            </Col>
          </Row>

          {/* Document Info */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="passport" label="Pasport (AA1234567)">
                <Input placeholder="AA1234567" size="large" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="address" label="Manzil">
                <Input.TextArea rows={1} placeholder="Toshkent, Yunusobod tumani, ..." size="large" />
              </Form.Item>
            </Col>
          </Row>

          {/* Notes */}
          <Form.Item name="notes" label="Izoh">
            <Input.TextArea rows={2} placeholder="Bemor haqida qo'shimcha ma'lumot" />
          </Form.Item>

          {/* Actions */}
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button
                onClick={() => navigate('/patients')}
                size="large"
              >
                Bekor qilish
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending}
                size="large"
                style={{ minWidth: 150 }}
              >
                Ro'yxatga olish
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

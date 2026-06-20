import { Typography, Card, Descriptions } from 'antd'
import { useAuth } from '../contexts/AuthContext'
import { i18n, roleTranslations } from '../i18n/uz'

const { Title } = Typography

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div>
      <Title level={3}>{i18n.settings.title}</Title>
      <Card title={i18n.settings.userProfile}>
        <Descriptions column={2}>
          <Descriptions.Item label={i18n.settings.email}>{user?.email}</Descriptions.Item>
          <Descriptions.Item label={i18n.settings.role}>{roleTranslations[user?.role || ''] || user?.role}</Descriptions.Item>
          <Descriptions.Item label={i18n.settings.firstName}>{user?.first_name}</Descriptions.Item>
          <Descriptions.Item label={i18n.settings.lastName}>{user?.last_name}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
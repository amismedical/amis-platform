import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Avatar, Dropdown, Badge, Button, theme } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { i18n, roleTranslations } from '../i18n/uz'

const { Header, Sider, Content } = AntLayout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: i18n.menu.dashboard },
  { key: '/patients', icon: <TeamOutlined />, label: i18n.menu.patients },
  { key: '/appointments', icon: <CalendarOutlined />, label: i18n.menu.appointments },
  { key: '/queue', icon: <MedicineBoxOutlined />, label: i18n.menu.queue },
  { key: '/cashier', icon: <DollarOutlined />, label: i18n.menu.cashier },
  { key: '/doctor', icon: <UserOutlined />, label: i18n.menu.doctor },
  { key: '/lis', icon: <ExperimentOutlined />, label: i18n.menu.laboratory },
  { key: '/analytics', icon: <BarChartOutlined />, label: i18n.menu.analytics },
  { key: '/settings', icon: <SettingOutlined />, label: i18n.menu.settings },
]

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = theme.useToken()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: i18n.common.profile,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: i18n.common.logout,
      danger: true,
    },
  ]

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    } else if (key === 'profile') {
      navigate('/settings')
    }
  }

  // Get role display name
  const getRoleDisplay = (role: string | undefined) => {
    if (!role) return ''
    return roleTranslations[role] || role
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {collapsed ? (
            <span style={{ fontSize: 20, fontWeight: 'bold', color: token.colorPrimary }}>AM</span>
          ) : (
            <span style={{ fontSize: 18, fontWeight: 'bold', color: token.colorPrimary }}>
              AMIS
            </span>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3}>
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>

            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: token.colorPrimary }}>
                  {user?.first_name?.[0]}
                  {user?.last_name?.[0]}
                </Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 500 }}>
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
                    {getRoleDisplay(user?.role)}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: 24,
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            minHeight: 280,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
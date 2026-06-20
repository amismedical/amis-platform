import { useState, useEffect } from 'react'
import { Form, Input, Button, message, Typography, Tabs } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { i18n } from '../i18n/uz'

const { Title, Text } = Typography

// Check if we're in demo mode
const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

export function LoginPage() {
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [registerForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      if (isDemoMode) {
        message.success('Demo rejimida kirish muvaffaqiyatli!')
        navigate('/')
        setLoading(false)
        return
      }
      await login(values.email, values.password)
      message.success(i18n.auth.loginSuccess)
      navigate('/')
    } catch (error: any) {
      message.error(error.message || i18n.auth.loginError)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: { email: string; password: string; firstName: string; lastName: string }) => {
    setLoading(true)
    try {
      if (isDemoMode) {
        message.success('Demo rejimida ro\'yxatdan o\'tish muvaffaqiyatli!')
        setActiveTab('login')
        form.setFieldsValue({ email: values.email })
        setLoading(false)
        return
      }
      await register(values.email, values.password, values.firstName, values.lastName)
      message.success(i18n.auth.registerSuccess)
      setActiveTab('login')
      form.setFieldsValue({ email: values.email })
    } catch (error: any) {
      message.error(error.message || i18n.auth.registerError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      {/* Video Background */}
      <video
        style={styles.videoBg}
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/amis_final_brand_intro.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay - rgba(0,0,0,0.35) */}
      <div style={styles.overlay} />

      {/* Hex Grid Pattern */}
      <div style={styles.hexGrid} />

      {/* Animated Particles */}
      <div style={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.particle,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Logo Section - Above Login Card */}
      <div style={styles.logoSection}>
        {/* Official AMIS Logo */}
        <div style={styles.logoContainer}>
          <img
            src="/amis-logo.svg"
            alt="AMIS Logo"
            style={{
              width: '120px',
              height: '120px',
              filter: 'drop-shadow(0 0 30px rgba(0,242,255,0.6)) drop-shadow(0 0 60px rgba(0,242,255,0.4))',
              animation: 'logo-pulse 3s ease-in-out infinite',
            }}
          />
        </div>

        {/* Title */}
        <Title level={1} style={styles.mainTitle}>
          AMIS
        </Title>
        <Text style={styles.subtitle}>
          Advanced Medical Information System
        </Text>
        <Text style={styles.tagline}>
          Tibbiyotning kelajagi
        </Text>
      </div>

      {/* Login Card - Lower Center with Glassmorphism */}
      <div style={styles.cardWrapper}>
        <div style={styles.glassCard}>
          {/* Demo Mode Warning */}
          {isDemoMode && (
            <div style={styles.demoWarning}>
              <Text style={{ fontSize: 12 }}>
                Demo rejimi - ishlab chiqarish uchun emas
              </Text>
            </div>
          )}

          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            style={styles.tabs}
            items={[
              {
                key: 'login',
                label: i18n.auth.login,
                children: (
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleLogin}
                    size="large"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: i18n.auth.enterEmail },
                        { type: 'email', message: i18n.auth.invalidEmail },
                      ]}
                    >
                      <Input
                        prefix={<UserOutlined style={{ color: '#00d4aa' }} />}
                        placeholder={i18n.auth.email}
                        style={styles.input}
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: i18n.auth.enterPassword }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#00d4aa' }} />}
                        placeholder={i18n.auth.password}
                        style={styles.input}
                      />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 16, marginTop: 24 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={loading}
                        style={styles.loginButton}
                      >
                        {i18n.auth.loginButton}
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'register',
                label: i18n.auth.register,
                children: (
                  <Form
                    form={registerForm}
                    layout="vertical"
                    onFinish={handleRegister}
                    size="large"
                  >
                    <Form.Item
                      name="firstName"
                      rules={[{ required: true, message: i18n.auth.enterFirstName }]}
                    >
                      <Input placeholder={i18n.auth.firstName} style={styles.input} />
                    </Form.Item>

                    <Form.Item
                      name="lastName"
                      rules={[{ required: true, message: i18n.auth.enterLastName }]}
                    >
                      <Input placeholder={i18n.auth.lastName} style={styles.input} />
                    </Form.Item>

                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: i18n.auth.enterEmail },
                        { type: 'email', message: i18n.auth.invalidEmail },
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined style={{ color: '#00d4aa' }} />}
                        placeholder={i18n.auth.email}
                        style={styles.input}
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[
                        { required: true, message: i18n.auth.enterPassword },
                        { min: 6, message: i18n.auth.passwordMinLength },
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: '#00d4aa' }} />}
                        placeholder={i18n.auth.password}
                        style={styles.input}
                      />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 16, marginTop: 24 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={loading}
                        style={styles.loginButton}
                      >
                        {i18n.auth.registerButton}
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />

          {/* Footer Text */}
          <div style={styles.footer}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              {isDemoMode ? 'Demo rejimi - to''liq tizim uchun tizimga kiring' : 'AMIS API orqali himoyalangan'}
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
}

// Premium Styles - Tesla + Apple + Palantir + Epic EMR Quality
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Video Background
  videoBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
  },

  // Dark Overlay - rgba(0,0,0,0.35)
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.35)',
    zIndex: 1,
  },

  // Hex Grid Pattern
  hexGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.08,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'%3E%3Cpath fill='none' stroke='%2300d4ff' stroke-width='1' d='M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z'/%3E%3C/svg%3E")`,
    backgroundSize: '60px 52px',
    zIndex: 2,
    animation: 'grid-move 20s linear infinite',
  },

  // Animated Particles
  particles: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 3,
    overflow: 'hidden',
  },

  particle: {
    position: 'absolute',
    width: '4px',
    height: '4px',
    background: '#00d4ff',
    borderRadius: '50%',
    boxShadow: '0 0 20px #00d4ff, 0 0 40px #00d4ff',
    animation: 'float-particle 15s infinite linear',
    opacity: 0.5,
  },

  // Logo Section - Above Login Card
  logoSection: {
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    marginBottom: '40px',
    animation: 'fadeInUp 1s ease forwards',
  },

  logoContainer: {
    marginBottom: '20px',
  },

  logoSvg: {
    filter: 'drop-shadow(0 0 30px rgba(0,212,255,0.6)) drop-shadow(0 0 60px rgba(0,212,255,0.4))',
    animation: 'logo-pulse 3s ease-in-out infinite',
  },

  mainTitle: {
    fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
    fontSize: 'clamp(48px, 10vw, 80px)',
    fontWeight: 900,
    letterSpacing: '20px',
    background: 'linear-gradient(180deg, #ffffff 0%, #00d4ff 50%, #00ffcc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
    textShadow: '0 0 40px rgba(0,212,255,0.5)',
    filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.5))',
  },

  subtitle: {
    display: 'block',
    fontFamily: "'Inter', 'Rajdhani', sans-serif",
    fontSize: 'clamp(12px, 2vw, 18px)',
    fontWeight: 500,
    letterSpacing: '8px',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    marginTop: '16px',
  },

  tagline: {
    display: 'block',
    fontFamily: "'Inter', 'Rajdhani', sans-serif",
    fontSize: 'clamp(14px, 2.5vw, 20px)',
    fontWeight: 300,
    letterSpacing: '4px',
    color: '#00ffcc',
    marginTop: '12px',
  },

  // Card Wrapper - Lower Center (20-25% down)
  cardWrapper: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '440px',
    padding: '0 20px',
    marginTop: '40px', // Push card lower
  },

  // Glassmorphism Card
  glassCard: {
    background: 'rgba(5,15,25,0.35)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(0,255,220,0.25)',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 0 40px rgba(0,255,220,0.15), 0 25px 50px rgba(0,0,0,0.4)',
  },

  // Demo Warning
  demoWarning: {
    background: 'rgba(255,235,59,0.15)',
    border: '1px solid rgba(255,235,59,0.3)',
    borderRadius: '8px',
    padding: '10px 16px',
    marginBottom: '20px',
    textAlign: 'center',
  },

  // Tabs Styling
  tabs: {
    marginTop: '-8px',
  },

  // Input Styling
  input: {
    background: 'rgba(0,212,255,0.05)',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: '12px',
    height: '48px',
    color: '#ffffff',
    fontSize: '15px',
  },

  // Login Button
  loginButton: {
    height: '52px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '1px',
    background: 'linear-gradient(135deg, #00d4ff 0%, #00ffcc 100%)',
    border: 'none',
    boxShadow: '0 8px 25px rgba(0,212,255,0.4)',
  },

  // Footer
  footer: {
    textAlign: 'center',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(0,212,255,0.1)',
  },
}
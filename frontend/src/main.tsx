import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const theme = {
  token: {
    // Brand & Primary
    colorPrimary: '#D4AF37',
    colorSuccess: '#4ade80',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#60a5fa',
    // Layout & Surfaces — match CommandCenterLayout background #050a12
    colorBgBase: '#050a12',
    colorBgContainer: '#0a1929',
    colorBgElevated: '#0f2744',
    colorBgLayout: '#050a12',
    colorBgSpotlight: '#0a1929',
    // Text & Borders
    colorText: 'rgba(255,255,255,0.92)',
    colorTextSecondary: 'rgba(255,255,255,0.65)',
    colorTextTertiary: 'rgba(255,255,255,0.45)',
    colorTextQuaternary: 'rgba(255,255,255,0.25)',
    colorBorder: 'rgba(212,175,55,0.15)',
    colorBorderSecondary: 'rgba(255,255,255,0.08)',
    // Typography
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    // Component-level
    controlHeight: 38,
    controlHeightLG: 44,
    controlHeightSM: 30,
    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    // Link
    colorLink: '#60a5fa',
    colorLinkHover: '#93c5fd',
  },
  components: {
    Form: {
      labelColor: 'rgba(255,255,255,0.80)',
      labelFontSize: 13,
      labelRequiredMarkColor: '#ef4444',
      itemMarginBottom: 16,
    },
    Card: {
      colorBgContainer: '#0a1929',
      colorTextHeading: '#F5D76E',
      colorTextDescription: 'rgba(255,255,255,0.65)',
    },
    Modal: {
      contentBg: '#0f2744',
      headerBg: '#0f2744',
      titleColor: '#F5D76E',
    },
    Drawer: {
      colorBgElevated: '#0f2744',
    },
    Table: {
      headerBg: '#0a1929',
      headerColor: 'rgba(255,255,255,0.92)',
      rowHoverBg: 'rgba(212,175,55,0.06)',
      colorBgContainer: 'rgba(10,25,41,0.5)',
      colorText: 'rgba(255,255,255,0.88)',
    },
    Collapse: {
      headerBg: '#0a1929',
      contentBg: 'rgba(10,25,41,0.3)',
      headerColor: '#F5D76E',
      titleFontSize: 14,
    },
    Tabs: {
      itemColor: 'rgba(255,255,255,0.55)',
      itemHoverColor: '#60a5fa',
      itemSelectedColor: '#00d4ff',
      inkBarColor: '#00d4ff',
      horizontalItemGutter: 24,
    },
    Input: {
      colorBgContainer: 'rgba(255,255,255,0.95)',
      colorText: '#1a1a2e',
      placeholderColor: 'rgba(0,0,0,0.4)',
      activeBorderColor: '#D4AF37',
      hoverBorderColor: '#F5D76E',
    },
    Select: {
      colorBgContainer: 'rgba(255,255,255,0.95)',
      colorBgElevated: '#ffffff',
      colorText: '#1a1a2e',
      optionSelectedBg: 'rgba(212,175,55,0.15)',
    },
    DatePicker: {
      colorBgContainer: 'rgba(255,255,255,0.95)',
      colorBgElevated: '#ffffff',
      colorText: '#1a1a2e',
    },
    Button: {
      primaryColor: '#050a12',
    },
    Tag: {
      defaultBg: 'rgba(255,255,255,0.08)',
      defaultColor: 'rgba(255,255,255,0.85)',
    },
    Statistic: {
      titleFontSize: 13,
      titleColor: 'rgba(255,255,255,0.60)',
      contentFontSize: 26,
      contentFontWeight: 700,
      contentColor: 'rgba(255,255,255,0.92)',
    },
    Descriptions: {
      colorText: 'rgba(255,255,255,0.88)',
      titleColor: '#F5D76E',
    },
    Divider: {
      colorSplit: 'rgba(255,255,255,0.08)',
    },
    Checkbox: {
      colorBgContainer: 'rgba(255,255,255,0.95)',
    },
    Radio: {
      colorBgContainer: 'rgba(255,255,255,0.95)',
    },
    Switch: {
      colorPrimary: '#D4AF37',
      colorPrimaryHover: '#F5D76E',
    },
    Steps: {
      colorText: 'rgba(255,255,255,0.70)',
      colorTextDescription: 'rgba(255,255,255,0.50)',
      colorTextDisabled: 'rgba(255,255,255,0.25)',
    },
    Empty: {
      colorText: 'rgba(255,255,255,0.40)',
      colorTextDescription: 'rgba(255,255,255,0.30)',
    },
    Alert: {
      colorInfoBg: 'rgba(96,165,250,0.12)',
      colorInfoBorder: 'rgba(96,165,250,0.30)',
      colorInfo: '#93c5fd',
      colorSuccessBg: 'rgba(74,222,128,0.12)',
      colorSuccessBorder: 'rgba(74,222,128,0.30)',
      colorSuccess: '#4ade80',
      colorWarningBg: 'rgba(245,158,11,0.12)',
      colorWarningBorder: 'rgba(245,158,11,0.30)',
      colorWarning: '#fbbf24',
      colorErrorBg: 'rgba(239,68,68,0.12)',
      colorErrorBorder: 'rgba(239,68,68,0.30)',
      colorError: '#f87171',
    },
    Message: {
      colorBgElevated: '#0f2744',
      colorText: 'rgba(255,255,255,0.92)',
    },
    Notification: {
      colorBgElevated: '#0f2744',
    },
    Tooltip: {
      colorBgSpotlight: '#0f2744',
      colorTextLightSolid: 'rgba(255,255,255,0.95)',
    },
    Popover: {
      colorBgElevated: '#0f2744',
    },
    Dropdown: {
      colorBgElevated: '#0f2744',
    },
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={theme}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
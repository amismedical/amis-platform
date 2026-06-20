import React, { Component, ReactNode } from 'react'
import { Result, Button, Typography } from 'antd'

const { Paragraph, Text } = Typography

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Result
          status="error"
          title="Xatolik yuz berdi"
          subTitle="Ilova muammo bilan duch keldi. Sahifani qayta yuklashni sinab ko'ring."
          extra={[
            <Button key="reload" type="primary" onClick={this.handleReload}>
              Qayta yuklash
            </Button>,
          ]}
        >
          {import.meta.env.DEV && this.state.error && (
            <div style={{ textAlign: 'left', marginTop: 24 }}>
              <Paragraph>
                <Text strong>Xatolik:</Text>
              </Paragraph>
              <Paragraph>
                <pre style={{
                  background: '#f5f5f5',
                  padding: 16,
                  borderRadius: 4,
                  overflow: 'auto',
                  maxHeight: 200,
                  fontSize: 12
                }}>
                  {this.state.error?.toString()}
                </pre>
              </Paragraph>
              {this.state.errorInfo && (
                <>
                  <Paragraph>
                    <Text strong>Stack Trace:</Text>
                  </Paragraph>
                  <Paragraph>
                    <pre style={{
                      background: '#f5f5f5',
                      padding: 16,
                      borderRadius: 4,
                      overflow: 'auto',
                      maxHeight: 200,
                      fontSize: 12
                    }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </Paragraph>
                </>
              )}
            </div>
          )}
        </Result>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
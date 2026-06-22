import { Result, Button } from 'antd'
import { ToolOutlined } from '@ant-design/icons'

interface PlaceholderPageProps {
  moduleName: string
  description?: string
}

export function PlaceholderPage({ moduleName, description }: PlaceholderPageProps) {
  return (
    <Result
      icon={
        <ToolOutlined style={{
          fontSize: 64,
          color: '#D4AF37',
        }}
        />
      }
      title={moduleName}
      subTitle={description || 'Modul hali sozlanmagan'}
      extra={
        <div style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 14,
          maxWidth: 400,
          margin: '0 auto',
          lineHeight: 1.8,
        }}>
          <p>Bu modul backend integratsiyasini kutmoqda.</p>
          <p>Iltimos, keyinchalik qayta urinib ko'ring yoki administrator bilan bog'laning.</p>
        </div>
      }
    />
  )
}

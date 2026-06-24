/**
 * AMIS - Queue Display for TV (Module 6)
 * Fullscreen TV display with day/night theme, language switch, clock
 * Auto-refresh every 30 seconds, WebSocket-ready
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Typography, Card, Row, Col, Tag, Select, Button, Space, Spin, Badge } from 'antd'
import {
  SoundOutlined, SettingOutlined, ArrowLeftOutlined,
  ClockCircleOutlined, CheckCircleOutlined, UserOutlined,
  MinusSquareOutlined, AudioOutlined, AudioMutedOutlined
} from '@ant-design/icons'
import { queueService } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// Language content definitions
type Lang = 'uz-lat' | 'uz-cyrillic' | 'ru'
const langContent: Record<Lang, {
  title: string
  queueName: string
  called: string
  waiting: string
  completed: string
  selectQueue: string
  currentNumber: string
  nextNumbers: string
  lastCalled: string
  noQueueSelected: string
  noEntries: string
  refresh: string
  dayMode: string
  nightMode: string
  goBack: string
  muted: string
  unmuted: string
}> = {
  'uz-lat': {
    title: 'Navbat ekrani',
    queueName: 'Navbat nomi',
    called: 'CHAQIRILDI',
    waiting: 'KUTILMOQDA',
    completed: 'TUGALLANDI',
    selectQueue: 'Navbatni tanlang',
    currentNumber: 'Hozirgi raqam',
    nextNumbers: 'Keyingi raqamlar',
    lastCalled: 'Oxirgi chaqirilgan',
    noQueueSelected: 'Navbat tanlanmagan',
    noEntries: 'Hali hech kim yo\'q',
    refresh: 'Yangilash',
    dayMode: 'Kunduzgi',
    nightMode: 'Tungi',
    goBack: 'Orqaga',
    muted: 'Ovozsiz',
    unmuted: 'Ovozli',
  },
  'uz-cyrillic': {
    title: 'Навбат экрани',
    queueName: 'Навбат номи',
    called: 'ЧАҚИРИЛДИ',
    waiting: 'КУТИЛМОҚДА',
    completed: 'ТУГАЛЛАНДИ',
    selectQueue: 'Навбатни танланг',
    currentNumber: 'Ҳозирги рақам',
    nextNumbers: 'Кейинги рақамлар',
    lastCalled: 'Охирги чақирилган',
    noQueueSelected: 'Навбат танланмаган',
    noEntries: 'Ҳали ҳеч ким йоқ',
    refresh: 'Янгилаш',
    dayMode: 'Кундузги',
    nightMode: 'Тунги',
    goBack: 'Орқага',
    muted: 'Овозсиз',
    unmuted: 'Овозли',
  },
  'ru': {
    title: 'Экран очереди',
    queueName: 'Название очереди',
    called: 'ВЫЗЫВАЕТСЯ',
    waiting: 'ОЖИДАЕТ',
    completed: 'ЗАВЕРШЕНО',
    selectQueue: 'Выберите очередь',
    currentNumber: 'Текущий номер',
    nextNumbers: 'Следующие номера',
    lastCalled: 'Последний вызванный',
    noQueueSelected: 'Очередь не выбрана',
    noEntries: 'Пока никого нет',
    refresh: 'Обновить',
    dayMode: 'Дневной',
    nightMode: 'Ночной',
    goBack: 'Назад',
    muted: 'Без звука',
    unmuted: 'Со звуком',
  },
}

// Status colors for TV display
const statusColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  called: { bg: '#d4af37', text: '#000', border: '#f5d560', glow: 'rgba(212,175,55,0.5)' },
  waiting: { bg: '#1a2a4a', text: '#4a90d9', border: '#2a5a9a', glow: 'rgba(74,144,217,0.3)' },
  completed: { bg: '#0d3320', text: '#52c41a', border: '#23731a', glow: 'rgba(82,196,26,0.3)' },
  skipped: { bg: '#2d2a1a', text: '#faad14', border: '#8a7020', glow: 'rgba(250,173,20,0.3)' },
  cancelled: { bg: '#2d1a1a', text: '#ff4d4f', border: '#8a2020', glow: 'rgba(255,77,79,0.3)' },
}

export function QueueDisplayPage() {
  const navigate = useNavigate()
  const [selectedQueue, setSelectedQueue] = useState<string>('')
  const [lang, setLang] = useState<Lang>('uz-lat')
  const [isNightMode, setIsNightMode] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [prevCalledNumber, setPrevCalledNumber] = useState<number | null>(null)
  const [soundAlert, setSoundAlert] = useState(false)

  const t = langContent[lang]

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem('queueDisplayPrefs')
    if (saved) {
      try {
        const prefs = JSON.parse(saved)
        if (prefs.lang) setLang(prefs.lang)
        if (prefs.isNightMode !== undefined) setIsNightMode(prefs.isNightMode)
      } catch {}
    }
    const savedQueue = localStorage.getItem('queueDisplayQueue')
    if (savedQueue) setSelectedQueue(savedQueue)
  }, [])

  // Save preferences
  useEffect(() => {
    localStorage.setItem('queueDisplayPrefs', JSON.stringify({ lang, isNightMode }))
  }, [lang, isNightMode])

  useEffect(() => {
    if (selectedQueue) localStorage.setItem('queueDisplayQueue', selectedQueue)
  }, [selectedQueue])

  // Load queues list
  const { data: queuesData } = useQuery({
    queryKey: ['queue-lists'],
    queryFn: () => queueService.list(),
  })
  const queuesList = queuesData?.data || []

  // Auto-select first active queue if none selected
  useEffect(() => {
    if (!selectedQueue && queuesList.length > 0) {
      const active = queuesList.find((q: any) => q.is_active)
      setSelectedQueue(active?.id || queuesList[0]?.id || '')
    }
  }, [queuesList, selectedQueue])

  // Load selected queue entries (auto-refresh every 30s)
  const { data: queueData, isLoading, refetch } = useQuery({
    queryKey: ['queue-display', selectedQueue],
    queryFn: () => selectedQueue ? queueService.get(selectedQueue) : Promise.resolve(null),
    enabled: !!selectedQueue,
    refetchInterval: 30000,
  })

  // Process entries
  const entries = queueData?.data || []
  const calledEntries = entries.filter((e: any) => e.status === 'called')
  const waitingEntries = entries.filter((e: any) => e.status === 'waiting')
  const completedEntries = entries.filter((e: any) => e.status === 'completed').slice(-5)

  const currentEntry = calledEntries[0]
  const nextEntries = waitingEntries.slice(0, 5)

  // Sound alert when new number is called
  useEffect(() => {
    if (currentEntry && currentEntry.queue_number !== prevCalledNumber) {
      setPrevCalledNumber(currentEntry.queue_number)
      if (!isMuted) {
        setSoundAlert(true)
        // Play beep
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioCtx.createOscillator()
          const gainNode = audioCtx.createGain()
          oscillator.connect(gainNode)
          gainNode.connect(audioCtx.destination)
          oscillator.frequency.value = 880
          oscillator.type = 'sine'
          gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
          oscillator.start(audioCtx.currentTime)
          oscillator.stop(audioCtx.currentTime + 0.5)
        } catch {}
        setTimeout(() => setSoundAlert(false), 500)
      }
    }
  }, [currentEntry, prevCalledNumber, isMuted])

  // Theme styles
  const theme = isNightMode ? {
    bg: '#000510',
    cardBg: 'rgba(0,5,16,0.95)',
    textPrimary: '#e8e8e8',
    textSecondary: '#8c8c8c',
    accent: '#d4af37',
    accentDim: '#8a7030',
    border: 'rgba(212,175,55,0.2)',
    divider: 'rgba(212,175,55,0.1)',
    panelBg: 'rgba(0,10,30,0.9)',
  } : {
    bg: '#0a1628',
    cardBg: 'rgba(10,22,40,0.95)',
    textPrimary: '#ffffff',
    textSecondary: '#8c8c8c',
    accent: '#d4af37',
    accentDim: '#8a7030',
    border: 'rgba(212,175,55,0.3)',
    divider: 'rgba(212,175,55,0.2)',
    panelBg: 'rgba(15,30,60,0.9)',
  }

  const currentQueueName = queuesList.find((q: any) => q.id === selectedQueue)?.name || t.noQueueSelected

  // Language options
  const langOptions = [
    { value: 'uz-lat', label: 'O\'zbek (Lotin)' },
    { value: 'uz-cyrillic', label: 'Ўзбекча (Кирилл)' },
    { value: 'ru', label: 'Русский' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.bg,
        color: theme.textPrimary,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Control Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        background: theme.cardBg,
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/queue')}
            style={{ color: theme.accent, fontSize: 18 }}
          />
          <div>
            <Text style={{
              color: theme.accent,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 1,
            }}>
              {t.title.toUpperCase()}
            </Text>
            <Text style={{
              color: theme.textSecondary,
              fontSize: 14,
              marginLeft: 16,
            }}>
              {currentQueueName}
            </Text>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Queue Selector */}
          <Select
            placeholder={t.selectQueue}
            value={selectedQueue || undefined}
            onChange={(v) => { setSelectedQueue(v); setPrevCalledNumber(null) }}
            style={{ width: 200, minWidth: 200 }}
            size="large"
            options={queuesList.map((q: any) => ({ value: q.id, label: q.name }))}
            allowClear
          />

          {/* Language Switch */}
          <Select
            value={lang}
            onChange={(v) => setLang(v as Lang)}
            style={{ width: 160 }}
            size="large"
            options={langOptions}
          />

          {/* Day/Night Toggle */}
          <Button
            icon={isNightMode ? <SettingOutlined /> : <SettingOutlined />}
            onClick={() => setIsNightMode(!isNightMode)}
            style={{
              background: isNightMode ? '#1a1a2e' : theme.accent,
              borderColor: isNightMode ? '#3a3a5e' : theme.accent,
              color: isNightMode ? '#d4af37' : '#000',
              fontSize: 16,
              height: 40,
              width: 40,
            }}
          >
            {isNightMode ? '☾' : '☀'}
          </Button>

          {/* Sound Toggle */}
          <Button
            icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
            onClick={() => setIsMuted(!isMuted)}
            style={{
              background: isMuted ? '#2d1a1a' : '#0d3320',
              borderColor: isMuted ? '#8a2020' : '#23731a',
              color: isMuted ? '#ff4d4f' : '#52c41a',
              fontSize: 16,
              height: 40,
              width: 40,
            }}
          />

          {/* Clock */}
          <div style={{ textAlign: 'right', minWidth: 120 }}>
            <Text style={{
              color: theme.accent,
              fontSize: 22,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              display: 'block',
              lineHeight: 1.2,
            }}>
              {dayjs(currentTime).format('HH:mm')}
            </Text>
            <Text style={{
              color: theme.textSecondary,
              fontSize: 12,
              display: 'block',
            }}>
              {dayjs(currentTime).format('DD.MM.YYYY')}
            </Text>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        paddingTop: 80,
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 24,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {isLoading ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 16,
          }}>
            <Spin size="large" />
            <Text style={{ color: theme.textSecondary, fontSize: 18 }}>{t.refresh}</Text>
          </div>
        ) : !selectedQueue ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 16,
          }}>
            <Text style={{
              color: theme.textSecondary,
              fontSize: 32,
              fontWeight: 600,
            }}>
              {t.noQueueSelected}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 18 }}>
              {t.selectQueue}
            </Text>
          </div>
        ) : (
          <>
            {/* Main Display - Current Called Number */}
            <Row gutter={20} style={{ flex: '0 0 auto' }}>
              {/* Current Called - Hero Section */}
              <Col span={24}>
                <div
                  style={{
                    background: `linear-gradient(135deg, ${theme.cardBg} 0%, rgba(212,175,55,0.08) 100%)`,
                    border: `2px solid ${theme.accent}`,
                    borderRadius: 24,
                    padding: '40px 48px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 0 60px ${theme.accentDim}40, inset 0 1px 0 rgba(255,255,255,0.05)`,
                  }}
                >
                  {/* Animated glow effect */}
                  {soundAlert && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: `radial-gradient(circle at center, ${theme.accentDim}40 0%, transparent 70%)`,
                      animation: 'pulse 0.5s ease-out',
                      borderRadius: 24,
                    }} />
                  )}

                  <Text style={{
                    color: theme.textSecondary,
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: 4,
                    display: 'block',
                    marginBottom: 12,
                    textTransform: 'uppercase',
                  }}>
                    {t.called}
                  </Text>

                  {currentEntry ? (
                    <>
                      <div style={{
                        fontSize: 'clamp(80px, 15vw, 160px)',
                        fontWeight: 900,
                        color: theme.accent,
                        lineHeight: 1,
                        textShadow: `0 0 40px ${theme.accentDim}`,
                        letterSpacing: '-2px',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {String(currentEntry.queue_number).padStart(2, '0')}
                      </div>
                      <div style={{
                        marginTop: 16,
                        fontSize: 24,
                        color: theme.textPrimary,
                        fontWeight: 600,
                      }}>
                        {currentEntry.Patient
                          ? `${currentEntry.Patient.last_name || ''} ${currentEntry.Patient.first_name || ''}`.trim()
                          : currentEntry.patient_name || '—'}
                      </div>
                      {currentEntry.cabinet && (
                        <div style={{
                          marginTop: 8,
                          fontSize: 20,
                          color: theme.accent,
                          fontWeight: 600,
                        }}>
                          {currentEntry.cabinet}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      fontSize: 48,
                      color: theme.textSecondary,
                      fontWeight: 600,
                      padding: '40px 0',
                    }}>
                      {t.noEntries}
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            {/* Bottom Row - Waiting + Stats + Completed */}
            <Row gutter={20} style={{ flex: 1 }}>
              {/* Waiting List */}
              <Col span={14}>
                <Card
                  bordered={false}
                  style={{
                    background: theme.panelBg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 16,
                    height: '100%',
                  }}
                  bodyStyle={{ padding: '16px 20px', height: '100%' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{
                      color: theme.accent,
                      fontSize: 16,
                      fontWeight: 700,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                    }}>
                      {t.waiting}
                    </Text>
                    <Badge
                      count={waitingEntries.length}
                      style={{
                        backgroundColor: 'transparent',
                        color: theme.textSecondary,
                        fontSize: 14,
                        fontWeight: 600,
                        border: `1px solid ${theme.border}`,
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: 12,
                    overflowY: 'auto',
                    maxHeight: 'calc(100% - 40px)',
                  }}>
                    {waitingEntries.map((entry: any, idx: number) => (
                      <div
                        key={entry.id}
                        style={{
                          background: `rgba(26,42,74,0.5)`,
                          border: `1px solid ${theme.border}`,
                          borderRadius: 12,
                          padding: '12px 8px',
                          textAlign: 'center',
                          position: 'relative',
                        }}
                      >
                        {idx === 0 && (
                          <div style={{
                            position: 'absolute',
                            top: -1,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: `8px solid ${theme.accent}`,
                          }} />
                        )}
                        <div style={{
                          fontSize: 32,
                          fontWeight: 800,
                          color: idx === 0 ? theme.accent : theme.textPrimary,
                          lineHeight: 1,
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {String(entry.queue_number).padStart(2, '0')}
                        </div>
                        {entry.cabinet && (
                          <div style={{
                            fontSize: 11,
                            color: theme.textSecondary,
                            marginTop: 4,
                          }}>
                            {entry.cabinet}
                          </div>
                        )}
                      </div>
                    ))}
                    {waitingEntries.length === 0 && (
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        color: theme.textSecondary,
                        fontSize: 16,
                        padding: 32,
                      }}>
                        {t.noEntries}
                      </div>
                    )}
                  </div>
                </Card>
              </Col>

              {/* Right Column */}
              <Col span={10}>
                <Row gutter={[0, 16]} style={{ height: '100%' }}>
                  {/* Queue Stats */}
                  <Col span={24}>
                    <Card
                      bordered={false}
                      style={{
                        background: theme.panelBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 16,
                      }}
                      bodyStyle={{ padding: '16px 20px' }}
                    >
                      <Text style={{
                        color: theme.accent,
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: 16,
                      }}>
                        STATISTIKA
                      </Text>
                      <Row gutter={16}>
                        {[
                          { label: t.waiting, value: waitingEntries.length, color: '#4a90d9' },
                          { label: t.called, value: calledEntries.length, color: theme.accent },
                          { label: t.completed, value: completedEntries.length, color: '#52c41a' },
                        ].map((stat) => (
                          <Col span={8} key={stat.label}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{
                                fontSize: 36,
                                fontWeight: 800,
                                color: stat.color,
                                lineHeight: 1,
                                fontVariantNumeric: 'tabular-nums',
                              }}>
                                {stat.value}
                              </div>
                              <div style={{
                                fontSize: 11,
                                color: theme.textSecondary,
                                marginTop: 4,
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                              }}>
                                {stat.label}
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  </Col>

                  {/* Last Completed */}
                  <Col span={24} style={{ flex: 1 }}>
                    <Card
                      bordered={false}
                      style={{
                        background: theme.panelBg,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 16,
                        height: '100%',
                      }}
                      bodyStyle={{ padding: '16px 20px', height: 'calc(100% - 40px)', overflow: 'hidden' }}
                    >
                      <Text style={{
                        color: '#52c41a',
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: 12,
                      }}>
                        {t.completed}
                      </Text>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
                        {completedEntries.map((entry: any) => (
                          <div
                            key={entry.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(13,51,32,0.3)',
                              borderRadius: 8,
                              padding: '8px 12px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                              <span style={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: '#52c41a',
                                fontVariantNumeric: 'tabular-nums',
                              }}>
                                {String(entry.queue_number).padStart(2, '0')}
                              </span>
                            </div>
                            <span style={{ fontSize: 13, color: theme.textSecondary }}>
                              {entry.Patient
                                ? `${entry.Patient.last_name || ''} ${entry.Patient.first_name || ''}`.trim()
                                : entry.patient_name || '—'}
                            </span>
                          </div>
                        ))}
                        {completedEntries.length === 0 && (
                          <div style={{
                            textAlign: 'center',
                            color: theme.textSecondary,
                            fontSize: 14,
                            padding: 16,
                          }}>
                            {t.noEntries}
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        background: `linear-gradient(90deg, ${theme.accentDim}, ${theme.accent}, ${theme.accentDim})`,
      }} />

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.5); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

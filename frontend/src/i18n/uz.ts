// ===========================================
// AMIS - Advanced Medical Information System
// UZBEK LATIN TRANSLATIONS
// ===========================================

export const i18n = {
  // ============ MENU ============
  menu: {
    dashboard: 'Boshqaruv paneli',
    patients: 'Bemorlar',
    appointments: 'Qabullar',
    queue: 'Elektron navbat',
    cashier: 'Kassa',
    doctor: 'Shifokor',
    laboratory: 'Laboratoriya',
    analytics: 'Tahlillar',
    settings: 'Sozlamalar',
  },

  // ============ AUTH ============
  auth: {
    login: 'Kirish',
    register: "Ro'yxatdan o'tish",
    email: 'Email',
    password: 'Parol',
    confirmPassword: 'Parolni tasdiqlang',
    enterEmail: 'Email manzilini kiriting',
    invalidEmail: 'Email manzili noto\'g\'ri',
    enterPassword: 'Parolni kiriting',
    passwordMinLength: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak',
    firstName: 'Ism',
    lastName: 'Familiya',
    enterFirstName: 'Ismni kiriting',
    enterLastName: 'Familiyani kiriting',
    loginSuccess: 'Muvaffaqiyatli kirdingiz',
    loginError: 'Kirishda xatolik. Email va parolni tekshiring.',
    registerSuccess: "Ro'yxatdan muvaffaqiyatli o'tdingiz! Endi tizimga kiring.",
    registerError: "Ro'yxatdan o'tishda xatolik",
    loginButton: 'Tizimga kirish',
    registerButton: "Ro'yxatdan o'tish",
    useSupabaseAuth: 'Tizimga kirish uchun Supabase Auth ishlatiladi',
  },

  // ============ DASHBOARD ============
  dashboard: {
    title: 'Boshqaruv paneli',
    totalAppointments: 'Jami qabullar',
    completed: 'Tugallangan',
    cancelled: 'Bekor qilingan',
    revenue: 'Tushum',
    newPatients: 'Yangi bemorlar',
    inQueue: 'Navbatda',
    recentAppointments: "So'nggi qabullar",
    quickActions: 'Tezkor amallar',
    registerPatient: 'Bemor yozish',
    todaySchedule: "Bugungi jadval",
    cashier: 'Kassa',
  },

  // ============ PATIENTS ============
  patients: {
    title: 'Bemorlar',
    addPatient: 'Bemor qo\'shish',
    searchPlaceholder: 'FISH, telefon bo\'yicha qidirish...',
    id: 'ID',
    fullName: 'FISH',
    birthDate: 'Tug\'ilgan sana',
    gender: 'Jins',
    male: 'Erkak',
    female: 'Ayol',
    phone: 'Telefon',
    citizenship: 'Fuqarolik',
    balance: 'Balans',
    status: 'Holat',
    active: 'Faol',
    inactive: 'Faol emas',
    actions: 'Amallar',
    details: 'Batafsil',
  },

  // ============ APPOINTMENTS ============
  appointments: {
    title: 'Qabullar',
    time: 'Vaqt',
    patient: 'Bemor',
    service: 'Xizmat',
    doctor: 'Shifokor',
    status: 'Holat',
    cabinet: 'Kabinet',
    scheduled: 'Rejalashtirilgan',
    waiting: 'Kutmoqda',
    inProgress: 'Jarayonda',
    completed: 'Tugallangan',
    cancelled: 'Bekor qilingan',
    register: "Ro'yxatga olish",
    allStatuses: 'Barcha holatlar',
    search: 'Qidirish...',
  },

  // ============ QUEUE ============
  queue: {
    title: 'Elektron navbat',
    number: 'Raqam',
    status: 'Holat',
    waiting: 'Kutmoqda',
    called: 'Chaqirildi',
    completed: 'Tugallangan',
    patient: 'Bemor',
    phone: 'Telefon',
    actions: 'Amallar',
    finish: 'Tugallash',
    waitingCount: 'Kutmoqdalar',
    calledCount: 'Chaqirilganlar',
    selectQueue: 'Navbatni tanlang',
    callNext: 'Keyingini chaqirish',
    noPatientsInQueue: 'Navbatda bemorlar yo\'q',
    nextPatientCalled: 'Keyingi bemor chaqirildi',
    patientCompleted: 'Bemor tugallandi',
    finishAppointment: 'Qabulni tugallash?',
    patientFinishedVisit: 'Bemor qabulni tugatdi va kabinetni tark etdi',
  },

  // ============ CASHIER ============
  cashier: {
    title: 'Kassa',
    totalPaid: 'Jami to\'langan',
    refunds: 'Qaytarilgan',
    debt: 'Qarz',
    operations: 'Operatsiyalar',
    transactionTime: 'Vaqt',
    patient: 'Bemor',
    type: 'Turi',
    payment: 'To\'lov',
    refund: 'Qaytarish',
    amount: 'Summa',
    paymentMethod: 'To\'lov usuli',
    service: 'Xizmat',
    cashier: 'Kassa',
    cash: 'Naqd',
    card: 'Karta',
    transfer: 'O\'tkazma',
    newPayment: 'Yangi to\'lov',
    processPayment: "To'lovni amalga oshirish",
    cancel: 'Bekor qilish',
    paymentSuccess: 'To\'lov muvaffaqiyatli amalga oshirildi',
    paymentError: 'To\'lovda xatolik yuz berdi',
    refundSuccess: 'Qaytarish muvaffaqiyatli rasmiylashtirildi',
    refundError: 'Qaytarishda xatolik yuz berdi',
    processRefund: 'Qaytarishni rasmiylashtirish',
    transactionId: 'Tranzaksiya ID',
    refundAmount: 'Qaytarish summasi',
    refundReason: 'Qaytarish sababi',
    comment: 'Izoh',
  },

  // ============ DOCTOR ============
  doctor: {
    title: 'Shifokor ish joyi',
    todaySchedule: "Bugungi jadval",
    startAppointment: 'Qabulni boshlash',
    patient: 'Bemor',
    phone: 'Telefon',
    service: 'Xizmat',
    cabinet: 'Kabinet',
    appointmentStarted: 'Qabul boshlandi',
    recordVitals: 'Vital ma\'lumotlarni yozish',
    addDiagnosis: 'Diagnoz qo\'shish',
    sendToLab: 'Laboratoriyaga yo\'naltirish',
    vitalsData: 'Vital ma\'lumotlar',
    height: 'Bo\'y (sm)',
    weight: 'Vazn (kg)',
    temperature: 'Harorat',
    pulse: 'Puls',
    bloodPressure: 'Bosim',
    upperPressure: 'Yuqori',
    lowerPressure: 'Pastki',
    comments: 'Izohlar',
    diagnosisAdded: 'Diagnoz qo\'shildi',
    vitalsRecorded: 'Vital ma\'lumotlar yozildi',
    // Diagnosis
    addDiagnosisTitle: 'Diagnoz qo\'shish',
    icdCode: 'MK-10 kodi',
    diagnosisName: 'Diagnoz nomi',
    diagnosisType: 'Turi',
    primary: 'Asosiy',
    secondary: 'Qo\'shimcha',
    complication: 'Asorat',
  },

  // ============ LABORATORY ============
  laboratory: {
    title: 'Laboratoriya (LIS)',
    orders: 'Buyurtmalar',
    orderNumber: 'Buyurtma raqami',
    patient: 'Bemor',
    testType: 'Test turi',
    status: 'Holat',
    ordered: 'Buyurtma berilgan',
    collected: 'Namuna olingan',
    processing: 'Ishlanmoqda',
    ready: 'Tayyor',
    collectSample: 'Namuna olish',
    enterResults: 'Natija kiritish',
    viewResults: 'Natijalarni ko\'rish',
  },

  // ============ ANALYTICS ============
  analytics: {
    title: 'Tahlillar',
    totalAppointments: 'Jami qabullar',
    revenue: 'Tushum',
    patientStatistics: 'Bemor statistikasi',
    revenueStatistics: 'Tushum statistikasi',
    doctorStatistics: 'Shifokor statistikasi',
    queueStatistics: 'Navbat statistikasi',
  },

  // ============ SETTINGS ============
  settings: {
    title: 'Sozlamalar',
    userProfile: 'Foydalanuvchi profili',
    email: 'Email',
    role: 'Rol',
    firstName: 'Ism',
    lastName: 'Familiya',
    clinicSettings: 'Klinika sozlamalari',
    systemSettings: 'Tizim sozlamalari',
  },

  // ============ COMMON ============
  common: {
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    delete: 'O\'chirish',
    edit: 'Tahrirlash',
    add: 'Qo\'shish',
    close: 'Yopish',
    confirm: 'Tasdiqlash',
    yes: 'Ha',
    no: 'Yo\'q',
    loading: 'Yuklanmoqda...',
    error: 'Xatolik',
    success: 'Muvaffaqiyat',
    noData: 'Ma\'lumot yo\'q',
    profile: 'Profil',
    logout: 'Chiqish',
    admin: 'Administrator',
    doctor: 'Shifokor',
    cashier: 'Kassa',
    registrar: 'Registrator',
  },

  // ============ STATUSES ============
  status: {
    scheduled: 'Rejalashtirilgan',
    waiting: 'Kutmoqda',
    in_progress: 'Jarayonda',
    completed: 'Tugallangan',
    cancelled: 'Bekor qilingan',
    no_show: 'Kelmadi',
    active: 'Faol',
    inactive: 'Faol emas',
  },

  // ============ DAYS ============
  days: {
    sunday: 'Yakshanba',
    monday: 'Dushanba',
    tuesday: 'Seshanba',
    wednesday: 'Chorshanba',
    thursday: 'Payshanba',
    friday: 'Juma',
    saturday: 'Shanba',
  },
}

// Role translations
export const roleTranslations: Record<string, string> = {
  admin: 'Administrator',
  clinic_admin: 'Administrator',
  doctor: 'Shifokor',
  registrar: 'Registrator',
  cashier: 'Kassa',
  lab_tech: 'Laborant',
  director: 'Direktor',
}

// Status translations
export const statusTranslations: Record<string, string> = {
  scheduled: 'Rejalashtirilgan',
  waiting: 'Kutmoqda',
  in_progress: 'Jarayonda',
  completed: 'Tugallangan',
  cancelled: 'Bekor qilingan',
  no_show: 'Kelmadi',
  active: 'Faol',
  inactive: 'Faol emas',
  // Queue specific
  called: 'Chaqirildi',
  // Payment specific
  payment: "To'lov",
  refund: 'Qaytarish',
  // Payment methods
  cash: 'Naqd',
  card: 'Karta',
  transfer: "O'tkazma",
  deposit: 'Depozit',
}

// Format date to Uzbek format
export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

// Format day name to Uzbek
export const formatDayName = (date: Date): string => {
  const days = [
    'Yakshanba',
    'Dushanba',
    'Seshanba',
    'Chorshanba',
    'Payshanba',
    'Juma',
    'Shanba',
  ]
  return days[date.getDay()]
}

// Format full date with day name
export const formatFullDate = (date: Date): string => {
  const months = [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'Iyun',
    'Iyul',
    'Avgust',
    'Sentabr',
    'Oktabr',
    'Noyabr',
    'Dekabr',
  ]
  const dayName = formatDayName(date)
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${dayName}, ${day} ${month} ${year}`
}

export default i18n
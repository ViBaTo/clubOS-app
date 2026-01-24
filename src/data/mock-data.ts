// ============================================================================
// MOCK DATA FOR DEV BRANCH - No database connection
// ============================================================================

// Types
export interface MockClient {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  document_id: string | null
  categoria_id: string | null
  category_name: string | null
  status: 'active' | 'inactive' | 'prospect'
  internal_notes: string | null
  communications_consent: boolean
  deletion_request: boolean
  data_anonymized: boolean
  pending_balance: number
  last_class_date: string | null
  organization_id: string
  created_at: string
  updated_at: string
  avatar?: string
}

export interface MockProduct {
  id: string
  name: string
  description: string | null
  product_type: 'bono' | 'clase' | 'academia' | 'membership'
  price: number
  currency: string
  duration_days: number | null
  classes_included: number | null
  is_active: boolean
  display_order: number
  configuration: Record<string, any>
  organization_id: string
  created_at: string
  updated_at: string
}

export interface MockStaffMember {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: 'owner' | 'admin' | 'instructor' | 'reception'
  specialties: string[]
  status: 'active' | 'pending' | 'inactive'
  organization_id: string
  user_id: string | null
  invited_at: string
  activated_at: string | null
  first_login_completed: boolean
  created_at: string
  updated_at: string
  avatar?: string
}

export interface MockNotification {
  id: string
  user_id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  read: boolean
  action_url: string | null
  created_at: string
}

export interface MockCategory {
  id: string
  name: string
  color: string
  organization_id: string
  created_at: string
}

export interface MockOrganization {
  id: string
  name: string
  slug: string
  access_code: string
  logo_url: string | null
  created_at: string
}

// ============================================================================
// MOCK ORGANIZATION
// ============================================================================

export const mockOrganization: MockOrganization = {
  id: 'org-001',
  name: 'Club Deportivo Demo',
  slug: 'club-demo',
  access_code: 'DEMO2024',
  logo_url: '/placeholder-logo.png',
  created_at: '2024-01-01T00:00:00.000Z',
}

// ============================================================================
// MOCK USER (authenticated user for dev)
// ============================================================================

export const mockCurrentUser = {
  id: 'user-001',
  email: 'admin@clubdemo.com',
  full_name: 'Admin Demo',
  role: 'owner' as const,
  organization_id: 'org-001',
}

// ============================================================================
// MOCK CATEGORIES
// ============================================================================

export const mockCategories: MockCategory[] = [
  { id: 'cat-001', name: 'Adultos', color: '#3B82F6', organization_id: 'org-001', created_at: '2024-01-01T00:00:00.000Z' },
  { id: 'cat-002', name: 'Infantil', color: '#10B981', organization_id: 'org-001', created_at: '2024-01-01T00:00:00.000Z' },
  { id: 'cat-003', name: 'Senior', color: '#F59E0B', organization_id: 'org-001', created_at: '2024-01-01T00:00:00.000Z' },
  { id: 'cat-004', name: 'Competición', color: '#EF4444', organization_id: 'org-001', created_at: '2024-01-01T00:00:00.000Z' },
  { id: 'cat-005', name: 'Iniciación', color: '#8B5CF6', organization_id: 'org-001', created_at: '2024-01-01T00:00:00.000Z' },
]

// ============================================================================
// MOCK CLIENTS
// ============================================================================

export const mockClients: MockClient[] = [
  {
    id: 'client-001',
    full_name: 'Carlos Rodríguez García',
    email: 'carlos.rodriguez@email.com',
    phone: '+34 612 345 678',
    document_id: '12345678A',
    categoria_id: 'cat-001',
    category_name: 'Adultos',
    status: 'active',
    internal_notes: 'Cliente desde 2022. Prefiere horario de mañana.',
    communications_consent: true,
    deletion_request: false,
    data_anonymized: false,
    pending_balance: 0,
    last_class_date: '2024-01-15T10:00:00.000Z',
    organization_id: 'org-001',
    created_at: '2022-03-15T00:00:00.000Z',
    updated_at: '2024-01-15T00:00:00.000Z',
    avatar: '/client-carlos.jpg',
  },
  {
    id: 'client-002',
    full_name: 'Laura Martínez López',
    email: 'laura.martinez@email.com',
    phone: '+34 623 456 789',
    document_id: '23456789B',
    categoria_id: 'cat-004',
    category_name: 'Competición',
    status: 'active',
    internal_notes: 'Jugadora de competición. Entrena 3 veces por semana.',
    communications_consent: true,
    deletion_request: false,
    data_anonymized: false,
    pending_balance: 45,
    last_class_date: '2024-01-16T18:00:00.000Z',
    organization_id: 'org-001',
    created_at: '2021-09-01T00:00:00.000Z',
    updated_at: '2024-01-16T00:00:00.000Z',
    avatar: '/client-laura.jpg',
  },
  {
    id: 'client-003',
    full_name: 'Miguel Fernández Ruiz',
    email: 'miguel.fernandez@email.com',
    phone: '+34 634 567 890',
    document_id: '34567890C',
    categoria_id: 'cat-003',
    category_name: 'Senior',
    status: 'active',
    internal_notes: null,
    communications_consent: false,
    deletion_request: false,
    data_anonymized: false,
    pending_balance: 0,
    last_class_date: '2024-01-10T09:00:00.000Z',
    organization_id: 'org-001',
    created_at: '2023-01-20T00:00:00.000Z',
    updated_at: '2024-01-10T00:00:00.000Z',
    avatar: '/client-miguel.jpg',
  },
  {
    id: 'client-004',
    full_name: 'Elena Sánchez Moreno',
    email: 'elena.sanchez@email.com',
    phone: '+34 645 678 901',
    document_id: '45678901D',
    categoria_id: 'cat-005',
    category_name: 'Iniciación',
    status: 'prospect',
    internal_notes: 'Interesada en clases de pádel. Contactar la próxima semana.',
    communications_consent: true,
    deletion_request: false,
    data_anonymized: false,
    pending_balance: 0,
    last_class_date: null,
    organization_id: 'org-001',
    created_at: '2024-01-10T00:00:00.000Z',
    updated_at: '2024-01-10T00:00:00.000Z',
    avatar: '/client-elena.jpg',
  },
  {
    id: 'client-005',
    full_name: 'Roberto Silva Pérez',
    email: 'roberto.silva@email.com',
    phone: '+34 656 789 012',
    document_id: '56789012E',
    categoria_id: 'cat-002',
    category_name: 'Infantil',
    status: 'inactive',
    internal_notes: 'Padre de dos niños en la academia. Inactivo temporalmente.',
    communications_consent: true,
    deletion_request: false,
    data_anonymized: false,
    pending_balance: 120,
    last_class_date: '2023-12-01T17:00:00.000Z',
    organization_id: 'org-001',
    created_at: '2022-09-01T00:00:00.000Z',
    updated_at: '2023-12-01T00:00:00.000Z',
    avatar: '/client-roberto.jpg',
  },
  {
    id: 'client-006',
    full_name: 'Ana García Vidal',
    email: 'ana.garcia@email.com',
    phone: '+34 667 890 123',
    document_id: '67890123F',
    categoria_id: 'cat-001',
    category_name: 'Adultos',
    status: 'active',
    internal_notes: null,
    communications_consent: true,
    deletion_request: false,
    data_anonymized: false,
    pending_balance: 0,
    last_class_date: '2024-01-17T11:00:00.000Z',
    organization_id: 'org-001',
    created_at: '2023-06-15T00:00:00.000Z',
    updated_at: '2024-01-17T00:00:00.000Z',
  },
  {
    id: 'client-007',
    full_name: 'Pablo Martín González',
    email: 'pablo.martin@email.com',
    phone: '+34 678 901 234',
    document_id: '78901234G',
    categoria_id: 'cat-004',
    category_name: 'Competición',
    status: 'active',
    internal_notes: 'Participa en torneos federados.',
    communications_consent: true,
    deletion_request: false,
    data_anonymized: false,
    pending_balance: 0,
    last_class_date: '2024-01-16T19:00:00.000Z',
    organization_id: 'org-001',
    created_at: '2021-03-01T00:00:00.000Z',
    updated_at: '2024-01-16T00:00:00.000Z',
  },
  {
    id: 'client-008',
    full_name: 'María José Herrero',
    email: 'mariajose.herrero@email.com',
    phone: '+34 689 012 345',
    document_id: '89012345H',
    categoria_id: 'cat-001',
    category_name: 'Adultos',
    status: 'active',
    internal_notes: null,
    communications_consent: false,
    deletion_request: false,
    data_anonymized: false,
    pending_balance: 25,
    last_class_date: '2024-01-14T10:00:00.000Z',
    organization_id: 'org-001',
    created_at: '2023-11-01T00:00:00.000Z',
    updated_at: '2024-01-14T00:00:00.000Z',
  },
]

// ============================================================================
// MOCK PRODUCTS
// ============================================================================

export const mockProducts: MockProduct[] = [
  {
    id: 'prod-001',
    name: 'Bono 10 Clases',
    description: 'Bono de 10 clases particulares de pádel o tenis. Válido durante 3 meses.',
    product_type: 'bono',
    price: 350,
    currency: 'EUR',
    duration_days: 90,
    classes_included: 10,
    is_active: true,
    display_order: 1,
    configuration: { sports: ['padel', 'tenis'] },
    organization_id: 'org-001',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'prod-002',
    name: 'Bono 5 Clases',
    description: 'Bono de 5 clases particulares. Válido durante 2 meses.',
    product_type: 'bono',
    price: 200,
    currency: 'EUR',
    duration_days: 60,
    classes_included: 5,
    is_active: true,
    display_order: 2,
    configuration: { sports: ['padel', 'tenis'] },
    organization_id: 'org-001',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'prod-003',
    name: 'Clase Suelta',
    description: 'Clase particular de 1 hora.',
    product_type: 'clase',
    price: 45,
    currency: 'EUR',
    duration_days: null,
    classes_included: 1,
    is_active: true,
    display_order: 3,
    configuration: {},
    organization_id: 'org-001',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'prod-004',
    name: 'Academia Infantil',
    description: 'Programa de academia para niños de 6-12 años. 2 clases semanales.',
    product_type: 'academia',
    price: 75,
    currency: 'EUR',
    duration_days: 30,
    classes_included: 8,
    is_active: true,
    display_order: 4,
    configuration: { age_range: '6-12', weekly_classes: 2 },
    organization_id: 'org-001',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'prod-005',
    name: 'Academia Adultos',
    description: 'Programa de academia para adultos. 2 clases semanales.',
    product_type: 'academia',
    price: 90,
    currency: 'EUR',
    duration_days: 30,
    classes_included: 8,
    is_active: true,
    display_order: 5,
    configuration: { age_range: '18+', weekly_classes: 2 },
    organization_id: 'org-001',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'prod-006',
    name: 'Membresía Anual',
    description: 'Acceso ilimitado a clases grupales durante 1 año.',
    product_type: 'membership',
    price: 600,
    currency: 'EUR',
    duration_days: 365,
    classes_included: null,
    is_active: true,
    display_order: 6,
    configuration: { unlimited_group_classes: true },
    organization_id: 'org-001',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'prod-007',
    name: 'Clase Grupal',
    description: 'Clase grupal de hasta 4 personas.',
    product_type: 'clase',
    price: 25,
    currency: 'EUR',
    duration_days: null,
    classes_included: 1,
    is_active: true,
    display_order: 7,
    configuration: { max_participants: 4 },
    organization_id: 'org-001',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
]

// ============================================================================
// MOCK STAFF
// ============================================================================

export const mockStaff: MockStaffMember[] = [
  {
    id: 'staff-001',
    email: 'admin@clubdemo.com',
    full_name: 'Admin Demo',
    phone: '+34 600 000 001',
    role: 'owner',
    specialties: [],
    status: 'active',
    organization_id: 'org-001',
    user_id: 'user-001',
    invited_at: '2024-01-01T00:00:00.000Z',
    activated_at: '2024-01-01T00:00:00.000Z',
    first_login_completed: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'staff-002',
    email: 'ana.garcia@clubdemo.com',
    full_name: 'Ana García',
    phone: '+34 612 345 678',
    role: 'instructor',
    specialties: ['Tenis', 'Pádel', 'Clases grupales'],
    status: 'active',
    organization_id: 'org-001',
    user_id: 'user-002',
    invited_at: '2024-01-05T00:00:00.000Z',
    activated_at: '2024-01-06T00:00:00.000Z',
    first_login_completed: true,
    created_at: '2024-01-05T00:00:00.000Z',
    updated_at: '2024-01-06T00:00:00.000Z',
    avatar: '/instructor-ana.jpg',
  },
  {
    id: 'staff-003',
    email: 'carlos.mendez@clubdemo.com',
    full_name: 'Carlos Méndez',
    phone: '+34 623 456 789',
    role: 'instructor',
    specialties: ['Tenis', 'Clases particulares', 'Competición'],
    status: 'active',
    organization_id: 'org-001',
    user_id: 'user-003',
    invited_at: '2024-01-05T00:00:00.000Z',
    activated_at: '2024-01-07T00:00:00.000Z',
    first_login_completed: true,
    created_at: '2024-01-05T00:00:00.000Z',
    updated_at: '2024-01-07T00:00:00.000Z',
    avatar: '/instructor-carlos.jpg',
  },
  {
    id: 'staff-004',
    email: 'maria.lopez@clubdemo.com',
    full_name: 'María López',
    phone: '+34 634 567 890',
    role: 'instructor',
    specialties: ['Pádel', 'Fitness', 'Clases grupales'],
    status: 'active',
    organization_id: 'org-001',
    user_id: 'user-004',
    invited_at: '2024-01-08T00:00:00.000Z',
    activated_at: '2024-01-09T00:00:00.000Z',
    first_login_completed: true,
    created_at: '2024-01-08T00:00:00.000Z',
    updated_at: '2024-01-09T00:00:00.000Z',
    avatar: '/instructor-maria.jpg',
  },
  {
    id: 'staff-005',
    email: 'david.ruiz@clubdemo.com',
    full_name: 'David Ruiz',
    phone: '+34 645 678 901',
    role: 'instructor',
    specialties: ['Tenis', 'Academia', 'Iniciación'],
    status: 'active',
    organization_id: 'org-001',
    user_id: 'user-005',
    invited_at: '2024-01-08T00:00:00.000Z',
    activated_at: '2024-01-10T00:00:00.000Z',
    first_login_completed: true,
    created_at: '2024-01-08T00:00:00.000Z',
    updated_at: '2024-01-10T00:00:00.000Z',
    avatar: '/instructor-david.jpg',
  },
  {
    id: 'staff-006',
    email: 'recepcion@clubdemo.com',
    full_name: 'Sara Recepción',
    phone: '+34 656 789 012',
    role: 'reception',
    specialties: [],
    status: 'active',
    organization_id: 'org-001',
    user_id: 'user-006',
    invited_at: '2024-01-10T00:00:00.000Z',
    activated_at: '2024-01-11T00:00:00.000Z',
    first_login_completed: true,
    created_at: '2024-01-10T00:00:00.000Z',
    updated_at: '2024-01-11T00:00:00.000Z',
  },
  {
    id: 'staff-007',
    email: 'nuevo.instructor@clubdemo.com',
    full_name: 'Nuevo Instructor',
    phone: '+34 667 890 123',
    role: 'instructor',
    specialties: ['Pádel'],
    status: 'pending',
    organization_id: 'org-001',
    user_id: null,
    invited_at: '2024-01-15T00:00:00.000Z',
    activated_at: null,
    first_login_completed: false,
    created_at: '2024-01-15T00:00:00.000Z',
    updated_at: '2024-01-15T00:00:00.000Z',
  },
]

// ============================================================================
// MOCK NOTIFICATIONS
// ============================================================================

export const mockNotifications: MockNotification[] = [
  {
    id: 'notif-001',
    user_id: 'user-001',
    type: 'info',
    title: 'Nueva reserva',
    message: 'Carlos Rodríguez ha reservado una clase para mañana a las 10:00.',
    read: false,
    action_url: '/calendario',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
  },
  {
    id: 'notif-002',
    user_id: 'user-001',
    type: 'warning',
    title: 'Pago pendiente',
    message: 'Roberto Silva tiene un saldo pendiente de 120€.',
    read: false,
    action_url: '/clientes/client-005',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 'notif-003',
    user_id: 'user-001',
    type: 'success',
    title: 'Nuevo cliente registrado',
    message: 'Elena Sánchez se ha registrado como nuevo prospecto.',
    read: true,
    action_url: '/clientes/client-004',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'notif-004',
    user_id: 'user-001',
    type: 'info',
    title: 'Clase cancelada',
    message: 'La clase de las 18:00 con Laura Martínez ha sido cancelada.',
    read: true,
    action_url: '/calendario',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

let clientIdCounter = mockClients.length + 1
let productIdCounter = mockProducts.length + 1
let staffIdCounter = mockStaff.length + 1
let notificationIdCounter = mockNotifications.length + 1

export function generateClientId(): string {
  return `client-${String(clientIdCounter++).padStart(3, '0')}`
}

export function generateProductId(): string {
  return `prod-${String(productIdCounter++).padStart(3, '0')}`
}

export function generateStaffId(): string {
  return `staff-${String(staffIdCounter++).padStart(3, '0')}`
}

export function generateNotificationId(): string {
  return `notif-${String(notificationIdCounter++).padStart(3, '0')}`
}

// In-memory state for mutations (resets on server restart)
export const mockDataStore = {
  clients: [...mockClients],
  products: [...mockProducts],
  staff: [...mockStaff],
  notifications: [...mockNotifications],
  categories: [...mockCategories],
}

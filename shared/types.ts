// ============ 用户相关 ============
export type UserRole = 'client' | 'counselor';

export interface User {
  id: string;
  role: UserRole;
  phone?: string;
  email?: string;
  name: string;
  avatar?: string;
  passwordHash: string;
  createdAt: string;
}

export interface Client extends User {
  role: 'client';
  anonymousId: string;
}

export interface Counselor extends User {
  role: 'counselor';
  licenseNo: string;
  licenseVerified: boolean;
  specialties: Specialty[];
  serviceModes: ServiceMode[];
  introduction: string;
  education: string;
  experienceYears: number;
  sessionDuration: number;
  pricePerSession: number;
  avgRating: number;
  reviewCount: number;
  totalSessions: number;
  schedule: WeeklySchedule;
}

export type Specialty = 'anxiety' | 'depression' | 'marriage' | 'adolescent' | 'trauma' | 'stress' | 'family' | 'other';
export type ServiceMode = 'text' | 'voice' | 'video';

export interface WeeklySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export const SpecialtyLabels: Record<Specialty, string> = {
  anxiety: '焦虑症',
  depression: '抑郁症',
  marriage: '婚姻家庭',
  adolescent: '青少年',
  trauma: '创伤治疗',
  stress: '压力管理',
  family: '亲子关系',
  other: '其他',
};

export const ServiceModeLabels: Record<ServiceMode, string> = {
  text: '文字咨询',
  voice: '语音咨询',
  video: '视频咨询',
};

// ============ 预约相关 ============
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress';

export const AppointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  cancelled: '已取消',
  completed: '已完成',
  in_progress: '进行中',
};

export interface Appointment {
  id: string;
  counselorId: string;
  clientId: string;
  counselorName?: string;
  clientName?: string;
  date: string;
  timeSlot: string;
  serviceMode: ServiceMode;
  status: AppointmentStatus;
  price: number;
  packageUsageId?: string;
  assessmentForm?: AssessmentForm;
  crisisTriggered: boolean;
  createdAt: string;
}

export interface AssessmentForm {
  anonymousId: string;
  emotionalState: number;
  stressLevel: number;
  sleepQuality: number;
  mainConcern: string;
  durationMonths: number;
  previousTherapy: boolean;
  previousTherapyDetails?: string;
  suicidalIdeation: boolean;
  selfHarmThoughts: boolean;
  additionalNotes?: string;
  submittedAt: string;
}

// ============ 聊天与会话 ============
export interface ChatMessage {
  id: string;
  appointmentId: string;
  senderId: string;
  senderRole: UserRole;
  content: string;
  contentEncrypted: boolean;
  timestamp: string;
  crisisFlags?: string[];
}

// ============ 档案笔记 ============
export interface CounselorNote {
  id: string;
  counselorId: string;
  clientId: string;
  clientName?: string;
  appointmentId?: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============ 评价 ============
export interface Review {
  id: string;
  appointmentId: string;
  counselorId: string;
  clientId: string;
  rating: number;
  createdAt: string;
}

export interface ReviewStats {
  avgRating: number;
  reviewCount: number;
  distribution: { rating: number; count: number; percentage: number }[];
}

// ============ 课程包 ============
export interface Package {
  id: string;
  counselorId: string;
  name: string;
  sessionCount: number;
  originalPrice: number;
  discountPrice: number;
  description: string;
}

export interface PackagePurchase {
  id: string;
  packageId: string;
  clientId: string;
  counselorId: string;
  counselorName?: string;
  remainingSessions: number;
  totalSessions: number;
  purchasedAt: string;
  expireAt: string;
}

// ============ 危机干预 ============
export interface CrisisCheckResult {
  triggered: boolean;
  matchedKeywords: string[];
  severity: 'low' | 'medium' | 'high';
}

// ============ API 响应 ============
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: Omit<User, 'passwordHash'>;
}

export interface CounselorFilters {
  specialties?: Specialty[];
  serviceModes?: ServiceMode[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

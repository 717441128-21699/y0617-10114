import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  Counselor,
  Client,
  Appointment,
  ChatMessage,
  CounselorNote,
  Review,
  Package,
  PackagePurchase,
  ScheduleException,
  RescheduleRequest,
  FollowUpTask,
  TimeSlot,
  WeeklySchedule,
} from '../../shared/types.js';
import {
  mockCounselors,
  mockClients,
  mockAppointments,
  mockChatMessages,
  mockCounselorNotes,
  mockReviews,
  mockPackages,
  mockPackagePurchases,
  mockScheduleExceptions,
} from './mockData.js';
import { encryptContent, decryptContent } from './encryption.js';
import { normalizeWeeklySchedule, normalizeCounselorSchedule, DEFAULT_TIME_SLOTS } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

interface DatabaseData {
  users: User[];
  counselors: Counselor[];
  clients: Client[];
  appointments: Appointment[];
  chatMessages: ChatMessage[];
  counselorNotes: CounselorNote[];
  reviews: Review[];
  packages: Package[];
  packagePurchases: PackagePurchase[];
  scheduleExceptions: ScheduleException[];
  rescheduleRequests: RescheduleRequest[];
  followUpTasks: FollowUpTask[];
}

function getInitialData(): DatabaseData {
  const users: User[] = [...mockCounselors, ...mockClients];
  return {
    users,
    counselors: mockCounselors,
    clients: mockClients,
    appointments: mockAppointments,
    chatMessages: mockChatMessages,
    counselorNotes: mockCounselorNotes,
    reviews: mockReviews,
    packages: mockPackages,
    packagePurchases: mockPackagePurchases,
    scheduleExceptions: mockScheduleExceptions,
    rescheduleRequests: [],
    followUpTasks: [],
  };
}

export class Database {
  private static instance: Database | null = null;
  public users: User[];
  public counselors: Counselor[];
  public clients: Client[];
  public appointments: Appointment[];
  public chatMessages: ChatMessage[];
  public counselorNotes: CounselorNote[];
  public reviews: Review[];
  public packages: Package[];
  public packagePurchases: PackagePurchase[];
  public scheduleExceptions: ScheduleException[];
  public rescheduleRequests: RescheduleRequest[];
  public followUpTasks: FollowUpTask[];

  private constructor() {
    const data = this.load();
    this.users = data.users;
    this.counselors = data.counselors;
    this.clients = data.clients;
    this.appointments = data.appointments;
    this.chatMessages = data.chatMessages;
    this.counselorNotes = data.counselorNotes;
    this.reviews = data.reviews;
    this.packages = data.packages;
    this.packagePurchases = data.packagePurchases;
    this.scheduleExceptions = data.scheduleExceptions;
    this.rescheduleRequests = data.rescheduleRequests;
    this.followUpTasks = data.followUpTasks;
    this.save();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private load(): DatabaseData {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseData;
        if (
          parsed.users &&
          parsed.counselors &&
          parsed.clients &&
          parsed.appointments &&
          parsed.chatMessages &&
          parsed.counselorNotes &&
          parsed.reviews &&
          parsed.packages &&
          parsed.packagePurchases &&
          parsed.scheduleExceptions &&
          parsed.rescheduleRequests &&
          parsed.followUpTasks
        ) {
          const decryptedMessages = parsed.chatMessages.map((msg) => ({
            ...msg,
            content: decryptContent(msg.content),
            contentEncrypted: false,
          }));
          return {
            ...parsed,
            chatMessages: decryptedMessages,
            scheduleExceptions: parsed.scheduleExceptions || [],
            rescheduleRequests: parsed.rescheduleRequests || [],
            followUpTasks: parsed.followUpTasks || [],
          };
        }
      }
    } catch (err) {
      console.error('Failed to load data.json, using mock data instead:', err);
    }
    const initial = getInitialData();
    this.saveInternal(initial);
    return initial;
  }

  private saveInternal(data: DatabaseData): void {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save data.json:', err);
    }
  }

  public save(): void {
    const encryptedMessages = this.chatMessages.map((msg) => ({
      ...msg,
      content: encryptContent(msg.content),
      contentEncrypted: true,
    }));
    const data: DatabaseData = {
      users: this.users,
      counselors: this.counselors,
      clients: this.clients,
      appointments: this.appointments,
      chatMessages: encryptedMessages,
      counselorNotes: this.counselorNotes,
      reviews: this.reviews,
      packages: this.packages,
      packagePurchases: this.packagePurchases,
      scheduleExceptions: this.scheduleExceptions,
      rescheduleRequests: this.rescheduleRequests,
      followUpTasks: this.followUpTasks,
    };
    this.saveInternal(data);
  }

  public reset(): void {
    const initial = getInitialData();
    this.users = initial.users;
    this.counselors = initial.counselors;
    this.clients = initial.clients;
    this.appointments = initial.appointments;
    this.chatMessages = initial.chatMessages;
    this.counselorNotes = initial.counselorNotes;
    this.reviews = initial.reviews;
    this.packages = initial.packages;
    this.packagePurchases = initial.packagePurchases;
    this.scheduleExceptions = initial.scheduleExceptions;
    this.rescheduleRequests = initial.rescheduleRequests;
    this.followUpTasks = initial.followUpTasks;
    this.save();
  }

  // ============ Users ============
  public getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  public addUser(user: User): User {
    this.users.push(user);
    if (user.role === 'counselor') {
      this.counselors.push(user as Counselor);
    } else {
      this.clients.push(user as Client);
    }
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.users[idx] = { ...this.users[idx], ...updates } as User;
    const role = this.users[idx].role;
    if (role === 'counselor') {
      const cIdx = this.counselors.findIndex((c) => c.id === id);
      if (cIdx !== -1) {
        this.counselors[cIdx] = { ...this.counselors[cIdx], ...(updates as Partial<Counselor>) };
      }
    } else {
      const cIdx = this.clients.findIndex((c) => c.id === id);
      if (cIdx !== -1) {
        this.clients[cIdx] = { ...this.clients[cIdx], ...(updates as Partial<Client>) };
      }
    }
    this.save();
    return this.users[idx];
  }

  public deleteUser(id: string): boolean {
    const user = this.getUserById(id);
    if (!user) return false;
    this.users = this.users.filter((u) => u.id !== id);
    this.counselors = this.counselors.filter((c) => c.id !== id);
    this.clients = this.clients.filter((c) => c.id !== id);
    this.save();
    return true;
  }

  // ============ Counselors ============
  public getCounselorById(id: string): Counselor | undefined {
    const counselor = this.counselors.find((c) => c.id === id);
    return counselor ? normalizeCounselorSchedule(counselor) : undefined;
  }

  public listCounselors(): Counselor[] {
    return this.counselors.map(normalizeCounselorSchedule);
  }

  public updateCounselor(id: string, updates: Partial<Counselor>): Counselor | undefined {
    const idx = this.counselors.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    const normalizedUpdates: Partial<Counselor> = { ...updates };
    if (updates.schedule !== undefined) {
      normalizedUpdates.schedule = normalizeWeeklySchedule(updates.schedule);
    }
    this.counselors[idx] = { ...this.counselors[idx], ...normalizedUpdates };
    const uIdx = this.users.findIndex((u) => u.id === id);
    if (uIdx !== -1) {
      this.users[uIdx] = { ...this.users[uIdx], ...(normalizedUpdates as Partial<User>) };
    }
    this.save();
    return normalizeCounselorSchedule(this.counselors[idx]);
  }

  // ============ Clients ============
  public getClientById(id: string): Client | undefined {
    return this.clients.find((c) => c.id === id);
  }

  public listClients(): Client[] {
    return [...this.clients];
  }

  public updateClient(id: string, updates: Partial<Client>): Client | undefined {
    const idx = this.clients.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.clients[idx] = { ...this.clients[idx], ...updates };
    const uIdx = this.users.findIndex((u) => u.id === id);
    if (uIdx !== -1) {
      this.users[uIdx] = { ...this.users[uIdx], ...(updates as Partial<User>) };
    }
    this.save();
    return this.clients[idx];
  }

  // ============ Appointments ============
  public getAppointmentById(id: string): Appointment | undefined {
    return this.appointments.find((a) => a.id === id);
  }

  public listAppointments(filters?: {
    counselorId?: string;
    clientId?: string;
    status?: Appointment['status'];
  }): Appointment[] {
    let result = [...this.appointments];
    if (filters?.counselorId) {
      result = result.filter((a) => a.counselorId === filters.counselorId);
    }
    if (filters?.clientId) {
      result = result.filter((a) => a.clientId === filters.clientId);
    }
    if (filters?.status) {
      result = result.filter((a) => a.status === filters.status);
    }
    return result;
  }

  public addAppointment(appointment: Appointment): Appointment | null {
    const exists = this.appointments.some(
      (a) =>
        a.counselorId === appointment.counselorId &&
        a.date === appointment.date &&
        a.timeSlot === appointment.timeSlot &&
        a.status !== 'cancelled' &&
        a.id !== appointment.id,
    );
    if (exists) {
      return null;
    }
    this.appointments.push(appointment);
    this.save();
    return appointment;
  }

  public updateAppointment(id: string, updates: Partial<Appointment>): Appointment | undefined {
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.appointments[idx] = { ...this.appointments[idx], ...updates };
    this.save();
    return this.appointments[idx];
  }

  public deleteAppointment(id: string): boolean {
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.appointments.splice(idx, 1);
    this.save();
    return true;
  }

  // ============ Chat Messages ============
  public getChatMessageById(id: string): ChatMessage | undefined {
    return this.chatMessages.find((m) => m.id === id);
  }

  public listChatMessages(appointmentId: string): ChatMessage[] {
    return this.chatMessages
      .filter((m) => m.appointmentId === appointmentId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public addChatMessage(message: ChatMessage): ChatMessage {
    this.chatMessages.push(message);
    this.save();
    return message;
  }

  public updateChatMessage(id: string, updates: Partial<ChatMessage>): ChatMessage | undefined {
    const idx = this.chatMessages.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    this.chatMessages[idx] = { ...this.chatMessages[idx], ...updates };
    this.save();
    return this.chatMessages[idx];
  }

  // ============ Counselor Notes ============
  public getCounselorNoteById(id: string): CounselorNote | undefined {
    return this.counselorNotes.find((n) => n.id === id);
  }

  public listCounselorNotes(filters?: {
    counselorId?: string;
    clientId?: string;
  }): CounselorNote[] {
    let result = [...this.counselorNotes];
    if (filters?.counselorId) {
      result = result.filter((n) => n.counselorId === filters.counselorId);
    }
    if (filters?.clientId) {
      result = result.filter((n) => n.clientId === filters.clientId);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addCounselorNote(note: CounselorNote): CounselorNote {
    this.counselorNotes.push(note);
    this.save();
    return note;
  }

  public updateCounselorNote(id: string, updates: Partial<CounselorNote>): CounselorNote | undefined {
    const idx = this.counselorNotes.findIndex((n) => n.id === id);
    if (idx === -1) return undefined;
    this.counselorNotes[idx] = {
      ...this.counselorNotes[idx],
      ...updates,
      updatedAt: updates.updatedAt || new Date().toISOString(),
    };
    this.save();
    return this.counselorNotes[idx];
  }

  public deleteCounselorNote(id: string): boolean {
    const idx = this.counselorNotes.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    this.counselorNotes.splice(idx, 1);
    this.save();
    return true;
  }

  // ============ Reviews ============
  public getReviewById(id: string): Review | undefined {
    return this.reviews.find((r) => r.id === id);
  }

  public listReviews(filters?: {
    counselorId?: string;
    clientId?: string;
    appointmentId?: string;
  }): Review[] {
    let result = [...this.reviews];
    if (filters?.counselorId) {
      result = result.filter((r) => r.counselorId === filters.counselorId);
    }
    if (filters?.clientId) {
      result = result.filter((r) => r.clientId === filters.clientId);
    }
    if (filters?.appointmentId) {
      result = result.filter((r) => r.appointmentId === filters.appointmentId);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getReviewStats(counselorId: string): {
    avgRating: number;
    reviewCount: number;
    distribution: { rating: number; count: number; percentage: number }[];
  } {
    const reviews = this.listReviews({ counselorId });
    const reviewCount = reviews.length;
    const avgRating = reviewCount === 0
      ? 0
      : reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
    const distribution: { rating: number; count: number; percentage: number }[] = [];
    for (let i = 5; i >= 1; i--) {
      const count = reviews.filter((r) => r.rating === i).length;
      const percentage = reviewCount === 0 ? 0 : (count / reviewCount) * 100;
      distribution.push({ rating: i, count, percentage });
    }
    return { avgRating, reviewCount, distribution };
  }

  public addReview(review: Review): Review {
    this.reviews.push(review);
    const stats = this.getReviewStats(review.counselorId);
    this.updateCounselor(review.counselorId, {
      avgRating: stats.avgRating,
      reviewCount: stats.reviewCount,
    });
    this.save();
    return review;
  }

  // ============ Packages ============
  public getPackageById(id: string): Package | undefined {
    return this.packages.find((p) => p.id === id);
  }

  public listPackages(counselorId?: string): Package[] {
    if (counselorId) {
      return this.packages.filter((p) => p.counselorId === counselorId);
    }
    return [...this.packages];
  }

  public addPackage(pkg: Package): Package {
    this.packages.push(pkg);
    this.save();
    return pkg;
  }

  public updatePackage(id: string, updates: Partial<Package>): Package | undefined {
    const idx = this.packages.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.packages[idx] = { ...this.packages[idx], ...updates };
    this.save();
    return this.packages[idx];
  }

  public deletePackage(id: string): boolean {
    const idx = this.packages.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.packages.splice(idx, 1);
    this.save();
    return true;
  }

  // ============ Package Purchases ============
  public getPackagePurchaseById(id: string): PackagePurchase | undefined {
    return this.packagePurchases.find((pp) => pp.id === id);
  }

  public listPackagePurchases(filters?: {
    clientId?: string;
    counselorId?: string;
    packageId?: string;
  }): PackagePurchase[] {
    let result = [...this.packagePurchases];
    if (filters?.clientId) {
      result = result.filter((pp) => pp.clientId === filters.clientId);
    }
    if (filters?.counselorId) {
      result = result.filter((pp) => pp.counselorId === filters.counselorId);
    }
    if (filters?.packageId) {
      result = result.filter((pp) => pp.packageId === filters.packageId);
    }
    return result.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
  }

  public addPackagePurchase(purchase: PackagePurchase): PackagePurchase {
    this.packagePurchases.push(purchase);
    this.save();
    return purchase;
  }

  public updatePackagePurchase(id: string, updates: Partial<PackagePurchase>): PackagePurchase | undefined {
    const idx = this.packagePurchases.findIndex((pp) => pp.id === id);
    if (idx === -1) return undefined;
    this.packagePurchases[idx] = { ...this.packagePurchases[idx], ...updates };
    this.save();
    return this.packagePurchases[idx];
  }

  public consumePackageSession(purchaseId: string): PackagePurchase | undefined {
    const purchase = this.getPackagePurchaseById(purchaseId);
    if (!purchase || purchase.remainingSessions <= 0) return undefined;
    return this.updatePackagePurchase(purchaseId, {
      remainingSessions: purchase.remainingSessions - 1,
    });
  }

  // ============ Schedule Exceptions ============
  public listScheduleExceptions(
    counselorId: string,
    startDate?: string,
    endDate?: string,
  ): ScheduleException[] {
    let result = this.scheduleExceptions.filter((e) => e.counselorId === counselorId);
    if (startDate) {
      result = result.filter((e) => e.date >= startDate);
    }
    if (endDate) {
      result = result.filter((e) => e.date <= endDate);
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  public addScheduleException(exception: ScheduleException): ScheduleException {
    this.scheduleExceptions.push(exception);
    this.save();
    return exception;
  }

  public updateScheduleException(
    id: string,
    updates: Partial<ScheduleException>,
  ): ScheduleException | undefined {
    const idx = this.scheduleExceptions.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    this.scheduleExceptions[idx] = { ...this.scheduleExceptions[idx], ...updates };
    this.save();
    return this.scheduleExceptions[idx];
  }

  public deleteScheduleException(id: string): boolean {
    const idx = this.scheduleExceptions.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.scheduleExceptions.splice(idx, 1);
    this.save();
    return true;
  }

  public getAvailableSlotsForDate(counselorId: string, date: string): TimeSlot[] {
    const counselor = this.getCounselorById(counselorId);
    if (!counselor) {
      return DEFAULT_TIME_SLOTS.map((s) => ({ ...s, available: false }));
    }

    const dateObj = new Date(date);
    const days: (keyof WeeklySchedule)[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const weekday = days[dateObj.getDay()];
    const defaultSlots = counselor.schedule[weekday] || [];

    const exception = this.scheduleExceptions.find(
      (e) => e.counselorId === counselorId && e.date === date,
    );

    if (exception) {
      if (exception.type === 'off') {
        return DEFAULT_TIME_SLOTS.map((s) => ({ ...s, available: false }));
      }
      if (exception.type === 'extra' && exception.timeSlots) {
        const slotMap = new Map<string, boolean>();
        for (const slot of defaultSlots) {
          slotMap.set(slot.start, slot.available);
        }
        for (const slot of exception.timeSlots) {
          slotMap.set(slot.start, true);
        }
        return DEFAULT_TIME_SLOTS.map((defaultSlot) => ({
          start: defaultSlot.start,
          end: defaultSlot.end,
          available: slotMap.get(defaultSlot.start) ?? false,
        }));
      }
    }

    return DEFAULT_TIME_SLOTS.map((defaultSlot) => {
      const existing = defaultSlots.find((s) => s.start === defaultSlot.start);
      return {
        start: defaultSlot.start,
        end: defaultSlot.end,
        available: existing?.available ?? false,
      };
    });
  }

  // ============ Reschedule Requests ============
  public createRescheduleRequest(request: RescheduleRequest): RescheduleRequest {
    this.rescheduleRequests.push(request);
    this.save();
    return request;
  }

  public getRescheduleRequestsForAppointment(appointmentId: string): RescheduleRequest[] {
    return this.rescheduleRequests
      .filter((r) => r.appointmentId === appointmentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getRescheduleRequestsForCounselor(counselorId: string): RescheduleRequest[] {
    return this.rescheduleRequests
      .filter((r) => {
        const appt = this.appointments.find((a) => a.id === r.appointmentId);
        return appt?.counselorId === counselorId;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getRescheduleRequestsForClient(clientId: string): RescheduleRequest[] {
    return this.rescheduleRequests
      .filter((r) => {
        const appt = this.appointments.find((a) => a.id === r.appointmentId);
        return appt?.clientId === clientId;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public updateRescheduleRequest(
    id: string,
    updates: Partial<RescheduleRequest>,
  ): RescheduleRequest | undefined {
    const idx = this.rescheduleRequests.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.rescheduleRequests[idx] = { ...this.rescheduleRequests[idx], ...updates };
    this.save();
    return this.rescheduleRequests[idx];
  }

  public approveReschedule(
    requestId: string,
  ): { oldAppointment: Appointment; newAppointment: Appointment; request: RescheduleRequest } | null {
    const request = this.rescheduleRequests.find((r) => r.id === requestId);
    if (!request) return null;

    const oldAppointment = this.appointments.find((a) => a.id === request.appointmentId);
    if (!oldAppointment) return null;

    const newAppointment: Appointment = {
      ...oldAppointment,
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: request.newDate,
      timeSlot: request.newTimeSlot,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const created = this.addAppointment(newAppointment);
    if (!created) return null;

    this.updateAppointment(oldAppointment.id, { status: 'rescheduled' });

    const updatedRequest = this.updateRescheduleRequest(requestId, {
      status: 'approved',
      decidedAt: new Date().toISOString(),
    });
    if (!updatedRequest) return null;

    return {
      oldAppointment: { ...oldAppointment, status: 'rescheduled' },
      newAppointment: created,
      request: updatedRequest,
    };
  }

  // ============ Follow Up Tasks ============
  public createFollowUpTask(task: FollowUpTask): FollowUpTask {
    this.followUpTasks.push(task);
    this.save();
    return task;
  }

  public getFollowUpsByCounselor(
    counselorId: string,
    status?: FollowUpTask['status'],
  ): FollowUpTask[] {
    let result = this.followUpTasks.filter((t) => t.counselorId === counselorId);
    if (status) {
      result = result.filter((t) => t.status === status);
    }
    return result.sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public getFollowUpsByClient(
    counselorId: string,
    clientId: string,
    status?: FollowUpTask['status'],
  ): FollowUpTask[] {
    let result = this.followUpTasks.filter(
      (t) => t.counselorId === counselorId && t.clientId === clientId,
    );
    if (status) {
      result = result.filter((t) => t.status === status);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public updateFollowUp(
    id: string,
    updates: Partial<FollowUpTask>,
  ): FollowUpTask | undefined {
    const idx = this.followUpTasks.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    this.followUpTasks[idx] = { ...this.followUpTasks[idx], ...updates };
    this.save();
    return this.followUpTasks[idx];
  }

  public completeFollowUp(id: string): FollowUpTask | undefined {
    return this.updateFollowUp(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  }
}

export const db = Database.getInstance();

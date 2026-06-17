import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, FileText, Clock, Plus, Edit2, Save, X, Calendar, CheckCircle, Users, MessageSquare, ChevronDown, AlertTriangle, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecordStore } from '@/store/recordStore';
import { useAppointmentStore } from '@/store/appointmentStore';
import Empty from '@/components/Empty';
import Modal from '@/components/Modal';
import PrivacyBadge from '@/components/PrivacyBadge';
import { AppointmentStatusLabels } from '@shared/types';
import type { CounselorNote, Appointment, AssessmentForm } from '@shared/types';

interface ClientItem {
  id: string;
  anonymousId: string;
  name: string;
  totalSessions: number;
  lastSession: string;
}

type TabKey = 'notes' | 'timeline';

export default function CounselorRecords() {
  const [searchParams] = useSearchParams();
  const urlClientId = searchParams.get('clientId');
  const urlAppointmentId = searchParams.get('appointmentId');
  const urlOpenNote = searchParams.get('openNote') === '1';

  const [selectedClientId, setSelectedClientId] = useState<string | null>(urlClientId || null);
  const [activeTab, setActiveTab] = useState<TabKey>('notes');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CounselorNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteAppointmentId, setNoteAppointmentId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [noteModalOpenedFromUrl, setNoteModalOpenedFromUrl] = useState(false);

  const { notes, loading, fetchNotesByClient, createNote, updateNote } = useRecordStore();
  const { appointments, fetchMyAppointments } = useAppointmentStore();

  const clients: ClientItem[] = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      if (!grouped.has(appt.clientId)) {
        grouped.set(appt.clientId, []);
      }
      grouped.get(appt.clientId)!.push(appt);
    }
    const result: ClientItem[] = [];
    for (const [clientId, appts] of grouped) {
      const sorted = [...appts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      result.push({
        id: clientId,
        name: `来访者${clientId.slice(-3)}`,
        anonymousId: `ANON-${clientId.slice(-6)}`,
        totalSessions: appts.length,
        lastSession: sorted[0]?.date || '',
      });
    }
    return result.sort((a, b) => new Date(b.lastSession).getTime() - new Date(a.lastSession).getTime());
  }, [appointments]);

  useEffect(() => {
    fetchMyAppointments();
  }, [fetchMyAppointments]);

  useEffect(() => {
    if (clients.length > 0 && selectedClientId === null) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (urlClientId && clients.length > 0) {
      const exists = clients.some((c) => c.id === urlClientId);
      if (exists) {
        setSelectedClientId(urlClientId);
      }
    }
  }, [urlClientId, clients]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const clientAppointments = useMemo(
    () => appointments.filter((a) => a.clientId === selectedClientId),
    [appointments, selectedClientId]
  );

  useEffect(() => {
    if (selectedClientId) {
      fetchNotesByClient(selectedClientId);
    }
  }, [selectedClientId, fetchNotesByClient]);

  const sortedClientAppointments = useMemo(
    () =>
      [...clientAppointments].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [clientAppointments]
  );

  useEffect(() => {
    if (urlAppointmentId && sortedClientAppointments.length > 0) {
      const exists = sortedClientAppointments.some((a) => a.id === urlAppointmentId);
      if (exists) {
        setSelectedAppointmentId(urlAppointmentId);
      }
    }
  }, [urlAppointmentId, sortedClientAppointments]);

  useEffect(() => {
    if (urlOpenNote && !noteModalOpenedFromUrl && sortedClientAppointments.length > 0) {
      const apptId = urlAppointmentId || sortedClientAppointments[0]?.id || '';
      if (apptId) {
        setEditingNote(null);
        setNoteContent('');
        setNoteAppointmentId(apptId);
        setNoteModalOpen(true);
        setNoteModalOpenedFromUrl(true);
      }
    }
  }, [urlOpenNote, urlAppointmentId, sortedClientAppointments, noteModalOpenedFromUrl]);

  const selectedAppointment = sortedClientAppointments.find((a) => a.id === selectedAppointmentId);

  const handleOpenNewNote = () => {
    setEditingNote(null);
    setNoteContent('');
    const defaultApptId = selectedAppointmentId || sortedClientAppointments[0]?.id || '';
    setNoteAppointmentId(defaultApptId);
    setNoteModalOpen(true);
  };

  const handleOpenEditNote = (note: CounselorNote) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setNoteAppointmentId(note.appointmentId || '');
    setNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setNoteModalOpen(false);
    setEditingNote(null);
    setNoteContent('');
    setNoteAppointmentId('');
  };

  const handleSaveNote = async () => {
    if (!selectedClientId || !noteContent.trim()) return;
    setSaving(true);
    if (editingNote) {
      await updateNote(editingNote.id, noteContent);
    } else {
      await createNote({
        clientId: selectedClientId,
        appointmentId: noteAppointmentId || undefined,
        content: noteContent,
        tags: ['咨询笔记'],
      });
    }
    setSaving(false);
    const savedApptId = noteAppointmentId;
    handleCloseNoteModal();
    if (savedApptId && !selectedAppointmentId) {
      setSelectedAppointmentId(savedApptId);
    }
  };

  const filteredNotes = useMemo(() => {
    const sorted = [...notes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (selectedAppointmentId) {
      return sorted.filter((n) => n.appointmentId === selectedAppointmentId);
    }
    return sorted;
  }, [notes, selectedAppointmentId]);

  const timelineAppointments = useMemo(() => {
    if (!selectedAppointmentId) {
      return sortedClientAppointments;
    }
    const selected = sortedClientAppointments.find((a) => a.id === selectedAppointmentId);
    const others = sortedClientAppointments.filter((a) => a.id !== selectedAppointmentId);
    return selected ? [selected, ...others] : sortedClientAppointments;
  }, [sortedClientAppointments, selectedAppointmentId]);

  const isNoteAppointmentReadonly = !editingNote && !!noteAppointmentId && (
    urlOpenNote || selectedAppointmentId === noteAppointmentId
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-800">档案管理</h1>
          <p className="mt-1 text-sm text-slate-500">查看来访者档案，记录咨询笔记</p>
        </div>
        <PrivacyBadge />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-4">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="font-serif text-base font-bold text-slate-700">来访者列表</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {clients.length}
              </span>
            </div>

            <div className="space-y-1">
              {clients.length === 0 ? (
                <div className="px-2 py-8 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-500">暂无来访者数据</p>
                  <p className="mt-1 text-xs text-slate-400">完成预约后来访者信息会显示在这里</p>
                </div>
              ) : (
                clients.map((client) => {
                  const selected = client.id === selectedClientId;
                  return (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setSelectedAppointmentId('');
                      }}
                      className={cn(
                        'w-full flex items-start gap-3 rounded-xl p-3 text-left transition-colors',
                        selected
                          ? 'bg-warm-50 shadow-glow'
                          : 'hover:bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                          selected
                            ? 'bg-gradient-to-br from-warm-100 to-warm-200 text-warm-700'
                            : 'bg-slate-100 text-slate-500'
                        )}
                      >
                        {client.anonymousId.slice(-3)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn('font-serif text-sm font-bold truncate', selected ? 'text-warm-800' : 'text-slate-700')}>
                            {client.name}
                          </p>
                          <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', selected ? 'bg-warm-100 text-warm-700' : 'bg-slate-100 text-slate-500')}>
                            {client.totalSessions}次
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-400">{client.anonymousId}</p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar className="h-3 w-3" />
                          最近 {client.lastSession}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-8">
          {selectedClient ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-warm-100 to-warm-200 text-lg font-bold text-warm-700">
                      {selectedClient.anonymousId.slice(-3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg font-bold text-slate-800">{selectedClient.name}</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          {selectedClient.anonymousId}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">匿名来访者 · 信息已加密保护</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center rounded-xl bg-slate-50 px-4 py-3">
                      <p className="font-serif text-2xl font-bold text-warm-600">{selectedClient.totalSessions}</p>
                      <p className="mt-0.5 text-xs text-slate-500">总咨询次数</p>
                    </div>
                    <div className="text-center rounded-xl bg-slate-50 px-4 py-3">
                      <p className="font-serif text-2xl font-bold text-primary-600">
                        {clientAppointments.filter((a) => a.status === 'completed').length}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">已完成</p>
                    </div>
                  </div>
                </div>
              </div>

              {sortedClientAppointments.length > 0 && (
                <div className="rounded-2xl bg-white p-4 shadow-card">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    <Calendar className="mr-1.5 inline h-4 w-4" />
                    按咨询筛选
                  </label>
                  <div className="relative">
                    <select
                      value={selectedAppointmentId}
                      onChange={(e) => setSelectedAppointmentId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none transition-colors focus:border-warm-400 focus:ring-2 focus:ring-warm-100"
                    >
                      <option value="">全部咨询记录</option>
                      {sortedClientAppointments.map((appt) => (
                        <option key={appt.id} value={appt.id}>
                          {appt.date} {appt.timeSlot} · {AppointmentStatusLabels[appt.status]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              )}

              {selectedAppointment && (
                <AppointmentAssessmentCard appointment={selectedAppointment} />
              )}

              <div className="rounded-2xl bg-white p-2 shadow-card">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      activeTab === 'notes'
                        ? 'bg-warm-50 text-warm-700 shadow-glow'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    档案笔记
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                      activeTab === 'notes' ? 'bg-warm-100 text-warm-700' : 'bg-slate-100 text-slate-500'
                    )}>
                      {filteredNotes.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      activeTab === 'timeline'
                        ? 'bg-primary-50 text-primary-700 shadow-glow'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    咨询历程
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                      activeTab === 'timeline' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-500'
                    )}>
                      {sortedClientAppointments.length}
                    </span>
                  </button>
                </div>
              </div>

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      onClick={handleOpenNewNote}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-warm-500 px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-warm-600"
                    >
                      <Plus className="h-4 w-4" />
                      新建笔记
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex h-40 items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-warm-200 border-t-warm-600" />
                    </div>
                  ) : filteredNotes.length === 0 ? (
                    <Empty
                      icon={FileText}
                      title={selectedAppointmentId ? '该次咨询暂无笔记' : '暂无笔记记录'}
                      description={selectedAppointmentId ? '点击「新建笔记」记录本次咨询内容' : '点击「新建笔记」开始记录本次咨询内容'}
                      className="py-12"
                      action={{ label: '新建笔记', onClick: handleOpenNewNote }}
                    />
                  ) : (
                    <div className="space-y-3">
                      {filteredNotes.map((note) => (
                        <div key={note.id} className="rounded-2xl bg-white p-5 shadow-card">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-warm-50 px-2.5 py-0.5 text-xs font-medium text-warm-700">
                                {note.tags?.[0] || '咨询笔记'}
                              </span>
                              {note.appointmentId && (() => {
                                const appt = sortedClientAppointments.find((a) => a.id === note.appointmentId);
                                return appt ? (
                                  <span className="text-xs text-slate-400">
                                    · {appt.date} {appt.timeSlot}
                                  </span>
                                ) : null;
                              })()}
                              <span className="text-xs text-slate-400">
                                创建于 {note.createdAt?.slice(0, 10)} {note.createdAt?.slice(11, 16)}
                              </span>
                              {note.updatedAt !== note.createdAt && (
                                <span className="text-xs text-slate-400">· 已编辑</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleOpenEditNote(note)}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              编辑
                            </button>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                            {note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="rounded-2xl bg-white p-5 shadow-card">
                  {timelineAppointments.length === 0 ? (
                    <Empty
                      icon={Calendar}
                      title="暂无咨询历程"
                      description="与此来访者的咨询记录将显示在这里"
                      className="py-12"
                    />
                  ) : (
                    <div className="relative pl-8">
                      <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-gradient-to-b from-warm-200 via-warm-300 to-transparent" />
                      <div className="space-y-6">
                        {timelineAppointments.map((appt, index) => (
                          <TimelineItem
                            key={appt.id}
                            appointment={appt}
                            isLast={index === timelineAppointments.length - 1}
                            highlighted={appt.id === selectedAppointmentId}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-10 shadow-card">
              <Empty
                icon={Users}
                title="请选择来访者"
                description="从左侧列表选择一位来访者查看详情"
              />
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={noteModalOpen}
        onClose={handleCloseNoteModal}
        title={editingNote ? '编辑笔记' : '新建咨询笔记'}
        confirmText={saving ? '保存中...' : '保存笔记'}
        confirmVariant="warm"
        onConfirm={handleSaveNote}
        className="max-w-xl"
      >
        <div className="space-y-4">
          {selectedClient && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warm-100 text-sm font-bold text-warm-700">
                {selectedClient.anonymousId.slice(-3)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{selectedClient.name}</p>
                <p className="text-xs text-slate-400">{selectedClient.anonymousId}</p>
              </div>
            </div>
          )}

          {!editingNote && sortedClientAppointments.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                关联预约
              </label>
              {isNoteAppointmentReadonly ? (
                <div className="rounded-xl border border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-800">
                  {(() => {
                    const appt = sortedClientAppointments.find((a) => a.id === noteAppointmentId);
                    return appt ? `${appt.date} ${appt.timeSlot} · ${AppointmentStatusLabels[appt.status]}` : '不关联具体预约';
                  })()}
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={noteAppointmentId}
                    onChange={(e) => setNoteAppointmentId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none transition-colors focus:border-warm-400 focus:ring-2 focus:ring-warm-100"
                  >
                    <option value="">不关联具体预约</option>
                    {sortedClientAppointments.map((appt) => (
                      <option key={appt.id} value={appt.id}>
                        {appt.date} {appt.timeSlot} · {AppointmentStatusLabels[appt.status]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              笔记内容 <span className="text-crisis-500">*</span>
            </label>
            <textarea
              rows={8}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="记录咨询过程中的重要内容、来访者状态、干预措施、下次计划等..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 outline-none transition-colors focus:border-warm-400 focus:ring-2 focus:ring-warm-100"
            />
            <p className="mt-2 text-xs text-slate-400">
              当前 {noteContent.length} 字 · 笔记内容仅您可见，已端到端加密存储
            </p>
          </div>

          <div className="rounded-xl bg-safe-50 p-3 text-xs text-safe-700">
            <p className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              所有档案笔记严格遵守心理咨询伦理规范，仅用于专业咨询记录，不会对外披露。
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface AppointmentAssessmentCardProps {
  appointment: Appointment;
}

function AppointmentAssessmentCard({ appointment }: AppointmentAssessmentCardProps) {
  const assessment = appointment.assessmentForm as AssessmentForm | undefined;

  return (
    <div className="space-y-3">
      {appointment.crisisTriggered && (
        <div className="flex items-start gap-3 rounded-xl border border-crisis-200 bg-crisis-500/10 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-crisis-600" />
          <div>
            <p className="font-semibold text-crisis-800">危机预警状态</p>
            <p className="mt-1 text-sm text-crisis-700">
              本次咨询过程中检测到危机关键词，需重点关注来访者状态。
            </p>
          </div>
        </div>
      )}

      {assessment && (
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary-600" />
            <h4 className="font-serif text-base font-bold text-slate-800">评估摘要</h4>
            <span className="text-xs text-slate-400">
              {new Date(assessment.submittedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { label: '情绪状态', value: `${assessment.emotionalState}/10`, crisis: false },
              { label: '压力程度', value: `${assessment.stressLevel}/10`, crisis: false },
              { label: '睡眠质量', value: `${assessment.sleepQuality}/10`, crisis: false },
              { label: '持续时间', value: `${assessment.durationMonths}个月`, crisis: false },
              { label: '自杀意念', value: assessment.suicidalIdeation ? '有' : '无', crisis: assessment.suicidalIdeation },
              { label: '自残想法', value: assessment.selfHarmThoughts ? '有' : '无', crisis: assessment.selfHarmThoughts },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  'rounded-lg px-3 py-2',
                  item.crisis ? 'bg-crisis-500/10 border border-crisis-200' : 'bg-slate-50'
                )}
              >
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className={cn(
                  'text-sm font-medium',
                  item.crisis ? 'text-crisis-700' : 'text-slate-700'
                )}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-slate-100 p-3">
            <p className="mb-1 text-xs font-medium text-slate-500">主要困扰</p>
            <p className="text-sm text-slate-700">{assessment.mainConcern}</p>
          </div>

          {assessment.additionalNotes && (
            <div className="mt-2 rounded-lg border border-slate-100 p-3">
              <p className="mb-1 text-xs font-medium text-slate-500">补充说明</p>
              <p className="text-sm text-slate-700">{assessment.additionalNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TimelineItemProps {
  appointment: Appointment;
  isLast: boolean;
  highlighted?: boolean;
}

function TimelineItem({ appointment, isLast, highlighted }: TimelineItemProps) {
  const statusColors: Record<string, string> = {
    completed: 'bg-safe-500 ring-safe-100',
    confirmed: 'bg-primary-500 ring-primary-100',
    in_progress: 'bg-warm-500 ring-warm-100',
    pending: 'bg-amber-500 ring-amber-100',
    cancelled: 'bg-slate-300 ring-slate-100',
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'absolute -left-[22px] top-1.5 h-4 w-4 rounded-full ring-4',
          statusColors[appointment.status] || 'bg-slate-400 ring-slate-100'
        )}
      />
      <div
        className={cn(
          'rounded-xl border p-4 transition-colors',
          highlighted
            ? 'bg-warm-50 border-warm-300 shadow-glow ring-2 ring-warm-200'
            : appointment.status === 'completed'
            ? 'bg-safe-50/30 border-safe-100'
            : appointment.status === 'cancelled'
            ? 'bg-slate-50 border-slate-100 opacity-60'
            : 'bg-white border-slate-200'
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">{appointment.date}</span>
              <span className="text-sm text-slate-400">{appointment.timeSlot}</span>
              {highlighted && (
                <span className="rounded-full bg-warm-200 px-2 py-0.5 text-[10px] font-semibold text-warm-800">
                  当前筛选
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <MessageSquare className="h-3 w-3" />
              预约 #{appointment.id.slice(-6)}
            </div>
            {appointment.crisisTriggered && (
              <div className="mt-2 flex items-center gap-1 text-[11px] text-crisis-600">
                <AlertTriangle className="h-3 w-3" />
                危机标记
              </div>
            )}
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
              appointment.status === 'completed'
                ? 'bg-safe-100 text-safe-700'
                : appointment.status === 'confirmed'
                ? 'bg-primary-100 text-primary-700'
                : appointment.status === 'in_progress'
                ? 'bg-warm-100 text-warm-700'
                : appointment.status === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-500'
            )}
          >
            {AppointmentStatusLabels[appointment.status]}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span>¥{appointment.price}</span>
          {appointment.packageUsageId && <span>使用课程包</span>}
        </div>
      </div>
    </div>
  );
}

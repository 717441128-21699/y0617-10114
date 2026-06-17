import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Lock,
  Send,
  Smile,
  Paperclip,
  Mic,
  Video,
  PanelRightOpen,
  PanelRightClose,
  PhoneOff,
  Clock,
  Phone,
  MessageSquare,
  AlertTriangle,
  FileText,
  Heart,
  User,
  Save,
} from 'lucide-react';
import { useSessionStore } from '@/store/sessionStore';
import { useAppointmentStore } from '@/store/appointmentStore';
import { useRecordStore } from '@/store/recordStore';
import { useAuthStore } from '@/store/authStore';
import { useCounselorStore } from '@/store/counselorStore';
import CrisisAlert from '@/components/CrisisAlert';
import PrivacyBadge from '@/components/PrivacyBadge';
import Modal from '@/components/Modal';
import { ServiceModeLabels, AppointmentStatusLabels, type ServiceMode, type ChatMessage } from '@shared/types';
import { cn } from '@/lib/utils';

const ServiceIcon: Record<ServiceMode, typeof MessageSquare> = {
  text: MessageSquare,
  voice: Phone,
  video: Video,
};

export default function Session() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const { messages, crisisActive, matchedKeywords, fetchMessages, sendMessage, pollMessages, clearSession } =
    useSessionStore();
  const { appointments, fetchMyAppointments, updateStatus } = useAppointmentStore();
  const { createNote } = useRecordStore();
  const { user } = useAuthStore();
  const { counselors } = useCounselorStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [crisisAlertDismissed, setCrisisAlertDismissed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const appointment = appointments.find((a) => a.id === appointmentId);

  const isCounselor = user?.role === 'counselor';

  const otherPartyName = appointment
    ? isCounselor
      ? appointment.clientName || '来访者'
      : appointment.counselorName || '咨询师'
    : '加载中...';

  const otherPartyAvatar = appointment?.counselorId
    ? counselors.find((c) => c.id === appointment.counselorId)?.avatar
    : undefined;

  const appointmentAssessment = appointment?.assessmentForm;

  useEffect(() => {
    if (appointmentId) {
      fetchMyAppointments();
      fetchMessages(appointmentId);
    }
    return () => {
      clearSession();
    };
  }, [appointmentId, fetchMyAppointments, fetchMessages, clearSession]);

  useEffect(() => {
    if (appointmentId && appointment?.status === 'in_progress') {
      pollMessages(appointmentId, 2000);
    }
  }, [appointmentId, appointment?.status, pollMessages]);

  useEffect(() => {
    if (appointment?.status === 'in_progress') {
      const timer = setInterval(() => {
        setElapsedTime((t) => t + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [appointment?.status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [inputValue]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !appointmentId) return;
    const content = inputValue.trim();
    setInputValue('');
    await sendMessage(appointmentId, content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !appointment) return;
    setSavingNote(true);
    await createNote({
      clientId: appointment.clientId,
      appointmentId: appointment.id,
      content: noteContent.trim(),
      tags: [],
    });
    setSavingNote(false);
    setNoteContent('');
  };

  const handleEndSession = async () => {
    if (!appointmentId) return;
    setEndingSession(true);
    const success = await updateStatus(appointmentId, 'completed');
    setEndingSession(false);
    setEndModalOpen(false);
    if (success && appointment) {
      if (isCounselor) {
        navigate(`/counselor/records?clientId=${appointment.clientId}&appointmentId=${appointmentId}&openNote=1`);
      } else {
        navigate('/client/reviews', { state: { appointmentId, openReview: true } });
      }
    }
  };

  const handleCrisisConfirm = () => {
    setCrisisAlertDismissed(true);
  };

  const assessmentSummary = appointmentAssessment
    ? [
        { label: '情绪状态', value: appointmentAssessment.emotionalState + '/10' },
        { label: '压力程度', value: appointmentAssessment.stressLevel + '/10' },
        { label: '睡眠质量', value: appointmentAssessment.sleepQuality + '/10' },
        { label: '持续时间', value: appointmentAssessment.durationMonths + '个月' },
        { label: '接受过咨询', value: appointmentAssessment.previousTherapy ? '是' : '否' },
        { label: '自杀意念', value: appointmentAssessment.suicidalIdeation ? '有' : '无' },
        { label: '自残想法', value: appointmentAssessment.selfHarmThoughts ? '有' : '无' },
      ]
    : [];

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {crisisActive && !crisisAlertDismissed && user && (
        <div className="z-30 w-full">
          <CrisisAlert
            keywords={matchedKeywords}
            onConfirm={handleCrisisConfirm}
            userRole={user.role}
          />
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            {otherPartyAvatar ? (
              <img
                src={otherPartyAvatar}
                alt={otherPartyName}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-sm font-bold text-primary-700">
                {otherPartyName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-semibold text-slate-800">{otherPartyName}</h2>
                {appointment?.serviceMode && (
                  <span className="badge shrink-0 bg-primary-100 text-primary-700">
                    {(() => {
                      const Icon = ServiceIcon[appointment.serviceMode];
                      return <Icon className="h-3 w-3" />;
                    })()}
                    {ServiceModeLabels[appointment.serviceMode]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {appointment?.status === 'in_progress' ? (
              <div className="flex items-center gap-2 rounded-full bg-safe-50 px-4 py-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-safe-500" />
                <span className="text-sm font-medium text-safe-700">进行中</span>
                <Clock className="h-3.5 w-3.5 text-safe-600" />
                <span className="font-mono text-sm font-semibold text-safe-800">
                  {formatTime(elapsedTime)}
                </span>
              </div>
            ) : appointment?.status ? (
              <span className="badge bg-slate-100 text-slate-600">
                {AppointmentStatusLabels[appointment.status]}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <PrivacyBadge variant="subtle" className="hidden sm:flex" />

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              title={sidebarOpen ? '收起边栏' : '展开边栏'}
            >
              {sidebarOpen ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRightOpen className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={() => setEndModalOpen(true)}
              className="btn-danger !py-2 !px-3"
              title="结束咨询"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="hidden sm:inline">结束咨询</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div
          className={cn(
            'flex flex-1 flex-col transition-all duration-300',
            sidebarOpen && 'lg:mr-80'
          )}
        >
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50">
                    <MessageSquare className="h-8 w-8 text-primary-400" />
                  </div>
                  <h3 className="mb-2 font-serif text-lg font-semibold text-slate-700">
                    咨询会话已开始
                  </h3>
                  <p className="max-w-sm text-sm text-slate-500">
                    {isCounselor
                      ? '请先了解来访者的情况，建立信任关系，逐步引导来访者表达内心感受。'
                      : '请放心，所有对话内容均采用端到端加密保护。您可以从描述当前的感受开始。'}
                  </p>
                </div>
              ) : (
                messages.map((msg: ChatMessage) => {
                  const isOwn = msg.senderRole === user?.role;
                  const hasCrisis = msg.crisisFlags && msg.crisisFlags.length > 0;
                  return (
                    <div
                      key={msg.id}
                      className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-3',
                          isOwn
                            ? 'bg-primary-700 text-white'
                            : 'bg-slate-100 text-slate-800',
                          hasCrisis && 'border-l-4 border-crisis-500'
                        )}
                      >
                        {hasCrisis && (
                          <div
                            className={cn(
                              'mb-2 flex items-center gap-1 text-xs',
                              isOwn ? 'text-crisis-200' : 'text-crisis-600'
                            )}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            <span>检测到敏感关键词</span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {msg.content}
                        </p>
                        <div
                          className={cn(
                            'mt-2 flex items-center justify-end gap-2 text-xs',
                            isOwn ? 'text-primary-200' : 'text-slate-400'
                          )}
                        >
                          {msg.contentEncrypted && <Lock className="h-3 w-3" />}
                          <span>{formatMessageTime(msg.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-4">
            <div className="mx-auto max-w-3xl">
              <div className="mb-2 flex items-center gap-1">
                <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <Smile className="h-5 w-5" />
                </button>
                <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <Paperclip className="h-5 w-5" />
                </button>
                <button
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  title="语音通话"
                >
                  <Mic className="h-5 w-5" />
                </button>
                <button
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  title="视频通话"
                >
                  <Video className="h-5 w-5" />
                </button>
                <div className="ml-auto">
                  <PrivacyBadge variant="subtle" />
                </div>
              </div>

              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isCounselor ? '输入您的回复...（Enter 发送，Shift+Enter 换行）' : '描述您的感受...（Enter 发送，Shift+Enter 换行）'}
                  rows={1}
                  className="input-field resize-none pr-4"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="btn-primary !h-11 !px-4 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {sidebarOpen && (
          <aside className="fixed right-0 top-16 z-10 hidden h-[calc(100vh-4rem)] w-80 flex-col border-l border-slate-200 bg-white lg:flex">
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
              {isCounselor ? (
                <div className="space-y-5">
                  <div className="card p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                      <User className="h-4 w-4 text-primary-600" />
                      匿名评估摘要
                    </h3>
                    {appointmentAssessment ? (
                      <div className="space-y-2">
                        {assessmentSummary.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                          >
                            <span className="text-xs text-slate-500">{item.label}</span>
                            <span
                              className={cn(
                                'text-sm font-medium',
                                (item.label === '自杀意念' || item.label === '自残想法') &&
                                  item.value === '有'
                                  ? 'text-crisis-600'
                                  : 'text-slate-700'
                              )}
                            >
                              {item.value}
                            </span>
                          </div>
                        ))}
                        <div className="mt-3 rounded-lg border border-slate-100 p-3">
                          <p className="mb-1 text-xs font-medium text-slate-500">主要困扰</p>
                          <p className="text-sm text-slate-700">
                            {appointmentAssessment.mainConcern}
                          </p>
                        </div>
                        {appointmentAssessment.additionalNotes && (
                          <div className="rounded-lg border border-slate-100 p-3">
                            <p className="mb-1 text-xs font-medium text-slate-500">补充说明</p>
                            <p className="text-sm text-slate-700">
                              {appointmentAssessment.additionalNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-sm text-slate-400">
                        该来访者未提交评估问卷
                      </p>
                    )}
                  </div>

                  <div className="card p-4">
                    <h3 className="mb-3 flex items-center justify-between font-semibold text-slate-800">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary-600" />
                        档案笔记
                      </span>
                      {noteContent.trim() && (
                        <button
                          onClick={handleSaveNote}
                          disabled={savingNote}
                          className="text-xs font-medium text-primary-600 hover:text-primary-700"
                        >
                          {savingNote ? '保存中...' : (
                            <>
                              <Save className="mr-1 inline h-3 w-3" />
                              保存
                            </>
                          )}
                        </button>
                      )}
                    </h3>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="记录咨询过程中的观察、诊断要点、干预方案等..."
                      rows={6}
                      className="input-field resize-none text-sm"
                    />
                  </div>

                  {matchedKeywords.length > 0 && (
                    <div className="card p-4">
                      <h3 className="mb-3 flex items-center gap-2 font-semibold text-crisis-700">
                        <AlertTriangle className="h-4 w-4" />
                        危机标记历史
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedKeywords.map((k) => (
                          <span
                            key={k}
                            className="badge bg-crisis-100 text-crisis-700"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="card p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                      <Heart className="h-4 w-4 text-warm-500" />
                      服务说明
                    </h3>
                    <div className="space-y-3 text-sm text-slate-600">
                      <p>
                        您正在与持证心理咨询师进行一对一咨询。咨询师会严格遵守保密原则，
                        为您提供专业的心理支持。
                      </p>
                      <p>
                        每次咨询时长约 50 分钟，请您提前安排好时间，选择安静私密的环境进行咨询。
                      </p>
                      <p className="text-xs text-slate-400">
                        咨询结束后，您可以对本次咨询进行评价，帮助我们改进服务质量。
                      </p>
                    </div>
                  </div>

                  <div className="card p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-crisis-700">
                      <Phone className="h-4 w-4" />
                      心理援助热线
                    </h3>
                    <div className="space-y-3">
                      <a
                        href="tel:400-161-9995"
                        className="flex items-center justify-between rounded-xl bg-crisis-50 px-4 py-3 transition-colors hover:bg-crisis-100"
                      >
                        <div>
                          <p className="text-sm font-semibold text-crisis-800">
                            全国心理援助热线
                          </p>
                          <p className="text-xs text-crisis-600">24小时服务</p>
                        </div>
                        <span className="font-mono text-lg font-bold text-crisis-700">
                          400-161-9995
                        </span>
                      </a>
                      <a
                        href="tel:12320-5"
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            卫生部心理援助热线
                          </p>
                          <p className="text-xs text-slate-500">工作日服务</p>
                        </div>
                        <span className="font-mono text-lg font-bold text-slate-700">
                          12320-5
                        </span>
                      </a>
                      <a
                        href="tel:010-82951332"
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            北京心理危机研究中心
                          </p>
                          <p className="text-xs text-slate-500">24小时服务</p>
                        </div>
                        <span className="font-mono text-lg font-bold text-slate-700">
                          010-82951332
                        </span>
                      </a>
                    </div>
                  </div>

                  <div className="rounded-xl border border-safe-200 bg-safe-50/50 p-4">
                    <PrivacyBadge />
                    <p className="mt-2 text-xs leading-relaxed text-safe-700">
                      您的所有对话内容均采用端到端加密技术保护，平台无法查看您与咨询师的具体对话。
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      <Modal
        isOpen={endModalOpen}
        onClose={() => !endingSession && setEndModalOpen(false)}
        title="确认结束咨询"
        onConfirm={handleEndSession}
        confirmText={endingSession ? '处理中...' : '确认结束'}
        cancelText="继续咨询"
        confirmVariant="danger"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            {isCounselor
              ? '确定要结束本次咨询吗？结束后将无法继续发送消息，请确认咨询目标已经完成或与来访者做好结束安排。'
              : '确定要结束本次咨询吗？结束后您将被引导至评价页面，对本次服务进行反馈。'}
          </p>
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <div className="mb-2 flex justify-between">
              <span className="text-slate-500">咨询时长</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatTime(elapsedTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">消息数量</span>
              <span className="font-semibold text-slate-800">{messages.length} 条</span>
            </div>
          </div>
          {isCounselor && (
            <p className="text-xs text-crisis-600">
              提示：结束后请在档案管理中完善本次咨询的咨询记录。
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

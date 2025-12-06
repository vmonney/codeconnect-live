import { create } from 'zustand';
import {
  Interview,
  InterviewStatus,
  ProgrammingLanguage,
  ChatMessage,
  Participant,
  InterviewInvitation,
  CodeExecution,
} from '@/types';
import { httpClient } from '@/api/httpClient';
import { createInterviewWebSocket, sendWebSocketMessage } from '@/api/websocketClient';
import {
  BackendInterview,
  BackendInterviewStats,
  BackendChatMessage,
  BackendInvitation,
  BackendParticipant,
  CodeExecuteResponse,
  ApiError,
  InterviewCreateRequest,
  InterviewUpdateRequest,
  WebSocketMessage,
} from '@/api/types';
import { executeCodeWasm, isWasmSupported } from '@/services/codeExecutor';
import type { ExecutionStatus } from '@/services/executionTypes';

interface InterviewState {
  interviews: Interview[];
  currentInterview: Interview | null;
  invitations: InterviewInvitation[];
  chatMessages: ChatMessage[];
  participants: Participant[];
  isTyping: { [userId: string]: boolean };
  isLoading: boolean;
  error: string | null;
  wsConnection: WebSocket | null;
  pyodideInitStatus: ExecutionStatus;

  // REST API Actions
  fetchInterviews: (filters?: { role?: 'interviewer' | 'candidate'; status?: InterviewStatus }) => Promise<void>;
  fetchInterview: (id: string) => Promise<Interview | null>;
  createInterview: (
    title: string,
    language: ProgrammingLanguage,
    interviewerId: string,
    interviewerName: string,
    templateId?: string,
    description?: string,
    scheduledAt?: string
  ) => Promise<Interview | null>;
  updateInterview: (id: string, updates: Partial<Interview>) => Promise<{ success: boolean; error?: string }>;
  deleteInterview: (id: string) => Promise<{ success: boolean; error?: string }>;
  fetchMessages: (interviewId: string) => Promise<void>;

  // Local state actions
  getInterviewById: (id: string) => Interview | undefined;
  getInterviewsByUser: (userId: string, role: 'interviewer' | 'candidate') => Interview[];
  setCurrentInterview: (interview: Interview | null) => void;

  // WebSocket actions
  connectToInterview: (interviewId: string) => void;
  disconnectFromInterview: () => void;
  sendCodeUpdate: (code: string) => void;
  sendCursorUpdate: (position: { line: number; column: number }) => void;
  sendChatMessage: (message: string) => void;
  sendTypingIndicator: (isTyping: boolean) => void;
  sendLanguageChange: (language: ProgrammingLanguage) => void;
  sendInterviewStatus: (status: InterviewStatus) => void;

  // Legacy local actions (for backwards compatibility during transition)
  joinInterview: (interviewId: string, participant: Participant) => void;
  leaveInterview: (interviewId: string, participantId: string) => void;
  updateCode: (interviewId: string, code: string) => void;
  updateCursorPosition: (interviewId: string, participantId: string, line: number, column: number) => void;
  sendMessage: (interviewId: string, userId: string, userName: string, message: string) => void;
  setTyping: (userId: string, isTyping: boolean) => void;

  // Invitations
  fetchInvitations: (status?: 'pending' | 'accepted' | 'declined') => Promise<void>;
  createInvitation: (interviewId: string, candidateId?: string, candidateEmail?: string) => Promise<{ success: boolean; error?: string }>;
  getInvitationsByUser: (userId: string) => InterviewInvitation[];
  updateInvitation: (id: string, status: 'accepted' | 'declined') => Promise<{ success: boolean; error?: string }>;

  // Code execution
  executeCode: (code: string, language: ProgrammingLanguage) => Promise<CodeExecution>;
  getPyodideStatus: () => ExecutionStatus;

  // Stats
  getInterviewerStats: (userId: string) => Promise<{ total: number; avgDuration: number; completed: number }>;
}

// Transform backend interview format to frontend Interview type
function transformInterview(backend: BackendInterview): Interview {
  return {
    id: backend.id,
    title: backend.title,
    description: backend.description ?? undefined,
    interviewerId: backend.interviewer_id,
    interviewerName: backend.interviewer_name,
    candidateId: backend.candidate_id ?? undefined,
    candidateName: backend.candidate_name ?? undefined,
    status: backend.status,
    scheduledAt: backend.scheduled_at ?? undefined,
    startedAt: backend.started_at ?? undefined,
    endedAt: backend.ended_at ?? undefined,
    duration: backend.duration ?? undefined,
    language: backend.language,
    templateId: backend.template_id ?? undefined,
    code: backend.code,
    rating: backend.rating ?? undefined,
    notes: backend.notes ?? undefined,
    shareLink: backend.share_link,
  };
}

// Transform backend chat message to frontend format
function transformChatMessage(backend: BackendChatMessage): ChatMessage {
  return {
    id: backend.id,
    interviewId: backend.interview_id,
    userId: backend.user_id,
    userName: backend.user_name,
    message: backend.message,
    timestamp: backend.timestamp,
  };
}

// Transform backend invitation to frontend format
function transformInvitation(backend: BackendInvitation): InterviewInvitation {
  return {
    id: backend.id,
    interviewId: backend.interview_id,
    interviewTitle: backend.interview_title,
    interviewerName: backend.interviewer_name,
    scheduledAt: backend.scheduled_at ?? undefined,
    status: backend.status,
    createdAt: backend.created_at,
  };
}

// Transform backend participant to frontend format
function transformParticipant(backend: BackendParticipant): Participant {
  return {
    id: backend.id,
    name: backend.name,
    role: backend.role,
    avatar: backend.avatar ?? undefined,
    isOnline: backend.isOnline,
    cursorColor: backend.cursorColor,
  };
}

const CURSOR_COLORS = ['#00d9ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

function getStarterCode(language: ProgrammingLanguage): string {
  const starters: Record<ProgrammingLanguage, string> = {
    javascript: `// Welcome to CodeView Interview Platform
// Write your solution below

function solution(input) {
  // Your code here
  return input;
}

// Test your solution
console.log(solution("Hello, World!"));
`,
    python: `# Welcome to CodeView Interview Platform
# Write your solution below

def solution(input):
    # Your code here
    return input

# Test your solution
print(solution("Hello, World!"))
`,
  };

  return starters[language];
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  interviews: [],
  currentInterview: null,
  invitations: [],
  chatMessages: [],
  participants: [],
  isTyping: {},
  isLoading: false,
  error: null,
  wsConnection: null,
  pyodideInitStatus: 'idle',

  // REST API Actions
  fetchInterviews: async (filters) => {
    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams();
      if (filters?.role) params.append('role', filters.role);
      if (filters?.status) params.append('status', filters.status);

      const queryString = params.toString();
      const endpoint = `/interviews${queryString ? `?${queryString}` : ''}`;

      const response = await httpClient.get<BackendInterview[]>(endpoint);
      set({
        interviews: response.map(transformInterview),
        isLoading: false,
      });
    } catch (error) {
      const apiError = error as ApiError;
      set({ error: apiError.detail, isLoading: false });
    }
  },

  fetchInterview: async (id) => {
    try {
      const response = await httpClient.get<BackendInterview>(`/interviews/${id}`);
      const interview = transformInterview(response);

      set((state) => {
        const exists = state.interviews.some((i) => i.id === id);
        return {
          currentInterview: interview,
          interviews: exists
            ? state.interviews.map((i) => (i.id === id ? interview : i))
            : [...state.interviews, interview],
        };
      });

      return interview;
    } catch {
      return null;
    }
  },

  createInterview: async (title, language, interviewerId, interviewerName, templateId, description, scheduledAt) => {
    set({ isLoading: true, error: null });

    try {
      const request: InterviewCreateRequest = {
        title,
        language,
        description,
        template_id: templateId,
        scheduled_at: scheduledAt,
      };

      const response = await httpClient.post<BackendInterview>('/interviews', request);
      const interview = transformInterview(response);

      set((state) => ({
        interviews: [...state.interviews, interview],
        isLoading: false,
      }));

      return interview;
    } catch (error) {
      const apiError = error as ApiError;
      set({ error: apiError.detail, isLoading: false });
      return null;
    }
  },

  updateInterview: async (id, updates) => {
    try {
      const backendUpdates: InterviewUpdateRequest = {};
      if (updates.title !== undefined) backendUpdates.title = updates.title;
      if (updates.description !== undefined) backendUpdates.description = updates.description;
      if (updates.status !== undefined) backendUpdates.status = updates.status;
      if (updates.candidateId !== undefined) backendUpdates.candidate_id = updates.candidateId;
      if (updates.candidateName !== undefined) backendUpdates.candidate_name = updates.candidateName;
      if (updates.language !== undefined) backendUpdates.language = updates.language;
      if (updates.code !== undefined) backendUpdates.code = updates.code;
      if (updates.rating !== undefined) backendUpdates.rating = updates.rating;
      if (updates.notes !== undefined) backendUpdates.notes = updates.notes;
      if (updates.startedAt !== undefined) backendUpdates.started_at = updates.startedAt;
      if (updates.endedAt !== undefined) backendUpdates.ended_at = updates.endedAt;
      if (updates.duration !== undefined) backendUpdates.duration = updates.duration;

      const response = await httpClient.patch<BackendInterview>(`/interviews/${id}`, backendUpdates);
      const interview = transformInterview(response);

      set((state) => ({
        interviews: state.interviews.map((i) => (i.id === id ? interview : i)),
        currentInterview: state.currentInterview?.id === id ? interview : state.currentInterview,
      }));

      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return { success: false, error: apiError.detail };
    }
  },

  deleteInterview: async (id) => {
    try {
      await httpClient.delete(`/interviews/${id}`);

      set((state) => ({
        interviews: state.interviews.filter((i) => i.id !== id),
        currentInterview: state.currentInterview?.id === id ? null : state.currentInterview,
      }));

      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return { success: false, error: apiError.detail };
    }
  },

  fetchMessages: async (interviewId) => {
    try {
      const response = await httpClient.get<BackendChatMessage[]>(`/interviews/${interviewId}/messages`);
      set({ chatMessages: response.map(transformChatMessage) });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  },

  // Local state actions
  getInterviewById: (id) => {
    return get().interviews.find((i) => i.id === id);
  },

  getInterviewsByUser: (userId, role) => {
    const { interviews } = get();
    if (role === 'interviewer') {
      return interviews.filter((i) => i.interviewerId === userId);
    }
    return interviews.filter((i) => i.candidateId === userId);
  },

  setCurrentInterview: (interview) => {
    set({ currentInterview: interview });
  },

  // WebSocket actions
  connectToInterview: (interviewId) => {
    const { wsConnection } = get();

    // Close existing connection
    if (wsConnection) {
      wsConnection.close();
    }

    const ws = createInterviewWebSocket(interviewId, {
      onMessage: (message: WebSocketMessage) => {
        switch (message.type) {
          case 'code_update':
            set((state) => ({
              currentInterview: state.currentInterview
                ? { ...state.currentInterview, code: message.code as string }
                : null,
            }));
            break;

          case 'cursor_update':
            set((state) => ({
              participants: state.participants.map((p) =>
                p.id === message.user_id
                  ? { ...p, cursorPosition: message.position as { line: number; column: number } }
                  : p
              ),
            }));
            break;

          case 'chat_message': {
            const chatMsg: ChatMessage = {
              id: message.id as string,
              interviewId,
              userId: message.user_id as string,
              userName: message.user_name as string,
              message: message.message as string,
              timestamp: message.timestamp as string,
            };
            set((state) => ({
              chatMessages: [...state.chatMessages, chatMsg],
            }));
            break;
          }

          case 'typing':
            set((state) => ({
              isTyping: {
                ...state.isTyping,
                [message.user_id as string]: message.is_typing as boolean,
              },
            }));
            break;

          case 'language_change':
            set((state) => ({
              currentInterview: state.currentInterview
                ? { ...state.currentInterview, language: message.language as ProgrammingLanguage }
                : null,
            }));
            break;

          case 'interview_status':
            set((state) => ({
              currentInterview: state.currentInterview
                ? { ...state.currentInterview, status: message.status as InterviewStatus }
                : null,
            }));
            break;

          case 'participant_joined': {
            const newParticipant = transformParticipant(message.participant as BackendParticipant);
            set((state) => ({
              participants: [...state.participants.filter((p) => p.id !== newParticipant.id), newParticipant],
            }));
            break;
          }

          case 'participant_left':
            set((state) => ({
              participants: state.participants.filter((p) => p.id !== message.user_id),
            }));
            break;

          case 'participants_list': {
            const participants = (message.participants as BackendParticipant[]).map(transformParticipant);
            set({ participants });
            break;
          }
        }
      },
      onConnect: () => set({ error: null }),
      onDisconnect: () => set({ wsConnection: null }),
      onError: () => set({ error: 'WebSocket connection failed' }),
    });

    set({ wsConnection: ws });

    // Fetch existing messages from backend
    get().fetchMessages(interviewId);
  },

  disconnectFromInterview: () => {
    const { wsConnection } = get();
    wsConnection?.close();
    // Don't clear chat messages - they should persist even after disconnect
    set({ wsConnection: null, participants: [] });
  },

  sendCodeUpdate: (code) => {
    const { wsConnection } = get();
    sendWebSocketMessage(wsConnection, 'code_update', { code });
  },

  sendCursorUpdate: (position) => {
    const { wsConnection } = get();
    sendWebSocketMessage(wsConnection, 'cursor_update', { position });
  },

  sendChatMessage: (message) => {
    const { wsConnection } = get();
    sendWebSocketMessage(wsConnection, 'chat_message', { message });
  },

  sendTypingIndicator: (isTyping) => {
    const { wsConnection } = get();
    sendWebSocketMessage(wsConnection, 'typing', { is_typing: isTyping });
  },

  sendLanguageChange: (language) => {
    const { wsConnection } = get();
    sendWebSocketMessage(wsConnection, 'language_change', { language });
  },

  sendInterviewStatus: (status) => {
    const { wsConnection } = get();
    sendWebSocketMessage(wsConnection, 'interview_status', { status });
  },

  // Legacy local actions (for backwards compatibility)
  joinInterview: (interviewId, participant) => {
    const colorIndex = get().participants.length % CURSOR_COLORS.length;
    const participantWithColor = { ...participant, cursorColor: CURSOR_COLORS[colorIndex] };

    set((state) => ({
      participants: [...state.participants.filter((p) => p.id !== participant.id), participantWithColor],
    }));
  },

  leaveInterview: (interviewId, participantId) => {
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== participantId),
    }));
  },

  updateCode: (interviewId, code) => {
    set((state) => ({
      interviews: state.interviews.map((i) => (i.id === interviewId ? { ...i, code } : i)),
      currentInterview:
        state.currentInterview?.id === interviewId ? { ...state.currentInterview, code } : state.currentInterview,
    }));

    // Also send via WebSocket if connected
    const { wsConnection } = get();
    if (wsConnection) {
      sendWebSocketMessage(wsConnection, 'code_update', { code });
    }
  },

  updateCursorPosition: (interviewId, participantId, line, column) => {
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === participantId ? { ...p, cursorPosition: { line, column } } : p
      ),
    }));

    // Also send via WebSocket if connected
    const { wsConnection } = get();
    if (wsConnection) {
      sendWebSocketMessage(wsConnection, 'cursor_update', { position: { line, column } });
    }
  },

  sendMessage: (interviewId, userId, userName, message) => {
    // Send via WebSocket if connected
    const { wsConnection } = get();
    if (wsConnection) {
      sendWebSocketMessage(wsConnection, 'chat_message', { message });
    } else {
      // Fallback to local state for offline mode
      const chatMessage: ChatMessage = {
        id: crypto.randomUUID(),
        interviewId,
        userId,
        userName,
        message,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, chatMessage],
      }));
    }
  },

  setTyping: (userId, isTyping) => {
    set((state) => ({
      isTyping: { ...state.isTyping, [userId]: isTyping },
    }));

    // Also send via WebSocket if connected
    const { wsConnection } = get();
    if (wsConnection) {
      sendWebSocketMessage(wsConnection, 'typing', { is_typing: isTyping });
    }
  },

  // Invitations
  fetchInvitations: async (status) => {
    try {
      const endpoint = status ? `/invitations?status=${status}` : '/invitations';
      const response = await httpClient.get<BackendInvitation[]>(endpoint);
      set({ invitations: response.map(transformInvitation) });
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  },

  createInvitation: async (interviewId, candidateId, candidateEmail) => {
    try {
      await httpClient.post('/invitations', {
        interview_id: interviewId,
        candidate_id: candidateId,
        candidate_email: candidateEmail,
      });
      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return { success: false, error: apiError.detail };
    }
  },

  getInvitationsByUser: (userId) => {
    return get().invitations;
  },

  updateInvitation: async (id, status) => {
    try {
      const response = await httpClient.patch<BackendInvitation>(`/invitations/${id}`, { status });
      const invitation = transformInvitation(response);

      set((state) => ({
        invitations: state.invitations.map((i) => (i.id === id ? invitation : i)),
      }));

      return { success: true };
    } catch (error) {
      const apiError = error as ApiError;
      return { success: false, error: apiError.detail };
    }
  },

  // Code execution
  executeCode: async (code, language) => {
    try {
      // Check if language supports WASM execution
      if (isWasmSupported(language)) {
        // Update Pyodide loading status if needed
        if (language === 'python' && get().pyodideInitStatus === 'idle') {
          set({ pyodideInitStatus: 'initializing' });
        }

        // Execute via WASM
        const result = await executeCodeWasm(code, language);

        // Mark Pyodide as ready on successful Python execution
        if (language === 'python') {
          set({ pyodideInitStatus: 'idle' });
        }

        return result;
      } else {
        // Fallback to backend for unsupported languages (Java, C++, Go, Ruby)
        const response = await httpClient.post<CodeExecuteResponse>('/code/execute', {
          code,
          language,
          stdin: '',
        });

        return {
          output: response.output,
          error: response.error ?? undefined,
          executionTime: response.execution_time,
        };
      }
    } catch (error) {
      // Reset Pyodide status on error
      if (language === 'python') {
        set({ pyodideInitStatus: 'error' });
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to execute code';
      return {
        output: '',
        error: errorMessage,
        executionTime: 0,
      };
    }
  },

  getPyodideStatus: () => get().pyodideInitStatus,

  // Stats
  getInterviewerStats: async (userId) => {
    try {
      const response = await httpClient.get<BackendInterviewStats>(`/interviews/stats/${userId}`);
      return {
        total: response.total,
        completed: response.completed,
        avgDuration: response.avg_duration,
      };
    } catch {
      // Fallback to local calculation
      const interviews = get().interviews.filter((i) => i.interviewerId === userId);
      const completed = interviews.filter((i) => i.status === 'completed');
      const totalDuration = completed.reduce((acc, i) => acc + (i.duration || 0), 0);

      return {
        total: interviews.length,
        completed: completed.length,
        avgDuration: completed.length > 0 ? Math.round(totalDuration / completed.length) : 0,
      };
    }
  },
}));

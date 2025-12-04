// Backend API response types (snake_case format matching FastAPI responses)

import { ProgrammingLanguage, UserRole, InterviewStatus, Difficulty } from '@/types';

// Error response from API
export interface ApiError {
  detail: string;
  status: number;
}

// Auth responses
export interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: BackendUser;
}

// Interview responses
export interface BackendInterview {
  id: string;
  title: string;
  description: string | null;
  interviewer_id: string;
  interviewer_name: string;
  candidate_id: string | null;
  candidate_name: string | null;
  status: InterviewStatus;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration: number | null;
  language: ProgrammingLanguage;
  template_id: string | null;
  code: string;
  rating: number | null;
  notes: string | null;
  share_link: string;
  created_at: string;
  updated_at: string;
}

export interface BackendInterviewStats {
  total: number;
  completed: number;
  avg_duration: number;
}

// Chat message response
export interface BackendChatMessage {
  id: string;
  interview_id: string;
  user_id: string;
  user_name: string;
  message: string;
  timestamp: string;
}

// Template responses
export interface BackendTemplate {
  id: string;
  title: string;
  description: string;
  problem: string;
  examples: string;
  constraints: string;
  difficulty: Difficulty;
  tags: string[];
  starter_code: Record<string, string>;
  solution: Record<string, string> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Invitation responses
export interface BackendInvitation {
  id: string;
  interview_id: string;
  interview_title: string;
  interviewer_name: string;
  scheduled_at: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

// Code execution response
export interface CodeExecuteResponse {
  output: string;
  error: string | null;
  execution_time: number;
}

// Participant from WebSocket/API
export interface BackendParticipant {
  id: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  isOnline: boolean;
  cursorColor: string;
}

// WebSocket event types
export type WebSocketEventType =
  | 'code_update'
  | 'cursor_update'
  | 'chat_message'
  | 'typing'
  | 'language_change'
  | 'interview_status'
  | 'participant_joined'
  | 'participant_left'
  | 'participants_list';

export interface WebSocketMessage {
  type: WebSocketEventType;
  [key: string]: unknown;
}

// Request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface InterviewCreateRequest {
  title: string;
  description?: string;
  language: ProgrammingLanguage;
  template_id?: string;
  scheduled_at?: string;
}

export interface InterviewUpdateRequest {
  title?: string;
  description?: string;
  status?: InterviewStatus;
  candidate_id?: string;
  candidate_name?: string;
  language?: ProgrammingLanguage;
  code?: string;
  rating?: number;
  notes?: string;
  started_at?: string;
  ended_at?: string;
  duration?: number;
}

export interface TemplateCreateRequest {
  title: string;
  description: string;
  problem: string;
  examples: string;
  constraints: string;
  difficulty: Difficulty;
  tags: string[];
  starter_code: Record<string, string>;
  solution?: Record<string, string>;
}

export interface TemplateUpdateRequest {
  title?: string;
  description?: string;
  problem?: string;
  examples?: string;
  constraints?: string;
  difficulty?: Difficulty;
  tags?: string[];
  starter_code?: Record<string, string>;
  solution?: Record<string, string>;
}

export interface InvitationCreateRequest {
  interview_id: string;
  candidate_id?: string;
  candidate_email?: string;
}

export interface CodeExecuteRequest {
  code: string;
  language: ProgrammingLanguage;
  stdin?: string;
}

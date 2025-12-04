export type UserRole = 'interviewer' | 'candidate';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export type InterviewStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface Interview {
  id: string;
  title: string;
  description?: string;
  interviewerId: string;
  interviewerName: string;
  candidateId?: string;
  candidateName?: string;
  status: InterviewStatus;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number; // in minutes
  language: ProgrammingLanguage;
  templateId?: string;
  code: string;
  rating?: number;
  notes?: string;
  shareLink: string;
}

export type ProgrammingLanguage = 'javascript' | 'python' | 'java' | 'cpp' | 'go' | 'ruby';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CodeTemplate {
  id: string;
  title: string;
  description: string;
  problem: string;
  examples: string;
  constraints: string;
  starterCode: Record<ProgrammingLanguage, string>;
  solution?: Record<ProgrammingLanguage, string>;
  difficulty: Difficulty;
  tags: string[];
  createdBy: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  interviewId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export interface CodeExecution {
  output: string;
  error?: string;
  executionTime: number; // in ms
}

export interface Participant {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isOnline: boolean;
  cursorPosition?: {
    line: number;
    column: number;
  };
  cursorColor: string;
}

export interface InterviewInvitation {
  id: string;
  interviewId: string;
  interviewTitle: string;
  interviewerName: string;
  scheduledAt?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

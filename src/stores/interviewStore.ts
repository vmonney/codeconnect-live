import { create } from 'zustand';
import { Interview, InterviewStatus, ProgrammingLanguage, ChatMessage, Participant, InterviewInvitation, CodeExecution } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { mockCodeExecution } from '@/api/codeService';

interface InterviewState {
  interviews: Interview[];
  currentInterview: Interview | null;
  invitations: InterviewInvitation[];
  chatMessages: ChatMessage[];
  participants: Participant[];
  isTyping: { [userId: string]: boolean };
  
  // Actions
  createInterview: (title: string, language: ProgrammingLanguage, interviewerId: string, interviewerName: string, templateId?: string) => Interview;
  getInterviewById: (id: string) => Interview | undefined;
  getInterviewsByUser: (userId: string, role: 'interviewer' | 'candidate') => Interview[];
  updateInterview: (id: string, updates: Partial<Interview>) => void;
  setCurrentInterview: (interview: Interview | null) => void;
  joinInterview: (interviewId: string, participant: Participant) => void;
  leaveInterview: (interviewId: string, participantId: string) => void;
  updateCode: (interviewId: string, code: string) => void;
  updateCursorPosition: (interviewId: string, participantId: string, line: number, column: number) => void;
  
  // Chat
  sendMessage: (interviewId: string, userId: string, userName: string, message: string) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  
  // Invitations
  createInvitation: (interviewId: string, candidateId: string) => void;
  getInvitationsByUser: (userId: string) => InterviewInvitation[];
  updateInvitation: (id: string, status: 'accepted' | 'declined') => void;
  
  // Code execution
  executeCode: (code: string, language: ProgrammingLanguage) => Promise<CodeExecution>;
  
  // Stats
  getInterviewerStats: (userId: string) => { total: number; avgDuration: number; completed: number };
}

const CURSOR_COLORS = ['#00d9ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

export const useInterviewStore = create<InterviewState>((set, get) => ({
  interviews: [],
  currentInterview: null,
  invitations: [],
  chatMessages: [],
  participants: [],
  isTyping: {},

  createInterview: (title, language, interviewerId, interviewerName, templateId) => {
    const id = uuidv4();
    const shareLink = `${window.location.origin}/interview/${id}`;
    
    const interview: Interview = {
      id,
      title,
      interviewerId,
      interviewerName,
      status: 'scheduled',
      language,
      templateId,
      code: getStarterCode(language),
      shareLink,
      scheduledAt: new Date().toISOString(),
    };

    set(state => ({
      interviews: [...state.interviews, interview],
    }));

    return interview;
  },

  getInterviewById: (id) => {
    return get().interviews.find(i => i.id === id);
  },

  getInterviewsByUser: (userId, role) => {
    const { interviews } = get();
    if (role === 'interviewer') {
      return interviews.filter(i => i.interviewerId === userId);
    }
    return interviews.filter(i => i.candidateId === userId);
  },

  updateInterview: (id, updates) => {
    set(state => ({
      interviews: state.interviews.map(i => 
        i.id === id ? { ...i, ...updates } : i
      ),
      currentInterview: state.currentInterview?.id === id 
        ? { ...state.currentInterview, ...updates } 
        : state.currentInterview,
    }));
  },

  setCurrentInterview: (interview) => {
    set({ currentInterview: interview });
  },

  joinInterview: (interviewId, participant) => {
    const colorIndex = get().participants.length % CURSOR_COLORS.length;
    const participantWithColor = { ...participant, cursorColor: CURSOR_COLORS[colorIndex] };
    
    set(state => ({
      participants: [...state.participants.filter(p => p.id !== participant.id), participantWithColor],
    }));
  },

  leaveInterview: (interviewId, participantId) => {
    set(state => ({
      participants: state.participants.filter(p => p.id !== participantId),
    }));
  },

  updateCode: (interviewId, code) => {
    set(state => ({
      interviews: state.interviews.map(i => 
        i.id === interviewId ? { ...i, code } : i
      ),
      currentInterview: state.currentInterview?.id === interviewId 
        ? { ...state.currentInterview, code } 
        : state.currentInterview,
    }));
  },

  updateCursorPosition: (interviewId, participantId, line, column) => {
    set(state => ({
      participants: state.participants.map(p => 
        p.id === participantId ? { ...p, cursorPosition: { line, column } } : p
      ),
    }));
  },

  sendMessage: (interviewId, userId, userName, message) => {
    const chatMessage: ChatMessage = {
      id: uuidv4(),
      interviewId,
      userId,
      userName,
      message,
      timestamp: new Date().toISOString(),
    };

    set(state => ({
      chatMessages: [...state.chatMessages, chatMessage],
    }));
  },

  setTyping: (userId, isTyping) => {
    set(state => ({
      isTyping: { ...state.isTyping, [userId]: isTyping },
    }));
  },

  createInvitation: (interviewId, candidateId) => {
    const interview = get().getInterviewById(interviewId);
    if (!interview) return;

    const invitation: InterviewInvitation = {
      id: uuidv4(),
      interviewId,
      interviewTitle: interview.title,
      interviewerName: interview.interviewerName,
      scheduledAt: interview.scheduledAt,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    set(state => ({
      invitations: [...state.invitations, invitation],
    }));
  },

  getInvitationsByUser: (userId) => {
    // In real app, this would filter by candidateId
    return get().invitations;
  },

  updateInvitation: (id, status) => {
    set(state => ({
      invitations: state.invitations.map(i => 
        i.id === id ? { ...i, status } : i
      ),
    }));
  },

  executeCode: async (code, language) => {
    return mockCodeExecution(code, language);
  },

  getInterviewerStats: (userId) => {
    const interviews = get().interviews.filter(i => i.interviewerId === userId);
    const completed = interviews.filter(i => i.status === 'completed');
    const totalDuration = completed.reduce((acc, i) => acc + (i.duration || 0), 0);
    
    return {
      total: interviews.length,
      completed: completed.length,
      avgDuration: completed.length > 0 ? Math.round(totalDuration / completed.length) : 0,
    };
  },
}));

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
    java: `// Welcome to CodeView Interview Platform
// Write your solution below

public class Solution {
    public static void main(String[] args) {
        System.out.println(solution("Hello, World!"));
    }
    
    public static String solution(String input) {
        // Your code here
        return input;
    }
}
`,
    cpp: `// Welcome to CodeView Interview Platform
// Write your solution below

#include <iostream>
#include <string>
using namespace std;

string solution(string input) {
    // Your code here
    return input;
}

int main() {
    cout << solution("Hello, World!") << endl;
    return 0;
}
`,
    go: `// Welcome to CodeView Interview Platform
// Write your solution below

package main

import "fmt"

func solution(input string) string {
    // Your code here
    return input
}

func main() {
    fmt.Println(solution("Hello, World!"))
}
`,
    ruby: `# Welcome to CodeView Interview Platform
# Write your solution below

def solution(input)
  # Your code here
  input
end

# Test your solution
puts solution("Hello, World!")
`,
  };

  return starters[language];
}

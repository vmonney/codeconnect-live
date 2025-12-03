import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useInterviewStore } from '@/stores/interviewStore';
import { useTemplateStore } from '@/stores/templateStore';
import { ProgrammingLanguage, CodeExecution, Participant } from '@/types';
import { CodeEditor } from '@/components/interview/CodeEditor';
import { OutputConsole } from '@/components/interview/OutputConsole';
import { ChatPanel } from '@/components/interview/ChatPanel';
import { ProblemPanel } from '@/components/interview/ProblemPanel';
import { VideoPanel } from '@/components/interview/VideoPanel';
import { InterviewControls } from '@/components/interview/InterviewControls';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Code2, Sun, Moon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' },
];

export default function InterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { 
    getInterviewById, 
    updateInterview, 
    updateCode, 
    executeCode,
    chatMessages,
    sendMessage,
    setTyping,
    isTyping,
    participants,
    joinInterview,
    leaveInterview,
  } = useInterviewStore();
  const { getTemplateById } = useTemplateStore();

  const [interview, setInterview] = useState(id ? getInterviewById(id) : undefined);
  const [language, setLanguage] = useState<ProgrammingLanguage>(interview?.language || 'javascript');
  const [code, setCode] = useState(interview?.code || '');
  const [output, setOutput] = useState<CodeExecution | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [simulatedParticipants, setSimulatedParticipants] = useState<Participant[]>([]);

  const template = interview?.templateId ? getTemplateById(interview.templateId) : undefined;
  const isInterviewer = user?.role === 'interviewer' && interview?.interviewerId === user?.id;
  const interviewMessages = chatMessages.filter(m => m.interviewId === id);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!interview && id) {
      // Interview doesn't exist, redirect to dashboard
      toast.error('Interview not found');
      navigate('/dashboard');
      return;
    }

    // Join the interview
    if (user && id) {
      const participant: Participant = {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        isOnline: true,
        cursorColor: '#00d9ff',
      };
      joinInterview(id, participant);

      // Start interview if interviewer
      if (isInterviewer && interview?.status === 'scheduled') {
        updateInterview(id, {
          status: 'in-progress',
          startedAt: new Date().toISOString(),
        });
      }
    }

    return () => {
      if (user && id) {
        leaveInterview(id, user.id);
      }
    };
  }, [isAuthenticated, interview, id, user, navigate, isInterviewer]);

  // Sync code changes
  useEffect(() => {
    if (interview) {
      setCode(interview.code);
      setLanguage(interview.language);
    }
  }, [interview]);

  // Simulate other participants for demo purposes
  useEffect(() => {
    if (!id || !user) return;

    // Add a simulated participant after a short delay
    const addParticipantTimeout = setTimeout(() => {
      const fakeParticipant: Participant = {
        id: 'simulated-user-1',
        name: user.role === 'interviewer' ? 'Alex (Candidate)' : 'Sarah (Interviewer)',
        role: user.role === 'interviewer' ? 'candidate' : 'interviewer',
        isOnline: true,
        cursorColor: '#a855f7',
        cursorPosition: { line: 5, column: 10 },
      };
      setSimulatedParticipants([fakeParticipant]);
    }, 2000);

    // Simulate cursor movement
    const cursorInterval = setInterval(() => {
      setSimulatedParticipants(prev => 
        prev.map(p => ({
          ...p,
          cursorPosition: {
            line: Math.max(1, Math.min(20, (p.cursorPosition?.line || 5) + Math.floor(Math.random() * 3) - 1)),
            column: Math.max(1, Math.min(40, (p.cursorPosition?.column || 10) + Math.floor(Math.random() * 5) - 2)),
          }
        }))
      );
    }, 3000);

    return () => {
      clearTimeout(addParticipantTimeout);
      clearInterval(cursorInterval);
    };
  }, [id, user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, language]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    if (id) {
      updateCode(id, newCode);
    }
  }, [id, updateCode]);

  const handleLanguageChange = (newLanguage: ProgrammingLanguage) => {
    setLanguage(newLanguage);
    if (id) {
      updateInterview(id, { language: newLanguage });
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    try {
      const result = await executeCode(code, language);
      setOutput(result);
      if (result.error) {
        toast.error('Execution failed', { description: result.error.split('\n')[0] });
      } else {
        toast.success('Code executed', { description: `Completed in ${result.executionTime}ms` });
      }
    } catch (error) {
      toast.error('Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendMessage = (message: string) => {
    if (user && id) {
      sendMessage(id, user.id, user.name, message);
    }
  };

  const handleTyping = (typing: boolean) => {
    if (user) {
      setTyping(user.id, typing);
    }
  };

  const handleEndInterview = () => {
    if (id) {
      updateInterview(id, {
        status: 'completed',
        endedAt: new Date().toISOString(),
      });
    }
  };

  const handleUpdateNotes = (notes: string) => {
    if (id) {
      updateInterview(id, { notes });
    }
  };

  const handleRateCandidate = (rating: number) => {
    if (id) {
      updateInterview(id, { rating });
    }
  };

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading interview...</p>
        </div>
      </div>
    );
  }

  const localParticipant: Participant | undefined = user ? {
    id: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    isOnline: true,
    cursorColor: '#00d9ff',
  } : undefined;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Code2 className="h-4 w-4" />
            </div>
            <span className="font-bold hidden sm:inline">
              Code<span className="text-primary">View</span>
            </span>
          </Link>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <h1 className="font-medium truncate max-w-[200px] sm:max-w-none">{interview.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <Select value={language} onValueChange={(v) => handleLanguageChange(v as ProgrammingLanguage)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
          >
            {theme === 'vs-dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Interview Controls */}
          <InterviewControls
            interview={interview}
            isInterviewer={isInterviewer}
            onEndInterview={handleEndInterview}
            onUpdateNotes={handleUpdateNotes}
            onRateCandidate={handleRateCandidate}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Problem & Video */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
            <div className="h-full flex flex-col p-2 gap-2">
              <div className="flex-1 min-h-0">
                <ProblemPanel template={template} />
              </div>
              <div className="h-[250px] flex-shrink-0">
                <VideoPanel 
                  participants={[...participants.filter(p => p.id !== user?.id), ...simulatedParticipants]} 
                  localParticipant={localParticipant}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Panel - Code Editor */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col p-2 gap-2">
              <div className="flex-1 min-h-0">
                <CodeEditor
                  code={code}
                  language={language}
                  onChange={handleCodeChange}
                  participants={[...participants.filter(p => p.id !== user?.id), ...simulatedParticipants]}
                  theme={theme}
                />
              </div>
              <div className="h-[200px] flex-shrink-0">
                <OutputConsole
                  onRun={handleRunCode}
                  output={output}
                  isRunning={isRunning}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Chat */}
          <ResizablePanel defaultSize={25} minSize={15} maxSize={35}>
            <div className="h-full p-2">
              <ChatPanel
                messages={interviewMessages}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                onTyping={handleTyping}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

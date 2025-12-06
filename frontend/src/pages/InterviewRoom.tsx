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
];

export default function InterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    getInterviewById,
    fetchInterview,
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
    connectToInterview,
    disconnectFromInterview,
    sendCodeUpdate,
    sendLanguageChange,
    currentInterview,
  } = useInterviewStore();
  const { getTemplateById } = useTemplateStore();

  const [interview, setInterview] = useState(id ? getInterviewById(id) : undefined);
  const [isLoadingInterview, setIsLoadingInterview] = useState(false);

  const [language, setLanguage] = useState<ProgrammingLanguage>(interview?.language || 'javascript');
  const [code, setCode] = useState(interview?.code || '');
  const [output, setOutput] = useState<CodeExecution | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const template = interview?.templateId ? getTemplateById(interview.templateId) : undefined;
  const isInterviewer = user?.role === 'interviewer' && interview?.interviewerId === user?.id;
  const interviewMessages = chatMessages.filter(m => m.interviewId === id);

  // Fetch interview from API if not in local store
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to auth with return URL
      navigate(`/auth?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!id) return;

    // Check if interview exists in local store
    const localInterview = getInterviewById(id);
    if (localInterview) {
      setInterview(localInterview);
      return;
    }

    // If not in store and not already loading, fetch from API
    if (!isLoadingInterview) {
      setIsLoadingInterview(true);
      fetchInterview(id).then((fetchedInterview) => {
        setIsLoadingInterview(false);
        if (!fetchedInterview) {
          // Interview doesn't exist, redirect to dashboard
          toast.error('Interview not found');
          navigate('/dashboard');
        } else {
          setInterview(fetchedInterview);
        }
      });
    }
  }, [isAuthenticated, id, navigate, fetchInterview, getInterviewById, isLoadingInterview]);

  // Sync with store's currentInterview
  useEffect(() => {
    if (currentInterview && currentInterview.id === id) {
      setInterview(currentInterview);
    }
  }, [currentInterview, id]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Already handled by the first useEffect
      return;
    }

    // Wait for interview to load before joining
    if (!interview || isLoadingInterview) {
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

      // Connect to WebSocket for real-time collaboration
      connectToInterview(id);

      // Update interview based on role
      if (isInterviewer && interview?.status === 'scheduled') {
        // Start interview if interviewer
        updateInterview(id, {
          status: 'in-progress',
          startedAt: new Date().toISOString(),
        });
      } else if (user.role === 'candidate' && !interview?.candidateId) {
        // Add candidate to interview if not already set
        updateInterview(id, {
          candidateId: user.id,
          candidateName: user.name,
        });
      }
    }

    return () => {
      if (user && id) {
        leaveInterview(id, user.id);
        // Disconnect WebSocket
        disconnectFromInterview();
      }
    };
  }, [isAuthenticated, interview, id, user, navigate, isInterviewer, connectToInterview, disconnectFromInterview, joinInterview, leaveInterview, updateInterview]);

  // Sync code changes
  useEffect(() => {
    if (interview) {
      setCode(interview.code);
      setLanguage(interview.language);
    }
  }, [interview]);

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
      updateCode(id, newCode); // Local state (immediate feedback)
      sendCodeUpdate(newCode);  // Send via WebSocket
    }
  }, [id, updateCode, sendCodeUpdate]);

  const handleLanguageChange = (newLanguage: ProgrammingLanguage) => {
    setLanguage(newLanguage);
    if (id) {
      updateInterview(id, { language: newLanguage });
      sendLanguageChange(newLanguage); // Send via WebSocket
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    try {
      const result = await executeCode(code, language);
      setOutput(result);

      if (result.error) {
        // Check for timeout errors
        if (result.error.includes('timeout')) {
          toast.error('Execution timeout', {
            description: 'Code took too long to execute (limit: 5s)'
          });
        } else {
          toast.error('Execution failed', {
            description: result.error.split('\n')[0]
          });
        }
      } else {
        toast.success('Code executed', {
          description: `Completed in ${result.executionTime}ms`
        });
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
                  participants={participants.filter(p => p.id !== user?.id)}
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
                  participants={participants.filter(p => p.id !== user?.id)}
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

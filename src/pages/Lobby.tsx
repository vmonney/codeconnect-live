import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useInterviewStore } from '@/stores/interviewStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor,
  CheckCircle2,
  XCircle,
  Loader2,
  Code2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Lobby() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { getInterviewById, updateInterview } = useInterviewStore();

  const [interview, setInterview] = useState(id ? getInterviewById(id) : undefined);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [systemChecks, setSystemChecks] = useState({
    browser: 'checking',
    camera: 'checking',
    microphone: 'checking',
    connection: 'checking',
  });
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Simulate system checks
    const runChecks = async () => {
      await new Promise(r => setTimeout(r, 500));
      setSystemChecks(prev => ({ ...prev, browser: 'passed' }));
      
      await new Promise(r => setTimeout(r, 700));
      setSystemChecks(prev => ({ ...prev, camera: 'passed' }));
      
      await new Promise(r => setTimeout(r, 600));
      setSystemChecks(prev => ({ ...prev, microphone: 'passed' }));
      
      await new Promise(r => setTimeout(r, 800));
      setSystemChecks(prev => ({ ...prev, connection: 'passed' }));
    };

    runChecks();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (id) {
      const checkInterview = () => {
        const currentInterview = getInterviewById(id);
        setInterview(currentInterview);
      };
      
      checkInterview();
      const interval = setInterval(checkInterview, 2000);
      return () => clearInterval(interval);
    }
  }, [id, getInterviewById]);

  const handleJoinInterview = async () => {
    setIsJoining(true);
    
    // Simulate joining delay
    await new Promise(r => setTimeout(r, 1000));
    
    if (id && user) {
      // Update interview with candidate info if candidate
      if (user.role === 'candidate' && interview) {
        updateInterview(id, {
          candidateId: user.id,
          candidateName: user.name,
        });
      }
      
      navigate(`/interview/${id}`);
    }
  };

  const allChecksPassed = Object.values(systemChecks).every(s => s === 'passed');
  const isInterviewReady = interview?.status === 'in-progress' || 
    (interview?.interviewerId === user?.id);

  const getCheckIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="w-full max-w-4xl relative z-10 space-y-6">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Code2 className="h-7 w-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Code<span className="text-primary">View</span>
          </span>
        </Link>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Video Preview */}
          <Card className="bg-card/80 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Check your camera and audio before joining</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video Preview */}
              <div className="aspect-video rounded-lg bg-secondary overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {isVideoOn ? (
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <VideoOff className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="text-sm font-medium bg-background/70 px-2 py-1 rounded backdrop-blur-sm">
                    {user?.name}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={isMicOn ? 'secondary' : 'destructive'}
                  size="lg"
                  onClick={() => setIsMicOn(!isMicOn)}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button
                  variant={isVideoOn ? 'secondary' : 'destructive'}
                  size="lg"
                  onClick={() => setIsVideoOn(!isVideoOn)}
                >
                  {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Checks & Join */}
          <Card className="bg-card/80 backdrop-blur-xl border-border/50">
            <CardHeader>
              <CardTitle>{interview?.title || 'Waiting Room'}</CardTitle>
              <CardDescription>
                {interview?.interviewerName 
                  ? `Interview with ${interview.interviewerName}`
                  : 'System requirements check'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Checks */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">System Check</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Browser Compatibility</span>
                    </div>
                    {getCheckIcon(systemChecks.browser)}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Camera Access</span>
                    </div>
                    {getCheckIcon(systemChecks.camera)}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Mic className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Microphone Access</span>
                    </div>
                    {getCheckIcon(systemChecks.microphone)}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Connection Quality</span>
                    </div>
                    {getCheckIcon(systemChecks.connection)}
                  </div>
                </div>
              </div>

              {/* Status */}
              {!isInterviewReady && allChecksPassed && (
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-warning" />
                  <p className="text-sm text-warning">Waiting for the host to start the session...</p>
                </div>
              )}

              {/* Join Button */}
              <Button
                variant="glow"
                size="xl"
                className="w-full"
                disabled={!allChecksPassed || isJoining || (!isInterviewReady && user?.role === 'candidate')}
                onClick={handleJoinInterview}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Joining...
                  </>
                ) : (
                  user?.role === 'interviewer' ? 'Start Interview' : 'Join Interview'
                )}
              </Button>

              {/* Back to Dashboard */}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

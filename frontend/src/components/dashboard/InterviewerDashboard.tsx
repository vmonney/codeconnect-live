import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useInterviewStore } from '@/stores/interviewStore';
import { useTemplateStore } from '@/stores/templateStore';
import { ProgrammingLanguage } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Copy, 
  Check, 
  Clock, 
  Users, 
  BarChart3, 
  ExternalLink,
  FileCode,
  Play
} from 'lucide-react';
import { toast } from 'sonner';

const LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
];

export function InterviewerDashboard() {
  const { user } = useAuthStore();
  const { interviews, createInterview, getInterviewerStats, getInterviewsByUser } = useInterviewStore();
  const { templates } = useTemplateStore();
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<ProgrammingLanguage>('javascript');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('none');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, avgDuration: 0 });

  useEffect(() => {
    if (user) {
      getInterviewerStats(user.id).then(setStats);
    }
  }, [user, getInterviewerStats]);

  if (!user) return null;

  const userInterviews = getInterviewsByUser(user.id, 'interviewer');

  const handleCreateInterview = async () => {
    if (!title.trim()) {
      toast.error('Please enter an interview title');
      return;
    }

    const interview = await createInterview(
      title,
      language,
      user.id,
      user.name,
      selectedTemplate !== 'none' ? selectedTemplate : undefined
    );

    if (!interview) {
      toast.error('Failed to create interview');
      return;
    }

    setIsCreateOpen(false);
    setTitle('');
    setLanguage('javascript');
    setSelectedTemplate('none');

    toast.success('Interview created!', {
      description: 'Share the link with your candidate.',
    });

    // Copy link to clipboard
    navigator.clipboard.writeText(interview.shareLink);
  };

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-warning bg-warning/10';
      case 'in-progress': return 'text-success bg-success/10';
      case 'completed': return 'text-muted-foreground bg-muted';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Interviews</p>
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/10 to-transparent border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-success">{stats.completed}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Duration</p>
                <p className="text-3xl font-bold text-accent">{stats.avgDuration}m</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="glow" size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create New Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Interview</DialogTitle>
              <DialogDescription>
                Set up a new coding interview session. A unique link will be generated.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Interview Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Frontend Developer Interview"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Primary Language</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as ProgrammingLanguage)}>
                  <SelectTrigger>
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
              </div>
              
              <div className="space-y-2">
                <Label>Problem Template (Optional)</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title} ({template.difficulty})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button variant="glow" onClick={handleCreateInterview}>
                Create Interview
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="lg" onClick={() => navigate('/templates')}>
          <FileCode className="h-5 w-5 mr-2" />
          Manage Templates
        </Button>

        <Button variant="secondary" size="lg" onClick={() => navigate('/demo')}>
          <Play className="h-5 w-5 mr-2" />
          View Demo
        </Button>
      </div>

      {/* Interview List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Interviews</CardTitle>
          <CardDescription>Manage and access your interview sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {userInterviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No interviews yet. Create your first interview to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{interview.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="capitalize">{interview.language}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(interview.status)}`}>
                        {interview.status}
                      </span>
                      {interview.candidateName && (
                        <>
                          <span>•</span>
                          <span>{interview.candidateName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => copyLink(interview.shareLink, interview.id)}
                    >
                      {copiedId === interview.id ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/interview/${interview.id}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

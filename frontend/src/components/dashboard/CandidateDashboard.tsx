import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useInterviewStore } from '@/stores/interviewStore';
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
  Link2, 
  Clock, 
  CheckCircle2, 
  Calendar,
  Play,
  FileCode,
  Inbox
} from 'lucide-react';
import { toast } from 'sonner';

export function CandidateDashboard() {
  const { user } = useAuthStore();
  const { getInterviewsByUser, invitations, updateInvitation, getInterviewById } = useInterviewStore();
  const navigate = useNavigate();

  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [interviewLink, setInterviewLink] = useState('');

  if (!user) return null;

  const userInterviews = getInterviewsByUser(user.id, 'candidate');
  const userInvitations = invitations.filter(i => i.status === 'pending');

  const handleJoinInterview = () => {
    // Extract interview ID from link
    const urlMatch = interviewLink.match(/\/interview\/([a-zA-Z0-9-]+)/);
    const interviewId = urlMatch ? urlMatch[1] : interviewLink;

    if (!interviewId) {
      toast.error('Please enter a valid interview link or code');
      return;
    }

    setIsJoinOpen(false);
    setInterviewLink('');
    navigate(`/lobby/${interviewId}`);
  };

  const handleAcceptInvitation = (invitationId: string, interviewId: string) => {
    updateInvitation(invitationId, 'accepted');
    toast.success('Invitation accepted!');
    navigate(`/lobby/${interviewId}`);
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
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Invitations</p>
                <p className="text-3xl font-bold text-primary">{userInvitations.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Inbox className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/10 to-transparent border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-success">
                  {userInterviews.filter(i => i.status === 'completed').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-3xl font-bold text-accent">
                  {userInterviews.filter(i => i.status === 'scheduled').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
          <DialogTrigger asChild>
            <Button variant="glow" size="lg">
              <Link2 className="h-5 w-5 mr-2" />
              Join Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Join Interview</DialogTitle>
              <DialogDescription>
                Enter the interview link or code shared by your interviewer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="link">Interview Link or Code</Label>
                <Input
                  id="link"
                  placeholder="https://codeview.app/interview/abc123 or abc123"
                  value={interviewLink}
                  onChange={(e) => setInterviewLink(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsJoinOpen(false)}>
                Cancel
              </Button>
              <Button variant="glow" onClick={handleJoinInterview}>
                Join Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="secondary" size="lg" onClick={() => navigate('/demo')}>
          <Play className="h-5 w-5 mr-2" />
          View Demo
        </Button>
      </div>

      {/* Invitations */}
      {userInvitations.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
              Interview Invitations
            </CardTitle>
            <CardDescription>Accept invitations to join interview sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-primary/5"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{invitation.interviewTitle}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>From: {invitation.interviewerName}</span>
                      {invitation.scheduledAt && (
                        <>
                          <span>•</span>
                          <span>{new Date(invitation.scheduledAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateInvitation(invitation.id, 'declined')}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="glow"
                      size="sm"
                      onClick={() => handleAcceptInvitation(invitation.id, invitation.interviewId)}
                    >
                      Accept & Join
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interview History */}
      <Card>
        <CardHeader>
          <CardTitle>Interview History</CardTitle>
          <CardDescription>Your past and upcoming interview sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {userInterviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No interview history yet. Join your first interview to get started!</p>
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
                      <span>With: {interview.interviewerName}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(interview.status)}`}>
                        {interview.status}
                      </span>
                      {interview.rating && (
                        <>
                          <span>•</span>
                          <span>Rating: {interview.rating}/5</span>
                        </>
                      )}
                    </div>
                  </div>
                  {interview.status !== 'completed' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/interview/${interview.id}`)}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Continue
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

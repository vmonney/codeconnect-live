import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useInterviewStore } from '@/stores/interviewStore';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Calendar, 
  Briefcase, 
  Edit2, 
  Save,
  BarChart3,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user, updateProfile, isAuthenticated } = useAuthStore();
  const { getInterviewsByUser, getInterviewerStats } = useInterviewStore();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');

  if (!isAuthenticated || !user) {
    navigate('/auth');
    return null;
  }

  const userInterviews = getInterviewsByUser(user.id, user.role);
  const stats = user.role === 'interviewer' ? getInterviewerStats(user.id) : null;

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    updateProfile({ name: name.trim() });
    setIsEditing(false);
    toast.success('Profile updated');
  };

  return (
    <Layout>
      <div className="container py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and view your activity</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </div>
                <Button
                  variant={isEditing ? 'glow' : 'outline'}
                  size="sm"
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-primary/20">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{user.name}</h3>
                  <span className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary capitalize">
                    {user.role}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Details */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  ) : (
                    <p className="text-foreground">{user.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email
                  </Label>
                  <p className="text-foreground">{user.email}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    Role
                  </Label>
                  <p className="text-foreground capitalize">{user.role}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Member Since
                  </Label>
                  <p className="text-foreground">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>Your interview statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userInterviews.length}</p>
                      <p className="text-sm text-muted-foreground">Total Interviews</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {userInterviews.filter(i => i.status === 'completed').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {stats?.avgDuration || 0}m
                      </p>
                      <p className="text-sm text-muted-foreground">Avg. Duration</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Interviews</CardTitle>
              <CardDescription>Your latest interview sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {userInterviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No interviews yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userInterviews.slice(0, 5).map((interview) => (
                    <div
                      key={interview.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border"
                    >
                      <div>
                        <p className="font-medium">{interview.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {interview.scheduledAt 
                            ? new Date(interview.scheduledAt).toLocaleDateString()
                            : 'Not scheduled'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        interview.status === 'completed' 
                          ? 'bg-muted text-muted-foreground'
                          : interview.status === 'in-progress'
                          ? 'bg-success/20 text-success'
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {interview.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

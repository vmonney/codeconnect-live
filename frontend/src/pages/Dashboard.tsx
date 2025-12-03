import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Layout } from '@/components/layout/Layout';
import { InterviewerDashboard } from '@/components/dashboard/InterviewerDashboard';
import { CandidateDashboard } from '@/components/dashboard/CandidateDashboard';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <Layout>
      <div className="container py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="text-primary">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground">
            {user.role === 'interviewer' 
              ? 'Manage your interviews and templates'
              : 'View your interview invitations and history'}
          </p>
        </div>

        {user.role === 'interviewer' ? (
          <InterviewerDashboard />
        ) : (
          <CandidateDashboard />
        )}
      </div>
    </Layout>
  );
}

import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/auth/forgot-password/new/$userId/$resetCode/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { resetCode, userId } = useParams({ from: '/auth/forgot-password/new/$userId/$resetCode/' });

  useEffect(() => {
    if (userId && resetCode) {
      localStorage.setItem('openResetPasswordModal', 'true');
      localStorage.setItem('userId', userId);
      localStorage.setItem('code', resetCode);

      navigate({ to: '/' });
    }
  }, [userId, resetCode, navigate]);

  return <div>Redirecting...</div>;
}

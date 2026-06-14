import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../App';

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

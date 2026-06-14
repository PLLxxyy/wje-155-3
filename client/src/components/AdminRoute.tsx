import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../App';

interface Props {
  children: ReactNode;
}

export default function AdminRoute({ children }: Props) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/search" replace />;
  return <>{children}</>;
}

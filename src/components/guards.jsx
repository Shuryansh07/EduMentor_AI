import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading } from './ui.jsx';

/** Requires authentication; otherwise redirects to /login (preserving target). */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Restoring your session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

/** Requires one of the given roles; otherwise sends to the dashboard. */
export function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

/** Sends already-authenticated users away from auth pages. */
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loading />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

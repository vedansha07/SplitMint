import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '../store';
import TopNav from './TopNav';

const ProtectedRoute = () => {
  const currentUser = useAppStore((s) => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <TopNav />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedRoute;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import OrphanageDetail from './pages/OrphanageDetail';
import MyDonations from './pages/MyDonations';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import DonationReports from './pages/DonationReports';
import Maintenance from './pages/Maintenance';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on load
    const verifySession = async () => {
      const savedUser = localStorage.getItem('amanah_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        try {
          const res = await fetch('/api/me', {
            headers: { 'x-user-data': savedUser }
          });
          
          if (res.status === 403) {
            const data = await res.json();
            alert(data.error || 'Akun Anda ditangguhkan');
            handleLogout();
          } else if (res.ok) {
            const data = await res.json();
            setUser(data);
            localStorage.setItem('amanah_user', JSON.stringify(data));
          }
        } catch (e) {
          console.error("Session verification failed", e);
        }
      }
      setLoading(false);
    };

    const handleLogout = () => {
      localStorage.removeItem('amanah_user');
      setUser(null);
    };

    verifySession();
  }, []);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-beige">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/app" element={user ? <AppLayout user={user} setUser={setUser} /> : <Navigate to="/login" />}>
          <Route index element={user?.role === 'admin' ? <AdminDashboard /> : <Dashboard />} />
          <Route path="explore" element={<Explore />} />
          <Route path="orphanage/:id" element={<OrphanageDetail />} />
          <Route path="my-donations" element={<MyDonations />} />
          <Route path="users" element={user?.role === 'admin' ? <UserManagement /> : <Navigate to="/app" />} />
          <Route path="reports" element={user?.role === 'admin' ? <DonationReports /> : <Navigate to="/app" />} />
          <Route path="admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/app" />} />
        </Route>
      </Routes>
    </Router>
  );
}

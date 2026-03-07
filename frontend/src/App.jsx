import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, Search, Activity, Clock, LogOut, Shield, LayoutDashboard } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

import Registration from './pages/Registration';
import SearchQueue from './pages/SearchQueue';
import ClinicalHub from './pages/ClinicalHub';
import PatientHistory from './pages/PatientHistory';
import UserManagement from './pages/UserManagement';

const SidebarLink = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-3 mx-2 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive
        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
        : 'text-slate-600 hover:bg-slate-50 hover:text-primary-600'
        }`}
    >
      <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'}`} />
      {children}
    </Link>
  );
};

const Layout = ({ children }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const pathParts = location.pathname.split('/').filter(p => p);
  const activePatientId = (pathParts[0] === 'hub' || pathParts[0] === 'history') ? pathParts[1] : null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300">
        <div className="h-20 flex items-center px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-100">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 tracking-tight font-display leading-tight">Hani Dental <span className="text-primary-600">Pro</span></span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Management System</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-1 customized-scrollbar">
          <div className="px-6 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Main Menu</span>
          </div>
          <SidebarLink to="/" icon={Users}>Registration</SidebarLink>
          <SidebarLink to="/search" icon={Search}>Search & Queue</SidebarLink>

          <div className="mt-8 px-6 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Patient Records</span>
          </div>

          <SidebarLink to={activePatientId ? `/hub/${activePatientId}` : '/hub'} icon={Activity}>Clinical Hub</SidebarLink>
          <SidebarLink to={activePatientId ? `/history/${activePatientId}` : '/history'} icon={Clock}>Visit History</SidebarLink>

          {user?.role === 'Admin' && (
            <>
              <div className="mt-8 px-6 mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Administration</span>
              </div>
              <SidebarLink to="/users" icon={Shield}>System Admin</SidebarLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm uppercase shadow-inner">
                {user?.username?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 leading-none mb-1">{user?.username || 'User'}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{user?.role || 'Staff'}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-0">
        <div className="animate-fade-in min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

const AuthenticatedApp = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <span className="mt-4 text-slate-500 font-medium animate-pulse">Initializing Hani Dental Pro...</span>
      </div>
    );
  }

  if (!token) {
    return <Login />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Registration />} />
          <Route path="/search" element={<SearchQueue />} />
          <Route path="/hub/:patientId" element={<ClinicalHub />} />
          <Route path="/hub" element={<ClinicalHub />} />
          <Route path="/history/:patientId" element={<PatientHistory />} />
          <Route path="/history" element={<PatientHistory />} />
          <Route path="/users" element={<UserManagement />} />
        </Routes>
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;

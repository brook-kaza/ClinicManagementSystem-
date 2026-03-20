import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Search, Activity, Clock, LogOut, Shield, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';

import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import SearchQueue from './pages/SearchQueue';
import ClinicalHub from './pages/ClinicalHub';
import PatientHistory from './pages/PatientHistory';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import AccessDenied from './components/AccessDenied';
import { LayoutDashboard } from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, children, isCollapsed, state = {}, className = '' }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      state={state}
      className={`group flex items-center gap-3 px-3 py-2.5 mx-3 rounded-xl text-sm font-medium transition-all duration-200 focus-ring ${isActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80'
        } ${className}`}
    >
      <Icon className={`w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
      {!isCollapsed && <span className="animate-fade-in">{children}</span>}
    </Link>
  );
};

const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const pathParts = location.pathname.split('/').filter(p => p);
  const activePatientId = (pathParts[0] === 'hub' || pathParts[0] === 'history') ? pathParts[1] : null;
  const navigate = useNavigate();

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for Search)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100 font-sans">
      {/* Sidebar */}
      <aside
        className={`relative flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 z-50 ${isCollapsed ? 'w-20' : 'w-[260px]'}`}
      >
        {/* Logo Area */}
        <div className="h-[72px] flex items-center justify-between px-4 border-b border-zinc-900">
          <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-fade-in whitespace-nowrap">
                <span className="text-base font-bold text-white tracking-tight leading-tight font-heading">Hani Dental</span>
                <span className="text-[11px] font-bold text-indigo-400 tracking-wider uppercase">Pro</span>
              </div>
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute -right-3 top-8 z-[60] p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 shadow-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-300 hidden sm:flex items-center justify-center`}
            style={{ transform: 'translateX(0)' }}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          <div className={`px-5 mb-2 ${isCollapsed ? 'text-center' : ''}`}>
            <span className={`text-[10px] font-bold text-zinc-600 uppercase tracking-widest ${isCollapsed ? 'hidden' : 'inline-block'}`}>Main Menu</span>
            {isCollapsed && <div className="h-px w-6 mx-auto bg-zinc-800 mt-2"></div>}
          </div>
          <SidebarLink to="/" icon={LayoutDashboard} isCollapsed={isCollapsed}>Dashboard</SidebarLink>
          <SidebarLink to="/search" icon={Search} isCollapsed={isCollapsed}>Clinical Queue <span className="ml-auto text-[9px] font-bold text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-700 font-mono tracking-widest">⌘K</span></SidebarLink>
          <SidebarLink to="/register" icon={Users} isCollapsed={isCollapsed}>Patient Reg</SidebarLink>

          <div className={`mt-8 px-5 mb-2 ${isCollapsed ? 'text-center' : ''}`}>
            <span className={`text-[10px] font-bold text-zinc-600 uppercase tracking-widest ${isCollapsed ? 'hidden' : 'inline-block'}`}>Clinical Record</span>
            {isCollapsed && <div className="h-px w-6 mx-auto bg-zinc-800 mt-2"></div>}
          </div>
          <SidebarLink to={activePatientId ? `/hub/${activePatientId}` : '/hub'}
            icon={Activity}
            isCollapsed={isCollapsed}
          >
            Clinical Hub
          </SidebarLink>
          <SidebarLink 
            to={activePatientId ? `/history/${activePatientId}` : '/history'}
            icon={Clock}
            isCollapsed={isCollapsed}
          >
            Visit History
          </SidebarLink>

          {['Admin', 'Dentist', 'Receptionist'].includes(user?.role) && (
            <>
              <div className={`mt-8 px-5 mb-2 ${isCollapsed ? 'text-center' : ''}`}>
                <span className={`text-[10px] font-bold text-zinc-600 uppercase tracking-widest ${isCollapsed ? 'hidden' : 'inline-block'}`}>Management</span>
                {isCollapsed && <div className="h-px w-6 mx-auto bg-zinc-800 mt-2"></div>}
              </div>
              <SidebarLink to="/reports" icon={FileText} isCollapsed={isCollapsed}>Reports & Analytics</SidebarLink>
              {user?.role === 'Admin' && (
                <SidebarLink to="/users" icon={Shield} isCollapsed={isCollapsed}>System Users</SidebarLink>
              )}
            </>
          )}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-zinc-800/50 bg-zinc-950/50">
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} p-2.5 rounded-xl hover:bg-zinc-900 transition-colors group cursor-default`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0 shadow-inner">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden animate-fade-in">
                  <span className="text-sm font-semibold text-zinc-200 truncate">{user?.username}</span>
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{user?.role}</span>
                </div>
              )}
            </div>
            <button
              onClick={logout}
              className={`p-2 text-zinc-500 hover:text-red-400 transition-all duration-200 rounded-lg hover:bg-red-500/10 focus-ring ${isCollapsed ? 'mt-1 w-full flex justify-center' : 'opacity-0 group-hover:opacity-100'}`}
              title="Logout"
            >
              <LogOut className="w-4 h-4 hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        {/* Subtle top gradient for depth */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-zinc-200/50 to-transparent pointer-events-none -z-10"></div>
        <div className="animate-scale-in h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

const AuthenticatedApp = () => {
  const { token, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 font-sans">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 animate-pulse">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div className="mt-8 flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
          </div>
          <span className="mt-4 text-zinc-400 font-medium text-sm tracking-wide">Initializing workspace...</span>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Login />;
  }

  return (
    <Router>
      <ErrorBoundary>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/search" element={<SearchQueue />} />

            {/* Clinical Routes */}
            <Route path="/hub/:patientId" element={<ClinicalHub />} />
            <Route path="/hub" element={<ClinicalHub />} />
            <Route path="/history/:patientId" element={<PatientHistory />} />
            <Route path="/history" element={<PatientHistory />} />

            <Route path="/reports" element={['Admin', 'Dentist', 'Receptionist'].includes(user?.role) ? <Reports /> : <AccessDenied />} />
            <Route path="/users" element={user?.role === 'Admin' ? <UserManagement /> : <AccessDenied />} />
          </Routes>
        </Layout>
      </ErrorBoundary>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ className: 'font-sans text-sm font-semibold rounded-2xl shadow-xl border border-zinc-100' }} />
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;

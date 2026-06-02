import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import TaskBoard from './components/TaskBoard';
import TaskModal from './components/TaskModal';
import Login from './components/Login';
import NotifyBoard from './components/NotifyBoard';
import { EventProvider } from './context/EventContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotifyProvider } from './context/NotifyContext';
import NotifyWindow from './components/NotifyWindow';

function AppContent() {
  const { currentUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProgressReminder, setShowProgressReminder] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const todayStr = now.toISOString().split('T')[0];
      const lastReminded = localStorage.getItem('lastProgressReminder');
      
      if (hours >= 16 && hours < 17 && lastReminded !== todayStr) {
        setShowProgressReminder(true);
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const dismissReminder = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('lastProgressReminder', todayStr);
    setShowProgressReminder(false);
  };

  useEffect(() => {
    const themeColor = localStorage.getItem('themeColor');
    const bgColor = localStorage.getItem('bgColor');
    const fontFamily = localStorage.getItem('fontFamily');
    const appScale = localStorage.getItem('appScale');

    const root = document.documentElement;
    if (themeColor) {
      root.style.setProperty('--primary-accent', themeColor);
      root.style.setProperty('--primary-pastel', `${themeColor}33`);
    }
    if (bgColor) {
      root.style.setProperty('--bg-main', bgColor);
    }
    if (fontFamily) {
      document.body.style.fontFamily = fontFamily;
    }
    if (appScale) {
      document.body.style.zoom = appScale === '110%' ? '1.1' : (appScale === '90%' ? '0.9' : '1');
    }
  }, []);

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-active' : ''}`}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="main-content">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/tasks" element={<TaskBoard />} />
            <Route path="/notify" element={<NotifyBoard />} />
            <Route path="/reports" element={<CalendarView />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <NotifyWindow />

      {/* Daily Progress Reminder Toast */}
      {showProgressReminder && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '16px',
          boxShadow: '0 12px 30px rgba(16, 185, 129, 0.4)',
          border: '1px solid rgba(255,255,255,0.2)',
          zIndex: 9999,
          width: '340px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <button 
            onClick={dismissReminder}
            style={{
              position: 'absolute', top: '12px', right: '12px', background: 'transparent',
              border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: '2px'
            }}
          >
            <X size={14} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertCircle size={18} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: '800' }}>Daily Update Reminder</span>
              <span style={{ fontSize: '11px', opacity: 0.9 }}>Action required before 17:00</span>
            </div>
          </div>
          
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', lineHeight: '1.4' }}>
            Please update the completion percentage (%) for your "In Progress" tasks.
          </p>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button 
              onClick={() => {
                dismissReminder();
                navigate('/tasks');
              }}
              style={{
                background: 'white', color: '#059669', border: 'none', padding: '8px 16px',
                borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', flex: 1
              }}
            >
              Update Now
            </button>
            <button 
              onClick={dismissReminder}
              style={{
                background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px',
                borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', flex: 1
              }}
            >
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotifyProvider>
        <EventProvider>
          <Router>
            <AppContent />
            <TaskModal />
          </Router>
        </EventProvider>
      </NotifyProvider>
    </AuthProvider>
  );
}

export default App;

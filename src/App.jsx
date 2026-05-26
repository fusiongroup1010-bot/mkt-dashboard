import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

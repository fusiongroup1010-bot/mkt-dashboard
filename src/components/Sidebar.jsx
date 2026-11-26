import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CalendarClock, LayoutDashboard, ChevronLeft, Megaphone } from 'lucide-react';
import logo from '../assets/fusion-logo.png';
import { useNotify } from '../context/NotifyContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { unreadCount } = useNotify();
  const { currentUser } = useAuth();

  return (
    <>
    {/* Overlay on mobile when sidebar is open */}
    {isOpen && <div className="sidebar-overlay-mobile" onClick={onClose} />}
    
    <aside className={`sidebar soft-panel ${isOpen ? 'active' : ''}`}>
      <div className="sidebar-brand-header">
        {/* Mobile close button - shown via CSS on mobile */}
        <button 
          className="sidebar-close-mobile"
          onClick={onClose}
        >
          <ChevronLeft size={24} />
        </button>
        <img src={logo} alt="MKT Dashboard Logo" className="sidebar-logo" />
        <h2 className="sidebar-brand-title">
          MKT Dashboard
        </h2>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
        <p style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Main Menu</p>
        
        <NavLink to="/" style={{ textDecoration: 'none' }} end>
          {({ isActive }) => (
            <div className={`btn-ghost ${isActive ? 'active' : ''}`}>
              <Home size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>Dashboard</span>
            </div>
          )}
        </NavLink>

        <NavLink to="/tasks" style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <div className={`btn-ghost ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>Weekly Task</span>
            </div>
          )}
        </NavLink>

        <NavLink to="/calendar" style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <div className={`btn-ghost ${isActive ? 'active' : ''}`}>
              <CalendarClock size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>Month Report/Meeting</span>
            </div>
          )}
        </NavLink>

        <NavLink to="/notify" style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <div className={`btn-ghost ${isActive ? 'active' : ''}`}>
              <div style={{ position: 'relative' }}>
                <Megaphone size={20} strokeWidth={isActive ? 2.5 : 2} />
                {unreadCount > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', border: '1.5px solid white', borderRadius: '50%', width: '10px', height: '10px' }}></span>}
              </div>
              <span>Notify Center</span>
            </div>
          )}
        </NavLink>
        
      </div>

      </aside>
    </>
  );
};

export default Sidebar;

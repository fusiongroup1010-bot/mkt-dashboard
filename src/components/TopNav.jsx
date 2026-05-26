import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Plus, Calendar as CalendarIcon, Menu, MapPin, User, Settings, LogOut, Edit3, ChevronDown, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import SettingsModal from './SettingsModal';
import ProfileModal from './ProfileModal';
import PasswordModal from './PasswordModal';

const TopNav = ({ onMenuClick }) => {
  const today = new Date();
  const location = useLocation();
  const { openAddModal, activeLocation, setActiveLocation } = useEvents();
  const { currentUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [profileMode, setProfileMode] = useState('view');

  return (
    <header className="top-nav" style={{ marginBottom: '24px', position: 'relative' }}>
      <button 
        className="sidebar-toggle-main-mobile"
        style={{ display: 'none' }}
        onClick={onMenuClick}
      >
        <Menu size={24} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
        {/* Location selector removed (Simplified version) */}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontWeight: '600', paddingRight: '12px', borderRight: '1px solid var(--border-light)' }}>
           <CalendarIcon size={18} color="var(--primary-accent)"/>
           <span>{format(today, 'EEEE, MMM dd', { locale: enUS })}</span>
        </div>

        {currentUser?.role !== 'guest' && location.pathname !== '/' && (
          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={openAddModal}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Task</span>
          </button>
        )}
        
        {/* User Badge with Dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ 
              padding: '0 16px', height: '44px', borderRadius: '16px', 
              background: '#f59e0b', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', fontWeight: '800', color: '#ffffff', 
              marginLeft: '4px', cursor: 'pointer', boxShadow: 'var(--shadow-soft)', 
              fontSize: '14px', gap: '8px', border: isDropdownOpen ? '1px solid #d97706' : '1px solid transparent'
            }}
          >
            {currentUser ? (currentUser.id === 'Guest' ? 'Guest mode' : currentUser.name) : 'Guest'}
            <ChevronDown size={14} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {isDropdownOpen && (
            <div 
              className="soft-panel animate-fade-in"
              style={{
                position: 'absolute', top: '54px', right: 0, width: '220px',
                padding: '8px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '4px',
                background: 'var(--bg-panel)', border: '1px solid var(--border-light)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', marginBottom: '4px' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{currentUser?.name}</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{currentUser?.id}</p>
              </div>

              <button className="user-dropdown-item" onClick={() => { setIsSettingsOpen(true); setIsDropdownOpen(false); }}>
                <Settings size={16} />
                <span>Settings</span>
              </button>
              
              <button className="user-dropdown-item" onClick={() => { setProfileMode('view'); setIsProfileOpen(true); setIsDropdownOpen(false); }}>
                <User size={16} />
                <span>Personal Info</span>
              </button>

              <button className="user-dropdown-item" onClick={() => { setProfileMode('edit'); setIsProfileOpen(true); setIsDropdownOpen(false); }}>
                <Edit3 size={16} />
                <span>Change Name</span>
              </button>

              <button className="user-dropdown-item" onClick={() => { setIsPasswordOpen(true); setIsDropdownOpen(false); }}>
                <Lock size={16} />
                <span>Change Password</span>
              </button>

              <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />

              <button 
                className="user-dropdown-item" 
                onClick={() => { logout(); setIsDropdownOpen(false); }}
                style={{ color: '#ef4444' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} initialMode={profileMode} />
      <PasswordModal isOpen={isPasswordOpen} onClose={() => setIsPasswordOpen(false)} />
    </header>
  );
};

export default TopNav;

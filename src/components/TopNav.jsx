import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Plus, Calendar as CalendarIcon, Menu, MapPin, User, Settings, LogOut, Edit3, ChevronDown, Lock, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import SettingsModal from './SettingsModal';
import ProfileModal from './ProfileModal';
import PasswordModal from './PasswordModal';
import UserManagementModal from './UserManagementModal';

const TopNav = ({ onMenuClick, onOpenUserMgmt }) => {
  const today = new Date();
  const location = useLocation();
  const { openAddModal, activeLocation, setActiveLocation } = useEvents();
  const { currentUser, logout, isAdmin } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [internalUserMgmtOpen, setInternalUserMgmtOpen] = useState(false);
  const [profileMode, setProfileMode] = useState('view');

  const handleOpenUserMgmt = () => {
    if (onOpenUserMgmt) {
      onOpenUserMgmt();
    } else {
      setInternalUserMgmtOpen(true);
    }
  };

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

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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

        {isAdmin && (
          <button 
            className="btn-secondary" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a',
              fontWeight: '800', padding: '0 16px', height: '42px', borderRadius: '14px',
              cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '13px'
            }}
            onClick={handleOpenUserMgmt}
            title="Quản lý tài khoản và phân quyền ID nhân viên"
          >
            <Shield size={16} />
            <span>Quản lý ID</span>
          </button>
        )}
        
        {/* User Badge with Dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ 
              padding: '0 16px', height: '44px', borderRadius: '16px', 
              background: isAdmin ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#f59e0b', 
              display: 'flex', alignItems: 'center', 
              justifyContent: 'center', fontWeight: '800', color: '#ffffff', 
              marginLeft: '4px', cursor: 'pointer', boxShadow: 'var(--shadow-soft)', 
              fontSize: '14px', gap: '8px', border: isDropdownOpen ? '1px solid #d97706' : '1px solid transparent'
            }}
          >
            {isAdmin && <span style={{ fontSize: '13px' }}>👑</span>}
            {currentUser ? (currentUser.id === 'Guest' ? 'Guest mode' : currentUser.name) : 'Guest'}
            <ChevronDown size={14} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {isDropdownOpen && (
            <div 
              className="soft-panel animate-fade-in"
              style={{
                position: 'absolute', top: '54px', right: 0, width: '230px',
                padding: '8px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '4px',
                background: 'var(--bg-panel)', border: '1px solid var(--border-light)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{currentUser?.name}</p>
                  {isAdmin && (
                    <span style={{ fontSize: '9px', fontWeight: '800', background: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: '4px' }}>
                      Admin
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>ID: {currentUser?.id}</p>
              </div>

              {isAdmin && (
                <button 
                  className="user-dropdown-item" 
                  onClick={() => { handleOpenUserMgmt(); setIsDropdownOpen(false); }}
                  style={{ color: '#b45309', fontWeight: '800', background: 'rgba(254, 243, 199, 0.5)' }}
                >
                  <Shield size={16} color="#b45309" />
                  <span>Quản lý ID nhân sự</span>
                </button>
              )}

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
      
      {!onOpenUserMgmt && (
        <UserManagementModal isOpen={internalUserMgmtOpen} onClose={() => setInternalUserMgmtOpen(false)} />
      )}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} initialMode={profileMode} />
      <PasswordModal isOpen={isPasswordOpen} onClose={() => setIsPasswordOpen(false)} />
    </header>
  );
};

export default TopNav;

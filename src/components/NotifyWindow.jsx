import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Megaphone, AlertCircle, ExternalLink, CheckCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotify } from '../context/NotifyContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const NotifyWindow = () => {
  const { currentUser } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotify();
  const [isOpen, setIsOpen] = useState(false);
  const [toastNotif, setToastNotif] = useState(null);
  const [lastLatestNotifId, setLastLatestNotifId] = useState(null);
  const [hasOldUnread, setHasOldUnread] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser || notifications.length === 0) return;
    
    const latest = notifications[0];
    
    // Set last ID on first load to prevent toast from popping up immediately on initial login
    if (!lastLatestNotifId) {
      setLastLatestNotifId(latest.id);
      return;
    }
    
    if (latest.id !== lastLatestNotifId) {
      setLastLatestNotifId(latest.id);
      
      // Only toast if it's sent by someone else and is unread
      const isUnread = !latest.readBy?.includes(currentUser.id);
      const isOthers = latest.senderId !== currentUser.id;
      if (isUnread && isOthers) {
        setToastNotif(latest);
        const timer = setTimeout(() => {
          setToastNotif(null);
        }, 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications, currentUser, lastLatestNotifId]);

  useEffect(() => {
    if (!currentUser || notifications.length === 0) {
      setHasOldUnread(false);
      return;
    }
    
    const now = new Date();
    const oldUnread = notifications.some(n => {
      const isUnread = !n.readBy?.includes(currentUser.id);
      if (!isUnread) return false;
      const dt = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
      const diffTime = Math.abs(now - dt);
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays > 2;
    });
    setHasOldUnread(oldUnread);
  }, [notifications, currentUser]);

  if (!currentUser) return null;
  
  // Don't show the floating button if we are already on the Notify page
  if (location.pathname === '/notify') return null;

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.readBy?.includes(currentUser.id));
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  const ScopeLabel = {
    all: 'Company Wide',
    rnd: 'RNDSP Department',
    design: 'HY Design Department',
    mms: 'MMKP Department',
    'hn-mkt': 'HN MKT Department',
    evolution: 'Evolution Department',
    crm: 'CRM Department'
  };

  return (
    <div className="notify-wrapper">
      {/* Toast Alert */}
      {toastNotif && (
        <div 
          onClick={() => {
            setIsOpen(true);
            setToastNotif(null);
          }}
          style={{
            background: 'linear-gradient(135deg, var(--primary-accent) 0%, var(--blue-accent, #1d4ed8) 100%)',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '16px',
            boxShadow: '0 12px 30px rgba(29, 78, 216, 0.4)',
            border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer',
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative'
          }}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setToastNotif(null);
            }}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px'
            }}
          >
            <X size={14} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {toastNotif.type === 'emergency' ? <AlertCircle size={16} color="#fca5a5" /> : <Megaphone size={16} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toastNotif.senderName}</span>
              <span style={{ fontSize: '9px', opacity: 0.8, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toastNotif.senderTitle}</span>
            </div>
          </div>
          
          <p style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: '600',
            lineHeight: '1.4',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {toastNotif.content}
          </p>
        </div>
      )}

      {/* Floating notification list panel */}
      {isOpen && (
        <div className="notify-window animate-slide-up" style={{ marginBottom: '10px' }}>
          {/* Header */}
          <div className="notify-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="notify-icon-container">
                <MessageSquare size={20} />
              </div>
              <div>
                <h4>Notify Board</h4>
                <p>{unreadCount} unread announcements</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px'
                  }}
                >
                  <CheckCheck size={18} />
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="notify-body custom-scrollbar">
            {notifications.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: '12px',
                padding: '40px'
              }}>
                <Megaphone size={40} opacity={0.15} />
                <p style={{ fontSize: '13px', fontWeight: '700' }}>No announcements yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const isUnread = !n.readBy?.includes(currentUser.id);
                const dt = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
                
                return (
                  <div 
                    key={n.id}
                    className={`message-item ${isUnread ? 'unread' : ''} ${n.type === 'emergency' ? 'urgent' : ''}`}
                    onClick={() => isUnread && markAsRead(n.id)}
                  >
                    <div className="message-header">
                      <div className="sender-badge">
                        <span className="sender-name">{n.senderName}</span>
                        <span className="sender-title">{n.senderTitle} · {ScopeLabel[n.recipients[0]] || 'Direct'}</span>
                      </div>
                      <span className="message-time">{format(dt, 'MMM dd, HH:mm', { locale: enUS })}</span>
                    </div>
                    
                    <div className="message-bubble">
                      <p>{n.content}</p>
                      {isUnread && (
                        <span style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--primary-accent)'
                        }}></span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="notify-footer">
            <button 
              onClick={() => {
                setIsOpen(false);
                navigate('/notify');
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--primary-pastel)',
                color: 'var(--primary-accent)',
                fontWeight: '800',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ExternalLink size={14} />
              <span>Full Notify Center</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        className={`notify-toggle ${unreadCount > 0 ? 'has-unread' : ''} ${hasOldUnread ? 'shake-alert' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Notify Panel"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>
    </div>
  );
};

export default NotifyWindow;

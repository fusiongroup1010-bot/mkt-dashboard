import React, { useState } from 'react';
import { Megaphone, Search, Pin, Trash2, CheckCircle, Clock, AlertCircle, Filter, Trash, Search as SearchIcon, X, Eye, EyeOff, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useNotify } from '../context/NotifyContext';
import { useAuth, EMPLOYEES } from '../context/AuthContext';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const NotifyBoard = () => {
  const { currentUser } = useAuth();
  const { notifications, markAsRead, togglePin, deleteNotification, sendNotification, getReadReceipts } = useNotify();
  const [activeTab, setActiveTab] = useState('all'); // all, unread, pinned
  const [search, setSearch] = useState('');
  const [expandedReceiptId, setExpandedReceiptId] = useState(null); // which notif receipt is open
  
  // Compose State
  const [showCompose, setShowCompose] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [recipientScope, setRecipientScope] = useState('all'); // 'all' or specific member id
  const [selectedMembers, setSelectedMembers] = useState([]); // used when scope != 'all'
  const [isUrgent, setIsUrgent] = useState(false);
  const [sending, setSending] = useState(false);

  // Members list (all active staff, no guest)
  const activeMembers = EMPLOYEES.filter(e => e.role !== 'guest');

  const getDisplayName = (id) => {
    const stored = localStorage.getItem(`name_${id}`);
    if (stored) return stored;
    const emp = EMPLOYEES.find(e => e.id === id);
    return emp ? emp.name : id;
  };

  const toggleMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setSending(true);
    try {
      const recipients = recipientScope === 'all'
        ? ['all']
        : selectedMembers.length > 0 ? selectedMembers : ['all'];
      await sendNotification({
        content: newContent,
        recipients,
        type: isUrgent ? 'emergency' : 'normal',
      });
      setNewContent('');
      setShowCompose(false);
      setIsUrgent(false);
      setRecipientScope('all');
      setSelectedMembers([]);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const filtered = notifications.filter(n => {
    const matchesSearch = n.content.toLowerCase().includes(search.toLowerCase()) || 
                         n.senderName.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'unread') return matchesSearch && !n.readBy?.includes(currentUser.id);
    if (activeTab === 'pinned') return matchesSearch && n.pinned;
    return matchesSearch;
  });

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
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header & Controls */}
      <div className="soft-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Megaphone size={28} color="var(--primary-accent)" /> Notify Center
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>Full announcement history & broadcast management</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="soft-panel" style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', gap: '12px', width: '320px', border: '1px solid var(--border-light)', marginBottom: 0 }}>
            <SearchIcon size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '600' }}
            />
          </div>
          {currentUser.role !== 'guest' && (
            <button className="btn-primary" onClick={() => setShowCompose(true)} style={{ padding: '12px 24px', gap: '10px' }}>
              <Megaphone size={18} /> Broadcast
            </button>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 3000 }}>
          <div className="modal-content animate-slide-up" style={{ width: '500px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', background: 'var(--primary-accent)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>New Announcement</h3>
               <button onClick={() => setShowCompose(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSend} style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '800', fontSize: '14px' }}>Target Audience</label>
                
                {/* Toggle: All Members vs Specific */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => { setRecipientScope('all'); setSelectedMembers([]); }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', border: '2px solid',
                      borderColor: recipientScope === 'all' ? 'var(--primary-accent)' : 'var(--border-light)',
                      background: recipientScope === 'all' ? 'var(--primary-pastel)' : 'transparent',
                      color: recipientScope === 'all' ? 'var(--primary-accent)' : 'var(--text-muted)',
                      fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    👥 All Members
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientScope('specific')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', border: '2px solid',
                      borderColor: recipientScope === 'specific' ? 'var(--primary-accent)' : 'var(--border-light)',
                      background: recipientScope === 'specific' ? 'var(--primary-pastel)' : 'transparent',
                      color: recipientScope === 'specific' ? 'var(--primary-accent)' : 'var(--text-muted)',
                      fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    👤 Specific Members
                  </button>
                </div>

                {/* Member checkboxes (only when Specific is selected) */}
                {recipientScope === 'specific' && (
                  <div style={{
                    border: '1px solid var(--border-light)', borderRadius: '12px',
                    maxHeight: '200px', overflowY: 'auto'
                  }}>
                    {activeMembers.map(emp => {
                      const name = getDisplayName(emp.id);
                      const checked = selectedMembers.includes(emp.id);
                      return (
                        <label key={emp.id} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: '1px solid var(--border-light)',
                          background: checked ? 'var(--primary-pastel)' : 'transparent',
                          transition: 'background 0.15s'
                        }}>
                          <input
                            type="checkbox" checked={checked}
                            onChange={() => toggleMember(emp.id)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-accent)', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{emp.title}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '800', fontSize: '14px' }}>Message Content</label>
                <textarea 
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Type your announcement here..."
                  style={{ width: '100%', height: '150px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)', outline: 'none', resize: 'none', fontSize: '15px' }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', color: isUrgent ? '#ef4444' : 'var(--text-muted)' }}>
                  <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} />
                  <AlertCircle size={18} /> Emergency
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowCompose(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={sending || !newContent.trim()}>
                    {sending ? 'Sending...' : 'Post Now'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '28px', flex: 1, overflow: 'hidden' }}>
        
        {/* Navigation / Filters Sidebar */}
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
           {[
             { id: 'all', label: 'All Notices', icon: Megaphone },
             { id: 'unread', label: 'Unread', icon: Clock },
             { id: 'pinned', label: 'Pinned', icon: Pin },
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`btn-ghost ${activeTab === tab.id ? 'active' : ''}`}
               style={{ justifyContent: 'flex-start', padding: '12px 16px', gap: '12px' }}
             >
               <tab.icon size={18} />
               <span>{tab.label}</span>
               {tab.id === 'unread' && notifications.filter(n => !n.readBy?.includes(currentUser.id)).length > 0 && (
                 <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '10px' }}>
                   {notifications.filter(n => !n.readBy?.includes(currentUser.id)).length}
                 </span>
               )}
             </button>
           ))}
        </div>

        {/* History List */}
        <div className="soft-panel" style={{ flex: 1, background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', padding: '28px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
           {filtered.length === 0 ? (
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '16px' }}>
               <Megaphone size={60} opacity={0.1} />
               <p style={{ fontWeight: '600' }}>No announcements matching your criteria</p>
             </div>
           ) : (
             <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px' }} className="custom-scrollbar">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filtered.map(n => {
                    const isUnread = !n.readBy?.includes(currentUser.id);
                    const dt = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
                    
                    return (
                      <div 
                        key={n.id} 
                        className={`notify-board-item ${n.type === 'emergency' ? 'emergency' : ''} ${isUnread ? 'unread' : ''}`}
                        onClick={() => isUnread && markAsRead(n.id)}
                        style={{
                          padding: '20px',
                          background: isUnread ? 'var(--primary-pastel)' : 'var(--bg-main)',
                          borderRadius: '16px',
                          border: isUnread ? '1px solid var(--primary-accent)' : '1px solid var(--border-light)',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '44px', height: '44px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: n.type === 'emergency' ? '#ef4444' : 'var(--primary-accent)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                               {n.type === 'emergency' ? <AlertCircle size={22} /> : <Megaphone size={22} />}
                            </div>
                            <div>
                               <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{n.senderName}</h4>
                               <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{n.senderTitle} · {ScopeLabel[n.recipients[0]] || 'Direct'}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                             <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>{format(dt, 'MMM dd, HH:mm', { locale: enUS })}</p>
                             {isUnread && <span style={{ fontSize: '10px', color: 'white', background: 'var(--primary-accent)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: '800', marginTop: '4px', display: 'inline-block' }}>NEW</span>}
                          </div>
                        </div>

                        <div style={{ paddingLeft: '56px' }}>
                          <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-primary)', fontWeight: '500', whiteSpace: 'pre-wrap' }}>{n.content}</p>
                          
                          {/* Bottom row: actions + read receipts */}
                          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                             {currentUser.canSendNotify && (
                               <button 
                                 className="btn-ghost-mini" 
                                 onClick={(e) => { e.stopPropagation(); togglePin(n.id, n.pinned); }}
                                 style={{ color: n.pinned ? 'var(--primary-accent)' : undefined }}
                               >
                                 <Pin size={14} fill={n.pinned ? 'currentColor' : 'none'} /> {n.pinned ? 'Pinned' : 'Pin'}
                               </button>
                             )}
                              {(n.senderId === currentUser.id || currentUser.id === 'CEOFS' || currentUser.isSpecialAccount) && (
                                <button 
                                  className="btn-ghost-mini" 
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                  style={{ color: '#ef4444' }}
                                >
                                  <Trash size={14} /> Delete
                                </button>
                              )}

                             {/* Read Receipts - aligned right */}
                             <div style={{ marginLeft: 'auto', position: 'relative' }}>
                               {(() => {
                                 const { readUsers, unreadUsers } = getReadReceipts(n);
                                 const total = readUsers.length + unreadUsers.length;
                                 const readCount = readUsers.length;
                                 const isSenderOrAdmin = n.senderId === currentUser.id || currentUser.id === 'CEOFS' || currentUser.isSpecialAccount;
                                 const isExpanded = expandedReceiptId === n.id;
                                 const allRead = readCount === total && total > 0;

                                 return (
                                   <div>
                                     {/* Badge button */}
                                     <button
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         if (isSenderOrAdmin) setExpandedReceiptId(isExpanded ? null : n.id);
                                       }}
                                       style={{
                                         display: 'flex', alignItems: 'center', gap: '6px',
                                         fontSize: '12px', fontWeight: '700',
                                         color: allRead ? '#16a34a' : unreadUsers.length > 0 ? '#d97706' : 'var(--text-muted)',
                                         background: allRead ? '#dcfce7' : unreadUsers.length > 0 ? '#fef3c7' : 'var(--bg-panel-hover)',
                                         padding: '5px 12px', borderRadius: '20px',
                                         border: `1.5px solid ${allRead ? '#86efac' : unreadUsers.length > 0 ? '#fcd34d' : 'var(--border-light)'}`,
                                         cursor: isSenderOrAdmin ? 'pointer' : 'default',
                                         transition: 'all 0.2s',
                                         userSelect: 'none',
                                       }}
                                     >
                                       <Eye size={13} />
                                       <span>{readCount}/{total} read</span>
                                       {isSenderOrAdmin && (
                                         isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>
                                       )}
                                     </button>

                                     {/* Expanded Receipt Dropdown */}
                                     {isExpanded && isSenderOrAdmin && (
                                       <div
                                         onClick={e => e.stopPropagation()}
                                         style={{
                                           position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                           width: '260px',
                                           background: 'var(--bg-panel)',
                                           borderRadius: '16px',
                                           boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
                                           border: '1px solid var(--border-light)',
                                           zIndex: 200,
                                           animation: 'popIn 0.2s cubic-bezier(0.16,1,0.3,1)',
                                           overflow: 'hidden',
                                         }}
                                       >
                                         {/* Header */}
                                         <div style={{
                                           padding: '12px 16px',
                                           borderBottom: '1px solid var(--border-light)',
                                           display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                           background: 'var(--bg-panel)',
                                           position: 'sticky', top: 0, zIndex: 1,
                                         }}>
                                           <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                                             <Users size={14} /> Read Receipts
                                           </span>
                                           <button onClick={() => setExpandedReceiptId(null)} style={{ color: 'var(--text-muted)', lineHeight: 1 }}>
                                             <X size={14}/>
                                           </button>
                                         </div>

                                         {/* Scrollable Read List */}
                                         {readUsers.length > 0 ? (
                                           <>
                                             <div style={{ padding: '8px 12px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                               <CheckCircle size={12} color="#16a34a"/>
                                               <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#16a34a', letterSpacing: '0.5px' }}>
                                                 Read · {readUsers.length}
                                               </span>
                                             </div>
                                             <div style={{
                                               maxHeight: '220px',
                                               overflowY: 'auto',
                                               padding: '4px 12px 8px',
                                               display: 'flex', flexDirection: 'column', gap: '4px',
                                             }}>
                                               {readUsers.map(u => (
                                                 <div key={u.id} style={{
                                                   display: 'flex', alignItems: 'center', gap: '10px',
                                                   padding: '7px 10px', borderRadius: '10px',
                                                   background: '#f0fdf4',
                                                 }}>
                                                   <div style={{
                                                     width: '30px', height: '30px', borderRadius: '9px', flexShrink: 0,
                                                     background: '#dcfce7', display: 'flex', alignItems: 'center',
                                                     justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#15803d'
                                                   }}>
                                                     {u.name.charAt(0).toUpperCase()}
                                                   </div>
                                                   <div style={{ minWidth: 0 }}>
                                                     <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
                                                     <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)' }}>{u.title}</p>
                                                   </div>
                                                   <CheckCircle size={13} color="#16a34a" style={{ marginLeft: 'auto', flexShrink: 0 }}/>
                                                 </div>
                                               ))}
                                             </div>
                                           </>
                                         ) : (
                                           <p style={{ margin: 0, padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>No one has read this yet</p>
                                         )}

                                         {/* Footer: Not yet read count */}
                                         {unreadUsers.length > 0 && (
                                           <div style={{
                                             padding: '9px 16px',
                                             borderTop: '1px solid var(--border-light)',
                                             background: '#fff7ed',
                                             display: 'flex', alignItems: 'center', gap: '7px',
                                           }}>
                                             <EyeOff size={13} color="#d97706"/>
                                             <span style={{ fontSize: '12px', fontWeight: '700', color: '#d97706' }}>
                                               {unreadUsers.length} not yet read
                                             </span>
                                           </div>
                                         )}
                                       </div>
                                     )}
                                   </div>
                                 );
                               })()}
                             </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default NotifyBoard;

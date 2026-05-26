import React, { useState, useEffect, useRef } from 'react';
import { User, X, Check, Edit2, Shield, MapPin, Hash, Briefcase, Camera, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';

const ProfileModal = ({ isOpen, onClose, initialMode = 'view' }) => {
  const { currentUser, updateProfile } = useAuth();
  const { refreshDepartments } = useEvents();
  const [mode, setMode] = useState(initialMode); // 'view' or 'edit'
  const fileInputRef = useRef();

  // Edit State
  const [tempName, setTempName] = useState('');
  const [tempDept, setTempDept] = useState('');
  const [tempAddr, setTempAddr] = useState('');
  const [tempAvatar, setTempAvatar] = useState(null);
  
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setTempName(currentUser.name);
      setTempDept(currentUser.department || currentUser.title || '');
      setTempAddr(currentUser.address || currentUser.allowedLocations[0] || '');
      setTempAvatar(currentUser.avatar || null);
    }
    setMode(initialMode);
    setSuccess(false);
  }, [isOpen, currentUser, initialMode]);

  if (!isOpen || !currentUser) return null;

  const handleAvatarChange = (e) => {
     const file = e.target.files[0];
     if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
           setTempAvatar(reader.result);
        };
        reader.readAsDataURL(file);
     }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    setLoading(true);
    try {
      await updateProfile({
        name: tempName,
        department: tempDept,
        address: tempAddr,
        avatar: tempAvatar
      });
      // Refresh calendar departments so renamed NVMKT7-10 appear immediately
      refreshDepartments();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMode('view');
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', padding: '0', overflow: 'hidden' }}>
        
        {/* Banner */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--primary-accent), var(--pink-accent))', 
          height: '110px', width: '100%', position: 'relative', 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
           <button 
             onClick={onClose} 
             style={{ position: 'absolute', top: '16px', right: '16px', color: 'white', background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
           >
             <X size={20} />
           </button>
           
           <div style={{ position: 'absolute', bottom: '-45px', background: 'white', padding: '6px', borderRadius: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
             <div style={{ 
                width: '90px', height: '90px', borderRadius: '26px', 
                overflow: 'hidden', background: 'var(--primary-pastel)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-accent)',
                position: 'relative'
             }}>
                {(mode === 'edit' ? tempAvatar : currentUser.avatar) ? (
                   <img src={mode === 'edit' ? tempAvatar : currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                   <User size={48} />
                )}
                
                {mode === 'edit' && (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                  >
                    <Camera size={24} />
                  </button>
                )}
             </div>
             <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} />
           </div>
        </div>

        <div style={{ padding: '64px 32px 32px 32px' }}>
          {mode === 'view' ? (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>{currentUser.name}</h2>
              <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>
                <Shield size={12} /> {currentUser.role === 'admin' ? 'Authorized Access' : 'Guest Mode'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Briefcase size={18} color="var(--primary-accent)" />
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</p>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{currentUser.department || currentUser.title || 'General Staff'}</p>
                    </div>
                </div>



                <div style={{ padding: '16px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Hash size={18} color="var(--primary-accent)" />
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employee ID</p>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{currentUser.id}</p>
                    </div>
                </div>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Close</button>
                <button onClick={() => setMode('edit')} className="btn-primary" style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Edit2 size={16} /> Edit Profile
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', textAlign: 'center' }}>Personal Info</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center' }}>Update your identity details</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group-mini">
                    <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Full Name</label>
                    <input value={tempName} onChange={e => setTempName(e.target.value)} placeholder="Full Name" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)', outline: 'none' }} />
                </div>

                <div className="form-group-mini">
                    <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Department</label>
                    <input value={tempDept} onChange={e => setTempDept(e.target.value)} placeholder="e.g. Sales, Account..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)', outline: 'none' }} />
                </div>


              </div>

              <div style={{ marginTop: '32px', display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setMode('view')} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', background: success ? '#10b981' : undefined }} disabled={loading}>
                  {loading ? '...' : (success ? <Check size={20} /> : 'Save Changes')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

import React, { useState } from 'react';
import { Shield, X, Check, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PasswordModal = ({ isOpen, onClose }) => {
  const { currentUser, changePassword } = useAuth();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newPassword) {
      setError('Please provide a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setSuccess(false);
    onClose();
  };

  if (currentUser.role === 'guest') {
    return (
      <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
        <div className="modal-content animate-fade-in" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <button className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }} onClick={handleClose}>
            <X size={20} />
          </button>
          <Shield size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
          <h3>Guest Mode</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Guests do not have a password to change.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '400px', padding: '0', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', height: '80px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <button onClick={handleClose} style={{ position: 'absolute', top: '16px', right: '16px', color: 'white', background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
             <X size={20} />
           </button>
           <div style={{ position: 'absolute', bottom: '-28px', background: 'white', padding: '6px', borderRadius: '50%', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
             <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
               <Lock size={24} />
             </div>
           </div>
        </div>

        <div style={{ padding: '48px 32px 32px 32px' }}>
          <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)', textAlign: 'center' }}>Change Password</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center' }}>Secure your account credentials</p>
            
            {error && (
              <div style={{ background: '#fee2e2', color: '#ef4444', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                {error}
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group-mini">
                  <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '12px 40px 12px 12px', borderRadius: '12px', border: '1px solid var(--border-light)', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', background: 'none', border: 'none',
                        padding: '4px', cursor: 'pointer', color: '#64748b',
                        display: 'flex', alignItems: 'center', outline: 'none',
                      }}
                    >
                      {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
              </div>

              <div className="form-group-mini">
                  <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '12px 40px 12px 12px', borderRadius: '12px', border: '1px solid var(--border-light)', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', background: 'none', border: 'none',
                        padding: '4px', cursor: 'pointer', color: '#64748b',
                        display: 'flex', alignItems: 'center', outline: 'none',
                      }}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
              </div>

              <div className="form-group-mini">
                  <label style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '12px 40px 12px 12px', borderRadius: '12px', border: '1px solid var(--border-light)', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)', background: 'none', border: 'none',
                        padding: '4px', cursor: 'pointer', color: '#64748b',
                        display: 'flex', alignItems: 'center', outline: 'none',
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '10px' }}>
              <button type="button" onClick={handleClose} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', background: success ? '#10b981' : undefined }} disabled={loading}>
                {loading ? '...' : (success ? <Check size={20} /> : 'Update')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, LogIn } from 'lucide-react';

const Login = () => {
  const [userId, setUserId]           = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId.trim()) {
      setError('Vui lòng nhập ID đăng nhập.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      await login(userId.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Sai ID hoặc mật khẩu.');
    } finally {
      setLoading(false);
    }
  }

  /* ─── inline style helpers ─── */
  const inputBase = {
    width: '100%',
    padding: '13px 44px 13px 16px',
    borderRadius: '14px',
    border: '1.5px solid #cbd5e1',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const labelBase = {
    fontSize: '11px',
    fontWeight: '800',
    color: '#475569',
    letterSpacing: '0.75px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    display: 'block',
  };

  function onFocus(e) {
    e.target.style.borderColor = '#2b70c9';
    e.target.style.boxShadow   = '0 0 0 3px rgba(43,112,201,0.15)';
  }
  function onBlur(e) {
    e.target.style.borderColor = '#cbd5e1';
    e.target.style.boxShadow   = 'none';
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #eef4f8 0%, #d8e3ed 100%)',
      fontFamily: "'Nunito', -apple-system, sans-serif",
      overflow: 'hidden',
      padding: '20px',
    }}>

      {/* Decorative blur circles */}
      <div style={{ width:'320px', height:'320px', background:'rgba(43,112,201,0.14)', borderRadius:'50%', filter:'blur(80px)', position:'absolute', top:'15%', left:'20%', zIndex:1 }} />
      <div style={{ width:'380px', height:'380px', background:'rgba(14,165,233,0.12)', borderRadius:'50%', filter:'blur(100px)', position:'absolute', bottom:'15%', right:'20%', zIndex:1 }} />

      {/* Card */}
      <div className="animate-fade-in" style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        borderRadius: '32px',
        padding: '48px 36px 40px 36px',
        boxShadow: '0 25px 50px -12px rgba(15,23,42,0.1), 0 0 1px 1px rgba(15,23,42,0.02)',
        border: '1px solid rgba(255,255,255,0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* Icon */}
        <div style={{
          width: '76px', height: '76px',
          background: 'linear-gradient(135deg, #2b70c9 0%, #1e5ba3 100%)',
          borderRadius: '22px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(43,112,201,0.28)',
          marginBottom: '24px',
        }}>
          <User size={34} style={{ color: '#ffffff' }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '22px', fontWeight: '900', color: '#0f172a',
          letterSpacing: '0.5px', marginBottom: '8px',
          textTransform: 'uppercase', textAlign: 'center',
        }}>
          Đăng nhập
        </h1>
        <p style={{
          fontSize: '13px', color: '#64748b', fontWeight: '600',
          lineHeight: '1.5', maxWidth: '300px', textAlign: 'center',
          marginBottom: '28px',
        }}>
          Nhập ID và mật khẩu để truy cập MKT Dashboard.
        </p>

        {/* Error */}
        {error && (
          <div style={{
            width: '100%', background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', padding: '12px 16px', borderRadius: '14px',
            fontSize: '13px', fontWeight: '700', textAlign: 'center',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>

          {/* ID field */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelBase}>ID đăng nhập</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-userid"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                autoComplete="username"
                placeholder="Nhập ID của bạn..."
                style={{ ...inputBase, paddingLeft: '44px' }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <User size={18} style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none',
              }} />
            </div>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: '28px' }}>
            <label style={labelBase}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Nhập mật khẩu..."
                style={inputBase}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  padding: '4px', cursor: 'pointer', color: '#64748b',
                  display: 'flex', alignItems: 'center', outline: 'none',
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            disabled={loading}
            type="submit"
            style={{
              width: '100%', padding: '14px 20px', borderRadius: '14px',
              border: 'none',
              background: loading
                ? '#94a3b8'
                : 'linear-gradient(135deg, #2b70c9 0%, #1e5ba3 100%)',
              color: '#ffffff', fontSize: '15px', fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 8px 20px rgba(43,112,201,0.28)',
            }}
            onMouseOver={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(43,112,201,0.38)'; } }}
            onMouseOut={(e)  => { if (!loading) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(43,112,201,0.28)'; } }}
            onMouseDown={(e) => { if (!loading)  e.currentTarget.style.transform = 'translateY(1px)'; }}
          >
            {loading ? (
              'Đang xác thực...'
            ) : (
              <><LogIn size={18} /> Đăng nhập</>
            )}
          </button>

        </form>

        {/* Footer */}
        <div style={{ marginTop: '36px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
          © 2026 MKT Dashboard · Fusion Group
        </div>

      </div>
    </div>
  );
};

export default Login;

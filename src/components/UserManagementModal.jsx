import React, { useState } from 'react';
import { 
  X, UserPlus, Trash2, Shield, User, Key, Eye, EyeOff, 
  Search, CheckCircle2, AlertCircle, Lock, Briefcase, Palette
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';

const PRESET_COLORS = [
  '#6366f1', // Indigo (Phuc)
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#64748b'  // Slate
];

const UserManagementModal = ({ isOpen, onClose }) => {
  const { employees, isAdmin, addEmployee, deleteEmployee, currentUser } = useAuth();
  const { refreshDepartments } = useEvents();

  // Form State
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newTitle, setNewTitle] = useState('MKT Staff');
  const [newColor, setNewColor] = useState(PRESET_COLORS[4]); // Default blue
  const [showFormPassword, setShowFormPassword] = useState(false);

  // UI state
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  if (!isOpen) return null;

  const togglePasswordVisibility = (id) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await addEmployee({
        id: newId,
        name: newName,
        pass: newPass,
        title: newTitle,
        color: newColor
      });

      refreshDepartments();
      setSuccess(`Đã tạo thành công tài khoản ID: ${newId.trim()} cho ${newName.trim()}`);
      setNewId('');
      setNewName('');
      setNewPass('');
      setNewTitle('MKT Staff');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Lỗi khi tạo tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (empId, empName) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await deleteEmployee(empId);
      refreshDepartments();
      setSuccess(`Đã xóa tài khoản ID: ${empId} (${empName})`);
      setConfirmDeleteId(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Lỗi khi xóa tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered employees list (exclude Guest from staff list, show regular + admin)
  const staffList = employees
    .filter(e => e.id !== 'Guest')
    .filter(e => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        e.id.toLowerCase().includes(q) ||
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.title && e.title.toLowerCase().includes(q))
      );
    });

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 2500 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '820px', 
          width: '94%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          borderRadius: '24px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.25)'
              }}>
                <Shield size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Quản lý ID & Phân quyền Nhân viên
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ 
                    fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', 
                    background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px'
                  }}>
                    Quyền Admin: {currentUser?.name || 'Phúc'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Thêm mới hoặc thu hồi ID tài khoản nhân viên
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button className="btn-icon" onClick={onClose} style={{ borderRadius: '12px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
            padding: '12px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669',
            padding: '12px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'
          }}>
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Form Thêm ID mới */}
          <div style={{
            background: 'var(--bg-panel-hover, #f8fafc)',
            border: '1px solid var(--border-light)',
            borderRadius: '18px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <UserPlus size={18} color="var(--primary-accent)" />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Tạo thêm ID tài khoản nhân viên
              </h3>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {/* ID Input */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  ID đăng nhập *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={newId}
                    onChange={e => setNewId(e.target.value.replace(/\s+/g, ''))}
                    placeholder="VD: NVMKT11, HuongMKT"
                    required
                    style={{
                      width: '100%', padding: '10px 12px 10px 34px', borderRadius: '10px',
                      border: '1.5px solid var(--border-light)', background: 'var(--bg-main)',
                      fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                  <User size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="VD: Nguyễn Thu Hường"
                  required
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '10px',
                    border: '1.5px solid var(--border-light)', background: 'var(--bg-main)',
                    fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Password Input */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Mật khẩu ban đầu *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="VD: MKTHN11"
                    required
                    style={{
                      width: '100%', padding: '10px 36px 10px 34px', borderRadius: '10px',
                      border: '1.5px solid var(--border-light)', background: 'var(--bg-main)',
                      fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                  <Key size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    style={{
                      position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex'
                    }}
                  >
                    {showFormPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Title / Position */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Chức vụ
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="VD: MKT Staff, Designer"
                    style={{
                      width: '100%', padding: '10px 12px 10px 34px', borderRadius: '10px',
                      border: '1.5px solid var(--border-light)', background: 'var(--bg-main)',
                      fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                  <Briefcase size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>

              {/* Color Selection */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Màu đại diện trên lịch công việc
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewColor(c)}
                      style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: c, border: newColor === c ? '3px solid #0f172a' : '2px solid white',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)', cursor: 'pointer',
                        transform: newColor === c ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={newColor}
                    onChange={e => setNewColor(e.target.value)}
                    title="Chọn màu tùy chỉnh"
                    style={{
                      width: '28px', height: '28px', padding: 0, border: 'none',
                      borderRadius: '8px', cursor: 'pointer', marginLeft: '6px'
                    }}
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    padding: '10px 22px', fontSize: '13px', fontWeight: '800',
                    display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px'
                  }}
                >
                  <UserPlus size={16} />
                  <span>{loading ? 'Đang tạo...' : 'Tạo tài khoản'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Danh sách tài khoản */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Danh sách nhân sự hiện tại ({staffList.length})
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Tất cả nhân viên có thể sử dụng ID và mật khẩu để đăng nhập vào MKT Dashboard
                </p>
              </div>

              {/* Search */}
              <div style={{
                position: 'relative', width: '220px'
              }}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, ID..."
                  style={{
                    width: '100%', padding: '8px 12px 8px 32px', borderRadius: '10px',
                    border: '1px solid var(--border-light)', background: 'var(--bg-main)',
                    fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            {/* List Table / Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {staffList.map(emp => {
                const isPhucAdmin = emp.id === 'PhucMKT';
                const currentPass = localStorage.getItem(`pass_${emp.id}`) || emp.pass || '***';
                const isPassVisible = revealedPasswords[emp.id];
                const empColor = emp.color || '#3b82f6';

                return (
                  <div
                    key={emp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '14px',
                      transition: 'all 0.2s ease',
                      gap: '12px'
                    }}
                  >
                    {/* Left: Avatar + Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '12px',
                        background: empColor, color: '#ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '15px', fontWeight: '800', flexShrink: 0
                      }}>
                        {emp.name ? emp.name.charAt(0).toUpperCase() : emp.id.charAt(0)}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            {emp.name}
                          </span>
                          {isPhucAdmin && (
                            <span style={{
                              fontSize: '10px', fontWeight: '800', background: '#fef3c7',
                              color: '#b45309', padding: '1px 6px', borderRadius: '4px',
                              border: '1px solid #fde68a'
                            }}>
                              👑 Admin
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {emp.title || 'MKT Staff'}
                        </span>
                      </div>
                    </div>

                    {/* Middle: ID & Password */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'flex-start' }}>
                      {/* ID Badge */}
                      <div style={{
                        padding: '4px 10px', borderRadius: '8px', background: 'var(--bg-panel-hover, #f1f5f9)',
                        fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', border: '1px solid var(--border-light)'
                      }}>
                        ID: <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>{emp.id}</span>
                      </div>

                      {/* Password pill with eye toggle */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', borderRadius: '8px', background: 'var(--bg-panel-hover, #f8fafc)',
                        border: '1px dashed var(--border-light)', fontSize: '12px'
                      }}>
                        <Key size={12} color="#94a3b8" />
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-secondary)' }}>
                          {isPassVisible ? currentPass : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(emp.id)}
                          style={{
                            background: 'none', border: 'none', padding: '2px',
                            cursor: 'pointer', color: '#94a3b8', display: 'flex'
                          }}
                          title={isPassVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {isPassVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div>
                      {isPhucAdmin ? (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          fontSize: '11px', fontWeight: '700', color: '#94a3b8', padding: '6px 12px'
                        }}>
                          <Lock size={13} />
                          <span>Admin Chính</span>
                        </div>
                      ) : confirmDeleteId === emp.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626' }}>Xác nhận?</span>
                          <button
                            onClick={() => handleDelete(emp.id, emp.name)}
                            disabled={loading}
                            style={{
                              background: '#dc2626', color: 'white', border: 'none',
                              borderRadius: '8px', padding: '4px 8px', fontSize: '11px',
                              fontWeight: '800', cursor: 'pointer'
                            }}
                          >
                            Xóa
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            style={{
                              background: '#e2e8f0', color: '#475569', border: 'none',
                              borderRadius: '8px', padding: '4px 8px', fontSize: '11px',
                              fontWeight: '700', cursor: 'pointer'
                            }}
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(emp.id)}
                          style={{
                            background: 'transparent', border: '1px solid #fee2e2',
                            color: '#ef4444', borderRadius: '10px', padding: '6px 12px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: '700', transition: 'all 0.15s'
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = '#fef2f2'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Trash2 size={14} />
                          <span>Xóa ID</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {staffList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Không tìm thấy nhân viên nào khớp với từ khóa tìm kiếm.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '8px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserManagementModal;

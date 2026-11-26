import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';

const AuthContext = createContext();

export const INITIAL_EMPLOYEES = [
  // MKT Dashboard accounts - Phuc is Admin, others are Staff
  { id: 'PhucMKT',  name: 'Phúc',         role: 'admin', pass: 'MKTHN0',  color: '#6366f1', allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true,  notifyScope: 'all', title: 'MKT Manager' },
  { id: 'NVMKT1',   name: 'Thanh Hoa',    role: 'staff', pass: 'MKTHN1',  color: '#ec4899', allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT2',   name: 'Ngọc Linh',    role: 'staff', pass: 'MKTHN2',  color: '#10b981', allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT3',   name: 'Phương Thảo',  role: 'staff', pass: 'MKTHN3',  color: '#f59e0b', allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT4',   name: 'Thúy Quỳnh',   role: 'staff', pass: 'MKTHN4',  color: '#3b82f6', allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT5',   name: 'Phạm Chiêm',   role: 'staff', pass: 'MKTHN5',  color: '#ef4444', allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT6',   name: 'Thu Trang',    role: 'staff', pass: 'MKTHN6',  color: '#8b5cf6', allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT7',   name: 'NVMKT7',       role: 'staff', pass: 'MKTHN7',  color: '#14b8a6', allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT8',   name: 'NVMKT8',       role: 'staff', pass: 'MKTHN8',  color: '#f97316', allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT9',   name: 'NVMKT9',       role: 'staff', pass: 'MKTHN9',  color: '#84cc16', allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT10',  name: 'NVMKT10',      role: 'staff', pass: 'MKTHN10', color: '#64748b', allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },

  // Guest Mode
  { id: 'Guest', name: 'Guest Mode', role: 'guest', color: '#94a3b8', allowedLocations: ['hanoi'], editableLocations: [], canSendNotify: false, title: 'Guest' }
];

// Fallback constant for backwards compatibility
export let EMPLOYEES = INITIAL_EMPLOYEES;

const STORAGE_KEY_EMPLOYEES = 'mkt_custom_employees';
const STORAGE_KEY_DELETED = 'mkt_deleted_emp_ids';

function loadStoredEmployees() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    const deletedRaw = localStorage.getItem(STORAGE_KEY_DELETED);
    const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Enforce Phuc is admin and others are staff
        const normalized = parsed.map(e => ({
          ...e,
          role: e.id === 'PhucMKT' ? 'admin' : (e.id === 'Guest' ? 'guest' : (e.role || 'staff'))
        })).filter(e => !deletedIds.includes(e.id));
        EMPLOYEES = normalized;
        return normalized;
      }
    }
  } catch (err) {
    console.error('Error loading stored employees:', err);
  }
  return INITIAL_EMPLOYEES;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState(loadStoredEmployees);
  const [loading, setLoading] = useState(true);

  // Sync state to EMPLOYEES export and localStorage
  useEffect(() => {
    EMPLOYEES = employees;
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  // Firestore realtime sync for employees list
  useEffect(() => {
    const colRef = collection(db, 'mkt_employees');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      try {
        const deletedRaw = localStorage.getItem(STORAGE_KEY_DELETED);
        const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];

        if (!snapshot.empty) {
          const cloudList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // Merge INITIAL_EMPLOYEES with cloudList
          const empMap = {};
          INITIAL_EMPLOYEES.forEach(e => {
            if (!deletedIds.includes(e.id)) empMap[e.id] = e;
          });
          cloudList.forEach(e => {
            if (!deletedIds.includes(e.id)) empMap[e.id] = { ...empMap[e.id], ...e };
          });

          // Ensure Guest is present
          if (!empMap['Guest']) {
            empMap['Guest'] = INITIAL_EMPLOYEES.find(e => e.id === 'Guest');
          }

          // Enforce Phuc as admin
          if (empMap['PhucMKT']) {
            empMap['PhucMKT'].role = 'admin';
          }

          const merged = Object.values(empMap);
          setEmployees(merged);
        }
      } catch (e) {
        console.warn('Could not sync employees from Firestore:', e);
      }
    }, (err) => {
      console.warn('Firestore employees snapshot error (offline or rules):', err);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('mockUser_mkt');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        // Ensure role is up-to-date
        if (u.id === 'PhucMKT') {
          u.role = 'admin';
        } else if (u.id !== 'Guest') {
          u.role = 'staff';
        }
        setCurrentUser(u);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }, []);

  const isAdmin = Boolean(
    currentUser && (currentUser.id === 'PhucMKT' || currentUser.role === 'admin')
  );

  function login(userId, password = '', customName = '') {
    const authorizedIds = employees.map(e => e.id.toLowerCase());
    if (!authorizedIds.includes(userId.toLowerCase())) {
      return Promise.reject(new Error('ID không tồn tại. Vui lòng kiểm tra lại.'));
    }

    const user = employees.find(e => e.id.toLowerCase() === userId.toLowerCase());

    if (user) {
      const savedPass = localStorage.getItem(`pass_${user.id}`);
      const validPass = savedPass || user.pass;

      if (user.role === 'guest' || validPass === password) {
        const savedName   = localStorage.getItem(`name_${user.id}`);
        const savedDept   = localStorage.getItem(`dept_${user.id}`);
        const savedAddr   = localStorage.getItem(`addr_${user.id}`);
        const savedAvatar = localStorage.getItem(`avatar_${user.id}`);

        const sessionUser = {
          ...user,
          role: user.id === 'PhucMKT' ? 'admin' : (user.role || 'staff'),
          name:       customName || savedName || user.name,
          department: savedDept  || user.title,
          address:    savedAddr  || (user.allowedLocations && user.allowedLocations[0]) || 'Hà Nội',
          avatar:     savedAvatar || null
        };

        setCurrentUser(sessionUser);
        localStorage.setItem('mockUser_mkt', JSON.stringify(sessionUser));
        if (customName) {
          localStorage.setItem(`name_${user.id}`, customName);
        }
        return Promise.resolve(sessionUser);
      }
    }
    return Promise.reject(new Error('Sai mật khẩu. Vui lòng thử lại.'));
  }

  function updateProfile(profileData) {
    if (!currentUser) return;
    const updated = { ...currentUser, ...profileData };
    setCurrentUser(updated);
    localStorage.setItem('mockUser_mkt', JSON.stringify(updated));

    if (profileData.name)       localStorage.setItem(`name_${currentUser.id}`,   profileData.name);
    if (profileData.department) localStorage.setItem(`dept_${currentUser.id}`,   profileData.department);
    if (profileData.address)    localStorage.setItem(`addr_${currentUser.id}`,   profileData.address);
    if (profileData.avatar)     localStorage.setItem(`avatar_${currentUser.id}`, profileData.avatar);

    return Promise.resolve(updated);
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem('mockUser_mkt');
    return Promise.resolve();
  }

  function changePassword(oldPassword, newPassword) {
    if (!currentUser) return Promise.reject(new Error('Not logged in'));

    const savedPass = localStorage.getItem(`pass_${currentUser.id}`);
    const currentValidPass = savedPass || currentUser.pass;

    if (oldPassword !== currentValidPass && currentUser.role !== 'guest') {
      return Promise.reject(new Error('Mật khẩu hiện tại không đúng'));
    }

    localStorage.setItem(`pass_${currentUser.id}`, newPassword);
    const updated = { ...currentUser, pass: newPassword };
    setCurrentUser(updated);
    localStorage.setItem('mockUser_mkt', JSON.stringify(updated));

    // Also persist in Firestore if connected
    try {
      setDoc(doc(db, 'mkt_employees', currentUser.id), { pass: newPassword }, { merge: true }).catch(() => {});
    } catch (e) {}

    return Promise.resolve();
  }

  // Admin function: Add a new employee ID
  async function addEmployee({ id, name, pass, title = 'MKT Staff', color = '#3b82f6', role = 'staff' }) {
    if (!isAdmin) {
      throw new Error('Chỉ Admin (Phúc) mới có quyền tạo thêm ID nhân viên.');
    }

    const cleanId = (id || '').trim();
    const cleanName = (name || '').trim();
    const cleanPass = (pass || '').trim();

    if (!cleanId) throw new Error('Vui lòng nhập ID nhân viên.');
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanId)) {
      throw new Error('ID chỉ được chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới (không dấu cách).');
    }
    if (!cleanName) throw new Error('Vui lòng nhập họ và tên nhân viên.');
    if (!cleanPass) throw new Error('Vui lòng nhập mật khẩu cho nhân viên.');

    const exists = employees.some(e => e.id.toLowerCase() === cleanId.toLowerCase());
    if (exists) {
      throw new Error(`ID "${cleanId}" đã tồn tại trên hệ thống. Vui lòng chọn ID khác.`);
    }

    const newEmp = {
      id: cleanId,
      name: cleanName,
      role: 'staff',
      pass: cleanPass,
      title: title.trim() || 'MKT Staff',
      color: color || '#3b82f6',
      allowedLocations: ['hanoi'],
      editableLocations: ['hanoi'],
      canSendNotify: true
    };

    // Remove from deleted list if re-adding
    try {
      const deletedRaw = localStorage.getItem(STORAGE_KEY_DELETED);
      if (deletedRaw) {
        const deletedIds = JSON.parse(deletedRaw).filter(d => d.toLowerCase() !== cleanId.toLowerCase());
        localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(deletedIds));
      }
    } catch (e) {}

    const updated = [...employees.filter(e => e.id !== 'Guest'), newEmp, employees.find(e => e.id === 'Guest') || INITIAL_EMPLOYEES.find(e => e.id === 'Guest')];
    setEmployees(updated);
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(updated));

    // Persist password & display name
    localStorage.setItem(`pass_${cleanId}`, cleanPass);
    localStorage.setItem(`name_${cleanId}`, cleanName);
    localStorage.setItem(`dept_${cleanId}`, newEmp.title);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'mkt_employees', cleanId), newEmp, { merge: true });
    } catch (err) {
      console.warn('Could not write new employee to Firestore:', err);
    }

    return newEmp;
  }

  // Admin function: Delete an employee ID
  async function deleteEmployee(employeeId) {
    if (!isAdmin) {
      throw new Error('Chỉ Admin (Phúc) mới có quyền xóa ID nhân viên.');
    }

    if (employeeId === 'PhucMKT') {
      throw new Error('Không thể xóa tài khoản Admin chính (Phúc).');
    }
    if (employeeId === 'Guest') {
      throw new Error('Không thể xóa tài khoản Guest Mode.');
    }

    // Mark as deleted in localStorage
    try {
      const deletedRaw = localStorage.getItem(STORAGE_KEY_DELETED);
      const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
      if (!deletedIds.includes(employeeId)) {
        deletedIds.push(employeeId);
        localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(deletedIds));
      }
    } catch (e) {}

    const updated = employees.filter(e => e.id !== employeeId);
    setEmployees(updated);
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(updated));

    // Delete from Firestore
    try {
      await deleteDoc(doc(db, 'mkt_employees', employeeId));
    } catch (err) {
      console.warn('Could not delete employee from Firestore:', err);
    }

    return true;
  }

  // Helper: get display name of an ID
  function getDisplayName(id) {
    if (!id) return '';
    const stored = localStorage.getItem(`name_${id}`);
    if (stored) return stored;
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : id;
  }

  const value = {
    currentUser,
    employees,
    isAdmin,
    login,
    logout,
    updateProfile,
    changePassword,
    addEmployee,
    deleteEmployee,
    getDisplayName,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

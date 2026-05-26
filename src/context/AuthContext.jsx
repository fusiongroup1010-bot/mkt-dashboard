import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const EMPLOYEES = [
  // MKT Dashboard accounts
  { id: 'PhucMKT',  name: 'Phúc',         role: 'admin', pass: 'MKTHN0',  allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true,  notifyScope: 'all', title: 'MKT Manager' },
  { id: 'NVMKT1',   name: 'Thanh Hoa',    role: 'admin', pass: 'MKTHN1',  allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT2',   name: 'Ngọc Linh',    role: 'admin', pass: 'MKTHN2',  allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT3',   name: 'Phương Thảo',  role: 'admin', pass: 'MKTHN3',  allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT4',   name: 'Thúy Quỳnh',   role: 'admin', pass: 'MKTHN4',  allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT5',   name: 'Phạm Chiêm',   role: 'admin', pass: 'MKTHN5',  allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT6',   name: 'Thu Trang',    role: 'admin', pass: 'MKTHN6',  allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT7',   name: 'NVMKT7',       role: 'admin', pass: 'MKTHN7',  allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT8',   name: 'NVMKT8',       role: 'admin', pass: 'MKTHN8',  allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT9',   name: 'NVMKT9',       role: 'admin', pass: 'MKTHN9',  allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },
  { id: 'NVMKT10',  name: 'NVMKT10',      role: 'admin', pass: 'MKTHN10', allowedLocations: ['hanoi'], editableLocations: ['hanoi'], canSendNotify: true, title: 'MKT Staff' },

  // Guest Mode
  { id: 'Guest', name: 'Guest Mode', role: 'guest', allowedLocations: ['hanoi'], editableLocations: [], canSendNotify: false, title: 'Guest' }
];

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('mockUser_mkt');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  function login(userId, password = '', customName = '') {
    const authorizedIds = EMPLOYEES.map(e => e.id.toLowerCase());
    if (!authorizedIds.includes(userId.toLowerCase())) {
      return Promise.reject(new Error('ID không tồn tại. Vui lòng kiểm tra lại.'));
    }

    const user = EMPLOYEES.find(e => e.id.toLowerCase() === userId.toLowerCase());

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
          name:       customName || savedName || user.name,
          department: savedDept  || user.title,
          address:    savedAddr  || user.allowedLocations[0],
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

    return Promise.resolve();
  }

  const value = {
    currentUser,
    login,
    logout,
    updateProfile,
    changePassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

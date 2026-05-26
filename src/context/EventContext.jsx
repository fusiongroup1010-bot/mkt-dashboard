import React, { createContext, useState, useContext, useEffect } from 'react';

/* ── MKT Members as calendar categories ── */
// Static named members (always visible)
const NAMED_MEMBERS = [
  { id: 'PhucMKT',  name: 'Phúc',          color: '#6366f1', text: '#ffffff', accent: '#6366f1' },
  { id: 'NVMKT1',   name: 'Thanh Hoa',      color: '#ec4899', text: '#ffffff', accent: '#ec4899' },
  { id: 'NVMKT2',   name: 'Ngọc Linh',      color: '#10b981', text: '#ffffff', accent: '#10b981' },
  { id: 'NVMKT3',   name: 'Phương Thảo',    color: '#f59e0b', text: '#ffffff', accent: '#f59e0b' },
  { id: 'NVMKT4',   name: 'Thúy Quỳnh',     color: '#3b82f6', text: '#ffffff', accent: '#3b82f6' },
  { id: 'NVMKT5',   name: 'Phạm Chiêm',     color: '#ef4444', text: '#ffffff', accent: '#ef4444' },
  { id: 'NVMKT6',   name: 'Thu Trang',       color: '#8b5cf6', text: '#ffffff', accent: '#8b5cf6' },
];

// Dynamic unnamed slots (NVMKT7-10): only show when their display name has been changed
const UNNAMED_SLOTS = ['NVMKT7', 'NVMKT8', 'NVMKT9', 'NVMKT10'];
const UNNAMED_COLORS = ['#14b8a6', '#f97316', '#84cc16', '#64748b'];

// Helper: get current stored name for an ID
function getStoredName(id, fallbackName) {
  return localStorage.getItem(`name_${id}`) || fallbackName || id;
}

// Build full DEPARTMENTS.all dynamically
function buildDepartments() {
  const all = NAMED_MEMBERS.map(m => ({
    ...m,
    name: getStoredName(m.id, m.name)
  }));
  UNNAMED_SLOTS.forEach((id, idx) => {
    const stored = getStoredName(id);
    // Only include if user has changed from the default (id itself)
    if (stored !== id) {
      all.push({ id, name: stored, color: UNNAMED_COLORS[idx], text: '#ffffff', accent: UNNAMED_COLORS[idx] });
    }
  });
  return { all };
}

export const DEPARTMENTS = buildDepartments();

export const CATEGORY_MAP = Object.fromEntries(
  Object.values(DEPARTMENTS).flat().map(d => [d.id, d])
);

import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

export const EventContext = createContext();

export const EventProvider = ({ children }) => {
  // Use mkt_deadline_items collection (separate from RNDSP)
  const COLLECTION = 'mkt_deadline_items';
  const LOCAL_FB_KEY   = 'mkt_last_known_fb_data';
  const LOCAL_CHNG_KEY = 'mkt_local_changes';

  const loadMergedState = (fbData) => {
    const fallbackFbStr = localStorage.getItem(LOCAL_FB_KEY);
    let baseData = fbData;

    if (!baseData && fallbackFbStr) {
      baseData = JSON.parse(fallbackFbStr);
    } else if (!baseData) {
      baseData = [];
    } else {
      localStorage.setItem(LOCAL_FB_KEY, JSON.stringify(fbData));
    }

    const localStr = localStorage.getItem(LOCAL_CHNG_KEY);
    const localChanges = localStr ? JSON.parse(localStr) : {};

    const dataMap = {};
    baseData.forEach(i => dataMap[i.id] = i);
    Object.keys(localChanges).forEach(id => {
      const change = localChanges[id];
      if (change === null) delete dataMap[id];
      else dataMap[id] = change;
    });

    return Object.values(dataMap);
  };

  // Build dynamic departments list (re-evaluated on each render to pick up name changes)
  const [departments, setDepartments] = useState(() => buildDepartments());
  const [categoryMap, setCategoryMap]   = useState(() =>
    Object.fromEntries(Object.values(buildDepartments()).flat().map(d => [d.id, d]))
  );

  // Refresh departments list (called after a name change)
  const refreshDepartments = () => {
    const fresh = buildDepartments();
    setDepartments(fresh);
    setCategoryMap(Object.fromEntries(Object.values(fresh).flat().map(d => [d.id, d])));
  };

  const [items, setItems] = useState(() => loadMergedState(null));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const { currentUser } = useAuth();
  const [activeLocation, setActiveLocation] = useState('all');

  useEffect(() => { setActiveLocation('all'); }, [currentUser]);

  // Refresh departments when currentUser changes (e.g. after name update)
  useEffect(() => { refreshDepartments(); }, [currentUser]);

  useEffect(() => {
    const t = {
      bg:            '#ffffff',
      panelHover:    '#f8fafc',
      border:        'rgba(37, 99, 235, 0.09)',
      accent:        '#2563eb',
      pastel:        '#dbeafe',
      pastelHover:   '#bfdbfe',
      textSecondary: '#2563eb',
      textPrimary:   '#0f172a',
      shadowSoft:    '0 10px 30px rgba(37, 99, 235, 0.05)',
      shadowHover:   '0 15px 40px rgba(37, 99, 235, 0.12)',
      bannerBg:      'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
    };
    const root = document.documentElement;
    const userBg    = localStorage.getItem('bgColor');
    const userTheme = localStorage.getItem('themeColor');
    if (!userBg)    { root.style.setProperty('--bg-main', t.bg); root.style.setProperty('--bg-panel-hover', t.panelHover); root.style.setProperty('--border-light', t.border); }
    if (!userTheme) {
      root.style.setProperty('--primary-accent',       t.accent);
      root.style.setProperty('--primary-pastel',       t.pastel);
      root.style.setProperty('--primary-pastel-hover', t.pastelHover);
      root.style.setProperty('--text-secondary',       t.textSecondary);
      root.style.setProperty('--text-primary',         t.textPrimary);
      root.style.setProperty('--shadow-soft',          t.shadowSoft);
      root.style.setProperty('--shadow-hover',         t.shadowHover);
    }
    root.style.setProperty('--location-banner-bg', t.bannerBg);
  }, [activeLocation]);

  const saveChangeLocal = (id, objOrNull) => {
    const localStr = localStorage.getItem(LOCAL_CHNG_KEY);
    const localChanges = localStr ? JSON.parse(localStr) : {};
    localChanges[id] = objOrNull;
    localStorage.setItem(LOCAL_CHNG_KEY, JSON.stringify(localChanges));
    setItems(prev => {
      if (objOrNull === null) return prev.filter(i => i.id !== id);
      if (prev.find(i => i.id === id)) return prev.map(i => i.id === id ? objOrNull : i);
      return [...prev, objOrNull];
    });
  };

  const clearChangeLocal = (id) => {
    const localStr = localStorage.getItem(LOCAL_CHNG_KEY);
    const localChanges = localStr ? JSON.parse(localStr) : {};
    if (id in localChanges) {
      delete localChanges[id];
      localStorage.setItem(LOCAL_CHNG_KEY, JSON.stringify(localChanges));
    }
  };

  const syncPendingChangesToCloud = () => {
    const localStr = localStorage.getItem(LOCAL_CHNG_KEY);
    if (!localStr) return;
    const localChanges = JSON.parse(localStr);
    const keys = Object.keys(localChanges);
    if (keys.length === 0) return;
    keys.forEach(id => {
      const change = localChanges[id];
      clearChangeLocal(id);
      if (change === null) {
        deleteDoc(doc(db, COLLECTION, id)).catch(() => saveChangeLocal(id, null));
      } else {
        setDoc(doc(db, COLLECTION, id), change, { merge: true }).catch(() => saveChangeLocal(id, change));
      }
    });
  };

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('dueDate', 'asc'));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const fbData = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        setItems(loadMergedState(fbData));
        syncPendingChangesToCloud();
      },
      (error) => {
        console.warn('Firestore sync failed. Offline mode active.', error);
        setItems(loadMergedState(null));
      }
    );
    return () => unsubscribe();
  }, []);

  /* ── CRUD ── */
  const addEvent = async (item) => {
    const newId = `item-${Date.now()}`;
    const newItem = { ...item, id: newId };
    saveChangeLocal(newId, newItem);
    setIsModalOpen(false);
    try { await setDoc(doc(db, COLLECTION, newId), newItem); clearChangeLocal(newId); } catch (e) { console.warn(e); }
  };

  const updateEvent = async (updated) => {
    saveChangeLocal(updated.id, updated);
    setIsModalOpen(false);
    setCurrentEvent(null);
    try { await setDoc(doc(db, COLLECTION, updated.id), updated, { merge: true }); clearChangeLocal(updated.id); } catch (e) { console.warn(e); }
  };

  const deleteEvent = async (id) => {
    saveChangeLocal(id, null);
    setIsModalOpen(false);
    setCurrentEvent(null);
    try { await deleteDoc(doc(db, COLLECTION, id)); clearChangeLocal(id); } catch (e) { console.warn(e); }
  };

  const changeStatus = async (id, status) => {
    setItems((prev) => {
      const target = prev.find(i => i.id === id);
      if (!target) return prev;
      const upd = { ...target, status, updatedBy: currentUser ? currentUser.name : 'Unknown', updatedAt: new Date().toISOString() };
      Promise.resolve().then(() => {
        const localStr = localStorage.getItem(LOCAL_CHNG_KEY);
        const localChanges = localStr ? JSON.parse(localStr) : {};
        localChanges[id] = upd;
        localStorage.setItem(LOCAL_CHNG_KEY, JSON.stringify(localChanges));
      });
      setDoc(doc(db, COLLECTION, id), upd, { merge: true }).then(() => clearChangeLocal(id)).catch(console.warn);
      return prev.map(i => i.id === id ? upd : i);
    });
  };

  const openAddModal  = () => { setCurrentEvent(null); setIsModalOpen(true); };
  const openEditModal = (item) => { setCurrentEvent(item); setIsModalOpen(true); };

  const [notifiedIds, setNotifiedIds] = useState(new Set());

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkNotifications = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      items.forEach(item => {
        if (item.status === 'done' || !item.dueDate || !item.dueTime || item.dueDate !== todayStr) return;
        if (notifiedIds.has(item.id)) return;
        const [h, m] = item.dueTime.split(':').map(Number);
        const dueTime = new Date(); dueTime.setHours(h, m, 0, 0);
        const diffMinutes = (dueTime.getTime() - now.getTime()) / 60000;
        if (diffMinutes > 0 && diffMinutes <= 15) {
          const typeLabel = item.type === 'meeting' ? '📅 Meeting' : item.type === 'report' ? '📊 Report' : '✅ Task';
          new Notification(`${typeLabel} soon: ${item.title}`, { body: `Starting at ${item.dueTime} (in ${Math.round(diffMinutes)} mins)` });
          setNotifiedIds(prev => new Set([...prev, item.id]));
        }
      });
    };
    const interval = setInterval(checkNotifications, 60000);
    checkNotifications();
    return () => clearInterval(interval);
  }, [items, notifiedIds]);

  return (
    <EventContext.Provider value={{
      items,
      activeLocation,
      setActiveLocation,
      filteredItems: items,
      events: items,
      isEditable: true,
      addEvent, updateEvent, deleteEvent, changeStatus,
      isModalOpen, setIsModalOpen,
      currentEvent,
      openAddModal, openEditModal,
      // Expose dynamic dept data
      departments,
      categoryMap,
      refreshDepartments,
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => useContext(EventContext);

import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

import { INITIAL_EMPLOYEES } from './AuthContext';

/* ── MKT Members as calendar categories ── */
// Helper: get current stored name for an ID
function getStoredName(id, fallbackName) {
  return localStorage.getItem(`name_${id}`) || fallbackName || id;
}

function getStoredEmployees() {
  try {
    const raw = localStorage.getItem('mkt_custom_employees');
    const deletedRaw = localStorage.getItem('mkt_deleted_emp_ids');
    const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(e => e.id !== 'Guest' && !deletedIds.includes(e.id));
      }
    }
  } catch (e) {}
  return INITIAL_EMPLOYEES.filter(e => e.id !== 'Guest');
}

// Build full DEPARTMENTS.all dynamically
function buildDepartments() {
  const emps = getStoredEmployees();
  const all = emps.map(emp => {
    const displayName = getStoredName(emp.id, emp.name);
    return {
      id: emp.id,
      name: displayName,
      color: emp.color || '#3b82f6',
      text: '#ffffff',
      accent: emp.color || '#3b82f6'
    };
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
  const syncingIds = useRef(new Set());

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
  const { currentUser, employees } = useAuth();
  const [activeLocation, setActiveLocation] = useState('all');

  useEffect(() => { setActiveLocation('all'); }, [currentUser]);

  // Refresh departments when currentUser or employees list changes (e.g. after add/delete/name update)
  useEffect(() => { refreshDepartments(); }, [currentUser, employees]);

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
    const keys = Object.keys(localChanges).filter(id => !syncingIds.current.has(id));
    if (keys.length === 0) return;
    keys.forEach(id => {
      const change = localChanges[id];
      syncingIds.current.add(id);
      if (change === null) {
        deleteDoc(doc(db, COLLECTION, id)).catch(() => { syncingIds.current.delete(id); });
      } else {
        setDoc(doc(db, COLLECTION, id), change, { merge: true }).catch(() => { syncingIds.current.delete(id); });
      }
    });
  };

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('dueDate', 'asc'));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const fbData = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        
        // Confirm writes: remove from local cache and syncingIds once it matches Firestore
        const localStr = localStorage.getItem(LOCAL_CHNG_KEY);
        if (localStr) {
          const localChanges = JSON.parse(localStr);
          let modified = false;
          const fbDataIds = new Set(fbData.map(i => i.id));
          
          Array.from(syncingIds.current).forEach(id => {
            const change = localChanges[id];
            // If it was a delete and is missing from fbData
            if (change === null && !fbDataIds.has(id)) {
              syncingIds.current.delete(id);
              delete localChanges[id];
              modified = true;
            } 
            // If it was an add/update and is present in fbData
            else if (change !== null && fbDataIds.has(id)) {
              syncingIds.current.delete(id);
              delete localChanges[id];
              modified = true;
            }
          });
          
          if (modified) {
            localStorage.setItem(LOCAL_CHNG_KEY, JSON.stringify(localChanges));
          }
        }

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
    syncingIds.current.add(newId);
    saveChangeLocal(newId, newItem);
    setIsModalOpen(false);
    try { await setDoc(doc(db, COLLECTION, newId), newItem); } catch (e) { console.warn(e); syncingIds.current.delete(newId); }
  };

  const updateEvent = async (updated) => {
    syncingIds.current.add(updated.id);
    saveChangeLocal(updated.id, updated);
    setIsModalOpen(false);
    setCurrentEvent(null);
    try { await setDoc(doc(db, COLLECTION, updated.id), updated, { merge: true }); } catch (e) { console.warn(e); syncingIds.current.delete(updated.id); }
  };

  const deleteEvent = async (id) => {
    syncingIds.current.add(id);
    saveChangeLocal(id, null);
    setIsModalOpen(false);
    setCurrentEvent(null);
    try { await deleteDoc(doc(db, COLLECTION, id)); } catch (e) { console.warn(e); syncingIds.current.delete(id); }
  };

  const changeStatus = async (id, status) => {
    setItems((prev) => {
      const target = prev.find(i => i.id === id);
      if (!target) return prev;
      const upd = { ...target, status, updatedBy: currentUser ? currentUser.name : 'Unknown', updatedAt: new Date().toISOString() };
      
      Promise.resolve().then(() => {
        syncingIds.current.add(id);
        const localStr = localStorage.getItem(LOCAL_CHNG_KEY);
        const localChanges = localStr ? JSON.parse(localStr) : {};
        localChanges[id] = upd;
        localStorage.setItem(LOCAL_CHNG_KEY, JSON.stringify(localChanges));
        setDoc(doc(db, COLLECTION, id), upd, { merge: true }).catch((e) => { console.warn(e); syncingIds.current.delete(id); });
      });
      
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

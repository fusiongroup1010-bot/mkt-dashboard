import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, where, arrayUnion } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { EMPLOYEES } from './AuthContext';

const NotifyContext = createContext();

export const useNotify = () => useContext(NotifyContext);

export const NotifyProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Query for notifications where current user is a recipient or it's public
    const q = query(
      collection(db, 'notifications_sale_online'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter client-side for simplicity in this demo, or use complex Firestore queries
      // Recipients can be: 'all', location (hanoi, hcm, hungyen), or specific user ID
      const myNotifs = allNotifs.filter(n => {
        // Always show to sender and admins
        if (n.senderId === currentUser.id) return true;
        const isAdmin = ['ceofs', 'lelienfs', 'thanhtrafs', 'tranhfs', 'nganhfs', 'tnhanfs', 'nanhfs', 'tnganfs', 'phlinhfs'].includes(currentUser.id.toLowerCase()) || currentUser.isSpecialAccount;
        if (isAdmin) return true;

        if (n.recipients.includes('all')) {
          const targetDepts = ['rnd', 'design', 'mms', 'hn-mkt', 'evolution', 'crm'];
          return targetDepts.includes(currentUser.id.toLowerCase());
        }

        if (n.recipients.includes(currentUser.id)) return true;
        // Check if user is in a location that is a recipient
        const userLocs = currentUser.allowedLocations || [];
        return n.recipients.some(r => userLocs.includes(r));
      });

      setNotifications(myNotifs);
      setUnreadCount(myNotifs.filter(n => !n.readBy?.includes(currentUser.id)).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const sendNotification = async (notifData) => {
    if (!currentUser || !currentUser.canSendNotify) return;

    const payload = {
      ...notifData,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderTitle: currentUser.title,
      createdAt: serverTimestamp(),
      readBy: [currentUser.id], // Sender has read it
      pinned: false
    };

    await addDoc(collection(db, 'notifications_sale_online'), payload);
  };

  const markAsRead = async (id) => {
    if (!currentUser) return;
    const ref = doc(db, 'notifications_sale_online', id);
    await updateDoc(ref, {
      readBy: arrayUnion(currentUser.id)
    });
  };

  const togglePin = async (id, currentVal) => {
    const ref = doc(db, 'notifications_sale_online', id);
    await updateDoc(ref, { pinned: !currentVal });
  };

  const deleteNotification = async (id) => {
    await deleteDoc(doc(db, 'notifications_sale_online', id));
  };

  /**
   * Given a notification, compute who has read and who hasn't.
   * Recipients are expanded to the actual user list.
   * Only visible to the sender or admins.
   */
  const getReadReceipts = (notif) => {
    if (!notif) return { readUsers: [], unreadUsers: [] };

    // Expand recipients to actual employee IDs
    const recipientIds = EMPLOYEES
      .filter(emp => {
        if (notif.recipients.includes('all')) {
          const targetDepts = ['rnd', 'design', 'mms', 'hn-mkt', 'evolution', 'crm'];
          return targetDepts.includes(emp.id.toLowerCase());
        }
        if (notif.recipients.includes(emp.id)) return true;
        // location-based
        return notif.recipients.some(r => emp.allowedLocations?.includes(r));
      })
      .map(emp => emp.id);

    const readSet = new Set(notif.readBy || []);

    const readUsers = recipientIds
      .filter(id => readSet.has(id))
      .map(id => EMPLOYEES.find(e => e.id === id))
      .filter(Boolean);

    const unreadUsers = recipientIds
      .filter(id => !readSet.has(id))
      .map(id => EMPLOYEES.find(e => e.id === id))
      .filter(Boolean);

    return { readUsers, unreadUsers };
  };

  const value = {
    notifications,
    unreadCount,
    sendNotification,
    markAsRead,
    togglePin,
    deleteNotification,
    getReadReceipts,
    loading
  };

  return <NotifyContext.Provider value={value}>{children}</NotifyContext.Provider>;
};

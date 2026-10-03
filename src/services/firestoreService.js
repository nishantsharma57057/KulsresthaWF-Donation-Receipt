import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write'
};

function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const FirestoreService = {
  // 1. DONATIONS
  async saveDonation(donation) {
    const path = 'donations';
    try {
      await setDoc(doc(db, path, donation.id), {
        ...donation,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${donation.id}`);
    }
  },

  async getDonations() {
    const path = 'donations';
    try {
      const q = query(collection(db, path), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  subscribeDonations(callback) {
    const path = 'donations';
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data());
        });
        // Sort descending by date
        list.sort((a, b) => (b.date > a.date ? 1 : -1));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  async deleteDonation(id) {
    const path = `donations/${id}`;
    try {
      await deleteDoc(doc(db, 'donations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // 2. SETTINGS
  async saveSettings(settings) {
    const path = 'settings';
    try {
      await setDoc(doc(db, path, 'global'), {
        ...settings,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/global`);
    }
  },

  async getSettings() {
    const path = 'settings/global';
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // 3. USERS
  async saveUser(user) {
    const path = 'users';
    try {
      await setDoc(doc(db, path, user.id), {
        ...user,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${user.id}`);
    }
  },

  async getUsers() {
    const path = 'users';
    try {
      const snapshot = await getDocs(collection(db, path));
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async deleteUser(userId) {
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};

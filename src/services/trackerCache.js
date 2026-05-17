const DB_NAME = 'throw-tracker-cache';
const DB_VERSION = 1;

let dbInstance = null;

export function openDB() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('discs')) {
        db.createObjectStore('discs', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('throwingSessions')) {
        const sessionStore = db.createObjectStore('throwingSessions', { keyPath: 'id' });
        sessionStore.createIndex('session_date', 'session_date', { unique: false });
      }

      if (!db.objectStoreNames.contains('throws')) {
        const throwStore = db.createObjectStore('throws', { keyPath: 'id' });
        throwStore.createIndex('session_id', 'session_id', { unique: false });
        throwStore.createIndex('disc_id', 'disc_id', { unique: false });
      }

      if (!db.objectStoreNames.contains('puttingSessions')) {
        const puttingSessionStore = db.createObjectStore('puttingSessions', { keyPath: 'id' });
        puttingSessionStore.createIndex('session_date', 'session_date', { unique: false });
      }

      if (!db.objectStoreNames.contains('putts')) {
        const puttStore = db.createObjectStore('putts', { keyPath: 'id' });
        puttStore.createIndex('putting_session_id', 'putting_session_id', { unique: false });
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('synced', 'synced', { unique: false });
        syncStore.createIndex('created_at', 'created_at', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to open IndexedDB: ${event.target.error}`));
    };
  });
}

function getStore(storeName, mode = 'readonly') {
  return openDB().then((db) => {
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  });
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generic CRUD for any store
function createStoreMethods(storeName) {
  return {
    async getAll() {
      const store = await getStore(storeName);
      return promisifyRequest(store.getAll());
    },

    async getById(id) {
      const store = await getStore(storeName);
      return promisifyRequest(store.get(id));
    },

    async put(item) {
      const store = await getStore(storeName, 'readwrite');
      return promisifyRequest(store.put(item));
    },

    async delete(id) {
      const store = await getStore(storeName, 'readwrite');
      return promisifyRequest(store.delete(id));
    },

    async clear() {
      const store = await getStore(storeName, 'readwrite');
      return promisifyRequest(store.clear());
    },
  };
}

export const discsCache = createStoreMethods('discs');
export const throwingSessionsCache = createStoreMethods('throwingSessions');
export const throwsCache = createStoreMethods('throws');
export const puttingSessionsCache = createStoreMethods('puttingSessions');
export const puttsCache = createStoreMethods('putts');

// Sync queue specific methods
export const syncQueueCache = {
  async enqueue(operation) {
    const store = await getStore('syncQueue', 'readwrite');
    const item = {
      ...operation,
      created_at: new Date().toISOString(),
      synced: false,
    };
    return promisifyRequest(store.add(item));
  },

  async getPending() {
    const store = await getStore('syncQueue');
    const all = await promisifyRequest(store.getAll());
    return all.filter((op) => op.synced === false && !op.failed);
  },

  async markSynced(id) {
    const db = await openDB();
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const item = await promisifyRequest(store.get(id));
    if (item) {
      item.synced = true;
      return promisifyRequest(store.put(item));
    }
  },

  async getFailedOps() {
    const store = await getStore('syncQueue');
    const all = await promisifyRequest(store.getAll());
    return all.filter((op) => op.failed === true && op.synced === false);
  },
};

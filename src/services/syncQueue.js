import { syncQueueCache } from './trackerCache.js';
import { sync as apiSync } from './trackerApi.js';

let autoSyncInterval = null;
let onlineHandler = null;

export async function enqueue(entityType, operation, entityId, payload) {
  // Only queue when offline — when online, the API call handles persistence
  if (!navigator.onLine) {
    await syncQueueCache.enqueue({
      entity_type: entityType,
      operation,
      entity_id: entityId,
      payload,
    });
  }
}

export async function drain() {
  if (!navigator.onLine) {
    return;
  }

  const pending = await syncQueueCache.getPending();
  if (pending.length === 0) {
    return;
  }

  const operations = pending.map((op) => ({
    entity_type: op.entity_type,
    operation: op.operation,
    entity_id: op.entity_id,
    payload: op.payload,
  }));

  try {
    const results = await apiSync(operations);

    for (let i = 0; i < pending.length; i++) {
      const result = results[i];
      if (result && result.success) {
        await syncQueueCache.markSynced(pending[i].id);
      } else {
        // Mark as failed if server returned an error for this operation
        await markFailed(pending[i].id, result?.error || 'Unknown error');
      }
    }
  } catch (error) {
    // Network error — leave operations in queue for retry
    if (error.status && error.status >= 400 && error.status < 500) {
      // 4xx errors — mark all as failed
      for (const op of pending) {
        await markFailed(op.id, error.message);
      }
    }
    // Otherwise it's a network/5xx error, leave for retry
  }
}

async function markFailed(id, errorMessage) {
  const { openDB } = await import('./trackerCache.js');
  const db = await openDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');

  return new Promise((resolve, reject) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        item.failed = true;
        item.error = errorMessage;
        const putReq = store.put(item);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export function startAutoSync() {
  // Drain immediately on start
  drain();

  // Set up 30-second interval
  if (!autoSyncInterval) {
    autoSyncInterval = setInterval(() => {
      if (navigator.onLine) {
        drain();
      }
    }, 30000);
  }

  // Listen for online event
  if (!onlineHandler) {
    onlineHandler = () => drain();
    window.addEventListener('online', onlineHandler);
  }
}

export function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }

  if (onlineHandler) {
    window.removeEventListener('online', onlineHandler);
    onlineHandler = null;
  }
}

export async function getPendingCount() {
  const pending = await syncQueueCache.getPending();
  return pending.length;
}

export async function getFailedOperations() {
  return syncQueueCache.getFailedOps();
}

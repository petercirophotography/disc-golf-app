import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus.js';
import { drain, getPendingCount, getFailedOperations } from '../services/syncQueue.js';

export function useSyncQueue() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [failedOps, setFailedOps] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const count = await getPendingCount();
    const failed = await getFailedOperations();
    setPendingCount(count);
    setFailedOps(failed);
  }, []);

  const retry = useCallback(async () => {
    setIsSyncing(true);
    try {
      await drain();
    } finally {
      setIsSyncing(false);
      await refresh();
    }
  }, [refresh]);

  // Trigger sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      retry();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh counts periodically
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { pendingCount, failedOps, isSyncing, retry };
}

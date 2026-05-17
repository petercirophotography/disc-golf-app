import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { useSyncQueue } from '../../hooks/useSyncQueue.js';

function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { pendingCount, isSyncing } = useSyncQueue();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className="offline-indicator offline-indicator-offline">
        <span>⚡</span>
        <span>Offline{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="offline-indicator offline-indicator-pending">
        <span>{isSyncing ? '⟳' : '↑'}</span>
        <span>{isSyncing ? 'Syncing...' : `${pendingCount} pending`}</span>
      </div>
    );
  }

  return null;
}

export default OfflineIndicator;

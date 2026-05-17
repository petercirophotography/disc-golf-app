import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus.js';
import * as api from '../services/trackerApi.js';
import {
  discsCache,
  throwingSessionsCache,
  throwsCache,
  puttingSessionsCache,
  puttsCache,
} from '../services/trackerCache.js';
import { enqueue } from '../services/syncQueue.js';

// Generic hook for fetching data with cache fallback
function useQuery(apiFn, cacheFns, deps = []) {
  const isOnline = useOnlineStatus();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        const result = await apiFn();
        setData(result);
        // Update cache
        if (cacheFns && cacheFns.clear && cacheFns.put) {
          await cacheFns.clear();
          if (Array.isArray(result)) {
            for (const item of result) {
              await cacheFns.put(item);
            }
          }
        }
      } else {
        // Offline — read from cache
        if (cacheFns && cacheFns.getAll) {
          const cached = await cacheFns.getAll();
          setData(cached);
        } else {
          setData(null);
        }
      }
    } catch (err) {
      // On network error, fall back to cache
      if (cacheFns && cacheFns.getAll) {
        try {
          const cached = await cacheFns.getAll();
          setData(cached);
        } catch {
          setError(err);
        }
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// Generic hook for mutations with cache-first writes
function useMutation(mutateFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutateFn(...args);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutateFn]);

  return { mutate, loading, error };
}

// ============================================================
// Discs
// ============================================================

export function useDiscs() {
  return useQuery(() => api.discs.list(), discsCache);
}

export function useCreateDisc() {
  const isOnline = useOnlineStatus();

  return useMutation(async (data) => {
    const tempId = crypto.randomUUID();
    const item = { id: tempId, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

    // Write to cache immediately
    await discsCache.put(item);

    // Enqueue sync operation
    await enqueue('disc', 'create', tempId, data);

    // If online, call API directly
    if (isOnline) {
      try {
        const result = await api.discs.create(data);
        // Update cache with server response (has real ID)
        await discsCache.delete(tempId);
        await discsCache.put(result);
        return result;
      } catch {
        // API failed but cache is updated — sync will retry
        return item;
      }
    }

    return item;
  });
}

export function useUpdateDisc() {
  const isOnline = useOnlineStatus();

  return useMutation(async (id, data) => {
    // Update cache immediately
    const existing = await discsCache.getById(id);
    const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
    await discsCache.put(updated);

    // Enqueue sync operation
    await enqueue('disc', 'update', id, data);

    // If online, call API
    if (isOnline) {
      try {
        const result = await api.discs.update(id, data);
        await discsCache.put(result);
        return result;
      } catch {
        return updated;
      }
    }

    return updated;
  });
}

export function useDeleteDisc() {
  const isOnline = useOnlineStatus();

  return useMutation(async (id) => {
    // Delete from cache immediately
    await discsCache.delete(id);

    // Enqueue sync operation
    await enqueue('disc', 'delete', id, {});

    // If online, call API
    if (isOnline) {
      try {
        await api.discs.delete(id);
      } catch {
        // Sync will retry
      }
    }
  });
}

// ============================================================
// Throwing Sessions
// ============================================================

export function useSessions() {
  return useQuery(() => api.sessions.list(), throwingSessionsCache);
}

export function useCreateSession() {
  const isOnline = useOnlineStatus();

  return useMutation(async (data) => {
    const tempId = crypto.randomUUID();
    const item = { id: tempId, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

    await throwingSessionsCache.put(item);
    await enqueue('session', 'create', tempId, data);

    if (isOnline) {
      try {
        const result = await api.sessions.create(data);
        await throwingSessionsCache.delete(tempId);
        await throwingSessionsCache.put(result);
        return result;
      } catch {
        return item;
      }
    }

    return item;
  });
}

export function useUpdateSession() {
  const isOnline = useOnlineStatus();

  return useMutation(async (id, data) => {
    const existing = await throwingSessionsCache.getById(id);
    const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
    await throwingSessionsCache.put(updated);
    await enqueue('session', 'update', id, data);

    if (isOnline) {
      try {
        const result = await api.sessions.update(id, data);
        await throwingSessionsCache.put(result);
        return result;
      } catch {
        return updated;
      }
    }

    return updated;
  });
}

export function useDeleteSession() {
  const isOnline = useOnlineStatus();

  return useMutation(async (id) => {
    await throwingSessionsCache.delete(id);
    await enqueue('session', 'delete', id, {});

    if (isOnline) {
      try {
        await api.sessions.delete(id);
      } catch {
        // Sync will retry
      }
    }
  });
}

export function useSessionThrows(sessionId) {
  return useQuery(
    () => api.sessions.getThrows(sessionId),
    {
      getAll: async () => {
        const allThrows = await throwsCache.getAll();
        return allThrows.filter((t) => t.session_id === sessionId);
      },
      clear: async () => {
        // Only clear throws for this session from cache
        const allThrows = await throwsCache.getAll();
        for (const t of allThrows) {
          if (t.session_id === sessionId) {
            await throwsCache.delete(t.id);
          }
        }
      },
      put: (item) => throwsCache.put(item),
    },
    [sessionId]
  );
}

export function useCreateThrows() {
  const isOnline = useOnlineStatus();

  return useMutation(async (sessionId, throwsData) => {
    // Cache each throw locally
    const localThrows = throwsData.map((t) => ({
      id: crypto.randomUUID(),
      session_id: sessionId,
      ...t,
      distance_feet: t.distance_yards * 3,
      created_at: new Date().toISOString(),
    }));

    for (const t of localThrows) {
      await throwsCache.put(t);
    }

    // Enqueue each throw as a sync operation
    for (const t of localThrows) {
      await enqueue('throw', 'create', t.id, {
        session_id: sessionId,
        disc_id: t.disc_id,
        distance_yards: t.distance_yards,
        throw_number: t.throw_number,
        flag: t.flag || null,
      });
    }

    if (isOnline) {
      try {
        const result = await api.sessions.createThrows(sessionId, throwsData);
        // Replace local throws with server versions
        for (const t of localThrows) {
          await throwsCache.delete(t.id);
        }
        for (const t of result) {
          await throwsCache.put(t);
        }
        return result;
      } catch {
        return localThrows;
      }
    }

    return localThrows;
  });
}

// ============================================================
// Throws (update/delete)
// ============================================================

export function useUpdateThrow() {
  const isOnline = useOnlineStatus();

  return useMutation(async (id, data) => {
    const existing = await throwsCache.getById(id);
    const updated = { ...existing, ...data };
    await throwsCache.put(updated);
    await enqueue('throw', 'update', id, data);

    if (isOnline) {
      try {
        const result = await api.throws.update(id, data);
        await throwsCache.put(result);
        return result;
      } catch {
        return updated;
      }
    }

    return updated;
  });
}

export function useDeleteThrow() {
  const isOnline = useOnlineStatus();

  return useMutation(async (id) => {
    await throwsCache.delete(id);
    await enqueue('throw', 'delete', id, {});

    if (isOnline) {
      try {
        await api.throws.delete(id);
      } catch {
        // Sync will retry
      }
    }
  });
}

// ============================================================
// Putting Sessions
// ============================================================

export function usePuttingSessions() {
  return useQuery(() => api.puttingSessions.list(), puttingSessionsCache);
}

export function useCreatePuttingSession() {
  const isOnline = useOnlineStatus();

  return useMutation(async (data) => {
    const tempId = crypto.randomUUID();
    const item = { id: tempId, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

    await puttingSessionsCache.put(item);
    await enqueue('putting_session', 'create', tempId, data);

    if (isOnline) {
      try {
        const result = await api.puttingSessions.create(data);
        await puttingSessionsCache.delete(tempId);
        await puttingSessionsCache.put(result);
        return result;
      } catch {
        return item;
      }
    }

    return item;
  });
}

export function useUpdatePuttingSession() {
  const isOnline = useOnlineStatus();

  return useMutation(async (id, data) => {
    const existing = await puttingSessionsCache.getById(id);
    const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
    await puttingSessionsCache.put(updated);
    await enqueue('putting_session', 'update', id, data);

    if (isOnline) {
      try {
        const result = await api.puttingSessions.update(id, data);
        await puttingSessionsCache.put(result);
        return result;
      } catch {
        return updated;
      }
    }

    return updated;
  });
}

export function useDeletePuttingSession() {
  const isOnline = useOnlineStatus();

  return useMutation(async (id) => {
    await puttingSessionsCache.delete(id);
    await enqueue('putting_session', 'delete', id, {});

    if (isOnline) {
      try {
        await api.puttingSessions.delete(id);
      } catch {
        // Sync will retry
      }
    }
  });
}

export function usePuttingSessionPutts(sessionId) {
  return useQuery(
    () => api.puttingSessions.getPutts(sessionId),
    {
      getAll: async () => {
        const allPutts = await puttsCache.getAll();
        return allPutts.filter((p) => p.putting_session_id === sessionId);
      },
      clear: async () => {
        const allPutts = await puttsCache.getAll();
        for (const p of allPutts) {
          if (p.putting_session_id === sessionId) {
            await puttsCache.delete(p.id);
          }
        }
      },
      put: (item) => puttsCache.put(item),
    },
    [sessionId]
  );
}

export function useCreatePutts() {
  const isOnline = useOnlineStatus();

  return useMutation(async (sessionId, puttsData) => {
    const localPutts = puttsData.map((p) => ({
      id: crypto.randomUUID(),
      putting_session_id: sessionId,
      ...p,
      circle: p.distance_feet < 33 ? 'C1' : 'C2',
      created_at: new Date().toISOString(),
    }));

    for (const p of localPutts) {
      await puttsCache.put(p);
    }

    for (const p of localPutts) {
      await enqueue('putt', 'create', p.id, {
        putting_session_id: sessionId,
        distance_feet: p.distance_feet,
        attempts: p.attempts,
        makes: p.makes,
      });
    }

    if (isOnline) {
      try {
        const result = await api.puttingSessions.createPutts(sessionId, puttsData);
        for (const p of localPutts) {
          await puttsCache.delete(p.id);
        }
        for (const p of result) {
          await puttsCache.put(p);
        }
        return result;
      } catch {
        return localPutts;
      }
    }

    return localPutts;
  });
}

// ============================================================
// Putts (update/delete)
// ============================================================

export function useUpdatePutt() {
  const isOnline = useOnlineStatus();

  return useMutation(async (id, data) => {
    const existing = await puttsCache.getById(id);
    const updated = { ...existing, ...data };
    await puttsCache.put(updated);
    await enqueue('putt', 'update', id, data);

    if (isOnline) {
      try {
        const result = await api.putts.update(id, data);
        await puttsCache.put(result);
        return result;
      } catch {
        return updated;
      }
    }

    return updated;
  });
}

export function useDeletePutt() {
  const isOnline = useOnlineStatus();

  return useMutation(async (id) => {
    await puttsCache.delete(id);
    await enqueue('putt', 'delete', id, {});

    if (isOnline) {
      try {
        await api.putts.delete(id);
      } catch {
        // Sync will retry
      }
    }
  });
}

// ============================================================
// Export/Import/Restore (online-only operations)
// ============================================================

export function useExportData() {
  return useMutation(async () => {
    return api.exportData();
  });
}

export function useImportData() {
  return useMutation(async (data) => {
    return api.importData(data);
  });
}

export function useRestoreData() {
  return useMutation(async (data) => {
    return api.restoreData(data);
  });
}

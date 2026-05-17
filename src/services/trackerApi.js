const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_PREFIX = `${BASE_URL}/api/throw-tracker`;

async function request(path, options = {}) {
  const url = `${API_PREFIX}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.error || `Request failed: ${response.status}`);
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const discs = {
  list() {
    return request('/discs');
  },
  create(data) {
    return request('/discs', { method: 'POST', body: JSON.stringify(data) });
  },
  update(id, data) {
    return request(`/discs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete(id) {
    return request(`/discs/${id}`, { method: 'DELETE' });
  },
};

export const sessions = {
  list() {
    return request('/sessions');
  },
  create(data) {
    return request('/sessions', { method: 'POST', body: JSON.stringify(data) });
  },
  update(id, data) {
    return request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete(id) {
    return request(`/sessions/${id}`, { method: 'DELETE' });
  },
  getThrows(id) {
    return request(`/sessions/${id}/throws`);
  },
  createThrows(id, throws) {
    return request(`/sessions/${id}/throws`, { method: 'POST', body: JSON.stringify(throws) });
  },
};

export const throws = {
  update(id, data) {
    return request(`/throws/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete(id) {
    return request(`/throws/${id}`, { method: 'DELETE' });
  },
};

export const puttingSessions = {
  list() {
    return request('/putting-sessions');
  },
  create(data) {
    return request('/putting-sessions', { method: 'POST', body: JSON.stringify(data) });
  },
  update(id, data) {
    return request(`/putting-sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete(id) {
    return request(`/putting-sessions/${id}`, { method: 'DELETE' });
  },
  getPutts(id) {
    return request(`/putting-sessions/${id}/putts`);
  },
  createPutts(id, putts) {
    return request(`/putting-sessions/${id}/putts`, { method: 'POST', body: JSON.stringify(putts) });
  },
};

export const putts = {
  update(id, data) {
    return request(`/putts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete(id) {
    return request(`/putts/${id}`, { method: 'DELETE' });
  },
};

export function sync(operations) {
  return request('/sync', { method: 'POST', body: JSON.stringify({ operations }) });
}

export function getAllThrows() {
  return request('/throws');
}

export function getAllPutts() {
  return request('/putts');
}

export function exportData() {
  return request('/export');
}

export function importData(data) {
  return request('/import', { method: 'POST', body: JSON.stringify(data) });
}

export function restoreData(data) {
  return request('/restore', { method: 'POST', body: JSON.stringify(data) });
}

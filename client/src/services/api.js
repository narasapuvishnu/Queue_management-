const API_BASE = '/api';

// Helper for HTTP requests
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('queueflow_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth API
  auth: {
    login: (emailOrUsername, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrUsername, password })
      }),
    register: (name, email, username, password) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, username, password })
      }),
    getMe: () => request('/auth/me')
  },

  // Queues API
  queues: {
    getAll: () => request('/queues'),
    getById: (id) => request(`/queues/${id}`),
    create: (data) =>
      request('/queues', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id, data) =>
      request(`/queues/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id) =>
      request(`/queues/${id}`, {
        method: 'DELETE'
      })
  },

  // Tokens API
  tokens: {
    getByQueue: (queueId, status) =>
      request(`/tokens/queue/${queueId}${status ? `?status=${status}` : ''}`),
    create: (data) =>
      request('/tokens', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    move: (tokenId, direction) =>
      request(`/tokens/${tokenId}/move`, {
        method: 'POST',
        body: JSON.stringify({ direction })
      }),
    callNext: (queueId) =>
      request(`/tokens/queue/${queueId}/call-next`, {
        method: 'POST'
      }),
    complete: (tokenId) =>
      request(`/tokens/${tokenId}/complete`, {
        method: 'POST'
      }),
    cancel: (tokenId, reason) =>
      request(`/tokens/${tokenId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      })
  },

  // Analytics API
  analytics: {
    get: (queueId = 'all', timeRange = 'all') =>
      request(`/analytics?queueId=${queueId}&timeRange=${timeRange}`)
  },

  // Admin demo reset
  resetDemo: () =>
    request('/admin/reset-demo', {
      method: 'POST'
    })
};

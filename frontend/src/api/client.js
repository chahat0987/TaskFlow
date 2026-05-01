import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export default api;
// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')

      if (refresh) {
        try {
          const { data } = await api.post('/auth/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login/', data),
  signup: (data) => api.post('/auth/signup/', data),
  me: () => api.get('/auth/me/'),
  updateMe: (data) => api.patch('/auth/me/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
  searchUsers: (q) => api.get('/users/search/', { params: { q } }),
}

// Projects
export const projectsApi = {
  list: () => api.get('/projects/'),
  create: (data) => api.post('/projects/', data),
  get: (id) => api.get(`/projects/${id}/`),
  update: (id, data) => api.patch(`/projects/${id}/`, data),
  delete: (id) => api.delete(`/projects/${id}/`),
  invite: (id, email) => api.post(`/projects/${id}/invite/`, { email }),
  removeMember: (id, user_id) => api.delete(`/projects/${id}/remove-member/`, { data: { user_id } }),
  leave: (id) => api.post(`/projects/${id}/leave/`),
}

// Tasks
export const tasksApi = {
  list: (projectId, params) => api.get(`/projects/${projectId}/tasks/`, { params }),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks/`, data),
  get: (id) => api.get(`/tasks/${id}/`),
  update: (id, data) => api.patch(`/tasks/${id}/`, data),
  delete: (id) => api.delete(`/tasks/${id}/`),
  myTasks: (params) => api.get('/tasks/mine/', { params }),
}

// Chat
export const chatApi = {
  list: (taskId) => api.get(`/tasks/${taskId}/messages/`),
  send: (taskId, text) => api.post(`/tasks/${taskId}/messages/`, { text }),
  delete: (messageId) => api.delete(`/messages/${messageId}/`),
  edit: (messageId, text) => api.patch(`/messages/${messageId}/`, { text }),
}



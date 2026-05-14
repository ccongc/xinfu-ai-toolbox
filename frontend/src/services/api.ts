import request from '../utils/request'

// ===== 认证 =====
export const authApi = {
  register: (data: any) => request.post('/auth/register', data),
  login: (data: any) => request.post('/auth/login', data),
  wecomQrUrl: () => request.get('/auth/wecom/qrurl'),
  wecomCallback: (data: any) => request.post('/auth/wecom/callback', data),
  refresh: (data: any) => request.post('/auth/refresh', data),
  logout: () => request.post('/auth/logout'),
  getMe: () => request.get('/auth/me'),
  updateMe: (data: any) => request.put('/auth/me', data),
  changePassword: (data: any) => request.put('/auth/me/password', data),
  adminPathInfo: () => request.get('/auth/admin-path-info'),
}

// ===== Agent =====
export const agentApi = {
  marketList: (params?: any) => request.get('/agents', { params }),
  categories: () => request.get('/agents/categories'),
  detail: (id: number) => request.get(`/agents/${id}`),
  recordView: (id: number) => request.post(`/agents/${id}/view`),
  publish: (data: any) => request.post('/agents', data),
  update: (id: number, data: any) => request.put(`/agents/${id}`, data),
  myAgents: (params?: any) => request.get('/agents/my/list', { params }),
}

// ===== 管理侧 Agent =====
export const adminAgentApi = {
  list: (params?: any) => request.get('/admin/agents', { params }),
  publish: (data: any) => request.post('/admin/agents', data),
  approve: (id: number, data?: any) => request.put(`/admin/agents/${id}/approve`, data),
  reject: (id: number, data?: any) => request.put(`/admin/agents/${id}/reject`, data),
  update: (id: number, data: any) => request.put(`/admin/agents/${id}`, data),
  offline: (id: number) => request.put(`/admin/agents/${id}/offline`),
  delete: (id: number) => request.delete(`/admin/agents/${id}`),
}

// ===== 用户管理 =====
export const userApi = {
  list: (params?: any) => request.get('/admin/users', { params }),
  roles: () => request.get('/admin/users/roles'),
  detail: (id: number) => request.get(`/admin/users/${id}`),
  update: (id: number, data: any) => request.put(`/admin/users/${id}`, data),
  assignRole: (id: number, data: any) => request.put(`/admin/users/${id}/role`, data),
  delete: (id: number) => request.delete(`/admin/users/${id}`),
  resetPassword: (id: number, data: any) => request.put(`/admin/users/${id}/reset-password`, data),
}

// ===== 大模型管理 =====
export const modelApi = {
  list: () => request.get('/admin/models'),
  create: (data: any) => request.post('/admin/models', data),
  update: (id: number, data: any) => request.put(`/admin/models/${id}`, data),
  delete: (id: number) => request.delete(`/admin/models/${id}`),
  test: (id: number) => request.post(`/admin/models/${id}/test`),
}

// ===== 模板 =====
export const templateApi = {
  getDefault: () => request.get('/templates/default'),
  detail: (id: number) => request.get(`/templates/${id}`),
  adminList: () => request.get('/admin/templates'),
  create: (data: any) => request.post('/admin/templates', data),
  update: (id: number, data: any) => request.put(`/admin/templates/${id}`, data),
  delete: (id: number) => request.delete(`/admin/templates/${id}`),
}

// ===== 首页 =====
export const homepageApi = {
  get: () => request.get('/homepage'),
  adminGet: () => request.get('/admin/homepage'),
  update: (key: string, data: any) => request.put(`/admin/homepage/${key}`, data),
}

// ===== 应用导航 =====
export const navLinkApi = {
  list: () => request.get('/nav-links'),
  adminList: () => request.get('/admin/nav-links'),
  create: (data: any) => request.post('/admin/nav-links', data),
  update: (id: number, data: any) => request.put(`/admin/nav-links/${id}`, data),
  delete: (id: number) => request.delete(`/admin/nav-links/${id}`),
}

// ===== 日志 =====
export const logApi = {
  operations: (params?: any) => request.get('/admin/logs/operations', { params }),
  access: (params?: any) => request.get('/admin/logs/access', { params }),
}

// ===== 系统管理 =====
export const systemApi = {
  configs: () => request.get('/admin/system/configs'),
  updateConfig: (key: string, data: any) => request.put(`/admin/system/configs/${key}`, data),
  adminPath: () => request.get('/admin/system/admin-path'),
  regenerateAdminPath: () => request.post('/admin/system/admin-path/regenerate'),
  stats: () => request.get('/admin/system/stats'),
}

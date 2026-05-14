import axios from 'axios'
import { getToken, getRefreshToken, saveLoginData, logout } from './auth'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.code !== undefined && data.code !== 0) {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data
  },
  async (error) => {
    const originalRequest = error.config

    // Token过期自动刷新
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          })
          const data = res.data?.data || res.data
          saveLoginData(data)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return request(originalRequest)
        } catch {
          logout()
          return Promise.reject(error)
        }
      }
      logout()
    }

    const message = error.response?.data?.detail || error.response?.data?.message || error.message || '网络错误'
    return Promise.reject(new Error(message))
  },
)

export default request

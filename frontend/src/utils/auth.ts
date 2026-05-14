const TOKEN_KEY = 'xinfu_access_token'
const REFRESH_TOKEN_KEY = 'xinfu_refresh_token'
const USER_KEY = 'xinfu_user_info'
const ADMIN_SALT_KEY = 'xinfu_admin_salt'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function getUserInfo() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setUserInfo(user: any): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getAdminSalt(): string | null {
  return localStorage.getItem(ADMIN_SALT_KEY)
}

export function setAdminSalt(salt: string): void {
  localStorage.setItem(ADMIN_SALT_KEY, salt)
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

export function isAdmin(): boolean {
  const user = getUserInfo()
  return user?.is_admin === true
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(ADMIN_SALT_KEY)
  window.location.href = '/'
}

export function saveLoginData(data: any): void {
  setToken(data.access_token)
  setRefreshToken(data.refresh_token)
  setUserInfo(data.user)
  if (data.user?.is_admin) {
    // 管理员保存salt用于管理路径
    const salt = localStorage.getItem(ADMIN_SALT_KEY)
    if (!salt && data.admin_salt) {
      setAdminSalt(data.admin_salt)
    }
  }
}

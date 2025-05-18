// 身份验证方法常量
export const AUTH_METHOD = {
  PASSWORD: 'password',
  API_KEY: 'apikey',
} as const;

export type AuthMethod = typeof AUTH_METHOD[keyof typeof AUTH_METHOD];

// localStorage 的键
const AUTH_METHOD_KEY = 'auth_method';
const PASSWORD_VERIFIED_KEY = 'password_verified';
const PASSWORD_KEY = 'siliconflow_password';
const API_KEY_KEY = 'siliconflow_api_key';

/**
 * 获取当前身份验证方法
 */
export function getAuthMethod(): AuthMethod | null {
  if (typeof window === 'undefined') return null;
  
  const method = localStorage.getItem(AUTH_METHOD_KEY) as AuthMethod | null;
  return method && (method === AUTH_METHOD.PASSWORD || method === AUTH_METHOD.API_KEY)
    ? method
    : null;
}

/**
 * 设置身份验证方法
 */
export function setAuthMethod(method: AuthMethod): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_METHOD_KEY, method);
}

/**
 * 清除身份验证方法
 */
export function clearAuthMethod(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_METHOD_KEY);
}

/**
 * 判断是否使用密码验证
 */
export function isUsingPassword(): boolean {
  return getAuthMethod() === AUTH_METHOD.PASSWORD;
}

/**
 * 判断是否使用API密钥验证
 */
export function isUsingApiKey(): boolean {
  return getAuthMethod() === AUTH_METHOD.API_KEY;
}

/**
 * 判断密码是否已验证
 */
export function isPasswordVerified(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PASSWORD_VERIFIED_KEY) === 'true';
}

/**
 * 设置密码验证状态
 */
export function setPasswordVerified(verified: boolean): void {
  if (typeof window === 'undefined') return;
  if (verified) {
    localStorage.setItem(PASSWORD_VERIFIED_KEY, 'true');
  } else {
    localStorage.removeItem(PASSWORD_VERIFIED_KEY);
  }
}

/**
 * 获取保存的密码
 */
export function getPassword(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PASSWORD_KEY);
}

/**
 * 保存密码
 */
export function savePassword(password: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PASSWORD_KEY, password);
}

/**
 * 清除密码
 */
export function clearPassword(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PASSWORD_KEY);
  localStorage.removeItem(PASSWORD_VERIFIED_KEY);
}

/**
 * 获取API密钥
 */
export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(API_KEY_KEY);
}

/**
 * 保存API密钥
 */
export function saveApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(API_KEY_KEY, apiKey);
}

/**
 * 清除API密钥
 */
export function clearApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_KEY_KEY);
}

/**
 * 清除与特定身份验证方法相关的数据
 */
export function clearAuthData(method: AuthMethod): void {
  if (method === AUTH_METHOD.PASSWORD) {
    clearPassword();
  } else if (method === AUTH_METHOD.API_KEY) {
    clearApiKey();
  }
  
  // 如果当前使用的身份验证方法与要清除的方法相同，则同时清除身份验证方法记录
  if (getAuthMethod() === method) {
    clearAuthMethod();
  }
}

/**
 * 获取当前生效的API密钥
 * 如果用户使用的是密码验证，返回null以便后端使用环境变量中的API密钥
 * 如果用户使用的是本地API密钥，返回保存的API密钥
 */
export function getEffectiveApiKey(): string | null {
  if (isUsingPassword()) {
    return null; // 使用密码验证，让后端使用环境变量
  } else if (isUsingApiKey()) {
    return getApiKey(); // 使用本地API密钥
  }
  
  // 向后兼容处理
  const verified = isPasswordVerified();
  if (verified) {
    return null; // 密码已验证，让后端使用环境变量
  } else {
    return getApiKey(); // 尝试返回本地API密钥
  }
} 
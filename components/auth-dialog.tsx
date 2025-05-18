"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AUTH_METHOD,
  getAuthMethod,
  setAuthMethod,
  clearAuthData,
  isPasswordVerified as checkPasswordVerified,
  setPasswordVerified,
  getPassword,
  savePassword,
  clearPassword,
  getApiKey,
  saveApiKey,
  clearApiKey
} from "@/lib/auth"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerify: (success: boolean) => void
  onSaveApiKey: (apiKey: string) => void
  hasServerApiKey: boolean
}

export default function AuthDialog({ open, onOpenChange, onVerify, onSaveApiKey, hasServerApiKey }: AuthDialogProps) {
  const [password, setPassword] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>(AUTH_METHOD.PASSWORD)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [hasAccessPassword, setHasAccessPassword] = useState(true)
  const [envChecked, setEnvChecked] = useState(false)

  // 检查环境变量状态
  useEffect(() => {
    async function checkEnv() {
      try {
        const response = await fetch("/api/check-env")
        const data = await response.json()

        // 获取保存的身份验证方法
        const savedAuthMethod = getAuthMethod()

        // 如果用户之前已选择身份验证方法，优先使用该方法
        if (savedAuthMethod) {
          setActiveTab(savedAuthMethod)
        } else {
          // 否则根据环境变量决定默认选项卡
          const defaultTab = data.hasApiKey && data.hasPassword ? AUTH_METHOD.PASSWORD : AUTH_METHOD.API_KEY
          setActiveTab(defaultTab)
        }

        setHasAccessPassword(data.hasPassword)
        setEnvChecked(true)
      } catch (err) {
        console.error("环境变量检查失败:", err)

        // 获取保存的身份验证方法
        const savedAuthMethod = getAuthMethod()

        // 如果用户之前已选择身份验证方法，优先使用该方法
        if (savedAuthMethod) {
          setActiveTab(savedAuthMethod)
        } else {
          setActiveTab(hasServerApiKey ? AUTH_METHOD.PASSWORD : AUTH_METHOD.API_KEY)
        }

        setEnvChecked(true)
      }
    }

    checkEnv()
  }, [hasServerApiKey])

  // 检查是否已经验证过密码
  useEffect(() => {
    // 使用工具函数检查密码是否已验证
    setIsPasswordVerified(checkPasswordVerified())

    // 加载保存的密码
    const savedPassword = getPassword()
    if (savedPassword) {
      setPassword(savedPassword)
    }
  }, [])

  // 加载保存的API密钥
  useEffect(() => {
    const savedApiKey = getApiKey()
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  const handleVerify = async () => {
    if (!password.trim() && hasAccessPassword) return

    try {
      setIsVerifying(true)
      setError(null)

      // 如果环境变量中没有设置访问密码，则直接验证成功
      if (!hasAccessPassword) {
        setPasswordVerified(true)
        // 保存密码到本地存储
        savePassword(password)
        // 保存身份验证方法选择
        setAuthMethod(AUTH_METHOD.PASSWORD)
        setIsPasswordVerified(true)
        onVerify(true)
        setError(null)
        onOpenChange(false) // 验证成功后关闭对话框
        return
      }

      const response = await fetch("/api/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        // 密码验证成功
        setPasswordVerified(true)
        // 保存密码到本地存储
        savePassword(password)
        // 保存身份验证方法选择
        setAuthMethod(AUTH_METHOD.PASSWORD)
        setIsPasswordVerified(true)
        onVerify(true)
        setError(null)
        onOpenChange(false) // 验证成功后关闭对话框
      } else {
        setError(data.message || "密码验证失败")
        onVerify(false)
      }
    } catch (err) {
      console.error("Password verification error:", err)
      setError("验证过程中发生错误")
      onVerify(false)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      saveApiKey(apiKey)
      // 保存身份验证方法选择
      setAuthMethod(AUTH_METHOD.API_KEY)
      onSaveApiKey(apiKey)
      onOpenChange(false) // 保存API密钥后关闭对话框
    }
  }

  const handleClearPassword = () => {
    clearAuthData(AUTH_METHOD.PASSWORD)
    setIsPasswordVerified(false)
    setPassword("")
    onVerify(false)
  }

  const handleClearApiKey = () => {
    clearAuthData(AUTH_METHOD.API_KEY)
    setApiKey("")
    onSaveApiKey("")
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setError(null)
  }

  // 处理验证或保存API密钥的操作
  const handleAction = () => {
    if (activeTab === AUTH_METHOD.PASSWORD) {
      handleVerify()
    } else if (activeTab === AUTH_METHOD.API_KEY) {
      handleSaveApiKey()
    }
  }

  // 如果环境变量检查尚未完成，显示加载状态
  if (!envChecked) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>验证身份</DialogTitle>
            <DialogDescription>正在检查环境配置...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>验证身份</DialogTitle>
          <DialogDescription>请输入密码以使用服务器的API密钥，或者提供您自己的API密钥。</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={AUTH_METHOD.PASSWORD} disabled={!hasServerApiKey}>
              使用密码
            </TabsTrigger>
            <TabsTrigger value={AUTH_METHOD.API_KEY}>使用API密钥</TabsTrigger>
          </TabsList>

          <TabsContent value={AUTH_METHOD.PASSWORD} className="mt-4">
            <div className="grid gap-4">
              {!hasAccessPassword ? (
                <Alert>
                  <AlertDescription>服务器未设置访问密码，无需输入密码即可使用</AlertDescription>
                </Alert>
              ) : (
                <div className="relative">
                  <Input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleVerify()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "隐藏密码" : "显示密码"}</span>
                  </Button>
                </div>
              )}

              {isPasswordVerified && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">密码已验证</span>
                  <Button variant="outline" size="sm" onClick={handleClearPassword}>
                    清除密码
                  </Button>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleVerify}
                disabled={
                  (hasAccessPassword && !password.trim()) ||
                  isVerifying
                }
              >
                {isVerifying ? "验证中..." : isPasswordVerified ? "重新验证" : "验证密码"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value={AUTH_METHOD.API_KEY} className="mt-4">
            <div className="grid gap-4">
              <div className="relative">
                <Input
                  id="api-key-input"
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && apiKey.trim()) {
                      handleSaveApiKey()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  <span className="sr-only">{showApiKey ? "隐藏密钥" : "显示密钥"}</span>
                </Button>
              </div>

              {apiKey && (
                <Button variant="outline" size="sm" onClick={handleClearApiKey} className="w-full">
                  清除API密钥
                </Button>
              )}
              <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
                保存API密钥
              </Button>
            </div>
          </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  )
}

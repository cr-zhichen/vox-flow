"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EyeIcon, EyeOffIcon, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ApiKeyForm() {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [envStatus, setEnvStatus] = useState<{
    hasApiKey: boolean
    message: string
    envVars?: Array<{ name: string; exists: boolean }>
  } | null>(null)
  const [isCheckingEnv, setIsCheckingEnv] = useState(true)

  // 检查环境变量
  useEffect(() => {
    async function checkEnv() {
      try {
        setIsCheckingEnv(true)
        const response = await fetch("/api/check-env")
        const data = await response.json()
        setEnvStatus(data)
      } catch (error) {
        console.error("Failed to check environment variables:", error)
      } finally {
        setIsCheckingEnv(false)
      }
    }

    checkEnv()
  }, [])

  // Load API key from localStorage on component mount
  useEffect(() => {
    // 加载本地存储的 API 密钥
    const savedApiKey = localStorage.getItem("siliconflow_api_key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
      setIsSaved(true)
    }
  }, [])

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("siliconflow_api_key", apiKey)
      setIsSaved(true)
    }
  }

  const handleClearApiKey = () => {
    localStorage.removeItem("siliconflow_api_key")
    setApiKey("")
    setIsSaved(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SiliconFlow API 密钥</CardTitle>
        <CardDescription>输入您的SiliconFlow API密钥，或通过环境变量设置 SILICONFLOW_API_KEY</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {envStatus && (
            <Alert variant={envStatus.hasApiKey ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {envStatus.hasApiKey ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>环境变量状态</AlertTitle>
              </div>
              <AlertDescription>
                {envStatus.message}
                {envStatus.envVars && envStatus.envVars.length > 0 && (
                  <div className="mt-2 text-xs">
                    <p>检测到的相关环境变量:</p>
                    <ul className="list-disc pl-5 mt-1">
                      {envStatus.envVars.map((env) => (
                        <li key={env.name}>{env.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="api-key">API 密钥</Label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
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
              {isSaved ? (
                <Button variant="outline" onClick={handleClearApiKey}>
                  清除
                </Button>
              ) : (
                <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
                  保存
                </Button>
              )}
            </div>
          </div>
          {isSaved && <p className="text-sm text-green-600">API密钥已保存在本地浏览器中</p>}
          <p className="text-xs text-muted-foreground">
            您的API密钥仅存储在本地浏览器中，不会发送到我们的服务器。 您也可以通过设置环境变量 SILICONFLOW_API_KEY
            来提供API密钥，但用户输入的API密钥优先级更高。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

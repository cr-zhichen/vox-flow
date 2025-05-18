"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LockIcon, UnlockIcon } from "lucide-react"
import AuthDialog from "./auth-dialog"
import { isPasswordVerified as checkPasswordVerified, getApiKey, AUTH_METHOD, isUsingPassword, isUsingApiKey } from "@/lib/auth"

export default function AuthStatus() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [hasServerApiKey, setHasServerApiKey] = useState(false)

  // 检查是否已经验证过密码
  useEffect(() => {
    const verified = checkPasswordVerified()
    setIsPasswordVerified(verified)

    // 检查是否有本地API密钥
    const savedApiKey = getApiKey()
    setHasApiKey(!!savedApiKey)

    // 检查服务器是否有API密钥
    async function checkServerApiKey() {
      try {
        const response = await fetch("/api/check-api-key")
        const data = await response.json()
        setHasServerApiKey(data.hasApiKey)
      } catch (error) {
        console.error("Failed to check server API key:", error)
      }
    }

    checkServerApiKey()
  }, [])

  const handlePasswordVerify = (success: boolean) => {
    setIsPasswordVerified(success)
  }

  const handleSaveApiKey = (newApiKey: string) => {
    setHasApiKey(!!newApiKey)
  }

  const getAuthMethodText = () => {
    if (isUsingPassword()) {
      return "使用服务器API密钥"
    } else if (isUsingApiKey()) {
      return "使用本地API密钥"
    } else {
      // 向后兼容，保持原有行为
      return isPasswordVerified ? "使用服务器API密钥" : "使用本地API密钥"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>语音转文字验证</CardTitle>
        <CardDescription>使用密码或API密钥进行验证以使用语音转文字功能</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPasswordVerified || hasApiKey ? (
              <>
                <UnlockIcon className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-600">已验证</p>
                  <p className="text-sm text-muted-foreground">
                    {getAuthMethodText()}
                  </p>
                </div>
              </>
            ) : (
              <>
                <LockIcon className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-600">未验证</p>
                  <p className="text-sm text-muted-foreground">请验证以使用语音转文字功能</p>
                </div>
              </>
            )}
          </div>
          <Button onClick={() => setAuthDialogOpen(true)}>
            {isPasswordVerified || hasApiKey ? "重新验证" : "立即验证"}
          </Button>
        </div>
      </CardContent>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onVerify={handlePasswordVerify}
        onSaveApiKey={handleSaveApiKey}
        hasServerApiKey={hasServerApiKey}
      />
    </Card>
  )
}

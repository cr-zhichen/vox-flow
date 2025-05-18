"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LockIcon, UnlockIcon } from "lucide-react"
import AuthDialog from "./auth-dialog"

export default function AuthStatus() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)
  const [hasServerApiKey, setHasServerApiKey] = useState(false)

  // 检查是否已经验证过密码
  useEffect(() => {
    const verified = localStorage.getItem("password_verified") === "true"
    setIsPasswordVerified(verified)

    // 检查是否有本地API密钥
    const savedApiKey = localStorage.getItem("siliconflow_api_key")
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
                    {isPasswordVerified ? "使用服务器API密钥" : "使用本地API密钥"}
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

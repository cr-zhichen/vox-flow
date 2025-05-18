"use client"

import { useState } from "react"
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
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerify: (success: boolean) => void
}

export default function PasswordDialog({ open, onOpenChange, onVerify }: PasswordDialogProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    if (!password.trim()) return

    try {
      setIsVerifying(true)
      setError(null)

      const response = await fetch("/api/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        // 密码验证成功，保存到本地存储
        localStorage.setItem("password_verified", "true")
        onVerify(true)
        onOpenChange(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>需要密码验证</DialogTitle>
          <DialogDescription>
            请输入密码以使用服务器的API密钥。如果您没有密码，您仍然可以使用自己的API密钥。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleVerify} disabled={!password.trim() || isVerifying}>
            {isVerifying ? "验证中..." : "验证"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

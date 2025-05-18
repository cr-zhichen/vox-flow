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

interface ApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (apiKey: string) => void
}

export default function ApiKeyDialog({ open, onOpenChange, onSave }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem("siliconflow_api_key", apiKey)
      onSave(apiKey)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>需要 API 密钥</DialogTitle>
          <DialogDescription>请输入您的 SiliconFlow API 密钥以继续进行语音转录。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Input
              id="api-key-dialog"
              type={showApiKey ? "text" : "password"}
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
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
          <p className="text-xs text-muted-foreground">您的API密钥仅存储在本地浏览器中，不会发送到我们的服务器。</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            保存并继续
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

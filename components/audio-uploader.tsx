"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Loader2, FileAudio } from "lucide-react"
import { transcribeAudio } from "@/app/actions"
import TranscriptionResult from "./transcription-result"
import AuthDialog from "./auth-dialog"

export default function AudioUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [hasServerApiKey, setHasServerApiKey] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingFileRef = useRef<File | null>(null)

  // 加载保存的API密钥和检查密码验证状态
  useEffect(() => {
    const savedApiKey = localStorage.getItem("siliconflow_api_key")
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }

    const verified = localStorage.getItem("password_verified") === "true"
    setIsPasswordVerified(verified)

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check if file is an audio file
      if (!selectedFile.type.startsWith("audio/")) {
        setError("请上传音频文件（MP3、WAV等）")
        setFile(null)
        setAudioUrl(null)
        return
      }

      setError(null)
      setFile(selectedFile)
      setAudioUrl(URL.createObjectURL(selectedFile))
      setTranscription(null)
    }
  }

  const handleTranscribe = async () => {
    if (!file) return

    // 检查是否有API密钥或密码验证
    const savedApiKey = localStorage.getItem("siliconflow_api_key")
    const isVerified = localStorage.getItem("password_verified") === "true"

    if (!savedApiKey && !isVerified) {
      // 如果既没有API密钥也没有密码验证，则打开验证对话框
      pendingFileRef.current = file
      setAuthDialogOpen(true)
      return
    }

    try {
      setIsTranscribing(true)
      setError(null)

      const result = await transcribeAudio(file, savedApiKey || undefined, isVerified)

      if (result.error) {
        if (result.needApiKey) {
          // 需要API密钥
          pendingFileRef.current = file
          setAuthDialogOpen(true)
        } else {
          setError(result.error)
        }
      } else if (result.text) {
        setTranscription(result.text)
      }
    } catch (err) {
      console.error("Transcription error:", err)
      setError("转录过程中发生错误。请稍后再试。")
    } finally {
      setIsTranscribing(false)
    }
  }

  const handlePasswordVerify = (success: boolean) => {
    setIsPasswordVerified(success)

    // 如果验证成功且有待处理的文件，继续转录
    if (success && pendingFileRef.current) {
      processPendingFile()
    }
  }

  const handleApiKeySave = (newApiKey: string) => {
    setApiKey(newApiKey)

    // 如果保存了API密钥且有待处理的文件，继续转录
    if (newApiKey && pendingFileRef.current) {
      processPendingFile()
    }
  }

  const processPendingFile = async () => {
    if (!pendingFileRef.current) return

    try {
      setIsTranscribing(true)
      setError(null)

      const savedApiKey = localStorage.getItem("siliconflow_api_key")
      const isVerified = localStorage.getItem("password_verified") === "true"

      const result = await transcribeAudio(pendingFileRef.current, savedApiKey || undefined, isVerified)

      if (result.error) {
        setError(result.error)
      } else if (result.text) {
        setTranscription(result.text)
      } else {
        setError("转录服务返回了空响应。请再次尝试。")
      }
    } catch (err) {
      console.error("Transcription error:", err)
      setError("转录过程中发生错误。请稍后再试。")
    } finally {
      setIsTranscribing(false)
      pendingFileRef.current = null
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />

      <div className="flex flex-col items-center justify-center gap-4">
        <Button variant="outline" size="lg" className="w-full h-16 text-lg border-dashed" onClick={triggerFileInput}>
          <Upload className="mr-2 h-5 w-5" />
          选择音频文件
        </Button>

        {file && (
          <div className="flex items-center gap-2 text-sm">
            <FileAudio className="h-4 w-4" />
            <span>{file.name}</span>
            <span className="text-muted-foreground">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
          </div>
        )}

        {audioUrl && (
          <Card className="w-full p-4">
            <audio src={audioUrl} controls className="w-full" />
            <Button onClick={handleTranscribe} disabled={isTranscribing} className="w-full mt-4">
              {isTranscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在转录...
                </>
              ) : (
                "转录音频"
              )}
            </Button>
          </Card>
        )}

        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

        {transcription && <TranscriptionResult text={transcription} />}
      </div>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onVerify={handlePasswordVerify}
        onSaveApiKey={handleApiKeySave}
        hasServerApiKey={hasServerApiKey}
      />
    </div>
  )
}

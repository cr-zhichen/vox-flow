"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Loader2, FileAudio } from "lucide-react"
import { transcribeAudio } from "@/app/actions"
import TranscriptionResult from "./transcription-result"
import { isPasswordVerified as checkPasswordVerified, getApiKey, getEffectiveApiKey } from "@/lib/auth"

export default function AudioUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [hasServerApiKey, setHasServerApiKey] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载保存的API密钥和检查密码验证状态
  useEffect(() => {
    const savedApiKey = getApiKey()
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }

    const verified = checkPasswordVerified()
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
      processFile(selectedFile)
    }
  }

  const processFile = (selectedFile: File) => {
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

  const handleTranscribe = async () => {
    if (!file) return

    try {
      setIsTranscribing(true)
      setError(null)

      // 使用getEffectiveApiKey获取当前应该使用的API密钥
      const effectiveApiKey = getEffectiveApiKey()
      const isVerified = checkPasswordVerified()

      const result = await transcribeAudio(file, effectiveApiKey || undefined, isVerified)

      if (result.error) {
        setError(result.error)
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

  // 拖拽事件处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />

      <div className="flex flex-col items-center justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          className={`w-full h-16 text-lg border-dashed transition-colors ${isDragging
              ? "border-primary bg-primary/10 text-primary"
              : "hover:border-primary/50"
            }`}
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mr-2 h-5 w-5" />
          {isDragging ? "松开鼠标上传文件" : "选择音频文件或拖拽到此处"}
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


    </div>
  )
}

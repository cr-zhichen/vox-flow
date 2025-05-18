"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, Square, Loader2, AlertCircle } from "lucide-react"
import { transcribeAudio } from "@/app/actions"
import TranscriptionResult from "./transcription-result"
import AuthDialog from "./auth-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [hasServerApiKey, setHasServerApiKey] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
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

  const startRecording = async () => {
    try {
      setError(null)
      setDebugInfo(null)
      setAudioBlob(null)
      setAudioUrl(null)
      setTranscription(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setDebugInfo(`录制完成: 大小 ${(blob.size / 1024).toFixed(2)} KB, 类型 ${blob.type}`)

        if (blob.size === 0) {
          setError("录制的音频为空。请确保麦克风正常工作并再次尝试。")
          return
        }

        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      setError("无法访问麦克风。请确保您已授予麦克风访问权限。")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleTranscribe = async () => {
    if (!audioBlob) {
      setError("没有可用的音频数据。请先录制音频。")
      return
    }

    // 检查是否有API密钥或密码验证
    const savedApiKey = localStorage.getItem("siliconflow_api_key")
    const isVerified = localStorage.getItem("password_verified") === "true"

    if (!savedApiKey && !isVerified) {
      // 如果既没有API密钥也没有密码验证，则打开验证对话框
      const audioFile = new File([audioBlob], "recording.webm", {
        type: audioBlob.type,
      })
      pendingFileRef.current = audioFile
      setAuthDialogOpen(true)
      return
    }

    try {
      setIsTranscribing(true)
      setError(null)
      setDebugInfo("准备转录音频...")

      // Create a File object from the Blob
      const audioFile = new File([audioBlob], "recording.webm", {
        type: audioBlob.type,
      })

      setDebugInfo(`创建音频文件: 大小 ${(audioFile.size / 1024).toFixed(2)} KB, 类型 ${audioFile.type}`)
      setDebugInfo(
        `API密钥状态: ${savedApiKey ? "已保存" : "未保存"}, 密码验证状态: ${isVerified ? "已验证" : "未验证"}`,
      )

      setDebugInfo("发送转录请求...")
      const result = await transcribeAudio(audioFile, savedApiKey || undefined, isVerified)
      setDebugInfo(`收到转录响应: ${JSON.stringify(result)}`)

      if (result.error) {
        if (result.needApiKey) {
          // 需要API密钥
          setDebugInfo("需要API密钥，打开对话框")
          pendingFileRef.current = audioFile
          setAuthDialogOpen(true)
        } else {
          setError(result.error)
        }
      } else if (result.text) {
        setTranscription(result.text)
      } else {
        // 如果没有错误也没有文本，可能是服务器返回了空响应
        setError("转录服务返回了空响应。请再次尝试。")
      }
    } catch (err) {
      console.error("Transcription error:", err)
      setError(`转录过程中发生错误: ${err instanceof Error ? err.message : String(err)}`)
      setDebugInfo(`错误详情: ${JSON.stringify(err)}`)
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
      setDebugInfo(`使用新凭证的转录响应: ${JSON.stringify(result)}`)

      if (result.error) {
        setError(result.error)
      } else if (result.text) {
        setTranscription(result.text)
      } else {
        setError("转录服务返回了空响应。请再次尝试。")
      }
    } catch (err) {
      console.error("Transcription error:", err)
      setError(`转录过程中发生错误: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsTranscribing(false)
      pendingFileRef.current = null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          className="w-full h-16 text-lg"
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <>
              <Square className="mr-2 h-5 w-5" />
              停止录制
            </>
          ) : (
            <>
              <Mic className="mr-2 h-5 w-5" />
              开始录制
            </>
          )}
        </Button>

        {isRecording && (
          <div className="flex items-center justify-center">
            <span className="animate-pulse text-red-500">● 正在录制</span>
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {debugInfo && process.env.NODE_ENV === "development" && (
          <div className="w-full p-2 text-xs bg-gray-100 rounded border border-gray-200 whitespace-pre-wrap">
            <details>
              <summary>调试信息</summary>
              {debugInfo}
            </details>
          </div>
        )}

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

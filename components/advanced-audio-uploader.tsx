"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { 
  Upload, 
  Loader2, 
  FileAudio, 
  Scissors, 
  Download,
  Play,
  Pause,
  Settings
} from "lucide-react"
import { 
  splitAudioByVAD, 
  AudioChunk, 
  TranscriptionChunk,
  generateSRT,
  generateVTT,
  msToSrtTimestamp,
  arrayBufferToBase64
} from "@/lib/audio-utils"
import { isPasswordVerified as checkPasswordVerified, getApiKey, getEffectiveApiKey } from "@/lib/auth"

interface ChunkProgress {
  completed: number
  total: number
  currentChunk?: number
}

export default function AdvancedAudioUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [chunks, setChunks] = useState<AudioChunk[]>([])
  const [transcriptionChunks, setTranscriptionChunks] = useState<TranscriptionChunk[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [progress, setProgress] = useState<ChunkProgress>({ completed: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  
  // 切片设置
  const [minChunkLength, setMinChunkLength] = useState([2000])
  const [maxChunkLength, setMaxChunkLength] = useState([30000])
  const [silenceThreshold, setSilenceThreshold] = useState([0.01])
  
  // 音频播放状态
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 检查认证状态
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)

  useEffect(() => {
    const savedApiKey = getApiKey()
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
    setIsPasswordVerified(checkPasswordVerified())
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.type.startsWith("audio/")) {
        setError("请上传音频文件（MP3、WAV等）")
        return
      }

      setError(null)
      setFile(selectedFile)
      setAudioUrl(URL.createObjectURL(selectedFile))
      setChunks([])
      setTranscriptionChunks([])
    }
  }

  const handleSplitAudio = async () => {
    if (!file) return

    try {
      setIsProcessing(true)
      setError(null)
      
      console.log("开始音频切片处理...")
      
      const audioChunks = await splitAudioByVAD(file, {
        minChunkLength: minChunkLength[0],
        maxChunkLength: maxChunkLength[0],
        silenceThreshold: silenceThreshold[0]
      })
      
      setChunks(audioChunks)
      console.log(`音频切片完成，共 ${audioChunks.length} 个片段`)
    } catch (err) {
      console.error("音频切片失败:", err)
      setError("音频切片处理失败：" + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTranscribeChunks = async () => {
    if (chunks.length === 0) return

    try {
      setIsTranscribing(true)
      setError(null)
      setProgress({ completed: 0, total: chunks.length })

      const effectiveApiKey = getEffectiveApiKey()
      const isVerified = checkPasswordVerified()

      // 将音频片段转换为base64格式
      const chunksData = await Promise.all(
        chunks.map(async (chunk) => {
          const arrayBuffer = await chunk.audioBlob.arrayBuffer()
          const base64 = arrayBufferToBase64(arrayBuffer)
          
          return {
            index: chunk.index,
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            audioData: base64
          }
        })
      )

      // 调用批量转录API
      const response = await fetch('/api/transcribe-chunks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chunks: chunksData,
          apiKey: effectiveApiKey,
          isPasswordVerified: isVerified
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '转录请求失败')
      }

      const result = await response.json()
      setTranscriptionChunks(result.chunks)
      setProgress({ completed: result.totalChunks, total: result.totalChunks })
      
      console.log(`转录完成，共 ${result.totalChunks} 个片段`)
    } catch (err) {
      console.error("批量转录失败:", err)
      setError("转录失败：" + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsTranscribing(false)
    }
  }

  const downloadSubtitle = (format: 'srt' | 'vtt') => {
    if (transcriptionChunks.length === 0) return

    const content = format === 'srt' 
      ? generateSRT(transcriptionChunks)
      : generateVTT(transcriptionChunks)
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subtitle.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6">
      {/* 文件上传 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileAudio className="h-5 w-5" />
            音频文件上传
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="audio/*" 
            className="hidden" 
          />
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full h-16 text-lg border-dashed" 
            onClick={triggerFileInput}
          >
            <Upload className="mr-2 h-5 w-5" />
            选择音频文件
          </Button>

          {file && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <FileAudio className="h-4 w-4" />
                <span>{file.name}</span>
                <span className="text-muted-foreground">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>

              {audioUrl && (
                <div className="w-full">
                  <audio 
                    ref={audioRef}
                    src={audioUrl} 
                    controls 
                    className="w-full"
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime * 1000)}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 切片设置 */}
      {file && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              切片设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>最小片段长度: {minChunkLength[0] / 1000}秒</Label>
                <Slider
                  value={minChunkLength}
                  onValueChange={setMinChunkLength}
                  max={10000}
                  min={500}
                  step={500}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>最大片段长度: {maxChunkLength[0] / 1000}秒</Label>
                <Slider
                  value={maxChunkLength}
                  onValueChange={setMaxChunkLength}
                  max={60000}
                  min={5000}
                  step={5000}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>静音阈值: {silenceThreshold[0]}</Label>
                <Slider
                  value={silenceThreshold}
                  onValueChange={setSilenceThreshold}
                  max={0.1}
                  min={0.001}
                  step={0.001}
                  className="w-full"
                />
              </div>
            </div>

            <Button 
              onClick={handleSplitAudio} 
              disabled={isProcessing || !file}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在处理音频...
                </>
              ) : (
                <>
                  <Scissors className="mr-2 h-4 w-4" />
                  分割音频片段
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 音频片段预览 */}
      {chunks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>音频片段 ({chunks.length} 个)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {chunks.slice(0, 12).map((chunk) => (
                <div 
                  key={chunk.index} 
                  className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                >
                  <span>片段 {chunk.index + 1}</span>
                  <span className="text-muted-foreground">
                    {formatDuration(chunk.endTime - chunk.startTime)}
                  </span>
                </div>
              ))}
              {chunks.length > 12 && (
                <div className="flex items-center justify-center p-2 bg-muted rounded text-sm text-muted-foreground">
                  +{chunks.length - 12} 更多...
                </div>
              )}
            </div>

            <Button 
              onClick={handleTranscribeChunks} 
              disabled={isTranscribing || chunks.length === 0}
              className="w-full mt-4"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在转录... ({progress.completed}/{progress.total})
                </>
              ) : (
                "开始转录所有片段"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 转录结果 */}
      {transcriptionChunks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>转录结果</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => downloadSubtitle('srt')}
                >
                  <Download className="mr-1 h-4 w-4" />
                  下载 SRT
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => downloadSubtitle('vtt')}
                >
                  <Download className="mr-1 h-4 w-4" />
                  下载 VTT
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {transcriptionChunks.map((chunk) => (
                <div 
                  key={chunk.index} 
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>片段 {chunk.index + 1}</span>
                    <span>
                      {msToSrtTimestamp(chunk.startTime)} → {msToSrtTimestamp(chunk.endTime)}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {chunk.text}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
} 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AudioRecorder from "@/components/audio-recorder"
import AudioUploader from "@/components/audio-uploader"
import AdvancedAudioUploader from "@/components/advanced-audio-uploader"
import { Suspense } from "react"
import { LoadingSpinner } from "@/components/loading-spinner"
import DebugPanel from "@/components/debug-panel"
import AuthStatus from "@/components/auth-status"

export default function Home() {
  const isDev = process.env.NODE_ENV === "development"

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col items-center space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">语音转录</h1>
        <p className="max-w-[700px] text-muted-foreground">
          使用SiliconFlow API将语音转换为文字。您可以录制音频、上传音频文件，或使用高级功能进行音频切片转录并生成字幕。
        </p>
      </div>

      <div className="mx-auto max-w-4xl mt-10">
        <Suspense
          fallback={
            <div className="flex justify-center p-6">
              <LoadingSpinner />
            </div>
          }
        >
          <AuthStatus />
        </Suspense>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>语音转文字</CardTitle>
            <CardDescription>选择转录方式：快速转录或带时间戳的高级转录</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="record" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="record">录制音频</TabsTrigger>
                <TabsTrigger value="upload">上传音频</TabsTrigger>
                <TabsTrigger value="advanced">高级转录</TabsTrigger>
              </TabsList>
              <TabsContent value="record" className="mt-4">
                <AudioRecorder />
              </TabsContent>
              <TabsContent value="upload" className="mt-4">
                <AudioUploader />
              </TabsContent>
              <TabsContent value="advanced" className="mt-4">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">🎯 高级转录功能</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 智能音频切片：基于静音检测自动分割音频</li>
                      <li>• 时间戳同步：每个片段都有精确的时间标记</li>
                      <li>• 字幕文件导出：支持SRT和VTT格式下载</li>
                      <li>• 并发处理：多个音频片段同时转录，提高效率</li>
                    </ul>
                  </div>
                  <AdvancedAudioUploader />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {isDev && <DebugPanel />}
      </div>
    </main>
  )
}

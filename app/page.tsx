import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AudioRecorder from "@/components/audio-recorder"
import AudioUploader from "@/components/audio-uploader"
import { Suspense } from "react"
import { LoadingSpinner } from "@/components/loading-spinner"
import DebugPanel from "@/components/debug-panel"
import AuthStatus from "@/components/auth-status"

export default function Home() {
  const isDev = process.env.NODE_ENV === "development"

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col items-center space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">语音转文字应用</h1>
        <p className="max-w-[700px] text-muted-foreground">
          使用SiliconFlow API将语音转换为文字。您可以录制音频或上传音频文件。
        </p>
      </div>

      <div className="mx-auto max-w-2xl mt-10">
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
            <CardDescription>录制音频或上传音频文件，然后将其转换为文字</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="record" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="record">录制音频</TabsTrigger>
                <TabsTrigger value="upload">上传音频</TabsTrigger>
              </TabsList>
              <TabsContent value="record" className="mt-4">
                <AudioRecorder />
              </TabsContent>
              <TabsContent value="upload" className="mt-4">
                <AudioUploader />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {isDev && <DebugPanel />}
      </div>
    </main>
  )
}

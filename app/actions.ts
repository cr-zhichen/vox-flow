"use server"

import { revalidatePath } from "next/cache"

export async function transcribeAudio(file: File, clientApiKey?: string) {
  try {
    // 优先使用客户端传入的API密钥，其次使用环境变量
    const apiKey = clientApiKey || process.env.SILICONFLOW_API_KEY

    // 调试输出（仅在开发环境）
    if (process.env.NODE_ENV === "development") {
      console.log("Environment variable exists:", !!process.env.SILICONFLOW_API_KEY)
      console.log("Client API key exists:", !!clientApiKey)
      console.log("File size:", file.size, "bytes")
      console.log("File type:", file.type)
    }

    // 如果没有API密钥，返回错误
    if (!apiKey) {
      console.log("No API key found")
      return { error: "需要API密钥", needApiKey: true }
    }

    // 验证文件
    if (file.size === 0) {
      console.log("Empty file detected")
      return { error: "音频文件为空" }
    }

    // 验证文件类型
    if (!file.type.startsWith("audio/")) {
      console.log("Invalid file type:", file.type)
      return { error: "文件类型无效，请上传音频文件" }
    }

    // Create FormData
    const formData = new FormData()
    formData.append("model", "FunAudioLLM/SenseVoiceSmall")
    formData.append("file", file)

    console.log("Sending request to SiliconFlow API")

    // Make request to SiliconFlow API
    const response = await fetch("https://api.siliconflow.cn/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    })

    console.log("Response status:", response.status)

    // Handle response
    if (!response.ok) {
      let errorMessage = "转录失败"

      // Handle specific error codes
      switch (response.status) {
        case 400:
          errorMessage = "参数错误，请检查您的请求"
          break
        case 401:
          errorMessage = "API密钥无效或未提供。请检查您的API密钥设置。"
          break
        case 404:
          errorMessage = "资源未找到"
          break
        case 429:
          errorMessage = "请求过于频繁，请稍后再试"
          break
        case 503:
        case 504:
          errorMessage = "服务不可用或请求超时，请稍后再试"
          break
      }

      // 尝试获取更详细的错误信息
      try {
        const errorData = await response.json()
        console.log("Error response:", errorData)
        if (errorData && errorData.error) {
          errorMessage += ` (${errorData.error})`
        }
      } catch (e) {
        console.log("Could not parse error response")
      }

      return { error: errorMessage }
    }

    // 解析响应
    try {
      const data = await response.json()
      console.log("Transcription successful")

      if (!data || !data.text) {
        console.log("Empty response or missing text field:", data)
        return { error: "转录服务返回了无效的响应" }
      }

      // Revalidate the path to update the UI
      revalidatePath("/")

      return { text: data.text }
    } catch (parseError) {
      console.error("Error parsing response:", parseError)
      return { error: "无法解析转录服务的响应" }
    }
  } catch (error) {
    console.error("Transcription error:", error)
    return { error: `转录过程中发生错误: ${error instanceof Error ? error.message : String(error)}` }
  }
}

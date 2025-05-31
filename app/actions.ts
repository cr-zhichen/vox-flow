"use server"

import { revalidatePath } from "next/cache"

// 在函数参数中添加 isPasswordVerified 参数
export async function transcribeAudio(file: File, clientApiKey?: string, isPasswordVerified = false) {
  try {
    // 优先使用客户端传入的API密钥，其次在密码验证通过的情况下使用环境变量
    let apiKey = clientApiKey

    // 只有在密码验证通过的情况下才使用服务器API密钥
    if (!apiKey && isPasswordVerified && process.env.SILICONFLOW_API_KEY) {
      apiKey = process.env.SILICONFLOW_API_KEY
    }

    // 调试输出（仅在开发环境）
    if (process.env.NODE_ENV === "development") {
      console.log("Environment variable exists:", !!process.env.SILICONFLOW_API_KEY)
      console.log("Client API key exists:", !!clientApiKey)
      console.log("Password verified:", isPasswordVerified)
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

// 新增：批量转录音频切片的server action
export async function transcribeAudioChunks(
  chunks: Array<{
    index: number
    startTime: number
    endTime: number
    audioData: string // base64 encoded audio data
  }>,
  clientApiKey?: string,
  isPasswordVerified = false
) {
  try {
    // 优先使用客户端传入的API密钥，其次在密码验证通过的情况下使用环境变量
    let apiKey = clientApiKey

    if (!apiKey && isPasswordVerified && process.env.SILICONFLOW_API_KEY) {
      apiKey = process.env.SILICONFLOW_API_KEY
    }

    if (!apiKey) {
      return { error: "需要API密钥", needApiKey: true }
    }

    if (!chunks || chunks.length === 0) {
      return { error: "未提供音频片段" }
    }

    console.log(`开始批量转录 ${chunks.length} 个音频片段`)

    // 批量转录所有片段
    const results = await Promise.allSettled(
      chunks.map(async (chunk) => {
        try {
          // 将base64转换为Blob
          const binaryString = atob(chunk.audioData)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const audioBlob = new Blob([bytes], { type: 'audio/wav' })

          // 创建FormData
          const formData = new FormData()
          formData.append("model", "FunAudioLLM/SenseVoiceSmall")
          formData.append("file", audioBlob, `chunk_${chunk.index}.wav`)

          // 调用API
          const response = await fetch("https://api.siliconflow.cn/v1/audio/transcriptions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          return {
            index: chunk.index,
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            text: data.text || ""
          }
        } catch (error) {
          console.error(`转录片段 ${chunk.index} 失败:`, error)
          return {
            index: chunk.index,
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            text: `[转录失败: ${error instanceof Error ? error.message : '未知错误'}]`
          }
        }
      })
    )

    // 处理结果
    const transcriptionChunks = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          index: chunks[index].index,
          startTime: chunks[index].startTime,
          endTime: chunks[index].endTime,
          text: `[转录失败: ${result.reason}]`
        }
      }
    })

    // 按索引排序
    transcriptionChunks.sort((a, b) => a.index - b.index)

    console.log(`批量转录完成，共 ${transcriptionChunks.length} 个片段`)

    // Revalidate the path to update the UI
    revalidatePath("/")

    return { 
      chunks: transcriptionChunks,
      totalChunks: transcriptionChunks.length
    }
  } catch (error) {
    console.error("批量转录错误:", error)
    return { error: `批量转录过程中发生错误: ${error instanceof Error ? error.message : String(error)}` }
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData()
    const file = formData.get("file") as File

    // 优先使用客户端传入的API密钥，其次使用环境变量
    const clientApiKey = formData.get("apiKey") as string
    const apiKey = clientApiKey || process.env.SILICONFLOW_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API密钥未提供", needApiKey: true }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: "未提供音频文件" }, { status: 400 })
    }

    // Create new FormData for the API request
    const apiFormData = new FormData()
    apiFormData.append("model", "FunAudioLLM/SenseVoiceSmall")
    apiFormData.append("file", file)

    // Make request to SiliconFlow API
    const response = await fetch("https://api.siliconflow.cn/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: apiFormData,
    })

    // Handle response
    if (!response.ok) {
      let errorMessage = "转录失败"

      // Handle specific error codes
      switch (response.status) {
        case 400:
          errorMessage = "参数错误，请检查您的请求"
          break
        case 401:
          errorMessage = "API密钥无效"
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

      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json({ error: "处理请求时发生错误" }, { status: 500 })
  }
}

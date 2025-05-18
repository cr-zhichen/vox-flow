import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.SILICONFLOW_API_KEY
    const hasApiKey = !!apiKey

    // 不要发送实际的API请求，只检查API密钥是否存在
    // 这样可以避免不必要的API调用
    return NextResponse.json({
      success: true,
      hasApiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyPrefix: apiKey ? apiKey.substring(0, 3) : null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

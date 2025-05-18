import { NextResponse } from "next/server"

export async function GET() {
  // 检查是否设置了环境变量
  const hasApiKey = !!process.env.SILICONFLOW_API_KEY

  // 返回结果，但不返回实际的 API 密钥
  return NextResponse.json({ hasApiKey })
}

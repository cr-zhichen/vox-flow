import { NextResponse } from "next/server"

export async function GET() {
  // 检查环境变量是否存在（不返回实际值，只返回是否存在）
  const hasApiKey = !!process.env.SILICONFLOW_API_KEY

  // 返回环境变量名称，帮助调试
  const envVarNames = Object.keys(process.env)
    .filter((key) => key.includes("SILICON") || key.includes("API"))
    .map((key) => ({ name: key, exists: true }))

  return NextResponse.json({
    hasApiKey,
    message: hasApiKey ? "环境变量 SILICONFLOW_API_KEY 已设置" : "环境变量 SILICONFLOW_API_KEY 未设置",
    envVars: envVarNames,
  })
}

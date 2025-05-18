import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    // 获取环境变量中设置的密码
    const correctPassword = process.env.API_ACCESS_PASSWORD

    // 如果没有设置密码环境变量，返回错误
    if (!correctPassword) {
      return NextResponse.json({ success: false, message: "服务器未配置访问密码" }, { status: 500 })
    }

    // 验证密码
    const isValid = password === correctPassword

    // 如果密码正确，返回成功并指示可以使用服务器API密钥
    if (isValid) {
      return NextResponse.json({
        success: true,
        message: "密码验证成功",
        canUseServerApiKey: true,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "密码不正确",
          canUseServerApiKey: false,
        },
        { status: 401 },
      )
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: "验证过程中发生错误", error: String(error) }, { status: 500 })
  }
}

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "语音转录 - SiliconFlow API",
  description: "使用 SiliconFlow API 将语音转换为文字的应用",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm">
            <div className="container mx-auto py-4 px-4 md:px-6">
              <h1 className="text-xl font-bold text-gray-900">语音转录</h1>
            </div>
          </header>
          <main className="flex-grow">
            {children}
          </main>
          <footer className="bg-white border-t py-6 mt-auto">
            <div className="container mx-auto px-4 md:px-6 text-center text-sm text-gray-500">
              <p>© {new Date().getFullYear()} 语音转录 - 基于 SiliconFlow API</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

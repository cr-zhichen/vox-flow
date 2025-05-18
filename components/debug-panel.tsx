"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugPanel() {
  const [envInfo, setEnvInfo] = useState<any>(null)
  const [apiKeyInfo, setApiKeyInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkEnvironment = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setApiKeyInfo(null) // 清除API密钥信息
      const response = await fetch("/api/check-env")
      const data = await response.json()
      setEnvInfo(data)
    } catch (err) {
      setError(`检查环境变量失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testApiKey = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setEnvInfo(null) // 清除环境变量信息
      const response = await fetch("/api/test-api-key")
      const data = await response.json()
      setApiKeyInfo(data)
    } catch (err) {
      setError(`测试API密钥失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 确定当前显示的信息标题
  const getInfoTitle = () => {
    if (envInfo) return "环境变量信息";
    if (apiKeyInfo) return "API密钥测试信息";
    return "";
  }

  // 获取当前显示的JSON数据
  const getInfoData = () => {
    if (envInfo) return envInfo;
    if (apiKeyInfo) return apiKeyInfo;
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>调试面板</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button onClick={checkEnvironment} disabled={isLoading}>
            检查环境变量
          </Button>
          <Button onClick={testApiKey} disabled={isLoading}>
            测试API密钥
          </Button>
        </div>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        {getInfoData() && (
          <div>
            <h3 className="text-sm font-medium mb-2">{getInfoTitle()}</h3>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(getInfoData(), null, 2)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

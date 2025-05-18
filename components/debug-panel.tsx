"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugPanel() {
  const [envInfo, setEnvInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkEnvironment = async () => {
    try {
      setIsLoading(true)
      setError(null)
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
      const response = await fetch("/api/test-api-key")
      const data = await response.json()
      setEnvInfo((prev: any) => ({ ...prev, apiKeyTest: data }))
    } catch (err) {
      setError(`测试API密钥失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
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

        {envInfo && (
          <div className="bg-gray-100 p-4 rounded text-sm font-mono whitespace-pre-wrap">
            {JSON.stringify(envInfo, null, 2)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

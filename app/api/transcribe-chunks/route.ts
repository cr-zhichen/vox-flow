import { type NextRequest, NextResponse } from "next/server"

interface TranscriptionRequest {
  audioBlob: string // base64编码的音频数据
  startTime: number
  endTime: number
  index: number
}

// 转录单个音频片段
async function transcribeChunk(
  audioBlob: Blob,
  apiKey: string,
  retries: number = 3
): Promise<string> {
  const url = "https://api.siliconflow.cn/v1/audio/transcriptions"
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const formData = new FormData()
      formData.append("model", "FunAudioLLM/SenseVoiceSmall")
      formData.append("file", audioBlob, `chunk_${Date.now()}.wav`)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 429 && attempt < retries) {
          // 请求过于频繁，等待后重试
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
          continue
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.text || ""
    } catch (error) {
      console.error(`转录失败 (尝试 ${attempt}/${retries}):`, error)
      
      if (attempt === retries) {
        throw error
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  return ""
}

export async function POST(request: NextRequest) {
  try {
    const { chunks, apiKey: clientApiKey, isPasswordVerified, maxConcurrency = 4 } = await request.json()
    
    // 优先使用客户端传入的API密钥，其次在密码验证通过的情况下使用环境变量
    let apiKey = clientApiKey
    if (!apiKey && isPasswordVerified && process.env.SILICONFLOW_API_KEY) {
      apiKey = process.env.SILICONFLOW_API_KEY
    }

    if (!apiKey) {
      return NextResponse.json({ error: "API密钥未提供", needApiKey: true }, { status: 400 })
    }

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json({ error: "未提供有效的音频片段" }, { status: 400 })
    }

    console.log(`开始转录 ${chunks.length} 个音频片段，并发数: ${maxConcurrency}`)

    // 并发转录所有片段，使用用户设置的并发数量
    const results: Array<{
      index: number
      startTime: number
      endTime: number
      text: string
    }> = []

    // 分批处理
    for (let i = 0; i < chunks.length; i += maxConcurrency) {
      const batch = chunks.slice(i, i + maxConcurrency)
      
      const promises = batch.map(async (chunk: any) => {
        try {
          // 将base64字符串转换回Blob
          const binaryString = atob(chunk.audioData)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const audioBlob = new Blob([bytes], { type: 'audio/wav' })
          
          const text = await transcribeChunk(audioBlob, apiKey)
          
          return {
            index: chunk.index,
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            text: text.trim()
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

      const batchResults = await Promise.all(promises)
      results.push(...batchResults)
      
      console.log(`完成批次 ${Math.floor(i / maxConcurrency) + 1}/${Math.ceil(chunks.length / maxConcurrency)}`)
    }

    // 按索引排序结果
    results.sort((a, b) => a.index - b.index)

    // 过滤掉没有内容的转录结果
    const filteredResults = results.filter(result => {
      const text = result.text.trim()
      return text.length > 0 && !text.startsWith('[转录失败')
    })

    // 重新分配索引，保持连续性
    const finalResults = filteredResults.map((result, index) => ({
      ...result,
      index: index
    }))

    console.log(`转录完成，共 ${results.length} 个片段，有效片段 ${finalResults.length} 个`)

    return NextResponse.json({ 
      chunks: finalResults,
      totalChunks: finalResults.length,
      originalChunks: results.length
    })
  } catch (error) {
    console.error("批量转录API错误:", error)
    return NextResponse.json({ 
      error: `处理请求时发生错误: ${error instanceof Error ? error.message : '未知错误'}` 
    }, { status: 500 })
  }
} 
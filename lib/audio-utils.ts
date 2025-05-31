// 音频处理工具类
// @ts-ignore - audiobuffer-to-wav没有类型定义
import toWav from 'audiobuffer-to-wav'

// 时间戳格式转换：毫秒 -> SRT格式
export function msToSrtTimestamp(ms: number): string {
  const hours = Math.floor(ms / (3600 * 1000))
  const minutes = Math.floor((ms % (3600 * 1000)) / (60 * 1000))
  const seconds = Math.floor((ms % (60 * 1000)) / 1000)
  const milliseconds = ms % 1000

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`
}

// 安全地将ArrayBuffer转换为base64字符串，避免调用栈溢出
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 8192 // 每次处理8KB
  let binary = ''
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  
  return btoa(binary)
}

// 音频切片数据接口
export interface AudioChunk {
  startTime: number // 开始时间（毫秒）
  endTime: number   // 结束时间（毫秒）
  audioBlob: Blob   // 音频片段
  index: number     // 序号
}

// 检测音频中的无声片段
async function detectSilence(audioBuffer: AudioBuffer, threshold: number = 0.01): Promise<Array<{start: number, end: number}>> {
  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const silenceRegions: Array<{start: number, end: number}> = []
  
  let silenceStart = -1
  const minSilenceDuration = 500 // 最小静音持续时间（毫秒）
  const minSilenceSamples = (minSilenceDuration / 1000) * sampleRate
  
  for (let i = 0; i < channelData.length; i++) {
    const isQuiet = Math.abs(channelData[i]) < threshold
    
    if (isQuiet && silenceStart === -1) {
      silenceStart = i
    } else if (!isQuiet && silenceStart !== -1) {
      const silenceDuration = i - silenceStart
      if (silenceDuration >= minSilenceSamples) {
        silenceRegions.push({
          start: (silenceStart / sampleRate) * 1000,
          end: (i / sampleRate) * 1000
        })
      }
      silenceStart = -1
    }
  }
  
  return silenceRegions
}

// 基于静音检测切分音频
export async function splitAudioByVAD(
  file: File,
  options: {
    minChunkLength?: number    // 最小片段长度（毫秒）
    maxChunkLength?: number    // 最大片段长度（毫秒）
    silenceThreshold?: number  // 静音阈值
  } = {}
): Promise<AudioChunk[]> {
  const {
    minChunkLength = 0,        // 默认最小0秒，不过滤短语音
    maxChunkLength = 30000,    // 默认最大30秒
    silenceThreshold = 0.01    // 默认静音阈值
  } = options

  try {
    // 将文件转换为AudioBuffer
    const arrayBuffer = await file.arrayBuffer()
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    // 检测静音区域
    const silenceRegions = await detectSilence(audioBuffer, silenceThreshold)
    
    // 计算音频片段边界
    const speechRegions: Array<{start: number, end: number}> = []
    let lastEnd = 0
    
    for (const silence of silenceRegions) {
      if (silence.start > lastEnd) {
        speechRegions.push({
          start: lastEnd,
          end: silence.start
        })
      }
      lastEnd = silence.end
    }
    
    // 添加最后一个片段
    if (lastEnd < audioBuffer.duration * 1000) {
      speechRegions.push({
        start: lastEnd,
        end: audioBuffer.duration * 1000
      })
    }
    
    // 过滤太短的片段并分割过长的片段
    const finalChunks: Array<{start: number, end: number}> = []
    
    for (const region of speechRegions) {
      const duration = region.end - region.start
      
      // 跳过太短的片段
      if (duration < minChunkLength) {
        continue
      }
      
      // 分割过长的片段
      if (duration > maxChunkLength) {
        let start = region.start
        while (start < region.end) {
          const end = Math.min(start + maxChunkLength, region.end)
          finalChunks.push({ start, end })
          start = end
        }
      } else {
        finalChunks.push(region)
      }
    }
    
    // 创建音频切片
    const chunks: AudioChunk[] = []
    
    for (let i = 0; i < finalChunks.length; i++) {
      const chunk = finalChunks[i]
      const startSample = Math.floor((chunk.start / 1000) * audioBuffer.sampleRate)
      const endSample = Math.floor((chunk.end / 1000) * audioBuffer.sampleRate)
      const length = endSample - startSample
      
      // 创建新的AudioBuffer
      const chunkBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        length,
        audioBuffer.sampleRate
      )
      
      // 复制音频数据
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const sourceData = audioBuffer.getChannelData(channel)
        const targetData = chunkBuffer.getChannelData(channel)
        for (let j = 0; j < length; j++) {
          targetData[j] = sourceData[startSample + j]
        }
      }
      
      // 转换为WAV格式
      const wavArrayBuffer = toWav(chunkBuffer)
      const audioBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' })
      
      chunks.push({
        startTime: chunk.start,
        endTime: chunk.end,
        audioBlob,
        index: i
      })
    }
    
    return chunks
  } catch (error) {
    console.error('音频切片处理失败:', error)
    throw new Error('音频切片处理失败')
  }
}

// 转录结果接口
export interface TranscriptionChunk {
  index: number
  startTime: number
  endTime: number
  text: string
}

// 生成SRT字幕格式
export function generateSRT(transcriptionChunks: TranscriptionChunk[]): string {
  // 过滤掉空内容的片段
  const validChunks = transcriptionChunks.filter(chunk => {
    const text = chunk.text.trim()
    return text.length > 0 && !text.startsWith('[转录失败')
  })

  return validChunks
    .map((chunk, index) => {
      const startTimestamp = msToSrtTimestamp(chunk.startTime)
      const endTimestamp = msToSrtTimestamp(chunk.endTime)
      return `${index + 1}\n${startTimestamp} --> ${endTimestamp}\n${chunk.text.trim()}\n`
    })
    .join('\n')
}

// 生成VTT字幕格式
export function generateVTT(transcriptionChunks: TranscriptionChunk[]): string {
  // 过滤掉空内容的片段
  const validChunks = transcriptionChunks.filter(chunk => {
    const text = chunk.text.trim()
    return text.length > 0 && !text.startsWith('[转录失败')
  })

  const header = 'WEBVTT\n\n'
  const content = validChunks
    .map(chunk => {
      const startTimestamp = msToSrtTimestamp(chunk.startTime).replace(',', '.')
      const endTimestamp = msToSrtTimestamp(chunk.endTime).replace(',', '.')
      return `${startTimestamp} --> ${endTimestamp}\n${chunk.text.trim()}\n`
    })
    .join('\n')
  
  return header + content
}

// 生成无时间戳的纯文本格式
export function generatePlainText(transcriptionChunks: TranscriptionChunk[]): string {
  // 过滤掉空内容的片段
  const validChunks = transcriptionChunks.filter(chunk => {
    const text = chunk.text.trim()
    return text.length > 0 && !text.startsWith('[转录失败')
  })

  return validChunks
    .map(chunk => chunk.text.trim())
    .join(' ')
} 
import { OCR_PROMPT, normalizeOcrSettings } from '../config/ocr'
import { readBlobAsBase64 } from './document'

export async function streamOcrMarkdown({ blob, onChunk, settings, signal }) {
  const ocrSettings = normalizeOcrSettings(settings)
  const requestStartedAt = performance.now()
  const encodedImage = await readBlobAsBase64(blob)

  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify({
      image: encodedImage,
      prompt: OCR_PROMPT,
      model: ocrSettings.model,
    }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error || 'The OCR request failed.')
  }

  if (!response.body) {
    throw new Error('The browser did not receive a readable response stream.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let streamedMarkdown = ''
  let firstTokenAt = null

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      break
    }

    pending += decoder.decode(value, { stream: true })
    const lines = pending.split('\n')
    pending = lines.pop() ?? ''

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (!trimmedLine || trimmedLine === 'data: [DONE]') {
        continue
      }

      // Gemini SSE 形式: "data: {...json...}"
      if (trimmedLine.startsWith('data: ')) {
        const jsonStr = trimmedLine.slice(6)

        try {
          const chunk = JSON.parse(jsonStr)
          const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text

          if (typeof text === 'string' && text) {
            if (firstTokenAt === null) {
              firstTokenAt = performance.now()
            }

            streamedMarkdown += text
            onChunk(streamedMarkdown)
          }
        } catch {
          // JSON解析エラーは無視して次のチャンクへ
        }
      }
    }
  }

  // 残りのバッファを処理
  const trailingLine = pending.trim()

  if (trailingLine && trailingLine.startsWith('data: ') && trailingLine !== 'data: [DONE]') {
    const jsonStr = trailingLine.slice(6)

    try {
      const chunk = JSON.parse(jsonStr)
      const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text

      if (typeof text === 'string' && text) {
        if (firstTokenAt === null) {
          firstTokenAt = performance.now()
        }

        streamedMarkdown += text
        onChunk(streamedMarkdown)
      }
    } catch {
      // JSON解析エラーは無視
    }
  }

  return buildOcrResult({
    markdown: streamedMarkdown,
    firstTokenAt,
    requestStartedAt,
  })
}

function buildOcrResult({ markdown, firstTokenAt, requestStartedAt }) {
  const finalMarkdown = markdown.trim()

  if (!finalMarkdown) {
    throw new Error('The model returned an empty response.')
  }

  return {
    markdown: finalMarkdown,
    stats: {
      ttftMs: firstTokenAt === null ? null : Math.max(0, firstTokenAt - requestStartedAt),
      tokensPerSecond: null,
    },
  }
}

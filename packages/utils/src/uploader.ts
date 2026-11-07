/**
 * XHR 上传工具。
 *
 * 响应协议与原版 editor.md 服务端约定保持兼容（唯一的对外协议兼容点）：
 *   成功: { "success": 1, "url": "<文件地址>" }
 *   失败: { "success": 0, "message": "<错误信息>" }
 * 上传表单字段名默认 editormd-image-file。
 */

export interface UploadResult {
  success: 0 | 1
  url?: string
  message?: string
}

export interface UploadOptions {
  url: string
  file: File
  /** 表单字段名，默认 editormd-image-file */
  fieldName?: string
  /** 附加表单字段 */
  fields?: Record<string, string>
  /** 0~100 进度回调 */
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

export function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { url, file, fieldName = 'editormd-image-file', fields = {}, onProgress, signal } = options

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.responseType = 'text'
    if (signal) {
      signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      })
    }

    xhr.addEventListener('load', () => {
      resolve(parseResponse(xhr.status, xhr.responseText))
    })
    xhr.addEventListener('error', () => reject(new Error('[editormd-next] network error during upload')))
    xhr.addEventListener('abort', () => reject(new Error('[editormd-next] upload aborted')))

    const form = new FormData()
    form.append(fieldName, file, file.name)
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value)
    }
    xhr.send(form)
  })
}

/** 解析服务端响应：优先 JSON，失败则按纯文本处理。 */
export function parseResponse(status: number, text: string): UploadResult {
  if (status < 200 || status >= 300) {
    return { success: 0, message: `HTTP ${status}` }
  }
  const trimmed = text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed) as Record<string, unknown>
      const success = data['success']
      if (success === 1 || success === true || success === '1') {
        return { success: 1, url: String(data['url'] ?? '') }
      }
      return { success: 0, message: String(data['message'] ?? 'upload failed') }
    } catch {
      /* fallthrough to text handling */
    }
  }
  return { success: 0, message: trimmed.slice(0, 200) || 'unexpected server response' }
}

/** 按扩展名校验文件是否在允许的格式白名单内（大小写不敏感）。 */
export function isAllowedFormat(fileName: string, formats: readonly string[]): boolean {
  const dot = fileName.lastIndexOf('.')
  if (dot === -1) return false
  const ext = fileName.slice(dot + 1).toLowerCase()
  return formats.some((f) => f.toLowerCase() === ext)
}

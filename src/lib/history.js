const HISTORY_STORAGE_KEY = 'mojiyomi.history'
const MAX_HISTORY_ITEMS = 50
const THUMBNAIL_MAX_SIZE = 200

export function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function addHistoryEntry({ fileName, markdown, blob }) {
  const thumbnail = await createThumbnail(blob)
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName,
    markdown,
    thumbnail,
    createdAt: new Date().toISOString(),
    charCount: markdown.length,
  }

  const history = getHistory()
  history.unshift(entry)

  if (history.length > MAX_HISTORY_ITEMS) {
    history.length = MAX_HISTORY_ITEMS
  }

  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  return entry
}

export function deleteHistoryEntry(id) {
  const history = getHistory().filter((entry) => entry.id !== id)
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  return history
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_STORAGE_KEY)
}

async function createThumbnail(blob) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(THUMBNAIL_MAX_SIZE / img.width, THUMBNAIL_MAX_SIZE / img.height, 1)
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
      URL.revokeObjectURL(url)
      canvas.width = 0
      canvas.height = 0
      resolve(dataUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }

    img.src = url
  })
}

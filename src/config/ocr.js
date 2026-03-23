export const DEFAULT_OCR_SETTINGS = Object.freeze({
  model: import.meta.env.VITE_OCR_MODEL || 'gemini-2.5-flash',
})

export const OCR_SETTINGS_STORAGE_KEY = 'local-ocr-workbench.ocr-settings'

export const OCR_PROMPT = `Extract every visible piece of text from this page as faithfully as possible.
Do not omit titles, subtitles, headers, footers, labels, captions, footnotes, notes, side text, or text near or around tables.
Preserve the document structure and formatting semantics whenever they are visually identifiable:
- titles and section headings
- subtitles
- paragraphs
- ordered and unordered lists
- bold text
- italic text
- code blocks
- table content
Respond in Markdown as much as possible.
Use standard Markdown for headings, paragraphs, lists, emphasis, strong text, and code blocks whenever Markdown can represent them cleanly.
Use HTML only when Markdown cannot preserve the layout well enough.
Render tables with HTML table tags instead of Markdown tables.
If text is visually bold or italic, preserve that with Markdown when possible, otherwise use HTML.
Keep text in reading order and keep nearby labels with the content they belong to.
Return only Markdown and inline HTML with no explanation.`

export function normalizeOcrSettings(settings = {}) {
  return {
    model: normalizeSettingValue(settings.model, DEFAULT_OCR_SETTINGS.model),
  }
}

export function getInitialOcrSettings() {
  if (typeof window === 'undefined') {
    return normalizeOcrSettings()
  }

  try {
    const rawValue = window.localStorage.getItem(OCR_SETTINGS_STORAGE_KEY)

    if (!rawValue) {
      return normalizeOcrSettings()
    }

    return normalizeOcrSettings(JSON.parse(rawValue))
  } catch {
    return normalizeOcrSettings()
  }
}

export function persistOcrSettings(settings) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    OCR_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeOcrSettings(settings)),
  )
}

export function clearPersistedOcrSettings() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(OCR_SETTINGS_STORAGE_KEY)
}

export function hasOcrSettingsOverride(settings) {
  const normalizedSettings = normalizeOcrSettings(settings)

  return normalizedSettings.model !== DEFAULT_OCR_SETTINGS.model
}

function normalizeSettingValue(value, fallback) {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmedValue = value.trim()
  return trimmedValue || fallback
}

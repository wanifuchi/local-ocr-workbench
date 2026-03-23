import { ArrowLeft, Copy, Check, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { markdownRehypePlugins, markdownRemarkPlugins } from '../lib/markdown'

function formatDate(isoString) {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

function HistoryPanel({ history, onDelete, onClear, onBack }) {
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const handleCopy = async (entry) => {
    await navigator.clipboard.writeText(entry.markdown)
    setCopiedId(entry.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  if (selectedEntry) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedEntry(null)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white/80 text-[var(--ink-strong)] transition hover:bg-white"
            aria-label="一覧に戻る"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--ink-strong)]">
              {selectedEntry.fileName}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {formatDate(selectedEntry.createdAt)} · {selectedEntry.charCount.toLocaleString()}文字
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(selectedEntry)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--ink-strong)] transition hover:bg-white"
          >
            {copiedId === selectedEntry.id ? (
              <><Check className="h-3.5 w-3.5" aria-hidden="true" />コピー済み</>
            ) : (
              <><Copy className="h-3.5 w-3.5" aria-hidden="true" />コピー</>
            )}
          </button>
        </div>

        <div className="panel flex-1">
          {selectedEntry.thumbnail ? (
            <div className="mb-4 flex justify-center">
              <img
                src={selectedEntry.thumbnail}
                alt={selectedEntry.fileName}
                className="max-h-48 rounded-xl object-contain shadow-[0_10px_30px_rgba(44,38,32,0.1)]"
              />
            </div>
          ) : null}
          <div className="markdown-preview">
            <ReactMarkdown
              remarkPlugins={markdownRemarkPlugins}
              rehypePlugins={markdownRehypePlugins}
            >
              {selectedEntry.markdown}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white/80 text-[var(--ink-strong)] transition hover:bg-white"
            aria-label="OCRに戻る"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="eyebrow">履歴</p>
        </div>
        {history.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(182,51,28,0.2)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[rgba(182,51,28,0.06)]"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            すべて削除
          </button>
        ) : null}
      </div>

      {history.length === 0 ? (
        <div className="panel flex min-h-[20rem] items-center justify-center">
          <p className="text-sm text-[var(--muted)]">まだ履歴がありません</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {history.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setSelectedEntry(entry)}
              className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-white/50 bg-[rgba(248,244,239,0.78)] p-4 text-left shadow-[0_12px_35px_rgba(26,34,40,0.06)] backdrop-blur transition hover:border-[var(--accent)] hover:shadow-[0_16px_45px_rgba(26,34,40,0.1)]"
            >
              {entry.thumbnail ? (
                <div className="mb-3 flex justify-center">
                  <img
                    src={entry.thumbnail}
                    alt={entry.fileName}
                    className="h-28 w-full rounded-xl object-contain"
                  />
                </div>
              ) : (
                <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-[var(--surface)]">
                  <span className="text-xs text-[var(--muted)]">プレビューなし</span>
                </div>
              )}
              <p className="truncate text-sm font-semibold text-[var(--ink-strong)]">
                {entry.fileName}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {formatDate(entry.createdAt)} · {entry.charCount.toLocaleString()}文字
              </p>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--ink)]">
                {entry.markdown.slice(0, 120)}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(entry.id)
                }}
                className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[var(--danger)] shadow-sm transition hover:bg-white group-hover:flex"
                aria-label="削除"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default HistoryPanel

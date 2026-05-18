import { useCallback, useId, useState, type DragEvent } from 'react'
import './KensaPayloadIntake.css'

export type KensaPayloadIntakeProps = {
  raw: string
  onRawChange: (next: string) => void
  uploadMode: 'replace' | 'append'
  onUploadModeChange: (mode: 'replace' | 'append') => void
  onFilesLoaded: (files: readonly File[], mode: 'replace' | 'append') => Promise<void>
  jsonPlaceholder: string
  onClear: () => void
  onLoadSample?: () => void
  lastNote?: string | null
}

function IconUpload({ className }: { className?: string }) {
  return (
    <svg className={className} width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V4m0 0 7 7m-7-7-7 7"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconLink({ className }: { className?: string }) {
  return (
    <svg className={className} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 13a5 5 0 0 0 7.54.54l2.08-2.08a5 5 0 0 0-7.07-7.07l-1.17 1.17"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <path
        d="M14 11a5 5 0 0 0-7.54-.54L4.38 12.54a5 5 0 0 0 7.07 7.07l1.17-1.17"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function KensaPayloadIntake({
  raw,
  onRawChange,
  uploadMode,
  onUploadModeChange,
  onFilesLoaded,
  jsonPlaceholder,
  onClear,
  onLoadSample,
  lastNote,
}: KensaPayloadIntakeProps) {
  const dropId = useId()
  const snippetId = useId()
  const urlId = useId()
  const [isDragOver, setIsDragOver] = useState(false)
  const [jsonSnippet, setJsonSnippet] = useState('')
  const [payloadUrl, setPayloadUrl] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [snippetError, setSnippetError] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const onDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : []
      if (!files.length) return
      await onFilesLoaded(files, uploadMode)
    },
    [onFilesLoaded, uploadMode],
  )

  const onPickFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : []
      if (!files.length) return
      try {
        await onFilesLoaded(files, uploadMode)
      } finally {
        e.currentTarget.value = ''
      }
    },
    [onFilesLoaded, uploadMode],
  )

  const applySnippet = useCallback(() => {
    const trimmed = jsonSnippet.trim()
    if (!trimmed) {
      setSnippetError('Paste JSON to apply')
      return
    }
    try {
      const parsed = JSON.parse(trimmed)
      const formatted = JSON.stringify(parsed, null, 2)
      onRawChange(formatted)
      setSnippetError(null)
      setJsonSnippet('')
      setShowEditor(true)
    } catch (e) {
      setSnippetError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }, [jsonSnippet, onRawChange])

  const fetchFromUrl = useCallback(async () => {
    const trimmed = payloadUrl.trim()
    if (!trimmed) {
      setUrlError('Enter a URL')
      return
    }
    let parsedUrl: URL
    try {
      parsedUrl = new URL(trimmed)
    } catch {
      setUrlError('Enter a valid https URL')
      return
    }
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      setUrlError('URL must use http or https')
      return
    }
    setUrlLoading(true)
    setUrlError(null)
    try {
      const res = await fetch(trimmed, {
        headers: { Accept: 'application/json, application/jwt, text/plain, */*' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const parsed: unknown = JSON.parse(text)
      onRawChange(JSON.stringify(parsed, null, 2))
      setShowEditor(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fetch failed'
      setUrlError(
        msg.includes('Failed to fetch') || msg.includes('NetworkError')
          ? 'Could not fetch (CORS or network). Try a file or paste JSON instead.'
          : msg,
      )
    } finally {
      setUrlLoading(false)
    }
  }, [payloadUrl, onRawChange])

  const payloadSummary =
    raw.trim().length > 0
      ? `${((raw.match(/\n/g)?.length ?? 0) + 1).toLocaleString()} lines · ${(raw.length / 1024).toFixed(1)} KB`
      : null

  return (
    <div className="kensaIntake">
      <div
        className={`kensaIntake__drop${isDragOver ? ' kensaIntake__drop--active' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!isDragOver) setIsDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (e.currentTarget === e.target) setIsDragOver(false)
        }}
        onDrop={onDrop}
      >
        <div className="kensaIntake__dropGlow" aria-hidden />
        <IconUpload className="kensaIntake__dropIcon" />
        <p className="kensaIntake__dropTitle">Drop JSON here</p>
        <p className="kensaIntake__dropHint">`.json` files · VP or presentation-request payloads</p>
        <label className="kensaIntake__browse" htmlFor={dropId}>
          Browse files
          <input
            id={dropId}
            type="file"
            accept="application/json,.json"
            className="kensaIntake__fileInput"
            multiple
            onChange={onPickFile}
          />
        </label>
        <div className="kensaIntake__uploadMode" role="radiogroup" aria-label="Upload mode">
          <button
            type="button"
            role="radio"
            aria-checked={uploadMode === 'replace'}
            className={`kensaIntake__modePill${uploadMode === 'replace' ? ' kensaIntake__modePill--on' : ''}`}
            onClick={() => onUploadModeChange('replace')}
          >
            Replace
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={uploadMode === 'append'}
            className={`kensaIntake__modePill${uploadMode === 'append' ? ' kensaIntake__modePill--on' : ''}`}
            onClick={() => onUploadModeChange('append')}
          >
            Append
          </button>
        </div>
      </div>

      <div className="kensaIntake__divider" aria-hidden>
        <span>or</span>
      </div>

      <div className="kensaIntake__lane">
        <label className="kensaIntake__laneLabel" htmlFor={snippetId}>
          JSON snippet
        </label>
        <div className="kensaIntake__laneRow">
          <textarea
            id={snippetId}
            className="kensaIntake__snippet"
            value={jsonSnippet}
            onChange={(e) => {
              setJsonSnippet(e.target.value)
              if (snippetError) setSnippetError(null)
            }}
            rows={2}
            spellCheck={false}
            placeholder={jsonPlaceholder}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                applySnippet()
              }
            }}
          />
          <button type="button" className="kensaIntake__laneBtn" onClick={applySnippet}>
            Apply
          </button>
        </div>
        {snippetError ? <p className="kensaIntake__laneErr">{snippetError}</p> : null}
      </div>

      <div className="kensaIntake__lane">
        <label className="kensaIntake__laneLabel" htmlFor={urlId}>
          Remote URL
        </label>
        <div className="kensaIntake__laneRow kensaIntake__laneRow--url">
          <span className="kensaIntake__urlIconWrap" aria-hidden>
            <IconLink className="kensaIntake__urlIcon" />
          </span>
          <input
            id={urlId}
            type="url"
            className="kensaIntake__url"
            value={payloadUrl}
            onChange={(e) => {
              setPayloadUrl(e.target.value)
              if (urlError) setUrlError(null)
            }}
            placeholder="https://verifier.example/presentation.json"
            autoComplete="off"
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void fetchFromUrl()
              }
            }}
          />
          <button
            type="button"
            className="kensaIntake__laneBtn kensaIntake__laneBtn--fetch"
            onClick={() => void fetchFromUrl()}
            disabled={urlLoading}
          >
            {urlLoading ? '…' : 'Fetch'}
          </button>
        </div>
        {urlError ? <p className="kensaIntake__laneErr">{urlError}</p> : null}
      </div>

      {(lastNote || payloadSummary || onLoadSample) && (
        <div className="kensaIntake__foot">
          {lastNote ? <p className="kensaIntake__note">{lastNote}</p> : null}
          {payloadSummary ? <p className="kensaIntake__summary">{payloadSummary}</p> : null}
          <div className="kensaIntake__footActions">
            {raw.trim() ? (
              <button type="button" className="kensaIntake__linkBtn" onClick={() => setShowEditor((v) => !v)}>
                {showEditor ? 'Hide editor' : 'Edit full JSON'}
              </button>
            ) : null}
            {onLoadSample ? (
              <button type="button" className="kensaIntake__linkBtn" onClick={onLoadSample}>
                Load sample
              </button>
            ) : null}
            {raw.trim() ? (
              <button type="button" className="kensaIntake__linkBtn kensaIntake__linkBtn--muted" onClick={onClear}>
                Clear
              </button>
            ) : null}
          </div>
        </div>
      )}

      {showEditor && raw.trim() ? (
        <div className="kensaIntake__editorWrap">
          <label className="kensaIntake__laneLabel" htmlFor="kensa-full-json">
            Full payload
          </label>
          <textarea
            id="kensa-full-json"
            className="kensaIntake__editor"
            value={raw}
            onChange={(e) => onRawChange(e.target.value)}
            spellCheck={false}
            rows={10}
          />
        </div>
      ) : null}
    </div>
  )
}

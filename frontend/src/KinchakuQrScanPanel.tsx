import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import './KinchakuOid4vciQrModal.css'
import { debugLog } from './debugLog'
import { isLikelyOid4vciText } from './oid4vci/isLikelyOid4vciText'

const hints = new Map<DecodeHintType, unknown>([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]]])

function makeReader() {
  return new BrowserMultiFormatReader(hints)
}

export type KinchakuQrScanPanelProps = {
  active: boolean
  onDecoded: (text: string) => void
  /** When set, show a cancel control (modal). Omit on the scan workspace page. */
  onCancel?: () => void
}

export function KinchakuQrScanPanel({ active, onDecoded, onCancel }: KinchakuQrScanPanelProps) {
  const titleId = useId()
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<'idle' | 'busy'>('idle')
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setPhase('idle')
    setError(null)
    BrowserMultiFormatReader.releaseAllStreams()
    if (videoRef.current) {
      BrowserMultiFormatReader.cleanVideoSource(videoRef.current)
    }
  }, [])

  useEffect(() => {
    if (!active) reset()
  }, [active, reset])

  const finishWithText = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!isLikelyOid4vciText(trimmed)) {
        setError(
          'That QR is not an OID4VCI credential offer (expected openid-credential-offer URI, HTTPS offer URL, or offer JSON).',
        )
        return
      }
      BrowserMultiFormatReader.releaseAllStreams()
      if (videoRef.current) BrowserMultiFormatReader.cleanVideoSource(videoRef.current)
      setPhase('idle')
      setError(null)
      onDecoded(trimmed)
    },
    [onDecoded],
  )

  const startCamera = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    setError(null)
    setPhase('busy')
    try {
      const reader = makeReader()
      const result = await reader.decodeOnceFromVideoDevice(undefined, video)
      finishWithText(result.getText())
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      debugLog('QR scan: camera error', e)
      setError(msg.includes('Permission') ? 'Camera permission was denied.' : `Camera scan failed: ${msg}`)
      setPhase('idle')
    } finally {
      BrowserMultiFormatReader.releaseAllStreams()
      if (video) BrowserMultiFormatReader.cleanVideoSource(video)
      setPhase('idle')
    }
  }, [finishWithText])

  const startCameraRef = useRef(startCamera)
  startCameraRef.current = startCamera

  useLayoutEffect(() => {
    if (!active) return
    void startCameraRef.current()
    return () => {
      BrowserMultiFormatReader.releaseAllStreams()
      if (videoRef.current) BrowserMultiFormatReader.cleanVideoSource(videoRef.current)
    }
  }, [active])

  const onPickFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      setError(null)
      setPhase('busy')
      const url = URL.createObjectURL(file)
      try {
        const reader = makeReader()
        const result = await reader.decodeFromImageUrl(url)
        finishWithText(result.getText())
      } catch {
        setError('No QR code found in that image.')
        setPhase('idle')
      } finally {
        URL.revokeObjectURL(url)
      }
    },
    [finishWithText],
  )

  if (!active) return null

  return (
    <div className="kinchaku-qr-panel">
      <h2 id={titleId} className="kinchaku-qr-modal__title">
        Scan OID4VCI QR
      </h2>
      <p className="kinchaku-qr-modal__hint">
        Point at a credential-offer QR, or upload a screenshot. On success you will continue to the OID4VCI intake
        flow with the value filled in.
      </p>

      <video ref={videoRef} className="kinchaku-qr-modal__video" playsInline muted aria-hidden={phase === 'idle' && !error} />

      {error ? (
        <p className="kinchaku-qr-modal__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="kinchaku-qr-modal__actions">
        <button
          type="button"
          className="kinchaku-qr-modal__btn kinchaku-qr-modal__btn--primary"
          disabled={phase === 'busy'}
          onClick={() => void startCamera()}
        >
          {phase === 'busy' ? 'Scanning…' : error ? 'Retry camera' : 'Use camera'}
        </button>
        <button
          type="button"
          className="kinchaku-qr-modal__btn"
          disabled={phase === 'busy'}
          onClick={() => fileRef.current?.click()}
        >
          Upload image
        </button>
        {onCancel ? (
          <button type="button" className="kinchaku-qr-modal__btn" disabled={phase === 'busy'} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="kinchaku-qr-modal__file" onChange={onPickFile} aria-hidden />
    </div>
  )
}

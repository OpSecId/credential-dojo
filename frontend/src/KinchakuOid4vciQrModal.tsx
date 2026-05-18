import { KinchakuQrScanPanel } from './KinchakuQrScanPanel'
import './KinchakuOid4vciQrModal.css'

type Props = {
  open: boolean
  onClose: () => void
  onDecoded: (text: string) => void
}

export default function KinchakuOid4vciQrModal({ open, onClose, onDecoded }: Props) {
  if (!open) return null

  return (
    <div
      className="kinchaku-qr-modal__backdrop"
      role="presentation"
      onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}
    >
      <div
        className="kinchaku-qr-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Scan OID4VCI QR"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <KinchakuQrScanPanel active={open} onDecoded={onDecoded} onCancel={onClose} />
      </div>
    </div>
  )
}

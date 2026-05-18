import { useNavigate } from 'react-router-dom'
import { KinchakuQrScanPanel } from './KinchakuQrScanPanel'

export default function KinchakuScanView() {
  const navigate = useNavigate()

  return (
    <section className="kinchakuPage__card kinchakuPage__scanCard" aria-labelledby="kinchaku-scan-label">
      <h2 id="kinchaku-scan-label" className="kinchakuPage__inventoryHeading">
        Scan QR
      </h2>
      <KinchakuQrScanPanel
        active
        onDecoded={(text) => navigate('/kinchaku-oid4vci', { state: { prefilledOffer: text } })}
      />
    </section>
  )
}

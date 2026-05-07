import {
  VC_ROOT_SLOTS,
  rootHasKey,
  vcRootPointer,
  type VcRootSlot,
} from '../utils/vcEnvelope'
import './VcEnvelopeRail.css'

export default function VcEnvelopeRail({
  root,
  activePointer,
  onSelectPointer,
}: {
  root: Record<string, unknown>
  activePointer: string | null
  onSelectPointer: (pointer: string, slot: VcRootSlot) => void
}) {
  const presentCount = VC_ROOT_SLOTS.filter((s) => rootHasKey(root, s.key)).length

  return (
    <div
      className="vc-rail dojo-augmented dojo-augmented--inset"
      data-augmented-ui="tl-clip tr-clip br-clip bl-clip border"
      role="navigation"
      aria-label="Verifiable Credential top-level properties"
    >
      <div className="vc-rail__head">
        <p className="vc-rail__title">Menkyo envelope</p>
        <p className="vc-rail__meta">
          {presentCount} / {VC_ROOT_SLOTS.length} slots in this document
        </p>
      </div>
      <p className="vc-rail__hint">
        W3C VC roots follow a familiar pattern—tap a slot to jump and expand it in the tree.
      </p>
      <div className="vc-rail__track">
        {VC_ROOT_SLOTS.map((slot) => {
          const present = rootHasKey(root, slot.key)
          const ptr = vcRootPointer(slot.key)
          const active = activePointer === ptr
          return (
            <button
              key={slot.key}
              type="button"
              className={`vc-rail__chip${present ? ' vc-rail__chip--on' : ''}${active ? ' vc-rail__chip--active' : ''}${slot.core && !present ? ' vc-rail__chip--gap' : ''}`}
              title={`${slot.blurb} · Pointer ${ptr}`}
              onClick={() => onSelectPointer(ptr, slot)}
            >
              <span
                className="vc-rail__dot"
                aria-hidden
                data-present={present ? 'true' : 'false'}
              />
              <span className="vc-rail__key">{slot.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

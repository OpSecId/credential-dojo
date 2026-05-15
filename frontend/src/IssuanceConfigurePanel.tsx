import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import type { PersonaPublic } from './demoPersonas'
import {
  CRYPTOSUITES,
  DID_METHODS,
  PROTOCOLS,
  RENDER_SUITE_TOGGLES,
  type DidMethod,
  type IssuanceConfigureSection,
  type IssuanceProtocol,
  type RenderMethodTemplate,
  credentialFormatLabel,
} from './issuanceConstants'
import type { DojoIssuanceConfigure } from './issueVerifyDemoVc'
import { ISSUE_CREDENTIAL_TEMPLATES, type IssueCredentialTemplateId } from './issueVerifyDemoVc'

function StatusToggle({
  id,
  title,
  checked,
  onCheckedChange,
  compact = false,
}: {
  id: string
  title: string
  checked: boolean
  onCheckedChange: (next: boolean) => void
  compact?: boolean
}) {
  return (
    <label
      className={`issuanceCfg__check${compact ? ' issuanceCfg__check--compact' : ''}`}
      htmlFor={id}
    >
      <span className="issuanceCfg__checkSwitch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="issuanceCfg__checkInput"
        />
        <span className="issuanceCfg__checkRail" aria-hidden>
          <span className="issuanceCfg__checkThumb" />
        </span>
      </span>
      <span className="issuanceCfg__checkTitle">{title}</span>
    </label>
  )
}

function DisclosureBlock({
  id,
  activeSection,
  onToggle,
  hint,
  label,
  controlsId,
  children,
}: {
  id: IssuanceConfigureSection
  activeSection: IssuanceConfigureSection | null
  onToggle: (next: IssuanceConfigureSection) => void
  hint: ReactNode
  label: string
  controlsId: string
  children: ReactNode
}) {
  const open = activeSection === id
  return (
    <div className="issuanceCfg__disclosure">
      <div className="issuanceCfg__disclosureRow">
        <div className="issuanceCfg__disclosureHint">{hint}</div>
        <button
          type="button"
          className={`issuanceCfg__disclosureBtn${open ? ' issuanceCfg__disclosureBtn--open' : ''}`}
          aria-expanded={open}
          aria-controls={controlsId}
          onClick={() => onToggle(id)}
        >
          <span className="issuanceCfg__disclosureChevron" aria-hidden>
            ▾
          </span>
          {label}
        </button>
      </div>
      {open ? (
        <div id={controlsId} className="issuanceCfg__disclosureBody">
          {children}
        </div>
      ) : null}
    </div>
  )
}

export type IssuanceConfigurePanelProps = {
  configure: DojoIssuanceConfigure
  patchConfigure: (patch: Partial<DojoIssuanceConfigure>) => void
  configureSection: IssuanceConfigureSection | null
  setConfigureSection: Dispatch<SetStateAction<IssuanceConfigureSection | null>>
  personas: readonly PersonaPublic[]
  issuancePersonaId: string
  onIssuancePersonaId: (id: string) => void
  ninjaProfile: boolean
  selectedTemplate: IssueCredentialTemplateId
  onSelectTemplate: (id: IssueCredentialTemplateId) => void
  onIssue: () => void
}

export function IssuanceConfigurePanel({
  configure,
  patchConfigure,
  configureSection,
  setConfigureSection,
  personas,
  issuancePersonaId,
  onIssuancePersonaId,
  ninjaProfile,
  selectedTemplate,
  onSelectTemplate,
  onIssue,
}: IssuanceConfigurePanelProps) {
  const toggleSection = (id: IssuanceConfigureSection) => {
    setConfigureSection((cur) => (cur === id ? null : id))
  }

  const handleProtocolToggle = (p: IssuanceProtocol, checked: boolean) => {
    const set = new Set(configure.protocols)
    if (checked) set.add(p)
    else set.delete(p)
    patchConfigure({
      protocols: PROTOCOLS.map((x) => x.value).filter((v) => set.has(v)),
    })
  }

  const handleRenderToggle = (kind: RenderMethodTemplate, on: boolean) => {
    if (on) patchConfigure({ renderMethodTemplate: kind })
    else if (configure.renderMethodTemplate === kind) patchConfigure({ renderMethodTemplate: null })
  }

  return (
    <div className="issueVerify__configureScroll">
      <div className="issueVerify__configureActions">
        <button type="button" className="issueVerify__btn issueVerify__btn--primary" onClick={onIssue}>
          Issue selected template
        </button>
      </div>

      <div className="issuanceCfg__field">
        <label htmlFor="dojo-issuance-issuer" className="issuanceCfg__fieldLabel">
          Issuer
        </label>
        <div className="issuanceCfg__issuerRow">
          <span className="issuanceCfg__personaAvatar" aria-hidden>
            {personas.find((p) => p.id === issuancePersonaId)?.labelJa.slice(0, 1) ?? '忍'}
          </span>
          <select
            id="dojo-issuance-issuer"
            className="issuanceCfg__select"
            value={issuancePersonaId}
            onChange={(e) => onIssuancePersonaId(e.target.value)}
          >
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — {p.proofSchool}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="issuanceCfg__fieldset">
        <legend className="issuanceCfg__fieldLabel">Credential template</legend>
        <div className="issuanceCfg__tplRow" role="radiogroup" aria-label="Credential template">
          {ISSUE_CREDENTIAL_TEMPLATES.map((tpl) => (
            <label
              key={tpl.id}
              htmlFor={`dojo-tpl-${tpl.id}`}
              className={`issuanceCfg__tplHoriz${
                selectedTemplate === tpl.id ? ' issuanceCfg__tplHoriz--selected' : ''
              }`}
            >
              <input
                id={`dojo-tpl-${tpl.id}`}
                type="radio"
                name="dojo-cred-template"
                value={tpl.id}
                checked={selectedTemplate === tpl.id}
                onChange={() => onSelectTemplate(tpl.id)}
                className="issuanceCfg__tplRadio"
              />
              <span className="issuanceCfg__tplGlyphAvatar" aria-hidden>
                {tpl.glyph}
              </span>
              <span className="issuanceCfg__tplHorizText">
                <span className="issuanceCfg__tplHorizTitle">{tpl.title}</span>
                <span className="issuanceCfg__tplHorizFormat">{credentialFormatLabel(tpl.formatType)}</span>
                <span className="issuanceCfg__tplHorizDesc">{tpl.subtitle}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {!ninjaProfile ? (
        <p className="issueVerify__profileHint">
          Sign in from the profile menu to attach your codename—or stay signed out and use the default demo issuer.{' '}
          <Link to="/create-ninja-profile">Ninja profile</Link>
        </p>
      ) : null}

      <div className="issuanceCfg__dateGrid">
        <div>
          <label htmlFor="dojo-valid-from" className="issuanceCfg__fieldLabel">
            validFrom
          </label>
          <input
            id="dojo-valid-from"
            type="date"
            className="issuanceCfg__dateInput"
            value={configure.validFromDate}
            onChange={(e) => patchConfigure({ validFromDate: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="dojo-valid-until" className="issuanceCfg__fieldLabel">
            validUntil
          </label>
          <input
            id="dojo-valid-until"
            type="date"
            className="issuanceCfg__dateInput"
            value={configure.validUntilDate}
            onChange={(e) => patchConfigure({ validUntilDate: e.target.value })}
          />
        </div>
      </div>

      <DisclosureBlock
        id="schema"
        activeSection={configureSection}
        onToggle={toggleSection}
        hint={
          <span title="Optional credentialSchema (JsonSchema) on the issuance profile when enabled.">
            Optional <code>credentialSchema</code> (JsonSchema) on the issuance profile when enabled.
          </span>
        }
        label="Schema"
        controlsId="dojo-issuance-schema-options"
      >
        <StatusToggle
          compact
          id="dojo-issuance-credential-schema"
          title="Include"
          checked={configure.includeCredentialSchema}
          onCheckedChange={(v) => patchConfigure({ includeCredentialSchema: v })}
        />
      </DisclosureBlock>

      <DisclosureBlock
        id="render"
        activeSection={configureSection}
        onToggle={toggleSection}
        hint={
          <span title="Optional renderMethod using TemplateRenderMethod — pick one template format.">
            Optional <code>renderMethod</code> using <code>TemplateRenderMethod</code> — pick one template format (SVG,
            PDF, or HTML).
          </span>
        }
        label="Render Method"
        controlsId="dojo-issuance-render-radios"
      >
        <ul className="issuanceCfg__toggleList">
          {RENDER_SUITE_TOGGLES.map((t) => (
            <li key={t.value}>
              <StatusToggle
                compact
                id={t.id}
                title={t.title}
                checked={configure.renderMethodTemplate === t.value}
                onCheckedChange={(on) => handleRenderToggle(t.value, on)}
              />
            </li>
          ))}
        </ul>
      </DisclosureBlock>

      <DisclosureBlock
        id="status"
        activeSection={configureSection}
        onToggle={toggleSection}
        hint={
          <span title="Optional credentialStatus entries using BitstringStatusListEntry.">
            Optional <code>credentialStatus</code> entries using <code>BitstringStatusListEntry</code> for revocation
            and/or suspension hints in the profile.
          </span>
        }
        label="Status lists"
        controlsId="dojo-issuance-status-lists"
      >
        <StatusToggle
          compact
          id="dojo-issuance-status-revocation"
          title="Revocation"
          checked={configure.includeRevocation}
          onCheckedChange={(v) => patchConfigure({ includeRevocation: v })}
        />
        <StatusToggle
          compact
          id="dojo-issuance-status-suspension"
          title="Suspension"
          checked={configure.includeSuspension}
          onCheckedChange={(v) => patchConfigure({ includeSuspension: v })}
        />
      </DisclosureBlock>

      <DisclosureBlock
        id="proof"
        activeSection={configureSection}
        onToggle={toggleSection}
        hint={
          <span title="Verification method (did:web or did:key), DataIntegrityProof cryptosuite, and optional issuedAt on the issuance profile.">
            Verification method (did:web or did:key), DataIntegrityProof cryptosuite, and optional{' '}
            <code>issuedAt</code> on the issuance profile for this demo build.
          </span>
        }
        label="Data Integrity Proof"
        controlsId="dojo-issuance-proof-options"
      >
        <fieldset className="issuanceCfg__fieldset issuanceCfg__fieldset--plain">
          <legend className="issuanceCfg__srOnly">Verification method</legend>
          <div className="issuanceCfg__didSeg" role="radiogroup" aria-label="DID method">
            <span className="issuanceCfg__didSegGlow" aria-hidden />
            {DID_METHODS.map((m) => {
              const selected = configure.didMethod === m.value
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  title={m.label}
                  className={`issuanceCfg__didSegBtn${selected ? ' issuanceCfg__didSegBtn--selected' : ''}`}
                  onClick={() => patchConfigure({ didMethod: m.value as DidMethod })}
                >
                  <span className="issuanceCfg__didSegMono">{m.value}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="issuanceCfg__field issuanceCfg__field--tight">
          <label htmlFor="dojo-cryptosuite" className="issuanceCfg__srOnly">
            Cryptosuite
          </label>
          <select
            id="dojo-cryptosuite"
            className="issuanceCfg__select issuanceCfg__select--full"
            value={configure.cryptosuite}
            onChange={(e) => patchConfigure({ cryptosuite: e.target.value })}
          >
            {CRYPTOSUITES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <StatusToggle
          compact
          id="dojo-issuance-proof-timestamp"
          title="Include timestamp"
          checked={configure.includeTimestamp}
          onCheckedChange={(v) => patchConfigure({ includeTimestamp: v })}
        />
      </DisclosureBlock>

      <DisclosureBlock
        id="protocols"
        activeSection={configureSection}
        onToggle={toggleSection}
        hint={
          <span title="Select which exchange protocols to include in the issuance profile.">
            Select which exchange protocols to include in the issuance profile (demo metadata on the VC).
          </span>
        }
        label="Exchange protocols"
        controlsId="dojo-issuance-exchange-protocols"
      >
        <ul className="issuanceCfg__toggleList">
          {PROTOCOLS.map((p) => (
            <li key={p.value}>
              <StatusToggle
                compact
                id={`dojo-issuance-protocol-${p.value}`}
                title={p.label.split(' — ')[0] ?? p.label}
                checked={configure.protocols.includes(p.value)}
                onCheckedChange={(on) => handleProtocolToggle(p.value, on)}
              />
            </li>
          ))}
        </ul>
      </DisclosureBlock>
    </div>
  )
}

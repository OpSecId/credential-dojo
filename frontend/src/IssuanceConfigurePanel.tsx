import { useCallback, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { PersonaPublic } from './demoPersonas'
import {
  DID_METHODS,
  RENDER_SUITE_TOGGLES,
  SCHEMA_FORMAT_TOGGLES,
  STATUS_LIST_TOGGLES,
  type CredentialSchemaFormat,
  type DidMethod,
  type StatusListPurpose,
  type RenderMethodTemplate,
} from './issuanceConstants'
import type { DojoIssuanceConfigure } from './issueVerifyDemoVc'
import { issueCredentialTemplatesForIssuer, type IssueCredentialTemplateId } from './issueVerifyDemoVc'
import { IssuanceDatePicker } from './IssuanceDatePicker'

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

export function ConfigSection({
  hint,
  label,
  children,
}: {
  hint?: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <section className="issuanceCfg__section">
      <div className="issuanceCfg__sectionHead">
        <h3 className="issuanceCfg__sectionLabel">{label}</h3>
        {hint ? <div className="issuanceCfg__sectionHint">{hint}</div> : null}
      </div>
      <div className="issuanceCfg__sectionBody">{children}</div>
    </section>
  )
}

export type IssuanceConfigurePanelProps = {
  configure: DojoIssuanceConfigure
  patchConfigure: (patch: Partial<DojoIssuanceConfigure>) => void
  personas: readonly PersonaPublic[]
  issuancePersonaId: string
  onIssuancePersonaId: (id: string) => void
  ninjaProfile: boolean
  selectedTemplate: IssueCredentialTemplateId
  onSelectTemplate: (id: IssueCredentialTemplateId) => void
}

export function IssuanceConfigurePanel({
  configure,
  patchConfigure,
  personas,
  issuancePersonaId,
  onIssuancePersonaId,
  ninjaProfile,
  selectedTemplate,
  onSelectTemplate,
}: IssuanceConfigurePanelProps) {
  const issuanceIssuer = useMemo(
    () => personas.find((p) => p.id === issuancePersonaId) ?? personas[0],
    [personas, issuancePersonaId],
  )

  const templatesForIssuer = useMemo(
    () => (issuanceIssuer ? issueCredentialTemplatesForIssuer(issuanceIssuer) : []),
    [issuanceIssuer],
  )

  const handleRenderMethodPick = (kind: RenderMethodTemplate) => {
    patchConfigure({
      renderMethodTemplate: configure.renderMethodTemplate === kind ? null : kind,
    })
  }

  const handleSchemaFormatPick = (_format: CredentialSchemaFormat) => {
    patchConfigure({ includeCredentialSchema: !configure.includeCredentialSchema })
  }

  const handleStatusListToggle = (purpose: StatusListPurpose) => {
    if (purpose === 'revocation') {
      patchConfigure({ includeRevocation: !configure.includeRevocation })
    } else {
      patchConfigure({ includeSuspension: !configure.includeSuspension })
    }
  }

  const isStatusListSelected = (purpose: StatusListPurpose) =>
    purpose === 'revocation' ? configure.includeRevocation : configure.includeSuspension

  const issuerIndex = useMemo(() => {
    const idx = personas.findIndex((p) => p.id === issuancePersonaId)
    return idx >= 0 ? idx : 0
  }, [personas, issuancePersonaId])

  const activeIssuer = personas[issuerIndex] ?? personas[0]

  const cycleIssuer = useCallback(
    (delta: -1 | 1) => {
      if (!personas.length) return
      const next = (issuerIndex + delta + personas.length) % personas.length
      onIssuancePersonaId(personas[next]!.id)
    },
    [issuerIndex, personas, onIssuancePersonaId],
  )

  return (
    <div className="issueVerify__configureScroll">

      <ConfigSection label="Issuer">
        {activeIssuer ? (
          <div className="issuanceCfg__issuerCycle" role="group" aria-label="Issuer">
            <button
              type="button"
              className="issuanceCfg__issuerCycleBtn"
              onClick={() => cycleIssuer(-1)}
              aria-label="Previous issuer"
              title="Previous proof school"
            >
              ‹
            </button>
            <div
              className="issuanceCfg__issuerCycleCard"
              title={`${activeIssuer.labelJa} (${activeIssuer.label}) — ${activeIssuer.description}`}
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="issuanceCfg__issuerCycleText">
                <span className="issuanceCfg__issuerCycleLabel" lang="ja">
                  {activeIssuer.labelJa}
                </span>
                <span className="issuanceCfg__issuerCycleKeytype">{activeIssuer.proofSchool}</span>
              </span>
              <span className="issuanceCfg__issuerCycleCount" aria-hidden>
                {issuerIndex + 1}/{personas.length}
              </span>
            </div>
            <button
              type="button"
              className="issuanceCfg__issuerCycleBtn"
              onClick={() => cycleIssuer(1)}
              aria-label="Next issuer"
              title="Next proof school"
            >
              ›
            </button>
          </div>
        ) : null}
      </ConfigSection>

      <fieldset className="issuanceCfg__fieldset">
        <legend className="issuanceCfg__fieldLabel">Credential</legend>
        <div className="issuanceCfg__tplRow" role="radiogroup" aria-label="Credential">
          {templatesForIssuer.map((tpl) => (
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

      <ConfigSection label="Validity">
        <div className="issuanceCfg__dateGrid">
          <div className="issuanceCfg__dateField">
            <label id="dojo-valid-from-label" htmlFor="dojo-valid-from" className="issuanceCfg__subLabel">
              From
            </label>
            <IssuanceDatePicker
              id="dojo-valid-from"
              fieldLabelId="dojo-valid-from-label"
              value={configure.validFromDate}
              onCommit={(iso) => patchConfigure({ validFromDate: iso })}
            />
          </div>
          <div className="issuanceCfg__dateField">
            <label id="dojo-valid-until-label" htmlFor="dojo-valid-until" className="issuanceCfg__subLabel">
              Until
            </label>
            <IssuanceDatePicker
              id="dojo-valid-until"
              fieldLabelId="dojo-valid-until-label"
              value={configure.validUntilDate}
              onCommit={(iso) => patchConfigure({ validUntilDate: iso })}
            />
          </div>
        </div>
      </ConfigSection>

      <ConfigSection label="Schema">
        <fieldset className="issuanceCfg__fieldset issuanceCfg__fieldset--plain">
          <legend className="issuanceCfg__srOnly">Schema format</legend>
          <div className="issuanceCfg__didSeg" role="group" aria-label="Schema format">
            <span className="issuanceCfg__didSegGlow" aria-hidden />
            {SCHEMA_FORMAT_TOGGLES.map((t) => {
              const selected = configure.includeCredentialSchema
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={selected}
                  title={`JsonSchema — ${t.title}. Click again to clear.`}
                  className={`issuanceCfg__didSegBtn${selected ? ' issuanceCfg__didSegBtn--selected' : ''}`}
                  onClick={() => handleSchemaFormatPick(t.value)}
                >
                  <span className="issuanceCfg__didSegMono">{t.title}</span>
                </button>
              )
            })}
          </div>
        </fieldset>
      </ConfigSection>

      <ConfigSection label="Render Method">
        <fieldset className="issuanceCfg__fieldset issuanceCfg__fieldset--plain">
          <legend className="issuanceCfg__srOnly">Template render format</legend>
          <div className="issuanceCfg__didSeg issuanceCfg__didSeg--render" role="group" aria-label="Render method">
            <span className="issuanceCfg__didSegGlow" aria-hidden />
            {RENDER_SUITE_TOGGLES.map((t) => {
              const selected = configure.renderMethodTemplate === t.value
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={selected}
                  title={`TemplateRenderMethod — ${t.title}. Click again to clear.`}
                  className={`issuanceCfg__didSegBtn${selected ? ' issuanceCfg__didSegBtn--selected' : ''}`}
                  onClick={() => handleRenderMethodPick(t.value)}
                >
                  <span className="issuanceCfg__didSegMono">{t.title}</span>
                </button>
              )
            })}
          </div>
        </fieldset>
      </ConfigSection>

      <ConfigSection label="Status lists">
        <fieldset className="issuanceCfg__fieldset issuanceCfg__fieldset--plain">
          <legend className="issuanceCfg__srOnly">Status list purposes</legend>
          <div className="issuanceCfg__didSeg" role="group" aria-label="Status lists">
            <span className="issuanceCfg__didSegGlow" aria-hidden />
            {STATUS_LIST_TOGGLES.map((t) => {
              const selected = isStatusListSelected(t.value)
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={selected}
                  title={`BitstringStatusListEntry — ${t.title}. Click again to clear.`}
                  className={`issuanceCfg__didSegBtn${selected ? ' issuanceCfg__didSegBtn--selected' : ''}`}
                  onClick={() => handleStatusListToggle(t.value)}
                >
                  <span className="issuanceCfg__didSegMono">{t.title}</span>
                </button>
              )
            })}
          </div>
        </fieldset>
      </ConfigSection>

      <ConfigSection label="Data Integrity Proof">
        <div className="issuanceCfg__proofStack">
          <StatusToggle
            compact
            id="dojo-issuance-proof-created"
            title="proof.created"
            checked={configure.includeProofCreated}
            onCheckedChange={(v) => patchConfigure({ includeProofCreated: v })}
          />

          <div className="issuanceCfg__proofField">
            <p className="issuanceCfg__subLabel" id="dojo-proof-did-method-label">
              Verification method
            </p>
            <fieldset className="issuanceCfg__fieldset issuanceCfg__fieldset--plain">
              <legend className="issuanceCfg__srOnly">Verification method</legend>
              <div
                className="issuanceCfg__didSeg"
                role="radiogroup"
                aria-labelledby="dojo-proof-did-method-label"
              >
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
          </div>

        </div>
      </ConfigSection>
    </div>
  )
}

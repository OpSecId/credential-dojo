import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './IssueVerifyPage.css'
import { DojoFlowPageHero, DojoFlowPageShell } from './dojoFlowPage'
import { DEMO_PERSONAS_OFFLINE, type PersonaPublic, type PersonasPayload } from './demoPersonas'
import {
  buildDemoCredential,
  buildDemoMenkyo,
  ISSUE_CREDENTIAL_TEMPLATES,
  previewCredentialIdForTemplate,
  type IssueCredentialTemplateId,
} from './issueVerifyDemoVc'
import { inspectJson } from './kensa/kensaInspect'
import {
  NINJA_PROFILE_CHANGED_EVENT,
  readNinjaProfile,
  type NinjaProfile,
} from './ninjaProfileStorage'
import { productTerminology } from './terminology'
import { addWalletItem } from './walletInventory'

const COMBINED_PREVIEW_CREDENTIAL_ID = previewCredentialIdForTemplate('dojo-demo')

export type IssueVerifyPageProps = {
  /** `issue` — issuance only (`/issue`). Default `both` is the combined Issue & verify page. */
  mode?: 'both' | 'issue'
}

export default function IssueVerifyPage({ mode = 'both' }: IssueVerifyPageProps) {
  const issueOnly = mode === 'issue'
  const [personas, setPersonas] = useState<readonly PersonaPublic[] | null>(null)
  const [ninjaProfile, setNinjaProfile] = useState<NinjaProfile | null>(() => readNinjaProfile())
  const [selectedTemplate, setSelectedTemplate] = useState<IssueCredentialTemplateId>('dojo-demo')
  const [rawJson, setRawJson] = useState('')
  const [appliedJson, setAppliedJson] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => setNinjaProfile(readNinjaProfile())
    window.addEventListener(NINJA_PROFILE_CHANGED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(NINJA_PROFILE_CHANGED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE ?? ''
    fetch(`${base}/api/personas`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json() as Promise<PersonasPayload>
      })
      .then((data) => setPersonas(data.personas))
      .catch(() => setPersonas(DEMO_PERSONAS_OFFLINE))
  }, [])

  const list = personas ?? DEMO_PERSONAS_OFFLINE

  const schoolId = useMemo(() => {
    const id = ninjaProfile?.schoolId ?? 'ed-ryu'
    return list.some((p) => p.id === id) ? id : 'ed-ryu'
  }, [ninjaProfile, list])

  const persona = list.find((p) => p.id === schoolId) ?? list[0]

  const operatorCodename = ninjaProfile?.codename

  const previewVc = useMemo(() => {
    if (issueOnly) {
      return buildDemoCredential(persona, selectedTemplate, {
        operatorCodename,
        credentialId: previewCredentialIdForTemplate(selectedTemplate),
      })
    }
    return buildDemoMenkyo(persona, {
      operatorCodename,
      credentialId: COMBINED_PREVIEW_CREDENTIAL_ID,
    })
  }, [issueOnly, persona, operatorCodename, selectedTemplate])

  const previewText = useMemo(() => JSON.stringify(previewVc, null, 2), [previewVc])

  const verifyResult = useMemo(() => {
    const t = appliedJson.trim()
    if (!t) return null
    try {
      return inspectJson(JSON.parse(t) as unknown, 'menkyo')
    } catch {
      return null
    }
  }, [appliedJson])

  const issueDemo = useCallback(() => {
    const vc = issueOnly
      ? buildDemoCredential(persona, selectedTemplate, { operatorCodename })
      : buildDemoMenkyo(persona, { operatorCodename })
    const text = JSON.stringify(vc, null, 2)
    setRawJson(text)
    setAppliedJson(text)
    setParseError(null)
    const opSuffix = operatorCodename ? ` · ${operatorCodename}` : ''
    const tpl = issueOnly ? ISSUE_CREDENTIAL_TEMPLATES.find((t) => t.id === selectedTemplate) : undefined
    addWalletItem({
      type: 'credential',
      title: tpl ? `Demo · ${tpl.title}${opSuffix}` : `Demo Menkyo · ${persona.label}${opSuffix}`,
      subtitle:
        mode === 'issue' ? 'Issued from /issue (browser demo)' : 'Issued from Issue & verify (browser demo)',
      issuerOrSource: persona.label,
      status: 'ready',
      tags: [
        'Menkyo',
        'Demo',
        mode === 'issue' ? 'Issue' : 'Issue-verify',
        persona.proofSchool,
        ...(tpl ? [tpl.title] : []),
      ],
      preview: text.slice(0, 180),
    })
  }, [persona, operatorCodename, mode, issueOnly, selectedTemplate])

  const runVerify = useCallback(() => {
    try {
      JSON.parse(rawJson)
      setParseError(null)
      setAppliedJson(rawJson)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON')
      setAppliedJson('')
    }
  }, [rawJson])

  const tCred = productTerminology.credential
  const tInspect = productTerminology.credentialInspection
  const tFromTemplate = productTerminology.credentialFromTemplate
  const tTehon = productTerminology.template
  const tKasa = productTerminology.kasa
  const tKata = productTerminology.cryptosuites

  return (
    <DojoFlowPageShell>
      <DojoFlowPageHero
        title={
          issueOnly ? productTerminology.credentialFromTemplate.issueCredentialLabel : <>Issue &amp; verify</>
        }
      >
        {issueOnly ? (
          <>
            <p className="dojo-flowPage__intro">
              In this UI, <strong>{tCred.name}</strong> (<span lang="ja">{tCred.glyph}</span>) names the{' '}
              <strong>issued verifiable credential</strong>—the holder-facing record <em>after</em> issuance, not the
              issuer&apos;s definitions. <strong>{tTehon.name}</strong> (<span lang="ja">{tTehon.glyph}</span>) is the
              issuer <strong>copybook</strong>: templates, offers, and exemplars on the issuer side.{' '}
              <strong>{tFromTemplate.name}</strong> (<span lang="ja">{tFromTemplate.glyph}</span>) ties them: literally
              the <strong>Menkyo from the Tehon</strong>—the same lineage as{' '}
              <strong>issuing a VC from a credential definition</strong> in a CRMS (definition and policy stance →
              concrete credential JSON you can hold and present).
            </p>
            <p className="dojo-flowPage__introFollow">
              On this route, <strong>pick one of five template cards</strong> below—each mints a different demo VC
              claim shape while sharing the same W3C VC envelope. Your <strong>{tKasa.name}</strong> (
              <span lang="ja">{tKasa.glyph}</span>) sets the proof school and <strong>{tKata.name}</strong> (
              <span lang="ja">{tKata.glyph}</span>) suite on the signature block. Everything stays in the browser—open{' '}
              <strong>{tInspect.name}</strong> on <Link to="/verify">/verify</Link> to inspect the JSON.
            </p>
          </>
        ) : (
          <p className="dojo-flowPage__intro">
            Mint a <strong>{tCred.name}</strong>-shaped demo JSON from a proof school (<strong>{tKasa.name}</strong>
            ), then run the same structural checks as <strong>{tInspect.name}</strong> — still no cryptographic
            verification, only shape and field heuristics.
          </p>
        )}
      </DojoFlowPageHero>

      <div className="dojo-flowPage__body">
        <div className="issueVerify dojoZenPage dojoZenPage--wide">
        <section
        className="issueVerify__panel dojo-augmented dojo-augmented--panel"
        data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
      >
        <div className={`issueVerify__grid${issueOnly ? ' issueVerify__grid--issueOnly' : ''}`}>
          <div>
            <h2 className="issueVerify__sectionTitle">Issue (demo)</h2>
            {issueOnly ? (
              <>
                <p className="issueVerify__sectionBody">
                  Each card is a different <strong>Tehon-style</strong> sketch: baseline Dojo, university degree,
                  employment, training completion, or event admission. Issuer <strong>Kasa</strong>, cryptosuite{' '}
                  <strong>Kata</strong>, and optional codename still follow your{' '}
                  <Link to="/create-ninja-profile">ninja profile</Link> or shell profile menu.
                </p>
                {!ninjaProfile ? (
                  <p className="issueVerify__profileHint">
                    Sign in from the profile menu to attach your codename—or stay signed out and use the default demo
                    issuer.
                  </p>
                ) : null}
                <div className="issueVerify__tplGrid" role="radiogroup" aria-label="Credential template">
                  {ISSUE_CREDENTIAL_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      role="radio"
                      aria-checked={selectedTemplate === tpl.id}
                      className={`issueVerify__tplCard${
                        selectedTemplate === tpl.id ? ' issueVerify__tplCard--selected' : ''
                      }`}
                      onClick={() => setSelectedTemplate(tpl.id)}
                    >
                      <span className="issueVerify__tplGlyph" aria-hidden>
                        {tpl.glyph}
                      </span>
                      <span className="issueVerify__tplTitle">{tpl.title}</span>
                      <span className="issueVerify__tplSubtitle">{tpl.subtitle}</span>
                    </button>
                  ))}
                </div>
                <div className="issueVerify__actions">
                  <button type="button" className="issueVerify__btn issueVerify__btn--primary" onClick={issueDemo}>
                    Issue selected template
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="issueVerify__sectionBody">
                  The demo issuer follows your <strong>active ninja profile</strong>: its <strong>Kasa</strong> (proof
                  school), <strong>Kata</strong> flavor, and your codename on the subject. Change school or codename in{' '}
                  <Link to="/create-ninja-profile">ninja profile</Link> or the shell profile menu. With no profile saved,
                  we use the default <strong>Ed-ryū</strong> demo school and no operator name.
                </p>

                {!ninjaProfile ? (
                  <p className="issueVerify__profileHint">
                    No ninja profile in this browser —{' '}
                    <Link to="/create-ninja-profile">create one</Link> to issue under your identity, or continue with the
                    default demo issuer.
                  </p>
                ) : null}

                <div className="issueVerify__actions">
                  <button type="button" className="issueVerify__btn issueVerify__btn--primary" onClick={issueDemo}>
                    Issue demo Menkyo
                  </button>
                </div>
              </>
            )}

            <div className="issueVerify__previewBlock">
              <p className="issueVerify__previewLabel">
                {issueOnly
                  ? 'Preview (selected template · Kasa & codename)'
                  : 'Preview (active profile Kasa & codename)'}
              </p>
              <pre className="issueVerify__preview" title="Read-only preview of the next Issue payload shape">
                {previewText}
              </pre>
            </div>
          </div>

          {issueOnly ? null : (
          <div>
            <h2 className="issueVerify__sectionTitle">Verify (Menkyo path)</h2>
            <p className="issueVerify__sectionBody">
              After issuing, edit the JSON if you like, then run checks. Errors and warnings mirror the Kensa credential
              tab.
            </p>
            <label className="issueVerify__label" htmlFor="issue-verify-json">
              Credential JSON
            </label>
            <textarea
              id="issue-verify-json"
              className="issueVerify__textarea"
              value={rawJson}
              onChange={(e) => {
                setRawJson(e.target.value)
                setParseError(null)
                setAppliedJson('')
              }}
              spellCheck={false}
              placeholder='Click "Issue demo Menkyo" or paste a VerifiableCredential-shaped object.'
            />
            {parseError ? <p className="issueVerify__parseErr">{parseError}</p> : null}
            <div className="issueVerify__actions" style={{ marginTop: '0.65rem' }}>
              <button type="button" className="issueVerify__btn" onClick={runVerify}>
                Run verify
              </button>
              <button
                type="button"
                className="issueVerify__btn"
                onClick={() => {
                  setRawJson('')
                  setAppliedJson('')
                  setParseError(null)
                }}
              >
                Clear
              </button>
            </div>
            {verifyResult ? (
              <div
                className={`issueVerify__result issueVerify__result--${verifyResult.level}`}
                role="status"
                aria-live="polite"
              >
                {verifyResult.lines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="issueVerify__empty">
                {parseError
                  ? 'Fix JSON and click Run verify.'
                  : appliedJson.trim()
                    ? 'Could not derive inspection output.'
                    : 'Issue or paste JSON, then click Run verify.'}
              </p>
            )}
          </div>
          )}
        </div>

        <p className="issueVerify__footerNote">
          This page is educational: proofs use a placeholder <code>proofValue</code>. For VP-shaped packages, use{' '}
          <Link to="/kensa">Kensa · Enbu</Link>.
          {issueOnly ? (
            <>
              {' '}
              For credential-shaped checks without issuing here, open{' '}
              <Link to="/verify">{tInspect.name}</Link>.
            </>
          ) : null}
        </p>
      </section>
        </div>
      </div>
    </DojoFlowPageShell>
  )
}

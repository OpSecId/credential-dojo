import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './IssueVerifyPage.css'
import { DojoFlowPageHero, DojoFlowPageShell } from './dojoFlowPage'
import { DEMO_PERSONAS_OFFLINE, type PersonaPublic, type PersonasPayload } from './demoPersonas'
import { buildDemoMenkyo } from './issueVerifyDemoVc'
import { inspectJson } from './kensa/kensaInspect'
import {
  NINJA_PROFILE_CHANGED_EVENT,
  readNinjaProfile,
  type NinjaProfile,
} from './ninjaProfileStorage'
import { productTerminology } from './terminology'
import { addWalletItem } from './walletInventory'

const PREVIEW_CREDENTIAL_ID = 'urn:uuid:00000000-0000-4000-8000-000000000001'

export type IssueVerifyPageProps = {
  /** `issue` — issuance only (`/issue`). Default `both` is the combined Issue & verify page. */
  mode?: 'both' | 'issue'
}

export default function IssueVerifyPage({ mode = 'both' }: IssueVerifyPageProps) {
  const [personas, setPersonas] = useState<readonly PersonaPublic[] | null>(null)
  const [ninjaProfile, setNinjaProfile] = useState<NinjaProfile | null>(() => readNinjaProfile())
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

  const previewVc = useMemo(
    () =>
      buildDemoMenkyo(persona, {
        operatorCodename,
        credentialId: PREVIEW_CREDENTIAL_ID,
      }),
    [persona, operatorCodename],
  )

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
    const vc = buildDemoMenkyo(persona, { operatorCodename })
    const text = JSON.stringify(vc, null, 2)
    setRawJson(text)
    setAppliedJson(text)
    setParseError(null)
    const opSuffix = operatorCodename ? ` · ${operatorCodename}` : ''
    addWalletItem({
      type: 'credential',
      title: `Demo Menkyo · ${persona.label}${opSuffix}`,
      subtitle:
        mode === 'issue' ? 'Issued from /issue (browser demo)' : 'Issued from Issue & verify (browser demo)',
      issuerOrSource: persona.label,
      status: 'ready',
      tags: ['Menkyo', 'Demo', mode === 'issue' ? 'Issue' : 'Issue-verify', persona.proofSchool],
      preview: text.slice(0, 180),
    })
  }, [persona, operatorCodename, mode])

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
  const issueOnly = mode === 'issue'

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
              <strong>{tKasa.name}</strong> (<span lang="ja">{tKasa.glyph}</span>) picks the <strong>demo proof school</strong>{' '}
              (issuer persona), which also sets the cryptosuite metaphor <strong>{tKata.name}</strong> (
              <span lang="ja">{tKata.glyph}</span>) and the demo <code>did:key</code> flavor on the payload below. This
              page only <strong>mints shaped demo JSON in your browser</strong>—no chain proofs or canonical
              verification. For structural inspection of that JSON as a held credential, use{' '}
              <strong>{tInspect.name}</strong> on <Link to="/verify">/verify</Link>.
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

            <div className="issueVerify__previewBlock">
              <p className="issueVerify__previewLabel">Preview (active profile Kasa &amp; codename)</p>
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

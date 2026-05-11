import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import './IssueVerifyPage.css'
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

export default function IssueVerifyPage() {
  const [personas, setPersonas] = useState<readonly PersonaPublic[] | null>(null)
  const [ninjaProfile, setNinjaProfile] = useState<NinjaProfile | null>(() => readNinjaProfile())
  const [issuerSource, setIssuerSource] = useState<'manual' | 'ninja'>(() =>
    readNinjaProfile() ? 'ninja' : 'manual',
  )
  const [schoolId, setSchoolId] = useState(() => readNinjaProfile()?.schoolId ?? 'ed-ryu')
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
    if (issuerSource === 'ninja' && ninjaProfile) {
      setSchoolId(ninjaProfile.schoolId)
    }
  }, [issuerSource, ninjaProfile])

  useEffect(() => {
    if (issuerSource === 'ninja' && !ninjaProfile) {
      setIssuerSource('manual')
    }
  }, [issuerSource, ninjaProfile])

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
  const persona = list.find((p) => p.id === schoolId) ?? list[0]

  const operatorCodename =
    issuerSource === 'ninja' && ninjaProfile ? ninjaProfile.codename : undefined

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
      subtitle: 'Issued from Issue & verify (browser demo)',
      issuerOrSource: persona.label,
      status: 'ready',
      tags: ['Menkyo', 'Demo', 'Issue-verify', persona.proofSchool],
      preview: text.slice(0, 180),
    })
  }, [persona, operatorCodename])

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

  return (
    <div className="dojo-scene dojo-scene--night issueVerify">
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <header className="issueVerify__header">
        <p className="issueVerify__eyebrow">The Credential Dojo</p>
        <h1 className="issueVerify__title">Issue &amp; verify</h1>
        <p className="issueVerify__intro">
          Mint a <strong>{tCred.name}</strong>-shaped demo JSON from a proof school (<strong>Kasa</strong>), then run
          the same structural checks as <strong>{tInspect.name}</strong> — still no cryptographic verification, only
          shape and field heuristics.
        </p>
        <nav className="issueVerify__nav" aria-label="Related pages">
          <Link className="issueVerify__back" to="/" title="Back Home">
            ← Home
          </Link>
          <Link className="issueVerify__back" to="/menkyo" title="Open full Menkyo inspection (Kensa)">
            {tInspect.name} (Kensa) →
          </Link>
          <Link className="issueVerify__back" to="/discover-kasa" title="Issuer personas and did:key">
            Discover Kasa
          </Link>
        </nav>
      </header>

      <section
        className="issueVerify__panel dojo-augmented dojo-augmented--panel"
        data-augmented-ui="tl-clip tr-clip bl-clip br-clip border"
      >
        <div className="issueVerify__grid">
          <div>
            <h2 className="issueVerify__sectionTitle">Issue (demo)</h2>
            <p className="issueVerify__sectionBody">
              Choose who acts as the demo issuer: pick a school directly, or use your saved ninja profile so the
              issuer <code>did:key</code> and <strong>Kata</strong> follow your <strong>Kasa</strong> and your codename
              appears on the credential subject.
            </p>

            <div className="issueVerify__issuerMode">
              <p className="issueVerify__issuerModeLabel">Issuer profile</p>
              <div className="issueVerify__issuerModeRow" role="radiogroup" aria-label="Issuer profile source">
                <button
                  type="button"
                  role="radio"
                  aria-checked={issuerSource === 'manual'}
                  className={`issueVerify__issuerModeBtn${issuerSource === 'manual' ? ' issueVerify__issuerModeBtn--active' : ''}`}
                  onClick={() => setIssuerSource('manual')}
                >
                  Manual Kasa
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={issuerSource === 'ninja'}
                  disabled={!ninjaProfile}
                  title={
                    ninjaProfile
                      ? 'Use ninja profile school and codename on the demo credential'
                      : 'Save a ninja profile first'
                  }
                  className={`issueVerify__issuerModeBtn${issuerSource === 'ninja' ? ' issueVerify__issuerModeBtn--active' : ''}`}
                  onClick={() => {
                    if (!ninjaProfile) return
                    setIssuerSource('ninja')
                    setSchoolId(ninjaProfile.schoolId)
                  }}
                >
                  Ninja profile
                </button>
              </div>
              {!ninjaProfile ? (
                <p className="issueVerify__profileHint">
                  No ninja profile in this browser —{' '}
                  <Link to="/create-ninja-profile">create one</Link> to issue under your operator identity, or stay on
                  manual Kasa.
                </p>
              ) : issuerSource === 'ninja' ? (
                <p className="issueVerify__profileHint">
                  Using <strong>{ninjaProfile.codename}</strong> · school{' '}
                  <strong>{list.find((p) => p.id === ninjaProfile.schoolId)?.label ?? ninjaProfile.schoolId}</strong>{' '}
                  (<span lang="ja">{list.find((p) => p.id === ninjaProfile.schoolId)?.labelJa}</span>).{' '}
                  <Link to="/create-ninja-profile">Edit profile</Link>.
                </p>
              ) : (
                <p className="issueVerify__profileHint">
                  Manual mode: Kasa chips below set the issuer only. Your ninja profile is not applied until you
                  switch to <strong>Ninja profile</strong>.
                </p>
              )}
            </div>

            <p className="issueVerify__label">Kasa (issuer school)</p>
            <div
              className={`issueVerify__schoolRow${issuerSource === 'ninja' ? ' issueVerify__schoolRow--locked' : ''}`}
              role="radiogroup"
              aria-label="Demo issuer school"
            >
              {list.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={schoolId === p.id}
                  disabled={issuerSource === 'ninja'}
                  className={`issueVerify__schoolChip${schoolId === p.id ? ' issueVerify__schoolChip--active' : ''}`}
                  onClick={() => {
                    setIssuerSource('manual')
                    setSchoolId(p.id)
                  }}
                  title={issuerSource === 'ninja' ? 'Switch to manual Kasa to change school' : p.description}
                >
                  {p.label}
                  <span className="issueVerify__schoolJa" lang="ja">
                    {p.labelJa}
                  </span>
                </button>
              ))}
            </div>

            <div className="issueVerify__actions">
              <button type="button" className="issueVerify__btn issueVerify__btn--primary" onClick={issueDemo}>
                Issue demo Menkyo
              </button>
            </div>

            <div className="issueVerify__previewBlock">
              <p className="issueVerify__previewLabel">Preview (updates with issuer profile &amp; Kasa)</p>
              <pre className="issueVerify__preview" title="Read-only preview of the next Issue payload shape">
                {previewText}
              </pre>
            </div>
          </div>

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
        </div>

        <p className="issueVerify__footerNote">
          This page is educational: proofs use a placeholder <code>proofValue</code>. For VP-shaped packages, use{' '}
          <Link to="/kensa">Kensa · Enbu</Link>.
        </p>
      </section>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './App.css'
import './IssueVerifyPage.css'
import { DEMO_PERSONAS_OFFLINE, type PersonaPublic, type PersonasPayload } from './demoPersonas'
import { buildDemoMenkyo } from './issueVerifyDemoVc'
import { inspectJson } from './kensa/kensaInspect'
import { productTerminology } from './terminology'
import { addWalletItem } from './walletInventory'

export default function IssueVerifyPage() {
  const [personas, setPersonas] = useState<readonly PersonaPublic[] | null>(null)
  const [schoolId, setSchoolId] = useState('ed-ryu')
  const [rawJson, setRawJson] = useState('')
  const [appliedJson, setAppliedJson] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

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
    const vc = buildDemoMenkyo(persona)
    const text = JSON.stringify(vc, null, 2)
    setRawJson(text)
    setAppliedJson(text)
    setParseError(null)
    addWalletItem({
      type: 'credential',
      title: `Demo Menkyo · ${persona.label}`,
      subtitle: 'Issued from Issue & verify (browser demo)',
      issuerOrSource: persona.label,
      status: 'ready',
      tags: ['Menkyo', 'Demo', 'Issue-verify', persona.proofSchool],
      preview: text.slice(0, 180),
    })
  }, [persona])

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
              Pick the issuer school for the demo VC. The payload uses that school’s public{' '}
              <code>did:key</code> and a preferred <strong>Kata</strong> string in the proof block.
            </p>
            <p className="issueVerify__label">Kasa</p>
            <div className="issueVerify__schoolRow" role="radiogroup" aria-label="Demo issuer school">
              {list.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={schoolId === p.id}
                  className={`issueVerify__schoolChip${schoolId === p.id ? ' issueVerify__schoolChip--active' : ''}`}
                  onClick={() => setSchoolId(p.id)}
                  title={p.description}
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
          </div>

          <div>
            <h2 className="issueVerify__sectionTitle">Verify (Menkyo path)</h2>
            <p className="issueVerify__sectionBody">
              Edit the JSON if you like, then run checks. Errors and warnings mirror the Kensa credential tab.
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

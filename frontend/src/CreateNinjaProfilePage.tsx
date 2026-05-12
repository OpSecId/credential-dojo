import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './App.css'
import './CreateNinjaProfilePage.css'
import { DEMO_PERSONAS_OFFLINE, type PersonaPublic, type PersonasPayload } from './demoPersonas'
import { generateNinjaCodename } from './ninjaCodenameGenerator'
import {
  appendNinjaProfile,
  clearNinjaProfile,
  createOrUpdateNinjaProfile,
  isValidSchoolId,
  readNinjaProfile,
} from './ninjaProfileStorage'
import { useDojoLandingTheme } from './DojoLandingThemeContext'
import { markJourneyPendingStart } from './journey/journeyStorage'
import { clearPasskey, readPasskey, writePasskey } from './passkey/passkeyStorage'
import { assertLocalPasskey, createLocalPasskey, isPasskeySupported } from './passkey/webauthn'

function schoolKataHeadline(p: PersonaPublic): string {
  if (p.kataSamples.length >= 2) return `${p.kataSamples[0]} · ${p.kataSamples[1]}`
  if (p.kataSamples.length === 1) return p.kataSamples[0]
  return p.proofSchool
}

const WIZARD_STEPS = ['welcome', 'codename', 'school', 'review'] as const
type WizardStep = (typeof WIZARD_STEPS)[number]

function initWizardSnapshot(): { codename: string; schoolId: string } {
  const e = readNinjaProfile()
  const schoolId = e && isValidSchoolId(e.schoolId) ? e.schoolId : 'ed-ryu'
  const codename = e?.codename?.trim() ? e.codename.trim() : generateNinjaCodename()
  return { codename, schoolId }
}

export default function CreateNinjaProfilePage() {
  const { theme } = useDojoLandingTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isNewProfile = searchParams.get('new') === '1'

  const [personas, setPersonas] = useState<readonly PersonaPublic[] | null>(null)
  const existing = isNewProfile ? null : readNinjaProfile()
  const [passkey, setPasskey] = useState(() => readPasskey())
  const [passkeyMsg, setPasskeyMsg] = useState<string | null>(null)

  const snapshotSeed = useMemo(() => {
    if (isNewProfile) {
      return { codename: generateNinjaCodename(), schoolId: 'ed-ryu' }
    }
    return initWizardSnapshot()
  }, [isNewProfile])

  const [codename, setCodename] = useState(snapshotSeed.codename)
  const [schoolId, setSchoolId] = useState(snapshotSeed.schoolId)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    setCodename(snapshotSeed.codename)
    setSchoolId(snapshotSeed.schoolId)
    setStepIndex(0)
  }, [snapshotSeed])

  const isDirty = useMemo(
    () => codename !== snapshotSeed.codename || schoolId !== snapshotSeed.schoolId,
    [codename, schoolId, snapshotSeed],
  )

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
  const selectedSchool = list.find((p) => p.id === schoolId)

  const step = WIZARD_STEPS[stepIndex] satisfies WizardStep

  const goHome = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm('Discard your changes and leave the wizard?')
      if (!ok) return
    }
    goHome()
  }, [goHome, isDirty])

  const goNext = () => {
    if (stepIndex < WIZARD_STEPS.length - 1) {
      setStepIndex((i) => i + 1)
    }
  }

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isValidSchoolId(schoolId)) return
    const priorActive = readNinjaProfile()
    if (!priorActive) markJourneyPendingStart()
    if (isNewProfile) appendNinjaProfile(codename, schoolId)
    else createOrUpdateNinjaProfile(codename, schoolId)
    navigate('/')
  }

  const onClear = () => {
    const ok = window.confirm('Remove your ninja profile from this browser? This cannot be undone here.')
    if (!ok) return
    clearNinjaProfile()
    navigate('/')
  }

  const displayName =
    codename.trim() === '' ? 'Anonymous ninja' : codename.trim()

  return (
    <div className={`dojo-scene dojo-scene--${theme} dojo-scene--zen dojo-scene--calmInner`}>
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <div className="ninjaProfile dojoZenPage dojoZenPage--calm">
        <header className="dojoZenPage__header">
          <p className="dojoZenPage__eyebrow">credential.ninja</p>
          <h1 className="dojoZenPage__title">
            {isNewProfile ? 'Add ninja profile' : existing ? 'Update ninja profile' : 'Create ninja profile'}
          </h1>
          <p className="dojoZenPage__intro">
            A short wizard: choose how you appear on the dojo, pick your proof school (kasa), then
            confirm. Everything stays in this browser only. Use <strong>Cancel</strong> on any step to
            leave without saving (you’ll be asked if you changed anything).
          </p>
          <nav className="dojoZenPage__nav" aria-label="Back navigation">
            <Link className="dojoZenPage__back" to="/" title="Back Home">
              ← Back Home
            </Link>
          </nav>
        </header>

        <div className="ninjaProfile__wizard ninjaProfile__wizard--calm">
          <ol className="ninjaProfile__progress" aria-label="Wizard progress">
            {WIZARD_STEPS.map((id, i) => (
              <li
                key={id}
                className={`ninjaProfile__progressStep${i === stepIndex ? ' ninjaProfile__progressStep--active' : ''}${i < stepIndex ? ' ninjaProfile__progressStep--done' : ''}`}
              >
                <span className="ninjaProfile__progressDot" aria-hidden />
                <span className="ninjaProfile__progressLabel">
                  {id === 'welcome' && 'Start'}
                  {id === 'codename' && 'Codename'}
                  {id === 'school' && 'Kasa'}
                  {id === 'review' && 'Confirm'}
                </span>
              </li>
            ))}
          </ol>

          <div className="ninjaProfile__stepPanels">
            {step === 'welcome' && (
              <section className="ninjaProfile__step" aria-labelledby="wizard-welcome">
                <h2 id="wizard-welcome" className="ninjaProfile__stepTitle">
                  {isNewProfile
                    ? 'Add another dojo identity'
                    : existing
                      ? 'Update your dojo identity'
                      : 'Begin your dojo identity'}
                </h2>
                <p className="ninjaProfile__stepBody">
                  You’ll pick a <strong>codename</strong> (or stay anonymous), choose a{' '}
                  <strong>kasa</strong> (proof school) that sets your default <strong>Kata</strong>{' '}
                  carousel on the home page, then review and save.
                </p>
                <div className="ninjaProfile__wizardActions">
                  <button type="button" className="ninjaProfile__ghost" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button type="button" className="ninjaProfile__primary" onClick={goNext}>
                    Continue
                  </button>
                </div>
              </section>
            )}

            {step === 'codename' && (
              <section className="ninjaProfile__step" aria-labelledby="wizard-codename">
                <h2 id="wizard-codename" className="ninjaProfile__stepTitle">
                  Codename
                </h2>
                <p className="ninjaProfile__stepBody">
                  How you’ll appear in the profile menu and across the dojo.
                </p>
                <label className="ninjaProfile__field">
                  <span className="ninjaProfile__label">Codename</span>
                  <div className="ninjaProfile__codenameRow">
                    <input
                      className="ninjaProfile__input ninjaProfile__input--codename"
                      name="codename"
                      autoComplete="nickname"
                      maxLength={48}
                      placeholder="e.g. Paper Crane"
                      value={codename}
                      onChange={(ev) => setCodename(ev.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="ninjaProfile__generateCodename"
                      onClick={() => setCodename(generateNinjaCodename())}
                      title="Generate another codename"
                      aria-label="Generate new codename"
                    >
                      <svg
                        className="ninjaProfile__generateCodenameIcon"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <path
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <span className="ninjaProfile__hint">
                    A name is suggested for new profiles. Clear the field to save as “Anonymous
                    ninja”.
                  </span>
                </label>
                <div className="ninjaProfile__wizardActions">
                  <button type="button" className="ninjaProfile__ghost" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button type="button" className="ninjaProfile__secondary" onClick={goBack}>
                    Back
                  </button>
                  <button type="button" className="ninjaProfile__primary" onClick={goNext}>
                    Next
                  </button>
                </div>
              </section>
            )}

            {step === 'school' && (
              <section className="ninjaProfile__step" aria-labelledby="wizard-school">
                <h2 id="wizard-school" className="ninjaProfile__stepTitle">
                  Proof school (kasa)
                </h2>
                <p className="ninjaProfile__stepBody">
                  Your school sets the default cryptosuites shown in the home Kata carousel and ties
                  your demo persona.
                </p>
                <fieldset className="ninjaProfile__schools">
                  <legend className="ninjaProfile__legend">Choose your kasa</legend>
                  <div className="ninjaProfile__schoolGrid">
                    {list.map((p) => (
                      <label
                        key={p.id}
                        className={`ninjaProfile__school${p.id === schoolId ? ' ninjaProfile__school--selected' : ''}`}
                        title={p.description}
                      >
                        <input
                          type="radio"
                          name="school"
                          value={p.id}
                          checked={schoolId === p.id}
                          onChange={() => setSchoolId(p.id)}
                          className="ninjaProfile__radio"
                        />
                        <span className="ninjaProfile__schoolName">{p.label}</span>
                        <span className="ninjaProfile__schoolJa" lang="ja">
                          {p.labelJa}
                        </span>
                        <span
                          className="ninjaProfile__schoolProof"
                          title={`Primary kata: ${schoolKataHeadline(p)}`}
                        >
                          {schoolKataHeadline(p)}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="ninjaProfile__wizardActions">
                  <button type="button" className="ninjaProfile__ghost" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button type="button" className="ninjaProfile__secondary" onClick={goBack}>
                    Back
                  </button>
                  <button type="button" className="ninjaProfile__primary" onClick={goNext}>
                    Next
                  </button>
                </div>
              </section>
            )}

            {step === 'review' && (
              <section className="ninjaProfile__step" aria-labelledby="wizard-review">
                <h2 id="wizard-review" className="ninjaProfile__stepTitle">
                  Confirm
                </h2>
                <dl className="ninjaProfile__summary">
                  <div className="ninjaProfile__summaryRow">
                    <dt>Codename</dt>
                    <dd>{displayName}</dd>
                  </div>
                  <div className="ninjaProfile__summaryRow">
                    <dt>School</dt>
                    <dd>
                      {selectedSchool ? (
                        <>
                          <strong>{selectedSchool.label}</strong>{' '}
                          <span lang="ja" className="ninjaProfile__summaryJa">
                            {selectedSchool.labelJa}
                          </span>
                        </>
                      ) : (
                        schoolId
                      )}
                    </dd>
                  </div>
                  {selectedSchool ? (
                    <div className="ninjaProfile__summaryRow">
                      <dt>Headline kata</dt>
                      <dd>
                        <code className="ninjaProfile__summaryCode">{schoolKataHeadline(selectedSchool)}</code>
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className="ninjaProfile__summary ninjaProfile__summary--passkey">
                  <div className="ninjaProfile__summaryRow">
                    <dt>Passkey</dt>
                    <dd>
                      {passkey ? (
                        <>
                          <strong>{passkey.label}</strong>{' '}
                          <span className="ninjaProfile__hint">
                            Saved {new Date(passkey.createdAt).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="ninjaProfile__hint">
                          Optional. Adds device-level sign-in to this browser profile.
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="ninjaProfile__wizardActions">
                    {!passkey ? (
                      <button
                        type="button"
                        className="ninjaProfile__secondary"
                        onClick={async () => {
                          setPasskeyMsg(null)
                          try {
                            if (!isPasskeySupported()) {
                              setPasskeyMsg('Passkeys are not supported on this device/browser.')
                              return
                            }
                            const res = await createLocalPasskey({
                              userName: displayName,
                              userDisplayName: displayName,
                            })
                            const stored = {
                              credentialIdB64Url: res.credentialIdB64Url,
                              createdAt: new Date().toISOString(),
                              label: `${displayName} passkey`,
                            }
                            writePasskey(stored)
                            setPasskey(stored)
                            setPasskeyMsg('Passkey created for this device.')
                          } catch (e) {
                            setPasskeyMsg(e instanceof Error ? e.message : 'Passkey creation failed.')
                          }
                        }}
                        title="Create a passkey for this device (WebAuthn)"
                      >
                        Create passkey
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="ninjaProfile__secondary"
                          onClick={async () => {
                            setPasskeyMsg(null)
                            try {
                              await assertLocalPasskey(passkey.credentialIdB64Url)
                              setPasskeyMsg('Passkey verified on this device.')
                            } catch (e) {
                              setPasskeyMsg(e instanceof Error ? e.message : 'Passkey check failed.')
                            }
                          }}
                        >
                          Test passkey
                        </button>
                        <button
                          type="button"
                          className="ninjaProfile__danger"
                          onClick={() => {
                            const ok = window.confirm(
                              'Remove the stored passkey reference from this browser? (The device passkey remains in your OS/manager.)',
                            )
                            if (!ok) return
                            clearPasskey()
                            setPasskey(null)
                            setPasskeyMsg('Passkey reference cleared from this browser.')
                          }}
                        >
                          Clear passkey
                        </button>
                      </>
                    )}
                  </div>
                  {passkeyMsg ? <p className="ninjaProfile__hint">{passkeyMsg}</p> : null}
                </div>
                <form onSubmit={onSubmit}>
                  <div className="ninjaProfile__wizardActions">
                    <button type="button" className="ninjaProfile__ghost" onClick={handleCancel}>
                      Cancel
                    </button>
                    <button type="button" className="ninjaProfile__secondary" onClick={goBack}>
                      Back
                    </button>
                    {existing && !isNewProfile ? (
                      <button type="button" className="ninjaProfile__danger" onClick={onClear}>
                        Clear profile
                      </button>
                    ) : null}
                    <button type="submit" className="ninjaProfile__submit">
                      {isNewProfile ? 'Add profile' : existing ? 'Save profile' : 'Create profile'}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

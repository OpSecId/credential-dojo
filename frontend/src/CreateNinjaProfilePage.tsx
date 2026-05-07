import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'
import './CreateNinjaProfilePage.css'
import { DEMO_PERSONAS_OFFLINE, type PersonaPublic, type PersonasPayload } from './demoPersonas'
import {
  clearNinjaProfile,
  createOrUpdateNinjaProfile,
  isValidSchoolId,
  readNinjaProfile,
} from './ninjaProfileStorage'
import { markJourneyPendingStart } from './journey/journeyStorage'

function schoolKataHeadline(p: PersonaPublic): string {
  if (p.kataSamples.length >= 2) return `${p.kataSamples[0]} · ${p.kataSamples[1]}`
  if (p.kataSamples.length === 1) return p.kataSamples[0]
  return p.proofSchool
}

const WIZARD_STEPS = ['welcome', 'codename', 'school', 'review'] as const
type WizardStep = (typeof WIZARD_STEPS)[number]

export default function CreateNinjaProfilePage() {
  const navigate = useNavigate()
  const [personas, setPersonas] = useState<readonly PersonaPublic[] | null>(null)
  const existing = useMemo(() => readNinjaProfile(), [])

  const [codename, setCodename] = useState(existing?.codename ?? '')
  const [schoolId, setSchoolId] = useState(
    existing && isValidSchoolId(existing.schoolId) ? existing.schoolId : 'ed-ryu',
  )

  const initialSnapshot = useRef({
    codename: existing?.codename ?? '',
    schoolId:
      existing && isValidSchoolId(existing.schoolId) ? existing.schoolId : 'ed-ryu',
  })
  const [stepIndex, setStepIndex] = useState(0)

  const isDirty = useMemo(() => {
    const init = initialSnapshot.current
    return codename !== init.codename || schoolId !== init.schoolId
  }, [codename, schoolId])

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
    if (!existing) markJourneyPendingStart()
    createOrUpdateNinjaProfile(codename, schoolId)
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
    <div className="dojo-scene dojo-scene--night">
      <div className="dojo-scene__moon" aria-hidden />
      <div className="dojo-scene__bg" aria-hidden />
      <div className="dojo-scene__grid" aria-hidden />

      <div className="ninjaProfile">
        <header className="ninjaProfile__header">
          <p className="ninjaProfile__eyebrow">The Credential Dojo</p>
          <h1 className="ninjaProfile__title">
            {existing ? 'Update ninja profile' : 'Create ninja profile'}
          </h1>
          <p className="ninjaProfile__intro">
            A short wizard: choose how you appear on the dojo, pick your proof school (kasa), then
            confirm. Everything stays in this browser only. Use <strong>Cancel</strong> on any step to
            leave without saving (you’ll be asked if you changed anything).
          </p>
        </header>

        <div
          className="ninjaProfile__wizard dojo-augmented dojo-augmented--form"
          data-augmented-ui="tl-clip br-clip border"
        >
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
                  {existing ? 'Update your dojo identity' : 'Begin your dojo identity'}
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
                  How you’ll appear in the ninja bar on the home dojo.
                </p>
                <label className="ninjaProfile__field">
                  <span className="ninjaProfile__label">Codename</span>
                  <input
                    className="ninjaProfile__input"
                    name="codename"
                    autoComplete="nickname"
                    maxLength={48}
                    placeholder="e.g. Paper Crane"
                    value={codename}
                    onChange={(ev) => setCodename(ev.target.value)}
                    autoFocus
                  />
                  <span className="ninjaProfile__hint">Leave blank to use “Anonymous ninja”.</span>
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
                <form onSubmit={onSubmit}>
                  <div className="ninjaProfile__wizardActions">
                    <button type="button" className="ninjaProfile__ghost" onClick={handleCancel}>
                      Cancel
                    </button>
                    <button type="button" className="ninjaProfile__secondary" onClick={goBack}>
                      Back
                    </button>
                    {existing ? (
                      <button type="button" className="ninjaProfile__danger" onClick={onClear}>
                        Clear profile
                      </button>
                    ) : null}
                    <button type="submit" className="ninjaProfile__submit">
                      {existing ? 'Save profile' : 'Create profile'}
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

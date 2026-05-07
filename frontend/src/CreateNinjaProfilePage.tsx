import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './App.css'
import './CreateNinjaProfilePage.css'
import { DEMO_PERSONAS_OFFLINE, type PersonaPublic, type PersonasPayload } from './demoPersonas'
import {
  clearNinjaProfile,
  createOrUpdateNinjaProfile,
  isValidSchoolId,
  readNinjaProfile,
} from './ninjaProfileStorage'

function schoolKataHeadline(p: PersonaPublic): string {
  if (p.kataSamples.length >= 2) return `${p.kataSamples[0]} · ${p.kataSamples[1]}`
  if (p.kataSamples.length === 1) return p.kataSamples[0]
  return p.proofSchool
}

export default function CreateNinjaProfilePage() {
  const navigate = useNavigate()
  const [personas, setPersonas] = useState<readonly PersonaPublic[] | null>(null)
  const existing = useMemo(() => readNinjaProfile(), [])

  const [codename, setCodename] = useState(existing?.codename ?? '')
  const [schoolId, setSchoolId] = useState(
    existing && isValidSchoolId(existing.schoolId) ? existing.schoolId : 'ed-ryu',
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isValidSchoolId(schoolId)) return
    createOrUpdateNinjaProfile(codename, schoolId)
    navigate('/')
  }

  const onClear = () => {
    clearNinjaProfile()
    navigate('/')
  }

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
            Pick a <strong>codename</strong> and the <strong>kasa</strong> (proof school) you train
            under. Your school sets the default <strong>Kata</strong> carousel on the home dojo;
            everything stays in this browser only.
          </p>
          <nav className="ninjaProfile__nav" aria-label="Section">
            <Link className="ninjaProfile__back" to="/" title="Credential Dojo home">
              ← Home
            </Link>
            <Link
              className="ninjaProfile__back"
              to="/discover-kasa"
              title="Demo proof schools (Kasa) with did:key and Kata samples"
            >
              Discover Kasa
            </Link>
            <Link
              className="ninjaProfile__back"
              to="/lexicon"
              title="Glossary: Dojo metaphors vs W3C Verifiable Credentials"
            >
              Lexicon
            </Link>
            <Link
              className="ninjaProfile__back"
              to="/json-explorer"
              title="Interactive JSON tree with RFC 6901 pointer tooltips"
            >
              JSON explorer
            </Link>
            <Link
              className="ninjaProfile__back"
              to="/kensa"
              title="Enbu の Kensa / Menkyo の Kensa — structural inspection"
            >
              Kensa
            </Link>
          </nav>
        </header>

        <form
          className="ninjaProfile__form dojo-augmented dojo-augmented--form"
          data-augmented-ui="tl-clip br-clip border"
          onSubmit={onSubmit}
        >
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
            />
            <span className="ninjaProfile__hint">Leave blank to use “Anonymous ninja”.</span>
          </label>

          <fieldset className="ninjaProfile__schools">
            <legend className="ninjaProfile__legend">Choose your kasa (school)</legend>
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
                  <span className="ninjaProfile__schoolProof" title={`Primary kata: ${schoolKataHeadline(p)}`}>
                    {schoolKataHeadline(p)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="ninjaProfile__actions">
            <button
              type="submit"
              className="ninjaProfile__submit"
              title="Store codename and school in localStorage and return home"
            >
              {existing ? 'Save profile' : 'Create profile'}
            </button>
            {existing ? (
              <button
                type="button"
                className="ninjaProfile__clear"
                title="Remove ninja profile from this browser and return home"
                onClick={onClear}
              >
                Clear profile
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  appendPointer,
  getValueAtPointer,
  pointersExpandedByDefault,
  pointersToExpandForPath,
} from '../utils/jsonPointer'
import './JsonAugWidget.css'

export type JsonHighlightKind =
  | 'json-root'
  | 'json-key'
  | 'json-string'
  | 'json-number'
  | 'json-boolean'
  | 'json-null'
  | 'json-object'
  | 'json-array'

export type JsonAugWidgetProps = {
  value: unknown
  title?: string
  /** RFC 6901 pointers (e.g. `/credentialSubject/name`) → explanation text */
  explainByPointer?: Record<string, string>
  /** Initial expand depth for nested objects/arrays (0 = root shell only). */
  defaultExpandDepth?: number
  /**
   * Programmatic focus (e.g. VC structure chips). Pair with `focusTick` so the same path can
   * be re-focused. Expands ancestors and scrolls the segment into view.
   */
  focusPointer?: string | null
  /** Increment when re-focusing the same pointer (e.g. `Date.now()`). */
  focusTick?: number
}

function kindForValue(v: unknown): JsonHighlightKind {
  if (v === undefined) return 'json-null'
  if (v === null) return 'json-null'
  if (Array.isArray(v)) return 'json-array'
  if (typeof v === 'object') return 'json-object'
  if (typeof v === 'string') return 'json-string'
  if (typeof v === 'number') return 'json-number'
  if (typeof v === 'boolean') return 'json-boolean'
  return 'json-string'
}

function previewValue(v: unknown, max = 120): string {
  try {
    const s = typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v)
    if (s.length <= max) return s
    return `${s.slice(0, max)}…`
  } catch {
    return String(v)
  }
}

function defaultExplain(path: string, v: unknown): string {
  if (path === '')
    return 'Root of the document. Hover keys and values in the tree to explore structure and meaning.'
  const k = kindForValue(v)
  switch (k) {
    case 'json-object':
      return 'Object: map of string keys to values. Use the toggle to fold or unfold nested fields.'
    case 'json-array':
      return 'Array: ordered list. Indices are numeric JSON Pointer segments.'
    case 'json-string':
      return 'String value. Often identifiers, display text, or compact encodings (JWT, dates).'
    case 'json-number':
      return 'JSON number (no separate int/float types).'
    case 'json-boolean':
      return 'Boolean literal.'
    case 'json-null':
      return 'null: explicit absence; distinct from a missing key.'
    default:
      return 'JSON node.'
  }
}

function resolveExplain(
  path: string,
  v: unknown,
  explainByPointer: Record<string, string>,
): string {
  let cur: string | null = path
  while (cur !== null) {
    if (explainByPointer[cur]) return explainByPointer[cur]
    if (cur === '') break
    const i = cur.lastIndexOf('/')
    cur = i <= 0 ? '' : cur.slice(0, i)
  }
  return defaultExplain(path, v)
}

type TreeProps = {
  value: unknown
  path: string
  expanded: Set<string>
  toggle: (path: string) => void
  onSegEnter: (path: string, kind: JsonHighlightKind) => void
  getTooltip: (path: string, kind: JsonHighlightKind) => string
  expandTooltip: (path: string, nextActionIsExpand: boolean) => string
}

function JsonTree({
  value,
  path,
  expanded,
  toggle,
  onSegEnter,
  getTooltip,
  expandTooltip,
}: TreeProps): ReactNode {
  const isExp = expanded.has(path)

  if (value === null) {
    return (
      <span
        className="json-aug__seg json-aug__seg--null"
        data-json-path={path}
        data-json-kind="json-null"
        title={getTooltip(path, 'json-null')}
        onPointerEnter={() => onSegEnter(path, 'json-null')}
      >
        null
      </span>
    )
  }

  if (typeof value === 'boolean') {
    return (
      <span
        className="json-aug__seg json-aug__seg--bool"
        data-json-path={path}
        data-json-kind="json-boolean"
        title={getTooltip(path, 'json-boolean')}
        onPointerEnter={() => onSegEnter(path, 'json-boolean')}
      >
        {value ? 'true' : 'false'}
      </span>
    )
  }

  if (typeof value === 'number') {
    return (
      <span
        className="json-aug__seg json-aug__seg--num"
        data-json-path={path}
        data-json-kind="json-number"
        title={getTooltip(path, 'json-number')}
        onPointerEnter={() => onSegEnter(path, 'json-number')}
      >
        {String(value)}
      </span>
    )
  }

  if (typeof value === 'string') {
    return (
      <span
        className="json-aug__seg json-aug__seg--str"
        data-json-path={path}
        data-json-kind="json-string"
        title={getTooltip(path, 'json-string')}
        onPointerEnter={() => onSegEnter(path, 'json-string')}
      >
        {JSON.stringify(value)}
      </span>
    )
  }

  if (Array.isArray(value)) {
    if (!isExp) {
      return (
        <span className="json-aug__fold">
          <button
            type="button"
            className="json-aug__toggle"
            aria-expanded={false}
            title={expandTooltip(path, true)}
            onClick={() => toggle(path)}
          >
            +
          </button>
          <span
            className="json-aug__seg json-aug__seg--array json-aug__ellipsis"
            data-json-path={path}
            data-json-kind="json-array"
            title={getTooltip(path, 'json-array')}
            onPointerEnter={() => onSegEnter(path, 'json-array')}
          >
            [{value.length} {value.length === 1 ? 'item' : 'items'}]
          </span>
        </span>
      )
    }
    return (
      <span className="json-aug__block">
        <span className="json-aug__foldLine">
          <button
            type="button"
            className="json-aug__toggle"
            aria-expanded
            title={expandTooltip(path, false)}
            onClick={() => toggle(path)}
          >
            −
          </button>
          <span
            className="json-aug__seg json-aug__seg--array"
            data-json-path={path}
            data-json-kind="json-array"
            title={getTooltip(path, 'json-array')}
            onPointerEnter={() => onSegEnter(path, 'json-array')}
          >
            [
          </span>
        </span>
        <span className="json-aug__indent">
          {value.map((item, i) => {
            const p = appendPointer(path, String(i))
            return (
              <span key={p} className="json-aug__line">
                <JsonTree
                  value={item}
                  path={p}
                  expanded={expanded}
                  toggle={toggle}
                  onSegEnter={onSegEnter}
                  getTooltip={getTooltip}
                  expandTooltip={expandTooltip}
                />
                {i < value.length - 1 ? <span className="json-aug__comma">,</span> : null}
              </span>
            )
          })}
        </span>
        <span className="json-aug__close">]</span>
      </span>
    )
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as object)
    if (!isExp) {
      return (
        <span className="json-aug__fold">
          <button
            type="button"
            className="json-aug__toggle"
            aria-expanded={false}
            title={expandTooltip(path, true)}
            onClick={() => toggle(path)}
          >
            +
          </button>
          <span
            className="json-aug__seg json-aug__seg--obj json-aug__ellipsis"
            data-json-path={path}
            data-json-kind="json-object"
            title={getTooltip(path, 'json-object')}
            onPointerEnter={() => onSegEnter(path, 'json-object')}
          >
            {'{'}
            {keys.length} {keys.length === 1 ? 'key' : 'keys'}
            {'}'}
          </span>
        </span>
      )
    }
    return (
      <span className="json-aug__block">
        <span className="json-aug__foldLine">
          <button
            type="button"
            className="json-aug__toggle"
            aria-expanded
            title={expandTooltip(path, false)}
            onClick={() => toggle(path)}
          >
            −
          </button>
          <span
            className="json-aug__seg json-aug__seg--obj"
            data-json-path={path}
            data-json-kind="json-object"
            title={getTooltip(path, 'json-object')}
            onPointerEnter={() => onSegEnter(path, 'json-object')}
          >
            {'{'}
          </span>
        </span>
        <span className="json-aug__indent">
          {keys.map((k, i) => {
            const p = appendPointer(path, k)
            const child = (value as Record<string, unknown>)[k]
            return (
              <span key={p} className="json-aug__line">
                <span
                  className="json-aug__seg json-aug__seg--key"
                  data-json-path={p}
                  data-json-kind="json-key"
                  title={getTooltip(p, 'json-key')}
                  onPointerEnter={() => onSegEnter(p, 'json-key')}
                >
                  {JSON.stringify(k)}
                </span>
                <span className="json-aug__colon">: </span>
                <JsonTree
                  value={child}
                  path={p}
                  expanded={expanded}
                  toggle={toggle}
                  onSegEnter={onSegEnter}
                  getTooltip={getTooltip}
                  expandTooltip={expandTooltip}
                />
                {i < keys.length - 1 ? <span className="json-aug__comma">,</span> : null}
              </span>
            )
          })}
        </span>
        <span className="json-aug__close">{'}'}</span>
      </span>
    )
  }

  return null
}

function findNodeByJsonPath(container: HTMLElement | null, ptr: string): Element | null {
  if (!container) return null
  for (const node of container.querySelectorAll('[data-json-path]')) {
    if (node.getAttribute('data-json-path') === ptr) return node
  }
  return null
}

export default function JsonAugWidget({
  value,
  title = 'JSON',
  explainByPointer = {},
  defaultExpandDepth = 2,
  focusPointer = null,
  focusTick = 0,
}: JsonAugWidgetProps) {
  const treeContainerRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(() =>
    pointersExpandedByDefault(value, defaultExpandDepth),
  )
  const [highlight, setHighlight] = useState<{
    path: string
    kind: JsonHighlightKind
  } | null>(null)
  const [hoverCode, setHoverCode] = useState(false)
  const [hoverViz, setHoverViz] = useState(false)

  useEffect(() => {
    if (focusPointer === null) return
    const ptr = focusPointer
    setExpanded((prev) => {
      const n = new Set(prev)
      for (const p of pointersToExpandForPath(ptr)) {
        n.add(p)
      }
      return n
    })
    const v = getValueAtPointer(value, ptr)
    const kind = kindForValue(v)
    setHighlight({ path: ptr, kind })

    const id = requestAnimationFrame(() => {
      const el = findNodeByJsonPath(treeContainerRef.current, ptr)
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(id)
  }, [focusPointer, focusTick, value])

  const toggle = useCallback((p: string) => {
    setExpanded((prev) => {
      const n = new Set(prev)
      if (n.has(p)) n.delete(p)
      else n.add(p)
      return n
    })
  }, [])

  const onSegEnter = useCallback((path: string, kind: JsonHighlightKind) => {
    setHighlight({ path, kind })
  }, [])

  const highlightedValue = useMemo(() => {
    if (!highlight) return undefined
    return getValueAtPointer(value, highlight.path)
  }, [highlight, value])

  const explainText = useMemo(() => {
    if (!highlight) {
      return 'Hover the tree on the left. Keys, values, objects, and arrays each light up a different note here—plus any custom blurbs you pass in explainByPointer.'
    }
    return resolveExplain(highlight.path, highlightedValue, explainByPointer)
  }, [highlight, highlightedValue, explainByPointer])

  const getTooltip = useCallback(
    (path: string, kind: JsonHighlightKind) => {
      const v = getValueAtPointer(value, path)
      let ex = resolveExplain(path, v, explainByPointer)
      if (kind === 'json-key') {
        ex = `Property key · ${ex}`
      }
      const ptr = path === '' ? '/' : path
      const oneLine = ex.replace(/\s+/g, ' ').trim()
      const short = oneLine.length > 140 ? oneLine.slice(0, 137) + '…' : oneLine
      return `${ptr} — ${short}`
    },
    [value, explainByPointer],
  )

  const expandTooltip = useCallback((path: string, nextActionIsExpand: boolean) => {
    const ptr = path === '' ? '(root)' : path
    return nextActionIsExpand
      ? `Expand nested values at JSON Pointer ${ptr}`
      : `Collapse nested values at JSON Pointer ${ptr}`
  }, [])

  const dataHighlight = highlight?.kind ?? ''
  const compressed3d = hoverCode && !hoverViz

  return (
    <section
      className="json-aug"
      data-augmented-ui="tl-2-clip-x tr-2-clip-x border"
      data-highlight-info={dataHighlight}
    >
      <h1 className="json-aug__title" title="Hover the tree for JSON Pointer tooltips on each segment.">
        {title}
      </h1>

      <div className="json-aug__demo">
        <div
          className="json-aug__codeArea"
          data-augmented-ui-reset=""
          title="Hover keys, values, and brackets to see RFC 6901 pointers and notes. +/− toggles fold nested objects and arrays."
          onPointerEnter={() => setHoverCode(true)}
          onPointerLeave={(e) => {
            const rel = e.relatedTarget as Node | null
            if (!rel || !e.currentTarget.parentElement?.contains(rel)) {
              setHoverCode(false)
              setHighlight(null)
            }
          }}
        >
          <div
            ref={treeContainerRef}
            className="json-aug__codeContainer"
            data-augmented-ui="tl-clip tr-clip-y br-2-clip-xy both"
          >
            <span className="json-aug__codeLabel" data-augmented-ui="" title="Document tree for the applied JSON.">
              JSON
            </span>
            <pre className="json-aug__pre">
              <code>
                <span
                  className="json-aug__seg json-aug__seg--root"
                  data-json-path=""
                  data-json-kind="json-root"
                  title={getTooltip('', 'json-root')}
                  onPointerEnter={() => onSegEnter('', 'json-root')}
                >
                  <JsonTree
                    value={value}
                    path=""
                    expanded={expanded}
                    toggle={toggle}
                    onSegEnter={onSegEnter}
                    getTooltip={getTooltip}
                    expandTooltip={expandTooltip}
                  />
                </span>
              </code>
            </pre>
          </div>
        </div>

        <div className="json-aug__vizCol" data-augmented-ui-reset="">
          <div
            className="json-aug__highlighted"
            data-augmented-ui="tl-clip tr-clip br-clip bl-clip border"
          >
            <div className="json-aug__show json-aug__show--root">
              <strong>Document</strong>
              <p>Whole JSON value. Pointer <code>/</code> or empty string refers to the root.</p>
            </div>
            <div className="json-aug__show json-aug__show--key">
              <strong>Property key</strong>
              <p>Maps to a JSON Pointer segment after the slash (escaped per RFC 6901).</p>
            </div>
            <div className="json-aug__show json-aug__show--string">
              <strong>String</strong>
              <p>UTF-8 text; often human-readable labels or machine codes.</p>
            </div>
            <div className="json-aug__show json-aug__show--number">
              <strong>Number</strong>
              <p>IEEE 754 as parsed by JSON.parse.</p>
            </div>
            <div className="json-aug__show json-aug__show--boolean">
              <strong>Boolean</strong>
              <p>Strict lowercase true/false in JSON.</p>
            </div>
            <div className="json-aug__show json-aug__show--null">
              <strong>null</strong>
              <p>Explicit null; the key is still present.</p>
            </div>
            <div className="json-aug__show json-aug__show--object">
              <strong>Object</strong>
              <p>Unordered key bag; fold with + to skim large payloads.</p>
            </div>
            <div className="json-aug__show json-aug__show--array">
              <strong>Array</strong>
              <p>Ordered; pointer uses numeric indices.</p>
            </div>
            <div className="json-aug__explain">
              <strong>Pointer</strong>
              <code
                className="json-aug__pointer"
                title={
                  highlight
                    ? getTooltip(highlight.path, highlight.kind)
                    : 'RFC 6901 JSON Pointer for the hovered tree segment'
                }
              >
                {highlight?.path === '' ? '/' : highlight?.path ?? '—'}
              </code>
              <strong className="json-aug__explainLabel">Detail</strong>
              <p className="json-aug__explainBody">{explainText}</p>
              {highlight ? (
                <p className="json-aug__preview">
                  <span className="json-aug__previewLabel">Value preview</span>{' '}
                  <code>{previewValue(highlightedValue)}</code>
                </p>
              ) : null}
            </div>
          </div>

          <div
            className={`json-aug__group3d${compressed3d ? ' json-aug__group3d--compressed' : ''}`}
            data-augmented-ui-reset=""
            title="Decorative layers: hovering the JSON tree compresses this strip (visual echo of the augmented-ui demo)."
            onPointerEnter={() => setHoverViz(true)}
            onPointerLeave={() => setHoverViz(false)}
          >
            <div
              className="json-aug__layer json-aug__layer--border"
              data-augmented-ui="tr-clip bl-clip br-clip-y border"
              aria-hidden
            />
            <div
              className="json-aug__layer json-aug__layer--content"
              data-augmented-ui="tr-clip bl-clip br-clip-y"
              aria-hidden
            >
              {'{ }'}
            </div>
            <div
              className="json-aug__layer json-aug__layer--both"
              data-augmented-ui="tr-clip bl-clip br-clip-y both"
              aria-hidden
            />
            <div
              className="json-aug__layer json-aug__layer--bg"
              data-augmented-ui="tr-clip bl-clip br-clip-y"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div
        className="json-aug__sectionInfo"
        onPointerEnter={() => {
          setHoverCode(false)
          setHighlight(null)
        }}
      >
        <h2>Expand · explore · explain</h2>
        <ul>
          <li>
            <strong>Expand</strong> — toggles fold nested objects and arrays so you can drill at your own pace.
          </li>
          <li>
            <strong>Explore</strong> — pointer paths and kinds update as you skim the tree.
          </li>
          <li>
            <strong>Explain</strong> — combine built-in blurbs with your own <code>explainByPointer</code> map
            (JSON Pointer → markdown-free copy).
          </li>
        </ul>
      </div>
    </section>
  )
}

/** RFC 6901 JSON Pointer segment escaping. */
export function escapePointerSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1')
}

export function unescapePointerSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~')
}

/** `base` is '' for root, or '/a/b' for nested. `segment` is an object key or array index string. */
export function appendPointer(base: string, segment: string): string {
  const esc = escapePointerSegment(segment)
  return base === '' ? `/${esc}` : `${base}/${esc}`
}

export function getValueAtPointer(root: unknown, pointer: string): unknown {
  if (pointer === '') return root
  if (!pointer.startsWith('/')) return undefined
  const segments = pointer.slice(1).split('/').map(unescapePointerSegment)
  let cur: unknown = root
  for (const part of segments) {
    if (cur === null || cur === undefined) return undefined
    if (typeof cur !== 'object') return undefined
    if (Array.isArray(cur)) {
      const i = Number(part)
      if (!Number.isInteger(i) || i < 0 || i >= cur.length) return undefined
      cur = cur[i]
    } else {
      const o = cur as Record<string, unknown>
      if (!Object.prototype.hasOwnProperty.call(o, part)) return undefined
      cur = o[part]
    }
  }
  return cur
}

/** Collect pointers for objects/arrays up to `maxDepth` nesting from root (0 = root only). */
/**
 * Pointers that must be in the expanded set so the node at `pointer` is visible
 * (root and every strict ancestor object/array along the path).
 */
export function pointersToExpandForPath(pointer: string): string[] {
  if (pointer === '' || pointer === '/') {
    return []
  }
  if (!pointer.startsWith('/')) {
    return ['']
  }
  const segments = pointer.slice(1).split('/').map(unescapePointerSegment)
  const out: string[] = ['']
  let cur = ''
  for (let i = 0; i < segments.length - 1; i++) {
    cur = appendPointer(cur, segments[i])
    out.push(cur)
  }
  return out
}

export function pointersExpandedByDefault(value: unknown, maxDepth: number): Set<string> {
  const set = new Set<string>()
  function walk(v: unknown, path: string, depth: number) {
    if (v === null || typeof v !== 'object') return
    set.add(path)
    if (depth >= maxDepth) return
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        const p = appendPointer(path, String(i))
        walk(item, p, depth + 1)
      })
    } else {
      for (const k of Object.keys(v as object)) {
        const p = appendPointer(path, k)
        walk((v as Record<string, unknown>)[k], p, depth + 1)
      }
    }
  }
  walk(value, '', 0)
  return set
}

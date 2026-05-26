'use client'
import { useCallback, useMemo, useSyncExternalStore } from 'react'

// v2 形式: "festivalId|YYYY-MM-DD" を Set で保持
// 旧形式（"festivalId" 単体）は初回読込時に破棄
const KEY = 'tamaya:favorites'
const EMPTY: Set<string> = new Set()

let cache: Set<string> | null = null
const subs = new Set<() => void>()

function makeKey(festivalId: string, date: string) {
  return `${festivalId}|${date}`
}

function load(): Set<string> {
  if (cache) return cache
  if (typeof window === 'undefined') {
    cache = new Set()
    return cache
  }
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? (JSON.parse(raw) as string[]) : []
    // 旧形式（"|" を含まない）は破棄
    const filtered = arr.filter(s => s.includes('|'))
    cache = new Set<string>(filtered)
    // 旧データが混ざっていれば一度書き戻して掃除
    if (filtered.length !== arr.length) persist(cache)
  } catch {
    cache = new Set()
  }
  return cache
}

function persist(s: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...s]))
  } catch {}
}

function emit() {
  subs.forEach(cb => cb())
}

function subscribe(cb: () => void) {
  subs.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null
      cb()
    }
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage)
  }
  return () => {
    subs.delete(cb)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage)
    }
  }
}

export function useFavorites() {
  const entries = useSyncExternalStore<Set<string>>(
    subscribe,
    () => load(),
    () => EMPTY,
  )

  const toggle = useCallback((festivalId: string, date: string) => {
    const current = load()
    const next = new Set(current)
    const k = makeKey(festivalId, date)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    cache = next
    persist(next)
    emit()
  }, [])

  // validKeys に含まれないエントリを削除（古い日程変更の掃除用）
  const prune = useCallback((validKeys: Set<string>) => {
    const current = load()
    const next = new Set<string>()
    let changed = false
    for (const k of current) {
      if (validKeys.has(k)) next.add(k)
      else changed = true
    }
    if (changed) {
      cache = next
      persist(next)
      emit()
    }
  }, [])

  // 1つでも fav が登録された大会IDの集合
  const festivalIds = useMemo(() => {
    const s = new Set<string>()
    for (const e of entries) {
      const i = e.indexOf('|')
      if (i > 0) s.add(e.slice(0, i))
    }
    return s
  }, [entries])

  const isFav = useCallback(
    (festivalId: string, date: string) => entries.has(makeKey(festivalId, date)),
    [entries],
  )

  // 指定大会の fav 日付一覧
  const datesOf = useCallback(
    (festivalId: string): string[] => {
      const prefix = `${festivalId}|`
      const out: string[] = []
      for (const e of entries) {
        if (e.startsWith(prefix)) out.push(e.slice(prefix.length))
      }
      return out.sort()
    },
    [entries],
  )

  return {
    entries,
    festivalIds,
    toggle,
    isFav,
    datesOf,
    prune,
    loaded: entries !== EMPTY,
    count: festivalIds.size,
  }
}

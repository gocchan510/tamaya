'use client'
import { useCallback, useSyncExternalStore } from 'react'

const KEY = 'tamaya:favorites'
const EMPTY: Set<string> = new Set()

let cache: Set<string> | null = null
const subs = new Set<() => void>()

function load(): Set<string> {
  if (cache) return cache
  if (typeof window === 'undefined') {
    cache = new Set()
    return cache
  }
  try {
    const raw = localStorage.getItem(KEY)
    cache = new Set<string>(raw ? (JSON.parse(raw) as string[]) : [])
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
  const ids = useSyncExternalStore<Set<string>>(
    subscribe,
    () => load(),
    () => EMPTY,
  )

  const toggle = useCallback((id: string) => {
    const current = load()
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    cache = next
    persist(next)
    emit()
  }, [])

  return {
    ids,
    toggle,
    isFav: (id: string) => ids.has(id),
    loaded: ids !== EMPTY,
    count: ids.size,
  }
}

'use client'
import { useCallback, useSyncExternalStore } from 'react'

export interface HomeBase {
  label: string
  lat: number
  lng: number
}

const KEY = 'tamaya:homebase'
const listeners = new Set<() => void>()

function notify() { listeners.forEach(cb => cb()) }

function getSnapshot(): HomeBase | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as HomeBase) : null
  } catch {
    return null
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', cb)
  }
}

export function useHomeBase() {
  const homeBase = useSyncExternalStore(subscribe, getSnapshot, () => null)

  const setHomeBase = useCallback((base: HomeBase) => {
    localStorage.setItem(KEY, JSON.stringify(base))
    notify()
  }, [])

  const clearHomeBase = useCallback(() => {
    localStorage.removeItem(KEY)
    notify()
  }, [])

  return { homeBase, setHomeBase, clearHomeBase }
}

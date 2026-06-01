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

// useSyncExternalStore は getSnapshot の戻り値を === で比較するため、
// 同じ内容なら同じ参照を返す（生文字列をキャッシュ）。毎回 JSON.parse すると
// 参照が変わり続け無限再レンダーになる。
let cachedRaw: string | null = null
let cachedObj: HomeBase | null = null

function getSnapshot(): HomeBase | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === cachedRaw) return cachedObj
    cachedRaw = raw
    cachedObj = raw ? (JSON.parse(raw) as HomeBase) : null
    return cachedObj
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

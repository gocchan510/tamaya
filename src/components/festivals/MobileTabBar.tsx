'use client'
import { Suspense } from 'react'
import { useFavorites } from '@/hooks/useFavorites'

const TABS = [
  { key: 'list',      icon: '🎇', label: '一覧' },
  { key: 'calendar',  icon: '📅', label: 'カレンダー' },
  { key: 'favorites', icon: '❤️', label: 'お気に入り' },
  { key: 'search',    icon: '🔍', label: '検索' },
] as const

type TabKey = typeof TABS[number]['key']

function Inner({
  activeTab,
  onCalendar,
  onSearch,
  onList,
  onFavorites,
}: {
  activeTab: TabKey
  onCalendar: () => void
  onSearch: () => void
  onList: () => void
  onFavorites: () => void
}) {
  const { count, loaded } = useFavorites()

  const handle = (key: TabKey) => {
    if (key === 'calendar')  return onCalendar()
    if (key === 'search')    return onSearch()
    if (key === 'favorites') return onFavorites()
    return onList()
  }

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="absolute inset-0 bg-[#0a0710]/85 backdrop-blur-xl border-t border-white/[0.07]" />
      <div className="relative flex items-stretch">
        {TABS.map(t => {
          const isActive = activeTab === t.key
          const favBadge = t.key === 'favorites' && loaded && count > 0
          return (
            <button
              key={t.key}
              onClick={() => handle(t.key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors duration-150 ${
                isActive ? 'text-amber-300' : 'text-white/35 active:text-white/60'
              }`}
            >
              <span className="text-xl relative">
                {t.icon}
                {favBadge && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {count}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-amber-300' : 'text-white/30'}`}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function MobileTabBar(props: {
  activeTab: TabKey
  onCalendar: () => void
  onSearch: () => void
  onList: () => void
  onFavorites: () => void
}) {
  return (
    <Suspense>
      <Inner {...props} />
    </Suspense>
  )
}

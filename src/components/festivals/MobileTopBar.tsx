'use client'
import { Suspense } from 'react'
import { SearchBox } from './SearchBox'
import { SortToggle } from './SortToggle'
import { QuickFilters } from './QuickFilters'
import { HomeBaseSettings } from './HomeBaseSettings'
import { FilterDisclosure } from './FilterDisclosure'
import { PrefectureFilter } from './PrefectureFilter'
import { TierFilter } from './TierFilter'
import { FireworksFilter } from './FireworksFilter'
import { DateStatusFilter } from './DateStatusFilter'
import { SourceFilter } from './SourceFilter'
import { MonthFilter } from './MonthFilter'
import { FilterToggle } from './FilterToggle'

export function MobileTopBar({
  candidates,
  availablePrefectures,
}: {
  candidates: { id: string; name: string; prefecture: string; city: string; tier: string | null }[]
  availablePrefectures: string[]
}) {
  return (
    <div className="lg:hidden flex flex-col gap-2 mb-4">
      <Suspense>
        <SearchBox candidates={candidates} />
      </Suspense>
      <Suspense>
        <QuickFilters />
      </Suspense>
      <Suspense>
        <SortToggle />
      </Suspense>
      <HomeBaseSettings />
      <Suspense>
        <FilterDisclosure>
          <PrefectureFilter available={availablePrefectures} />
          <TierFilter />
          <FireworksFilter />
          <DateStatusFilter />
          <SourceFilter />
          <MonthFilter />
          <FilterToggle />
        </FilterDisclosure>
      </Suspense>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { WireframeIcon } from '../common/WireframeIcon'

interface PeopleFiltersProps {
  onCreateSmartListFromView: () => void
  onFilterChange: (filters: {
    query: string
    lifecycleStage: string
    minimumScore: number
  }) => void
}

const suggestedFilters = [
  'Region: North America',
  'Engagement: High',
  'Owner: Maya Chen',
]

interface ActiveFilter {
  key: string
  label: string
}

export function PeopleFilters({
  onCreateSmartListFromView,
  onFilterChange,
}: PeopleFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [lifecycleStage, setLifecycleStage] = useState('All')
  const [scoreThreshold, setScoreThreshold] = useState(0)
  const [customFilters, setCustomFilters] = useState<string[]>([])
  const [nextCustomFilterIndex, setNextCustomFilterIndex] = useState(0)

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const filters: ActiveFilter[] = []

    if (lifecycleStage !== 'All') {
      filters.push({ key: 'lifecycle', label: `Lifecycle: ${lifecycleStage}` })
    }

    if (scoreThreshold > 0) {
      filters.push({ key: 'score', label: `Score >= ${scoreThreshold}` })
    }

    for (const filter of customFilters) {
      filters.push({ key: filter, label: filter })
    }

    if (searchQuery.trim()) {
      filters.push({ key: 'search', label: `Search: ${searchQuery.trim()}` })
    }

    return filters
  }, [customFilters, lifecycleStage, scoreThreshold, searchQuery])

  function handleAddFilter() {
    const filter = suggestedFilters[nextCustomFilterIndex % suggestedFilters.length]

    if (!customFilters.includes(filter)) {
      setCustomFilters((prev) => [...prev, filter])
    }

    setNextCustomFilterIndex((prev) => prev + 1)
  }

  function removeFilter(key: string) {
    if (key === 'lifecycle') {
      setLifecycleStage('All')
      onFilterChange({ query: searchQuery, lifecycleStage: 'All', minimumScore: scoreThreshold })
      return
    }

    if (key === 'score') {
      setScoreThreshold(0)
      onFilterChange({ query: searchQuery, lifecycleStage, minimumScore: 0 })
      return
    }

    if (key === 'search') {
      setSearchQuery('')
      onFilterChange({ query: '', lifecycleStage, minimumScore: scoreThreshold })
      return
    }

    setCustomFilters((prev) => prev.filter((filter) => filter !== key))
  }

  return (
    <section className='filterPanel'>
      <div className='filterRow'>
        <label className='searchInputWrap filterSearch'>
          <WireframeIcon name='search' className='iconSmall muted' />
          <input
            type='text'
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              onFilterChange({
                query: event.target.value,
                lifecycleStage,
                minimumScore: scoreThreshold,
              })
            }}
            className='searchInput'
            placeholder='Search people...'
          />
        </label>

        <label className='inlineControl'>
          <span>Lifecycle Stage</span>
          <select
            value={lifecycleStage}
            onChange={(event) => {
              setLifecycleStage(event.target.value)
              onFilterChange({
                query: searchQuery,
                lifecycleStage: event.target.value,
                minimumScore: scoreThreshold,
              })
            }}
          >
            <option>All</option>
            <option>Lead</option>
            <option>MQL</option>
            <option>SQL</option>
            <option>Customer</option>
          </select>
        </label>

        <label className='inlineControl scoreControl'>
          <span>Score Range</span>
          <input
            type='range'
            min={0}
            max={100}
            step={5}
            value={scoreThreshold}
            onChange={(event) => {
              const minimumScore = Number(event.target.value)
              setScoreThreshold(minimumScore)
              onFilterChange({ query: searchQuery, lifecycleStage, minimumScore })
            }}
          />
          <strong>{scoreThreshold}</strong>
        </label>

        <button type='button' className='button outline accent' onClick={handleAddFilter}>
          Add Filter
        </button>

        <button
          type='button'
          className='button outline accent'
          onClick={onCreateSmartListFromView}
        >
          Create Smart List from this view
        </button>
      </div>

      <div className='chipRow'>
        {activeFilters.map((filter) => (
          <button
            key={filter.key}
            type='button'
            className='filterChip active'
            onClick={() => removeFilter(filter.key)}
          >
            {filter.label}
            <span className='chipClose'>x</span>
          </button>
        ))}

        {activeFilters.length === 0 && <p className='helperText'>No active filters</p>}
      </div>
    </section>
  )
}

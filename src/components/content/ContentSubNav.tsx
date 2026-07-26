import { contentTabs } from '../../data/contentData'
import type { ContentTabKey } from '../../types/content'

interface ContentSubNavProps {
  activeTab: ContentTabKey
  onChange: (tab: ContentTabKey) => void
}

export function ContentSubNav({ activeTab, onChange }: ContentSubNavProps) {
  return (
    <div className='subNav contentSubNav' role='tablist' aria-label='Content sub-navigation'>
      {contentTabs.map((tab) => (
        <button
          key={tab.key}
          type='button'
          className={`subNavTab ${activeTab === tab.key ? 'active' : ''}`}
          role='tab'
          aria-selected={activeTab === tab.key}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { SlidePanel } from '../common/SlidePanel'
import { WireframeIcon } from '../common/WireframeIcon'
import type { PersonRecord } from '../../types/crm'

type DetailTab = 'profile' | 'activity' | 'membership' | 'consent'

interface PersonDetailPanelProps {
  person: PersonRecord
  onClose: () => void
}

const detailTabs: Array<{ key: DetailTab; label: string; icon: 'profile' | 'activity' | 'membership' | 'consent' }> = [
  { key: 'profile', label: 'Profile', icon: 'profile' },
  { key: 'activity', label: 'Activity Timeline', icon: 'activity' },
  { key: 'membership', label: 'Smart Lists Membership', icon: 'membership' },
  { key: 'consent', label: 'Consent', icon: 'consent' },
]

const activityIconByType = {
  'email-open': 'email-open',
  'form-fill': 'form-fill',
  'page-visit': 'page-visit',
  webinar: 'webinar',
} as const

export function PersonDetailPanel({ person, onClose }: PersonDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('profile')
  const [profile, setProfile] = useState({
    name: person.name,
    email: person.email,
    title: person.title,
    company: person.company,
    owner: person.owner,
    phone: person.phone,
    location: person.location,
  })

  const [consent, setConsent] = useState(person.consent)

  const profileEntries = useMemo(
    () => [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'title', label: 'Title' },
      { key: 'company', label: 'Company' },
      { key: 'owner', label: 'Owner' },
      { key: 'phone', label: 'Phone' },
      { key: 'location', label: 'Location' },
    ] as const,
    [],
  )

  function renderContent() {
    if (activeTab === 'profile') {
      return (
        <div className='panelSection'>
          {profileEntries.map((entry) => (
            <label key={entry.key} className='fieldRow'>
              <span>{entry.label}</span>
              <input
                type='text'
                value={profile[entry.key]}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    [entry.key]: event.target.value,
                  }))
                }
              />
            </label>
          ))}

          <button type='button' className='button solid panelSave'>
            Save
          </button>
        </div>
      )
    }

    if (activeTab === 'activity') {
      return (
        <ul className='timelineList'>
          {person.activity.map((item) => (
            <li key={item.id} className='timelineItem'>
              <span className='timelineIcon'>
                <WireframeIcon
                  name={activityIconByType[item.type]}
                  className='iconSmall accent'
                />
              </span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.timestamp}</p>
              </div>
            </li>
          ))}
        </ul>
      )
    }

    if (activeTab === 'membership') {
      return (
        <ul className='membershipList'>
          {person.smartLists.map((listName) => (
            <li key={listName}>
              <button type='button' className='textLink accent'>
                {listName}
              </button>
            </li>
          ))}
        </ul>
      )
    }

    return (
      <div className='panelSection'>
        <label className='toggleRow'>
          <span>Email Consent</span>
          <input
            type='checkbox'
            checked={consent.email}
            onChange={(event) =>
              setConsent((prev) => ({ ...prev, email: event.target.checked }))
            }
            className='toggleSwitch'
          />
        </label>

        <label className='toggleRow'>
          <span>SMS Consent</span>
          <input
            type='checkbox'
            checked={consent.sms}
            onChange={(event) =>
              setConsent((prev) => ({ ...prev, sms: event.target.checked }))
            }
            className='toggleSwitch'
          />
        </label>

        <label className='toggleRow'>
          <span>Tracking Consent</span>
          <input
            type='checkbox'
            checked={consent.tracking}
            onChange={(event) =>
              setConsent((prev) => ({ ...prev, tracking: event.target.checked }))
            }
            className='toggleSwitch'
          />
        </label>
      </div>
    )
  }

  return (
    <SlidePanel title={person.name} onClose={onClose}>
      <div className='panelTabs' role='tablist' aria-label='Person detail tabs'>
        {detailTabs.map((tab) => (
          <button
            key={tab.key}
            type='button'
            role='tab'
            aria-selected={activeTab === tab.key}
            className={`panelTab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <WireframeIcon name={tab.icon} className='iconTiny' />
            {tab.label}
          </button>
        ))}
      </div>

      <div className='panelContent'>{renderContent()}</div>
    </SlidePanel>
  )
}
